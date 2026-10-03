"""YouTube ingestion only. No model, database, or UI changes."""
import hashlib
import html
import json
import os
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
API = 'https://www.googleapis.com/youtube/v3/'
VERSION = 1


class YouTubeError(RuntimeError):
    pass


def normalize(text):
    text = unicodedata.normalize('NFKC', html.unescape(str(text))).casefold()
    return re.sub(r'[^\w]+', ' ', text).strip()


def merge_unique(comments, clean, valid):
    result, seen = [], set()
    for text in comments:
        text = clean(html.unescape(text))
        key = normalize(text)
        if valid(text) and key and key not in seen:
            result.append(text)
            seen.add(key)
    return result


def relevant(title, game_name, catalog):
    title, target = normalize(title), normalize(game_name)
    padded = ' ' + title + ' '
    if ' ' + target + ' ' not in padded:
        return False
    # Reject a numbered sequel immediately following the full target name.
    if re.search(r'\b' + re.escape(target) + r'\s+(?:\d+|ii|iii|iv|v|vi)\b', title):
        return False
    exclusions = {
        'team fortress classic': ['tf2', 'team fortress 2'],
        'team fortress 2': ['tfc', 'team fortress classic'],
        'left 4 dead': ['l4d2', 'left 4 dead 2'],
        'left 4 dead 2': ['l4d1', 'left 4 dead 1'],
    }
    for other in exclusions.get(target, []):
        if ' ' + normalize(other) + ' ' in padded:
            return False
    # Conservative policy: reject comparisons and other games in the same series.
    target_words = set(target.split())
    for name in catalog:
        other = normalize(name)
        if other == target or not other:
            continue
        shared = target_words & set(other.split())
        if len(shared) >= 2 and ' ' + other + ' ' in padded:
            # A base-game phrase embedded in the exact target is expected.
            if ' ' + other + ' ' not in ' ' + target + ' ':
                return False
    return True


def english(text):
    from langdetect import DetectorFactory, detect_langs
    DetectorFactory.seed = 0
    letters = [c for c in text if c.isalpha()]
    if not letters or sum(c.isascii() for c in letters) / len(letters) < .8:
        return False
    try:
        guesses = detect_langs(text)
        return bool(guesses and guesses[0].lang == 'en' and guesses[0].prob >= .90)
    except Exception:
        return False


def api_key():
    key = os.environ.get('YOUTUBE_API_KEY', '').strip()
    path = Path.home() / '.dira' / 'youtube_api_key.txt'
    if not key and path.exists():
        key = path.read_text(encoding='utf-8-sig').strip()
    if not key:
        raise YouTubeError('Set YOUTUBE_API_KEY or save it in %USERPROFILE%\\.dira\\youtube_api_key.txt')
    return key


def request(endpoint, key, **params):
    try:
        response = requests.get(API + endpoint, params=dict(params, key=key), timeout=30)
        data = response.json()
    except (requests.RequestException, ValueError):
        # Never print exception URLs, which can contain the API key.
        raise YouTubeError('YouTube network/JSON error; no results saved.') from None
    if response.status_code != 200 or 'error' in data:
        reasons = data.get('error', {}).get('errors', [])
        reason = reasons[0].get('reason', 'unknown') if reasons else 'unknown'
        raise YouTubeError(f'YouTube HTTP {response.status_code}: {reason}')
    return data


def fetch_youtube_comments(game_name, catalog, clean, valid, refresh=False):
    month = datetime.now(timezone.utc).strftime('%Y-%m')
    fingerprint = hashlib.sha256(json.dumps([VERSION, game_name, sorted(catalog)], ensure_ascii=False).encode()).hexdigest()
    cache_dir = Path.home() / '.dira' / 'youtube_cache'
    cache = cache_dir / (fingerprint + '.json')
    if not refresh and cache.exists():
        try:
            saved = json.loads(cache.read_text(encoding='utf-8'))
            if saved['month'] == month:
                print(f'YouTube monthly cache: {len(saved["comments"])} comments')
                return saved['comments']
        except (ValueError, KeyError, OSError):
            pass
    key = api_key()
    candidates, token = {}, None
    # Examine up to 100 search results ordered by views. This is a bounded
    # candidate pool, not a guarantee of the global top five on all YouTube.
    for _ in range(2):
        params = dict(part='snippet', type='video', q='"' + game_name + '"',
                      videoCategoryId='20', order='viewCount', relevanceLanguage='en',
                      safeSearch='none', maxResults=50)
        if token:
            params['pageToken'] = token
        page = request('search', key, **params)
        ids = [item['id']['videoId'] for item in page.get('items', [])]
        if ids:
            details = request('videos', key, part='snippet,statistics', id=','.join(ids))
            for item in details.get('items', []):
                snippet = item['snippet']
                if snippet.get('categoryId') == '20' and relevant(snippet['title'], game_name, catalog):
                    candidates[item['id']] = item
        token = page.get('nextPageToken')
        if not token:
            break
    ranked = sorted(candidates.values(), key=lambda v: (-int(v.get('statistics', {}).get('viewCount', 0)), v['id']))
    comments, seen, selected = [], set(), []
    for video in ranked:
        vid, accepted, page_token = video['id'], 0, None
        for page_number in range(10):
            params = dict(part='snippet', videoId=vid, maxResults=100,
                          order='time', textFormat='plainText')
            if page_token:
                params['pageToken'] = page_token
            try:
                page = request('commentThreads', key, **params)
            except YouTubeError as error:
                if str(error).endswith(': commentsDisabled') and page_number == 0:
                    break
                raise
            if page_number == 0:
                selected.append(vid)
                print(f'YouTube selected: {vid} | {video["snippet"]["title"]} | views={video.get("statistics", {}).get("viewCount", 0)}')
            for item in page.get('items', []):
                raw = item['snippet']['topLevelComment']['snippet']['textDisplay']
                text = clean(html.unescape(raw))
                key_text = normalize(text)
                if valid(text) and key_text not in seen and english(text):
                    comments.append(text)
                    seen.add(key_text)
                    accepted += 1
                    if accepted == 100:
                        break
            page_token = page.get('nextPageToken')
            if accepted == 100 or not page_token:
                break
        if vid in selected:
            print(f'YouTube accepted: {accepted} English comments')
        if len(selected) == 5:
            break
    cache_dir.mkdir(parents=True, exist_ok=True)
    temp = cache.with_suffix('.tmp')
    temp.write_text(json.dumps(dict(month=month, comments=comments, videos=selected), ensure_ascii=False), encoding='utf-8')
    temp.replace(cache)
    print(f'YouTube total: {len(selected)} videos, {len(comments)} comments')
    return comments

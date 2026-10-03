import time
import argparse
from pathlib import Path
from youtube_comments import fetch_youtube_comments, merge_unique, YouTubeError
import requests
import mysql.connector
import torch
import numpy as np
import re
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# =========================
# SETTINGS
# =========================

DB_CONFIG = {
    "host": "localhost",
    "port": 8889,
    "user": "root",
    "password": "root",
    "database": "dira_db",
}

MODEL_PATH = str(Path(__file__).resolve().parent.parent / "final_multilabel_model")

MAX_REVIEWS_PER_GAME = 100
GAME_LIMIT = 133 
BATCH_SIZE = 16
THRESHOLD = 0.5
REANALYZE_ALL = False

weights = {
    "sexual_harassment": 0.266,
    "hate_speech": 0.201,
    "bullying": 0.195,
    "threat": 0.182,
    "other_toxicity": 0.156
}

# =========================
# DATABASE
# =========================

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor(dictionary=True)

# =========================
# MODEL
# =========================

tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
model.eval()

# =========================
# FETCH STEAM REVIEWS
# =========================

def fetch_steam_reviews(steam_app_id, max_reviews=100):
    all_reviews = []
    cursor_value = "*"

    while len(all_reviews) < max_reviews:
        remaining = max_reviews - len(all_reviews)
        num_per_page = min(100, remaining)

        url = f"https://store.steampowered.com/appreviews/{steam_app_id}"

        params = {
            "json": 1,
            "filter": "recent",
            "language": "english",
            "num_per_page": num_per_page,
            "cursor": cursor_value
        }

        try:
            response = requests.get(url, params=params, timeout=20)
            data = response.json()
        except Exception as e:
            print(f"Steam request failed for AppID {steam_app_id}: {e}")
            break

        if not data or not data.get("success"):
            break

        reviews = data.get("reviews", [])

        if not reviews:
            break

        for review in reviews:
            text = review.get("review") or ""

            cleaned_text = clean_comment(text)

            if is_valid_comment(cleaned_text):
                all_reviews.append(cleaned_text)

            if len(all_reviews) >= max_reviews:
                break

        new_cursor = data.get("cursor")

        if not new_cursor or new_cursor == cursor_value:
            break

        cursor_value = new_cursor
        time.sleep(0.3)

    return all_reviews


# =========================
# CLEANING
# =========================

def clean_comment(text):
    if not text:
        return ""

    text = str(text)

    # Remove links
    text = re.sub(
        r"https?://\S+|www\.\S+",
        "",
        text,
        flags=re.IGNORECASE
    )

    # Normalize whitespace
    text = re.sub(
        r"\s+",
        " ",
        text
    ).strip()

    return text


def is_valid_comment(text):
    text = clean_comment(text)

    if not text:
        return False

    if len(text) < 20:
        return False

    if len(text.split()) < 3:
        return False

    # Must contain English letters
    if not re.search(r"[A-Za-z]", text):
        return False

    return True


# =========================
# ANALYSIS
# =========================

def analyze_comments(comments):
    counts = {
        "threat": 0,
        "bullying": 0,
        "sexual_harassment": 0,
        "hate_speech": 0,
        "other_toxicity": 0
    }

    for i in range(0, len(comments), BATCH_SIZE):
        batch_texts = comments[i:i + BATCH_SIZE]

        inputs = tokenizer(
            batch_texts,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=256
        )

        with torch.no_grad():
            outputs = model(**inputs)

        probs = torch.sigmoid(outputs.logits).numpy()
        preds = (probs >= THRESHOLD).astype(int)

        # LABEL_0 = is_toxic (not used in final scoring)
        # LABEL_1 = threat
        # LABEL_2 = bullying
        # LABEL_3 = sexual_harassment
        # LABEL_4 = hate_speech
        # LABEL_5 = other_toxicity

        counts["threat"] += int(preds[:, 1].sum())
        counts["bullying"] += int(preds[:, 2].sum())
        counts["sexual_harassment"] += int(preds[:, 3].sum())
        counts["hate_speech"] += int(preds[:, 4].sum())
        counts["other_toxicity"] += int(preds[:, 5].sum())

    total = len(comments)

    percentages = {
        label: round((count / total) * 100, 2)
        for label, count in counts.items()
    }

    weighted_scores = {
        "sexual_harassment": round(percentages["sexual_harassment"] * weights["sexual_harassment"], 2),
        "hate_speech": round(percentages["hate_speech"] * weights["hate_speech"], 2),
        "bullying": round(percentages["bullying"] * weights["bullying"], 2),
        "threat": round(percentages["threat"] * weights["threat"], 2),
        "other_toxicity": round(percentages["other_toxicity"] * weights["other_toxicity"], 2)
    }

    overall = round(sum(weighted_scores.values()), 2)

    if overall <= 30:
        level = "Low"
    elif overall <= 69:
        level = "Medium"
    else:
        level = "High"

    return counts, overall, level


def analyze_single_comment(text):
    cleaned_text = clean_comment(text)

    if not is_valid_comment(cleaned_text):
        return None

    inputs = tokenizer(
        [cleaned_text],
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=256
    )

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.sigmoid(outputs.logits).numpy()
    preds = (probs >= THRESHOLD).astype(int)[0]

    return {
        "threat": int(preds[1]),
        "bullying": int(preds[2]),
        "sexual_harassment": int(preds[3]),
        "hate_speech": int(preds[4]),
        "other_toxicity": int(preds[5])
    }

def calculate_overall_from_counts(counts, total_comments):
    if total_comments <= 0:
        return 0.0, "New"

    percentages = {
        label: (count / total_comments) * 100
        for label, count in counts.items()
    }

    overall = (
        percentages["sexual_harassment"] * weights["sexual_harassment"]
        + percentages["hate_speech"] * weights["hate_speech"]
        + percentages["bullying"] * weights["bullying"]
        + percentages["threat"] * weights["threat"]
        + percentages["other_toxicity"] * weights["other_toxicity"]
    )

    overall = round(overall, 2)

    if overall <= 30:
        level = "Low"
    elif overall <= 69:
        level = "Medium"
    else:
        level = "High"

    return overall, level

def update_game_with_single_comment(game_id, prediction):
    cursor.execute("""
        SELECT
            threat,
            bullying,
            sexual_harassment,
            hate_speech,
            other_toxicity,
            comments_count
        FROM games
        WHERE game_id = %s
        LIMIT 1
    """, (game_id,))

    game = cursor.fetchone()

    if not game:
        raise ValueError("Game not found")

    new_counts = {
        "threat":
            int(game["threat"] or 0) + prediction["threat"],

        "bullying":
            int(game["bullying"] or 0) + prediction["bullying"],

        "sexual_harassment":
            int(game["sexual_harassment"] or 0) + prediction["sexual_harassment"],

        "hate_speech":
            int(game["hate_speech"] or 0) + prediction["hate_speech"],

        "other_toxicity":
            int(game["other_toxicity"] or 0) + prediction["other_toxicity"]
    }

    new_total = int(game["comments_count"] or 0) + 1

    overall, level = calculate_overall_from_counts(
        new_counts,
        new_total
    )

    cursor.execute("""
        UPDATE games
        SET
            threat = %s,
            bullying = %s,
            sexual_harassment = %s,
            hate_speech = %s,
            other_toxicity = %s,
            comments_count = %s,
            overall_risk_percent = %s,
            overall_risk_level = %s,
            analysis_status = 'analyzed',
            analyzed_at = CURRENT_TIMESTAMP
        WHERE game_id = %s
    """, (
        new_counts["threat"],
        new_counts["bullying"],
        new_counts["sexual_harassment"],
        new_counts["hate_speech"],
        new_counts["other_toxicity"],
        new_total,
        overall,
        level,
        game_id
    ))

    conn.commit()

    return {
        "counts": new_counts,
        "comments_count": new_total,
        "overall_risk_percent": overall,
        "overall_risk_level": level
    }
# =========================
# SAVE RESULTS
# =========================

def save_analyzed_result(game_id, scores, overall, level, comments_count):
    cursor.execute("""
    UPDATE games
    SET
      threat = %s,
      bullying = %s,
      sexual_harassment = %s,
      hate_speech = %s,
      other_toxicity = %s,
      overall_risk_percent = %s,
      overall_risk_level = %s,
      comments_count = %s,
      analysis_status = 'analyzed',
      analyzed_at = CURRENT_TIMESTAMP
    WHERE game_id = %s
    """, (
        scores["threat"],
        scores["bullying"],
        scores["sexual_harassment"],
        scores["hate_speech"],
        scores["other_toxicity"],
        overall,
        level,
        comments_count,
        game_id
    ))

    conn.commit()


def save_no_comments_result(game_id):
    cursor.execute("""
    UPDATE games
    SET
      threat = 0,
      bullying = 0,
      sexual_harassment = 0,
      hate_speech = 0,
      other_toxicity = 0,
      overall_risk_percent = 0,
      overall_risk_level = 'New',
      comments_count = 0,
      analysis_status = 'no_comments',
      analyzed_at = CURRENT_TIMESTAMP
    WHERE game_id = %s
    """, (game_id,))

    conn.commit()



# =========================
# MAIN PIPELINE
# =========================

if __name__ == "__main__":

    parser = argparse.ArgumentParser()
    parser.add_argument('--game-id', type=int, help='Process one game, including previously analyzed games')
    parser.add_argument('--dry-run', action='store_true', help='Fetch and classify without database writes')
    parser.add_argument('--refresh-youtube', action='store_true', help="Ignore this month's cache")
    args = parser.parse_args()
    cursor.execute("SELECT game_name FROM games")
    catalog = [row['game_name'] for row in cursor.fetchall() if row['game_name']]

    cursor.execute("""
        SELECT game_id, api_game_id, game_name
        FROM games
        ORDER BY game_id ASC
    """)

    games = cursor.fetchall()

    print([g["game_id"] for g in games])
    print(f"Found {len(games)} games to process.")

    for game in games:
        game_id = game["game_id"]
        steam_app_id = game["api_game_id"]
        game_name = game["game_name"]

        print(
            f"\nProcessing: {game_name} | "
            f"game_id={game_id} | "
            f"Steam AppID={steam_app_id}"
        )

        steam_comments = fetch_steam_reviews(
            steam_app_id,
            MAX_REVIEWS_PER_GAME
        )

        try:
            youtube_comments = fetch_youtube_comments(
                game_name, catalog, clean_comment, is_valid_comment,
                refresh=args.refresh_youtube
            )
        except YouTubeError as error:
            print(f"Skipping game {game_id}: {error}. Existing database results preserved.")
            continue
        comments = merge_unique(steam_comments + youtube_comments, clean_comment, is_valid_comment)
        print(f"Steam={len(steam_comments)}, YouTube={len(youtube_comments)}, merged unique={len(comments)}")

        if len(comments) == 0:
            print(
                "No comments found. "
                "Saving as New / No analysis."
            )

            if not args.dry_run:
                save_no_comments_result(game_id)
            continue

        print(
            f"Fetched {len(comments)} comments. "
            "Analyzing..."
        )

        scores, overall, level = analyze_comments(
            comments
        )

        if args.dry_run:
            print(f"DRY RUN: comments={len(comments)}, counts={scores}, overall={overall}, level={level}; database unchanged")
            continue

        save_analyzed_result(
            game_id=game_id,
            scores=scores,
            overall=overall,
            level=level,
            comments_count=len(comments)
        )

        print(
            f"Saved result: "
            f"overall={overall}, level={level}"
        )

    print("\nDone.")

    cursor.close()
    conn.close()
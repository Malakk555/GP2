<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
set_time_limit(0);

require_once 'db.php';

header('Content-Type: text/html; charset=utf-8');


// Settings
$startAppId = 1;
$maxAppId = 200000;
$limitToSave = 300; // Number of games to save
$savedCount = 0;

// Fetch game details from the Steam API
function getSteamGameDetails($appid) {
    $url = "https://store.steampowered.com/api/appdetails?appids=" . $appid;

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        curl_close($ch);
        return null;
    }

    curl_close($ch);

    if (!$response) {
        return null;
    }

    $data = json_decode($response, true);

    if (!isset($data[$appid]) || $data[$appid]["success"] !== true) {
        return null;
    }

    return $data[$appid]["data"];
}

// Check whether the game supports online or multiplayer features
function isOnlineGame($categories) {
    if (empty($categories)) return false;

    $keywords = [
        "Multi-player",
        "Online PvP",
        "Online Co-op",
        "MMO",
        "Co-op",
        "PvP"
    ];

    foreach ($categories as $cat) {
        $desc = $cat["description"] ?? "";

        foreach ($keywords as $key) {
            if (stripos($desc, $key) !== false) {
                return true;
            }
        }
    }

    return false;
}

// Clean and format the release date
function cleanDate($dateText) {
    if (!$dateText) return null;

    $timestamp = strtotime($dateText);
    if (!$timestamp) return null;

    return date("Y-m-d", $timestamp);
}

// Normalize the game name to help avoid duplicate records
function normalizeGameName($name) {
    $name = strtolower(trim($name));
    $name = preg_replace('/\s+/', ' ', $name);
    $name = str_replace(['™', '®', '©'], '', $name);
    return $name;
}

// Main loop for scanning Steam App IDs
for ($appid = $startAppId; $appid <= $maxAppId; $appid++) {
    echo "Checking AppID: $appid<br>";
flush();

    if ($savedCount >= $limitToSave) {
        break;
    }

    $game = getSteamGameDetails($appid);

    if (!$game) continue;

    // Filter out unsupported or irrelevant entries
    if (($game["type"] ?? "") !== "game") continue;
    if (empty($game["platforms"]["windows"])) continue;
    if (!isOnlineGame($game["categories"] ?? [])) continue;

    // Extract game data
    $game_name = $game["name"] ?? "Unknown";
    $normalized_name = normalizeGameName($game_name);
    $skipWords = ['demo', 'beta', 'playtest', 'server', 'soundtrack', 'trailer'];

foreach ($skipWords as $word) {
    if (stripos($normalized_name, $word) !== false) {
        continue 2;
    }
}
    $description = $game["short_description"] ?? "";
    $image_url = $game["header_image"] ?? "";
    $genreList = [];

    if (!empty($game["genres"])) {
         foreach ($game["genres"] as $g) {
             if (!empty($g["description"])) {
                 $genreList[] = $g["description"];
             }
         }
    }

    $genre = implode(", ", $genreList);
    $platform = "PC";
    $release_date = cleanDate($game["release_date"]["date"] ?? null);
    $required_age = $game["required_age"] ?? 0;

    // Insert the game into the database or update it if it already exists
    $sql = "
    INSERT INTO games
    (api_game_id, game_name, normalized_name, description, image_url, genre, platform, release_date, required_age)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    game_name = VALUES(game_name),
    description = VALUES(description),
    image_url = VALUES(image_url),
    genre = VALUES(genre),
    platform = VALUES(platform),
    release_date = VALUES(release_date),
    required_age = VALUES(required_age)
   ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        echo "Prepare error for AppID $appid: " . $conn->error . "<br>";
        continue;
    }

    $stmt->bind_param(
    "isssssssi",
    $appid,
    $game_name,
    $normalized_name,
    $description,
    $image_url,
    $genre,
    $platform,
    $release_date,
    $required_age
    );

    if ($stmt->execute()) {
        $savedCount++;
        echo "Saved [$savedCount]: " . htmlspecialchars($game_name) . " (AppID: $appid)<br>";
    } else {
        echo "Insert error for $appid: " . $stmt->error . "<br>";
    }

    $stmt->close();

    usleep(100000); // 0.1 second delay
}

echo "<br>Done. Saved $savedCount games.";
?>
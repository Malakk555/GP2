<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . "/session.php";
require_once __DIR__ . "/db.php";

$game_id = $_GET['game_id'] ?? null;

// Stop the request if the game ID is missing
if (!$game_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing game_id"
    ]);
    exit;
}


// Retrieve the selected game's details and analysis data
$sql = "
SELECT 
  game_id,
  game_name,
  description,
  genre,
  platform,
  image_url,
  release_date,

  COALESCE(overall_risk_percent, 0) AS overall_risk_percent,
  overall_risk_level,

  COALESCE(bullying, 0) AS bullying,
  COALESCE(threat, 0) AS threat,
  COALESCE(sexual_harassment, 0) AS sexual_harassment,
  COALESCE(hate_speech, 0) AS hate_speech,
  COALESCE(other_toxicity, 0) AS other_toxicity,

  COALESCE(comments_count, 0) AS comments_count,
  COALESCE(analysis_status, 'no_comments') AS analysis_status,

  analyzed_at

FROM games
WHERE game_id = ?
LIMIT 1
";

$stmt = $conn->prepare($sql);

// Return an error if the SQL statement could not be prepared
if (!$stmt) {
    echo json_encode([
        "success" => false,
        "message" => "Prepare failed: " . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $game_id);
$stmt->execute();

$result = $stmt->get_result();

// Return an error if the game does not exist
if ($result->num_rows === 0) {
    echo json_encode([
        "success" => false,
        "message" => "Game not found"
    ]);
    exit;
}

$game = $result->fetch_assoc();

// Is this game in the logged-in user's list?
$game['is_tracked'] = 0;
$current_user = $_SESSION['user_id'] ?? null;
if ($current_user) {
    $t = $conn->prepare("SELECT 1 FROM tracked_games WHERE user_id = ? AND game_id = ? LIMIT 1");
    $t->bind_param("ii", $current_user, $game_id);
    $t->execute();
    $game['is_tracked'] = $t->get_result()->num_rows > 0 ? 1 : 0;
    $t->close();
}

// Return the selected game's data as a JSON response
echo json_encode([
    "success" => true,
    "game" => $game
], JSON_UNESCAPED_UNICODE);
?>
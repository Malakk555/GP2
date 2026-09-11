<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

// Retrieve the most recently added games
$sql = "
SELECT 
  game_id,
  game_name,
  description,
  genre,
  image_url,

  overall_risk_percent,
  overall_risk_level,
  comments_count,
  analysis_status

FROM games
ORDER BY created_at DESC
LIMIT 10
";

$result = $conn->query($sql);

$games = [];

// Store each recent game in the games array
while ($row = $result->fetch_assoc()) {
  $games[] = $row;
}

// Return the recent games as a JSON response
echo json_encode([
  "success" => true,
  "games" => $games
], JSON_UNESCAPED_UNICODE);
?>
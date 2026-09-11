<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

// Get the logged-in user's ID from the session
$user_id = $_SESSION["user_id"] ?? null;

// Stop the request if the user is not logged in
if (!$user_id) {
  echo json_encode([
    "success" => false,
    "message" => "Not logged in"
  ]);
  exit;
}

// Retrieve all games tracked by the current user
$sql = "
SELECT 
  g.game_id,
  g.game_name,
  g.description,
  g.genre,
  g.image_url,
  g.platform,

  g.overall_risk_percent,
  g.overall_risk_level,
  g.comments_count,
  g.analysis_status

FROM tracked_games tg

JOIN games g 
ON tg.game_id = g.game_id

WHERE tg.user_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();

$result = $stmt->get_result();

$games = [];

// Store each tracked game in the games array
while ($row = $result->fetch_assoc()) {
  $games[] = $row;
}

// Return the tracked games as a JSON response
echo json_encode([
  "success" => true,
  "games" => $games
], JSON_UNESCAPED_UNICODE);

$conn->close();
?>
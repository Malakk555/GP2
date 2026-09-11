<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';


$user_id = $_SESSION["user_id"] ?? null;

if (!$user_id) {
  echo json_encode(["success" => false, "message" => "Not logged in"]);
  exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$game_id = $data["game_id"] ?? null;

if (!$game_id) {
  echo json_encode(["success" => false, "message" => "Missing game_id"]);
  exit;
}

// Check if already tracked
$checkSql = "SELECT tracked_id FROM tracked_games WHERE user_id = ? AND game_id = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param("ii", $user_id, $game_id);
$checkStmt->execute();
$checkResult = $checkStmt->get_result();

if ($checkResult->num_rows > 0) {
  echo json_encode([
    "success" => false,
    "message" => "This game is already in your list"
  ]);
  exit;
}

// Add tracked game 
$sql = "INSERT INTO tracked_games (user_id, game_id) VALUES (?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $user_id, $game_id);

if ($stmt->execute()) {
  echo json_encode([
    "success" => true,
    "message" => "Game added to your list"
  ]);
} else {
  echo json_encode([
    "success" => false,
    "message" => "Failed to track game"
  ]);
}

$stmt->close();
$conn->close();
?>
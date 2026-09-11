<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once 'db.php';

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode([
        "success" => false,
        "message" => "User not logged in"
    ]);
    exit;
}

// Read the incoming JSON request data
$data = json_decode(file_get_contents("php://input"), true);

$game_id = $data['game_id'] ?? null;
$user_id = $_SESSION['user_id'];

if (!$game_id) {
    echo json_encode([
        "success" => false,
        "message" => "Missing game ID"
    ]);
    exit;
}


// Remove the selected game from the user's tracked games list
$sql = "DELETE FROM tracked_games WHERE user_id = ? AND game_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $user_id, $game_id);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Delete failed"
    ]);
}

$stmt->close();
$conn->close();
?>
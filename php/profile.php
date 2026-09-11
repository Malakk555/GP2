<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$conn = new mysqli("localhost", "root", "root", "dira_db", 8889);

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

// Handle profile data retrieval
if ($_SERVER["REQUEST_METHOD"] === "GET") {
  $sql = "SELECT user_id, name, email, created_at, profile_avatar FROM users WHERE user_id = ?";
  $stmt = $conn->prepare($sql);
  $stmt->bind_param("i", $user_id);
  $stmt->execute();

  $result = $stmt->get_result();
  $user = $result->fetch_assoc();

  // Return an error if the user record does not exist
  if (!$user) {
    echo json_encode([
      "success" => false,
      "message" => "User not found"
    ]);
    exit;
  }

  // Return the current user's profile data
  echo json_encode([
    "success" => true,
    "user" => $user
  ]);
  exit;
}

// Handle profile update requests
if ($_SERVER["REQUEST_METHOD"] === "POST") {
  $first_name = trim($_POST["first_name"] ?? "");
$last_name = trim($_POST["last_name"] ?? "");
$profile_avatar = trim($_POST["profile_avatar"] ?? "default");

// Validate required profile fields
if ($first_name === "" || $last_name === "") {
  echo json_encode([
    "success" => false,
    "message" => "First name and last name are required."
  ]);
  exit;
}

$name = $first_name . " " . $last_name;

// Define the avatars allowed by the system
  $allowedAvatars = ["default", "cat", "lion", "rabbit", "owl", "duck", "turtle", "bear"];

   // Use the default avatar if the selected avatar is not allowed
  if (!in_array($profile_avatar, $allowedAvatars)) {
    $profile_avatar = "default";
  }


  // Update the user's name and profile avatar
  $sql = "UPDATE users SET name = ?, profile_avatar = ? WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssi", $name, $profile_avatar, $user_id);

  if ($stmt->execute()) {
    echo json_encode([
      "success" => true,
      "message" => "Profile updated successfully"
    ]);
  } else {
    echo json_encode([
      "success" => false,
      "message" => "Update failed: " . $stmt->error
    ]);
  }

  $stmt->close();
  exit;
}

$conn->close();
?>
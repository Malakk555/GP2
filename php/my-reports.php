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

// Retrieve all reports submitted by the current user
$sql = "
SELECT 
  r.report_id,
  g.game_name,
  r.title,
  r.behavior_other AS description,
  r.status,
  r.date_reported
FROM reports r
JOIN games g ON r.game_id = g.game_id
WHERE r.user_id = ?
ORDER BY r.date_reported DESC
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

$stmt->bind_param("i", $user_id);
$stmt->execute();

$result = $stmt->get_result();
$reports = [];

// Store each report in the reports array
while ($row = $result->fetch_assoc()) {
  $reports[] = $row;
}

// Return the user's reports as a JSON response
echo json_encode([
  "success" => true,
  "reports" => $reports
]);

$stmt->close();
$conn->close();
?>
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

// Retrieve the current user's name
$userSql = "SELECT name FROM users WHERE user_id = ?";
$stmt = $conn->prepare($userSql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

// Count the games tracked by the current user
$trackedSql = "SELECT COUNT(*) AS total FROM tracked_games WHERE user_id = ?";
$stmt = $conn->prepare($trackedSql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$tracked = $stmt->get_result()->fetch_assoc();

// Count the user's reports that are still under review
$reportsSql = "
SELECT COUNT(*) AS total 
FROM reports 
WHERE user_id = ? 
AND status = 'Reviewing'
";
$stmt = $conn->prepare($reportsSql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$reports = $stmt->get_result()->fetch_assoc();

// Count all reports submitted by the current user
$submittedReportsSql = "
SELECT COUNT(*) AS total
FROM reports
WHERE user_id = ?
";
$stmt = $conn->prepare($submittedReportsSql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$submittedReports = $stmt->get_result()->fetch_assoc();

// Active Alerts: Count tracked games that currently have a high risk level
$alertsSql = "
SELECT COUNT(*) AS total
FROM tracked_games tg
JOIN games g ON tg.game_id = g.game_id
WHERE tg.user_id = ?
AND g.overall_risk_level = 'High'
";
$stmt = $conn->prepare($alertsSql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$alerts = $stmt->get_result()->fetch_assoc();

// Retrieve the most recently added games for the home page
$gamesSql = "
SELECT 
  game_id,
  game_name,
  description,
  genre,
  platform,
  image_url,
  overall_risk_percent,
  overall_risk_level,
  comments_count,
  analysis_status
FROM games
ORDER BY created_at DESC
LIMIT 7
";

$result = $conn->query($gamesSql);

$games = [];

// Store each recent game in the games array
while ($row = $result->fetch_assoc()) {
  $games[] = $row;
}

// Return the home page user data, dashboard statistics, and recent games
echo json_encode([
  "success" => true,
  "user" => $user,
  "stats" => [
  "tracked_games" => $tracked["total"],
  "active_alerts" => $alerts["total"],
  "reports_in_review" => $reports["total"],
  "submitted_reports" => $submittedReports["total"]
],
  "recent_games" => $games
], JSON_UNESCAPED_UNICODE);

$conn->close();
?>
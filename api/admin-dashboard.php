<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';


/* =========================================
   SUMMARY
========================================= */

$summary = [
    "total_games" => 0,
    "total_users" => 0,
    "total_employees" => 0,
    "total_reports" => 0
];


/* Games */

$result = $conn->query(
    "SELECT COUNT(*) AS total
     FROM games"
);

if ($result) {
    $summary["total_games"] =
        (int)$result->fetch_assoc()["total"];
}


/* Individual Users */

$result = $conn->query(
    "SELECT COUNT(*) AS total
     FROM users
     WHERE role = 'individual'"
);

if ($result) {
    $summary["total_users"] =
        (int)$result->fetch_assoc()["total"];
}


/* Government Employees */

$result = $conn->query(
    "SELECT COUNT(*) AS total
     FROM users
     WHERE role = 'government'"
);

if ($result) {
    $summary["total_employees"] =
        (int)$result->fetch_assoc()["total"];
}


/* Reports */

$result = $conn->query(
    "SELECT COUNT(*) AS total
     FROM reports"
);

if ($result) {
    $summary["total_reports"] =
        (int)$result->fetch_assoc()["total"];
}



/* =========================================
   RECENT GAMES
========================================= */

$recentGames = [];


$sql = "
SELECT
    game_id,
    game_name,
    genre,
    image_url,
    overall_risk_level,
    analysis_status,
    created_at

FROM games

ORDER BY created_at DESC, game_id DESC

LIMIT 5
";


$result = $conn->query($sql);


if ($result) {

    while ($row = $result->fetch_assoc()) {

        $recentGames[] = $row;
    }
}



/* =========================================
   RECENT INDIVIDUAL USERS
========================================= */

$recentUsers = [];


$sql = "
SELECT
    user_id,
    name,
    email,
    status,
    created_at

FROM users

WHERE role = 'individual'

ORDER BY created_at DESC, user_id DESC

LIMIT 5
";


$result = $conn->query($sql);


if ($result) {

    while ($row = $result->fetch_assoc()) {

        $recentUsers[] = $row;
    }
}



/* =========================================
   RESPONSE
========================================= */

echo json_encode([
    "success" => true,
    "summary" => $summary,
    "recent_games" => $recentGames,
    "recent_users" => $recentUsers
], JSON_UNESCAPED_UNICODE);

?>
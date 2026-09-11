<?php
require_once __DIR__ . "/config.php";

header('Content-Type: application/json; charset=utf-8');

$q = trim($_GET["q"] ?? "");

if ($q === "") {
    echo json_encode([
        "success" => true,
        "games" => []
    ]);
    exit;
}

$search = $q . "%";

$sql = "
SELECT 
    game_id,
    api_game_id,
    game_name,
    description,
    image_url,
    genre,
    platform,
    release_date,

    COALESCE(overall_risk_percent, 0) AS overall_risk_percent,
    COALESCE(overall_risk_level, 'Low') AS overall_risk_level,
    COALESCE(comments_count, 0) AS comments_count,
    COALESCE(analysis_status, 'no_comments') AS analysis_status

FROM games

WHERE game_name LIKE ?

ORDER BY game_name ASC
LIMIT 20
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $search);
$stmt->execute();

$result = $stmt->get_result();

$games = [];

// Store the search results in the games array
while ($row = $result->fetch_assoc()) {
    $games[] = $row;
}


// Return the matched games as a JSON response
echo json_encode([
    "success" => true,
    "games" => $games
], JSON_UNESCAPED_UNICODE);
?>
<?php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

// Retrieve all games with their metadata, risk analysis results, and label counts
$sql = "
SELECT 
    game_id,
    game_name,
    description,
    genre,
    platform,
    image_url,

    overall_risk_percent,
    overall_risk_level,
    analysis_status,
    comments_count,

    bullying,
    sexual_harassment,
    threat,
    hate_speech,
    other_toxicity

FROM games
";

$result = $conn->query($sql);

$games = [];

// Store each game record in the games array
while ($row = $result->fetch_assoc()) {
    $games[] = $row;
}

// Return all games as a JSON response
echo json_encode([
    "success" => true,
    "games" => $games
], JSON_UNESCAPED_UNICODE);
?>
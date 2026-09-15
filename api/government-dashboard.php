<?php

header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';


$response = [
    "success" => true,

    "summary" => [
        "total_reports" => 0,
        "total_reported_games" => 0,
        "high_risk_games" => 0
    ],

    "games" => []
];


/* =========================================
   1. TOTAL REPORTS
========================================= */

$result = $conn->query("
    SELECT COUNT(*) AS total_reports
    FROM reports
");

if ($result) {

    $row = $result->fetch_assoc();

    $response["summary"]["total_reports"] =
        (int)$row["total_reports"];
}


/* =========================================
   2. TOTAL GAMES WITH REPORTS
========================================= */

$result = $conn->query("
    SELECT COUNT(DISTINCT game_id) AS total_reported_games
    FROM reports
");

if ($result) {

    $row = $result->fetch_assoc();

    $response["summary"]["total_reported_games"] =
        (int)$row["total_reported_games"];
}


/* =========================================
   3. HIGH RISK REPORTED GAMES
========================================= */

$result = $conn->query("
    SELECT COUNT(DISTINCT g.game_id) AS high_risk_games

    FROM games g

    INNER JOIN reports r
        ON r.game_id = g.game_id

    WHERE g.overall_risk_level = 'High'
");

if ($result) {

    $row = $result->fetch_assoc();

    $response["summary"]["high_risk_games"] =
        (int)$row["high_risk_games"];
}


/* =========================================
   4. REPORTED GAMES TABLE
========================================= */

$sql = "
    SELECT

        g.game_id,
        g.game_name,
        g.image_url,
        g.genre,
        g.platform,
        g.required_age,

        g.overall_risk_percent,
        g.overall_risk_level,

        g.comments_count,

        g.threat,
        g.bullying,
        g.sexual_harassment,
        g.hate_speech,
        g.other_toxicity,

        COUNT(r.report_id) AS report_count

    FROM games g

    INNER JOIN reports r
        ON r.game_id = g.game_id

    GROUP BY

        g.game_id,
        g.game_name,
        g.image_url,
        g.genre,
        g.platform,
        g.required_age,

        g.overall_risk_percent,
        g.overall_risk_level,

        g.comments_count,

        g.threat,
        g.bullying,
        g.sexual_harassment,
        g.hate_speech,
        g.other_toxicity

    ORDER BY
        report_count DESC,
        g.game_name ASC
";


$result = $conn->query($sql);


/* =========================================
   DATABASE ERROR
========================================= */

if (!$result) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => $conn->error
    ]);

    exit;
}


/* =========================================
   FORMAT GAME DATA
========================================= */

while ($row = $result->fetch_assoc()) {

    $response["games"][] = [

        "game_id" =>
            (int)$row["game_id"],

        "game_name" =>
            $row["game_name"],

        "image_url" =>
            $row["image_url"],

        "genre" =>
            $row["genre"],

        "platform" =>
            $row["platform"],

        "required_age" =>
            (int)$row["required_age"],


        /* Number of reports */

        "report_count" =>
            (int)$row["report_count"],


        /* Overall risk */

        "overall_risk_percent" =>
            (float)$row["overall_risk_percent"],

        "overall_risk_level" =>
            $row["overall_risk_level"],


        /* Number of analyzed comments */

        "comments_count" =>
            (int)$row["comments_count"],


        /* Raw model values */

        "breakdown" => [

            "threat" =>
                (float)$row["threat"],

            "bullying" =>
                (float)$row["bullying"],

            "sexual_harassment" =>
                (float)$row["sexual_harassment"],

            "hate_speech" =>
                (float)$row["hate_speech"],

            "other_toxicity" =>
                (float)$row["other_toxicity"]
        ]
    ];
}


/* =========================================
   JSON RESPONSE
========================================= */

echo json_encode(
    $response,
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);


$conn->close();

?>
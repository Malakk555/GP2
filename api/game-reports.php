<?php

header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';


/* =========================================
   GET GAME ID
========================================= */

$game_id = filter_input(
    INPUT_GET,
    'game_id',
    FILTER_VALIDATE_INT
);

if (!$game_id) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Invalid game ID"
    ]);

    exit;
}


/* =========================================
   GET GAME INFORMATION
========================================= */

$gameStmt = $conn->prepare("
    SELECT
        game_id,
        game_name
    FROM games
    WHERE game_id = ?
");

$gameStmt->bind_param("i", $game_id);
$gameStmt->execute();

$gameResult = $gameStmt->get_result();

if ($gameResult->num_rows === 0) {

    http_response_code(404);

    echo json_encode([
        "success" => false,
        "message" => "Game not found"
    ]);

    exit;
}

$game = $gameResult->fetch_assoc();


/* =========================================
   GET REPORTS FOR THIS GAME
========================================= */

$stmt = $conn->prepare("
    SELECT
        report_id,
        title,

        behavior_toxic,
        behavior_bullying,
        behavior_hate,
        behavior_sexual,
        behavior_threat,
        behavior_other,

        severity,

        location_chat,
        location_gameplay,
        location_community,

        date_reported

    FROM reports

    WHERE game_id = ?

    ORDER BY
        date_reported DESC,
        report_id DESC
");

$stmt->bind_param("i", $game_id);
$stmt->execute();

$result = $stmt->get_result();


$reports = [];


/* =========================================
   FORMAT REPORT DATA
========================================= */

while ($row = $result->fetch_assoc()) {

    /* -------- Behavior -------- */

    $behaviors = [];

    if ((int)$row["behavior_toxic"] === 1) {
        $behaviors[] = "Offensive / Toxic Language";
    }

    if ((int)$row["behavior_bullying"] === 1) {
        $behaviors[] = "Bullying";
    }

    if ((int)$row["behavior_hate"] === 1) {
        $behaviors[] = "Hate Speech";
    }

    if ((int)$row["behavior_sexual"] === 1) {
        $behaviors[] = "Sexual Content";
    }

    if ((int)$row["behavior_threat"] === 1) {
        $behaviors[] = "Threats";
    }


    /* Other behavior */
    $other = trim($row["behavior_other"] ?? "");

    if ($other !== "") {
        $behaviors[] = "Other — " . $other;
    }


    /* -------- Detected At -------- */

    $locations = [];

    if ((int)$row["location_chat"] === 1) {
        $locations[] = "Chat";
    }

    if ((int)$row["location_gameplay"] === 1) {
        $locations[] = "Gameplay";
    }

    if ((int)$row["location_community"] === 1) {
        $locations[] = "Community";
    }


    /* -------- Final report -------- */

    $reports[] = [

        "report_id" =>
            (int)$row["report_id"],

        "title" =>
            $row["title"],

        "behavior" =>
            implode(", ", $behaviors),

        "severity" =>
            ucfirst(strtolower($row["severity"] ?? "")),

        "location" =>
            implode(", ", $locations),

        "date_reported" =>
            $row["date_reported"]
    ];
}


/* =========================================
   RESPONSE
========================================= */

echo json_encode([
    "success" => true,

    "game" => [
        "game_id" =>
            (int)$game["game_id"],

        "game_name" =>
            $game["game_name"]
    ],

    "reports" => $reports

], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);


$stmt->close();
$gameStmt->close();
$conn->close();

?>
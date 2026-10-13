<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

function respond($code, $body) {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if (
    !isset($_SESSION['user_id']) ||
    ($_SESSION['user_role'] ?? '') !== 'individual'
) {
    respond(403, [
        'success' => false,
        'message' => 'You are not allowed to submit comments.'
    ]);
}

$data = json_decode(file_get_contents('php://input'), true);

$gameId = (int)($data['game_id'] ?? 0);
$comment = trim($data['comment'] ?? '');

if ($gameId <= 0 || $comment === '') {
    respond(400, [
        'success' => false,
        'message' => 'Invalid comment data.'
    ]);
}

// =========================
// 1) Ask the model (Hugging Face Space)
// =========================

// AI_API_URL example: https://rathath-dira-api.hf.space
$aiBase = rtrim(getenv('AI_API_URL') ?: '', '/');
$aiKey = getenv('AI_API_KEY') ?: '';

if ($aiBase === '') {
    respond(500, ['success' => false, 'message' => 'AI_API_URL is not configured.']);
}

function http_call($url, $postBody = null) {
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        // The free Space sleeps when idle; the first request can take a while
        CURLOPT_TIMEOUT => 180
    ];
    if ($postBody !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_POSTFIELDS] = $postBody;
        $opts[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$body, $code];
}

$unavailable = [
    'success' => false,
    'message' => 'Analysis service is unavailable. Please try again in a minute.'
];

// Step 1: start the job
[$body, $code] = http_call(
    $aiBase . '/gradio_api/call/predict',
    json_encode(['data' => [$comment, $aiKey]])
);
$start = json_decode((string)$body, true);

if ($body === false || $code >= 400 || empty($start['event_id'])) {
    respond(503, $unavailable);
}

// Step 2: read the result (server-sent events text)
[$body, $code] = http_call($aiBase . '/gradio_api/call/predict/' . urlencode($start['event_id']));

$ai = null;
if ($body !== false && preg_match('/event:\s*complete\s*\ndata:\s*(.+)/', $body, $m)) {
    $out = json_decode(trim($m[1]), true);
    $ai = $out[0] ?? null;
}

if (!is_array($ai)) {
    respond(503, $unavailable);
}

if (empty($ai['success']) || !isset($ai['prediction'])) {
    respond(400, [
        'success' => false,
        'message' => $ai['message'] ?? 'Analysis service returned an invalid response.'
    ]);
}

$prediction = $ai['prediction'];

// =========================
// 2) Update the game in MySQL (was done in Python before)
// =========================

require_once __DIR__ . '/db.php';

$labels = ['threat', 'bullying', 'sexual_harassment', 'hate_speech', 'other_toxicity'];

$weights = [
    'sexual_harassment' => 0.266,
    'hate_speech'       => 0.201,
    'bullying'          => 0.195,
    'threat'            => 0.182,
    'other_toxicity'    => 0.156
];

$conn->begin_transaction();

try {
    $stmt = $conn->prepare(
        'SELECT threat, bullying, sexual_harassment, hate_speech, other_toxicity, comments_count
         FROM games WHERE game_id = ? LIMIT 1 FOR UPDATE'
    );
    $stmt->bind_param('i', $gameId);
    $stmt->execute();
    $game = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$game) {
        $conn->rollback();
        respond(404, ['success' => false, 'message' => 'Game not found']);
    }

    $counts = [];
    foreach ($labels as $label) {
        $counts[$label] = (int)($game[$label] ?? 0) + (int)($prediction[$label] ?? 0);
    }

    $total = (int)($game['comments_count'] ?? 0) + 1;

    $overall = 0.0;
    foreach ($labels as $label) {
        $overall += ($counts[$label] / $total) * 100 * $weights[$label];
    }
    $overall = round($overall, 2);

    if ($overall <= 30) {
        $level = 'Low';
    } elseif ($overall <= 69) {
        $level = 'Medium';
    } else {
        $level = 'High';
    }

    $stmt = $conn->prepare(
        "UPDATE games SET
            threat = ?, bullying = ?, sexual_harassment = ?, hate_speech = ?, other_toxicity = ?,
            comments_count = ?, overall_risk_percent = ?, overall_risk_level = ?,
            analysis_status = 'analyzed', analyzed_at = CURRENT_TIMESTAMP
         WHERE game_id = ?"
    );
    $stmt->bind_param(
        'iiiiiidsi',
        $counts['threat'],
        $counts['bullying'],
        $counts['sexual_harassment'],
        $counts['hate_speech'],
        $counts['other_toxicity'],
        $total,
        $overall,
        $level,
        $gameId
    );
    $stmt->execute();
    $stmt->close();

    $conn->commit();

} catch (Throwable $e) {
    $conn->rollback();
    respond(500, ['success' => false, 'message' => $e->getMessage()]);
}

respond(200, [
    'success' => true,
    'message' => 'Comment analyzed successfully.',
    'prediction' => $prediction,
    'result' => [
        'counts' => $counts,
        'comments_count' => $total,
        'overall_risk_percent' => $overall,
        'overall_risk_level' => $level
    ]
]);

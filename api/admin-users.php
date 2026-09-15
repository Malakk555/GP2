<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';


/* =========================================
   JSON RESPONSE
========================================= */

function sendJson($data, $status = 200) {

    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


$allowedRoles = [
    "individual",
    "government",
    "admin"
];


$allowedStatuses = [
    "active",
    "pending",
    "disabled"
];



/* =========================================
   UPDATE ACCOUNT STATUS
========================================= */

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $input =
        json_decode(
            file_get_contents("php://input"),
            true
        );


    $userId =
        intval(
            $input["user_id"] ?? 0
        );


    $newStatus =
        strtolower(
            trim(
                $input["status"] ?? ""
            )
        );


    if ($userId <= 0) {

        sendJson([
            "success" => false,
            "message" => "Invalid user ID."
        ], 400);
    }


    if (
        !in_array(
            $newStatus,
            $allowedStatuses,
            true
        )
    ) {

        sendJson([
            "success" => false,
            "message" => "Invalid account status."
        ], 400);
    }



    /* =========================================
       GET USER
    ========================================= */

    $stmt =
        $conn->prepare(
            "SELECT
                user_id,
                name,
                email,
                role,
                status
             FROM users
             WHERE user_id = ?
             LIMIT 1"
        );


    $stmt->bind_param(
        "i",
        $userId
    );


    $stmt->execute();


    $user =
        $stmt
            ->get_result()
            ->fetch_assoc();


    $stmt->close();


    if (!$user) {

        sendJson([
            "success" => false,
            "message" => "User not found."
        ], 404);
    }



    /* =========================================
       PROTECT LAST ACTIVE ADMIN
    ========================================= */

    if (
        $user["role"] === "admin" &&
        $user["status"] === "active" &&
        $newStatus === "disabled"
    ) {

        $result =
            $conn->query(
                "SELECT COUNT(*) AS total
                 FROM users
                 WHERE role = 'admin'
                 AND status = 'active'"
            );


        $activeAdmins =
            (int)$result
                ->fetch_assoc()["total"];


        if ($activeAdmins <= 1) {

            sendJson([
                "success" => false,
                "message" =>
                    "The last active administrator cannot be disabled."
            ], 400);
        }
    }



    /* =========================================
       UPDATE STATUS
    ========================================= */

    $stmt =
        $conn->prepare(
            "UPDATE users
             SET status = ?
             WHERE user_id = ?
             LIMIT 1"
        );


    $stmt->bind_param(
        "si",
        $newStatus,
        $userId
    );


    if (!$stmt->execute()) {

        $error =
            $stmt->error;


        $stmt->close();


        sendJson([
            "success" => false,
            "message" =>
                "Unable to update account: "
                . $error
        ], 500);
    }


    $stmt->close();



    sendJson([
        "success" => true,

        "message" =>
            $user["name"]
            . " account is now "
            . $newStatus
            . ".",

        "user_id" =>
            $userId,

        "status" =>
            $newStatus
    ]);
}



/* =========================================
   GET USERS BY ROLE
========================================= */

$role =
    $_GET["role"] ??
    "individual";


if (
    !in_array(
        $role,
        $allowedRoles,
        true
    )
) {

    sendJson([
        "success" => false,
        "message" => "Invalid user role."
    ], 400);
}


$sql = "
SELECT
    user_id,
    name,
    email,
    role,
    status,
    created_at,
    profile_avatar

FROM users

WHERE role = ?

ORDER BY created_at DESC, user_id DESC
";


$stmt =
    $conn->prepare($sql);


$stmt->bind_param(
    "s",
    $role
);


$stmt->execute();


$result =
    $stmt->get_result();


$users = [];


while (
    $row =
        $result->fetch_assoc()
) {

    $users[] =
        $row;
}


$stmt->close();


sendJson([
    "success" => true,
    "role" => $role,
    "count" => count($users),
    "users" => $users
]);

?>
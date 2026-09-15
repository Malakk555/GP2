<?php

session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';


function sendJson($data, $status = 200) {

    http_response_code($status);

    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE
    );

    exit;
}


/* =========================================
   REQUIRE LOGGED IN USER
========================================= */

$userId =
    intval(
        $_SESSION['user_id'] ?? 0
    );


if ($userId <= 0) {

    sendJson([
        'success' => false,
        'message' => 'You are not logged in.'
    ], 401);
}



/* =========================================
   GET CURRENT ADMIN DATA
========================================= */

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

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
        'i',
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
            'success' => false,
            'message' => 'User not found.'
        ], 404);
    }


    sendJson([
        'success' => true,
        'user' => $user
    ]);
}



/* =========================================
   POST ACTIONS
========================================= */

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $input =
        json_decode(
            file_get_contents('php://input'),
            true
        );


    $action =
        $input['action'] ?? '';



    /* =====================================
       UPDATE PROFILE
    ===================================== */

    if ($action === 'update_profile') {

        $name =
            trim(
                $input['name'] ?? ''
            );


        $email =
            trim(
                $input['email'] ?? ''
            );


        if ($name === '' || $email === '') {

            sendJson([
                'success' => false,
                'message' => 'Name and email are required.'
            ], 400);
        }


        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {

            sendJson([
                'success' => false,
                'message' => 'Please enter a valid email address.'
            ], 400);
        }



        /* Check duplicate email */

        $stmt =
            $conn->prepare(
                "SELECT user_id
                 FROM users
                 WHERE email = ?
                 AND user_id <> ?
                 LIMIT 1"
            );


        $stmt->bind_param(
            'si',
            $email,
            $userId
        );


        $stmt->execute();


        $duplicate =
            $stmt
                ->get_result()
                ->fetch_assoc();


        $stmt->close();


        if ($duplicate) {

            sendJson([
                'success' => false,
                'message' => 'This email is already in use.'
            ], 400);
        }



        /* Update */

        $stmt =
            $conn->prepare(
                "UPDATE users
                 SET name = ?, email = ?
                 WHERE user_id = ?
                 LIMIT 1"
            );


        $stmt->bind_param(
            'ssi',
            $name,
            $email,
            $userId
        );


        if (!$stmt->execute()) {

            sendJson([
                'success' => false,
                'message' => 'Unable to update profile.'
            ], 500);
        }


        $stmt->close();



        /* Update session */

        $_SESSION['user_name'] =
            $name;

        $_SESSION['user_email'] =
            $email;


        sendJson([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'role' => $_SESSION['user_role'] ?? 'admin'
            ]
        ]);
    }



    /* =====================================
       CHANGE PASSWORD
    ===================================== */

    if ($action === 'change_password') {

        $currentPassword =
            $input['current_password'] ?? '';

        $newPassword =
            $input['new_password'] ?? '';


        if (
            $currentPassword === '' ||
            $newPassword === ''
        ) {

            sendJson([
                'success' => false,
                'message' => 'Please complete all password fields.'
            ], 400);
        }


        if (strlen($newPassword) < 8) {

            sendJson([
                'success' => false,
                'message' => 'New password must be at least 8 characters.'
            ], 400);
        }



        /* Get current password */

        $stmt =
            $conn->prepare(
                "SELECT password
                 FROM users
                 WHERE user_id = ?
                 LIMIT 1"
            );


        $stmt->bind_param(
            'i',
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
                'success' => false,
                'message' => 'User not found.'
            ], 404);
        }


        $storedPassword =
            $user['password'] ?? '';


        $passwordCorrect =

            password_verify(
                $currentPassword,
                $storedPassword
            )

            ||

            hash_equals(
                $storedPassword,
                $currentPassword
            );


        if (!$passwordCorrect) {

            sendJson([
                'success' => false,
                'message' => 'Current password is incorrect.'
            ], 400);
        }



        /* Hash new password */

        $newHash =
            password_hash(
                $newPassword,
                PASSWORD_DEFAULT
            );


        $stmt =
            $conn->prepare(
                "UPDATE users
                 SET password = ?
                 WHERE user_id = ?
                 LIMIT 1"
            );


        $stmt->bind_param(
            'si',
            $newHash,
            $userId
        );


        if (!$stmt->execute()) {

            sendJson([
                'success' => false,
                'message' => 'Unable to change password.'
            ], 500);
        }


        $stmt->close();


        sendJson([
            'success' => true,
            'message' => 'Password changed successfully.'
        ]);
    }



    sendJson([
        'success' => false,
        'message' => 'Invalid action.'
    ], 400);
}


sendJson([
    'success' => false,
    'message' => 'Invalid request method.'
], 405);

?>
<?php

session_start();

require_once 'db.php';

header('Content-Type: application/json; charset=utf-8');


$data = json_decode(
    file_get_contents('php://input'),
    true
);


$email =
    trim($data['email'] ?? '');

$password =
    $data['password'] ?? '';



/* =========================================
   VALIDATE REQUIRED FIELDS
========================================= */

if ($email === '' || $password === '') {

    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' =>
            'Please enter email and password.'
    ]);

    exit;
}



/* =========================================
   GET USERS TABLE COLUMNS
========================================= */

$columns =
    get_columns(
        $conn,
        'users'
    );



/* =========================================
   MATCH DATABASE COLUMN NAMES
========================================= */

$emailCol =
    pick_column(
        $columns,
        ['email', 'user_email']
    );


$passCol =
    pick_column(
        $columns,
        [
            'password',
            'password_hash',
            'user_password'
        ]
    );


$nameCol =
    pick_column(
        $columns,
        [
            'name',
            'full_name',
            'username'
        ]
    );


$idCol =
    pick_column(
        $columns,
        [
            'user_id',
            'id'
        ]
    );


$roleCol =
    pick_column(
        $columns,
        ['role']
    );


$statusCol =
    pick_column(
        $columns,
        ['status']
    );



/* =========================================
   FIND USER BY EMAIL
========================================= */

$sql =
    "SELECT *
     FROM `users`
     WHERE `$emailCol` = ?
     LIMIT 1";


$stmt =
    $conn->prepare($sql);


$stmt->bind_param(
    's',
    $email
);


$stmt->execute();


$result =
    $stmt->get_result();



/* =========================================
   EMAIL NOT FOUND
========================================= */

if (
    !$result ||
    $result->num_rows === 0
) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' =>
            'Incorrect email or password.'
    ]);

    exit;
}


$user =
    $result->fetch_assoc();



/* =========================================
   VERIFY PASSWORD
========================================= */

$storedPassword =
    $user[$passCol] ?? '';


$passwordIsCorrect =

    password_verify(
        $password,
        $storedPassword
    )

    ||

    hash_equals(
        $storedPassword,
        $password
    );



/* =========================================
   WRONG PASSWORD
========================================= */

if (!$passwordIsCorrect) {

    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' =>
            'Incorrect email or password.'
    ]);

    exit;
}



/* =========================================
   CHECK ACCOUNT STATUS
========================================= */

$status =
    $statusCol
        ? strtolower(
            $user[$statusCol] ??
            'active'
        )
        : 'active';



/* Disabled account */

if ($status === 'disabled') {

    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' =>
            'This account has been disabled. Please contact the administrator.'
    ]);

    exit;
}



/* Pending account */

if ($status === 'pending') {

    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' =>
            'This account is waiting for administrator approval.'
    ]);

    exit;
}



/* Unknown status - deny by default */

if ($status !== 'active') {

    http_response_code(403);

    echo json_encode([
        'success' => false,
        'message' =>
            'This account is not currently available.'
    ]);

    exit;
}



/* =========================================
   CREATE SESSION
========================================= */

$_SESSION['user_id'] =
    $user[$idCol];


$_SESSION['user_email'] =
    $user[$emailCol];


$_SESSION['user_name'] =
    $nameCol
        ? $user[$nameCol]
        : '';


$_SESSION['user_role'] =
    $roleCol
        ? $user[$roleCol]
        : '';


$_SESSION['user_status'] =
    $status;



/* =========================================
   SUCCESS RESPONSE
========================================= */

echo json_encode([
    'success' => true,

    'message' =>
        'Login successful.',

    'user' => [

        'id' =>
            $user[$idCol],

        'name' =>
            $nameCol
                ? $user[$nameCol]
                : '',

        'email' =>
            $user[$emailCol],

        'role' =>
            $roleCol
                ? $user[$roleCol]
                : '',

        'status' =>
            $status
    ]

]);

?>
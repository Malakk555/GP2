<?php
session_start();
require_once 'db.php';

// Read the incoming JSON request data
$data = json_decode(file_get_contents('php://input'), true);

$firstName = trim($data['first_name'] ?? '');
$lastName  = trim($data['last_name'] ?? '');
$email     = strtolower(trim($data['email'] ?? ''));
$password  = $data['password'] ?? '';

$requestedRole = $data['role'] ?? 'individual';

$role = $requestedRole === 'employee'
    ? 'government'
    : 'individual';

// Validate required fields
if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields.']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email.']);
    exit;
}

// Government employee accounts must use the official organization email domain.
if ($role === 'government' && !preg_match('/^[A-Z0-9._%+-]+@gmedia\.gov\.sa$/i', $email)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Government employee accounts must use an official @gmedia.gov.sa email address.'
    ]);
    exit;
}

// Validate password length
if (strlen($password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 8 characters.'
    ]);
    exit;
}

// Validate that the password contains both letters and numbers
if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/[0-9]/', $password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must include both letters and numbers.'
    ]);
    exit;
}

// Get the columns of the users table
$columns = get_columns($conn, 'users');
if (empty($columns)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Table users was not found in dira_db.']);
    exit;
}


// Match the expected fields with the actual column names in the database
$emailCol = pick_column($columns, ['email', 'user_email']);
$passCol  = pick_column($columns, ['password', 'password_hash', 'user_password']);
$firstCol = pick_column($columns, ['first_name', 'firstname', 'fname']);
$lastCol  = pick_column($columns, ['last_name', 'lastname', 'lname']);
$nameCol  = pick_column($columns, ['name', 'full_name', 'username']);
$roleCol  = pick_column($columns, ['role', 'user_role', 'type']);
$statusCol = pick_column($columns, ['status', 'account_status']);

// Ensure that the required columns exist
if (!$emailCol || !$passCol) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'users table must contain email and password columns.']);
    exit;
}

// Government employee approval depends on the account status column.
if ($role === 'government' && !$statusCol) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'users table must contain a status column for employee approval requests.'
    ]);
    exit;
}

// Check if the email is already registered
$checkSql = "SELECT `$emailCol` FROM `users` WHERE `$emailCol` = ? LIMIT 1";
$check = $conn->prepare($checkSql);
$check->bind_param('s', $email);
$check->execute();
$exists = $check->get_result();
if ($exists && $exists->num_rows > 0) {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'This email is already registered.']);
    exit;
}


// Prepare the columns and values for inserting a new user
$insertColumns = [];
$values = [];
$types = '';

if ($firstCol) { $insertColumns[] = "`$firstCol`"; $values[] = $firstName; $types .= 's'; }
if ($lastCol)  { $insertColumns[] = "`$lastCol`";  $values[] = $lastName;  $types .= 's'; }


// Use a full name column if separate first and last name columns do not exist
if (!$firstCol && !$lastCol && $nameCol) { $insertColumns[] = "`$nameCol`"; $values[] = $firstName . ' ' . $lastName; $types .= 's'; }

$insertColumns[] = "`$emailCol`"; $values[] = $email; $types .= 's';
$insertColumns[] = "`$passCol`";  $values[] = password_hash($password, PASSWORD_DEFAULT); $types .= 's';

// Set role and approval status for newly registered users.
if ($roleCol) {
    $insertColumns[] = "`$roleCol`";
    $values[] = $role;
    $types .= 's';
}

$status = $role === 'government' ? 'pending' : 'active';

if ($statusCol) {
    $insertColumns[] = "`$statusCol`";
    $values[] = $status;
    $types .= 's';
}

// Insert the new user into the database
$placeholders = implode(',', array_fill(0, count($values), '?'));
$sql = "INSERT INTO `users` (" . implode(',', $insertColumns) . ") VALUES ($placeholders)";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$values);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;

    // Employee accounts are approval requests. Do not create a logged-in session yet.
    if ($role === 'government') {
        session_unset();

        echo json_encode([
            'success' => true,
            'requires_approval' => true,
            'message' => 'Your employee access request has been sent to the administrator for approval.',
            'user' => [
                'id' => $user_id,
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'role' => $role,
                'status' => $status
            ]
        ]);
        exit;
    }

    // Individual accounts can start an active session immediately.
    $_SESSION["user_id"] = $user_id;
    $_SESSION["user_name"] = $firstName . " " . $lastName;
    $_SESSION["user_email"] = $email;
    $_SESSION["user_role"] = $role;
    $_SESSION["user_status"] = $status;

    echo json_encode([
        'success' => true,
        'requires_approval' => false,
        'message' => 'Account created successfully.',
        'user' => [
            'id' => $user_id,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'role' => $role,
            'status' => $status
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Sign up failed: ' . $stmt->error]);
}
?>

<?php
// DIR'A Platform database connection.
// On Railway the values come from the MySQL service variables;
// locally (MAMP) it falls back to the old settings.

$DB_HOST = getenv('MYSQLHOST')     ?: 'localhost';
$DB_USER = getenv('MYSQLUSER')     ?: 'root';
$DB_PASS = getenv('MYSQLPASSWORD') ?: 'root';
$DB_NAME = getenv('MYSQLDATABASE') ?: 'dira_db';
$DB_PORT = (int)(getenv('MYSQLPORT') ?: 8889);

if (!isset($conn) || !($conn instanceof mysqli)) {
    $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);

    if ($conn->connect_error) {
        die("Database connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
}
?>

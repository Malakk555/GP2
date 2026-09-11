<?php
// DIR'A Platform database connection for MAMP/phpMyAdmin

$DB_HOST = 'localhost';
$DB_USER = 'root';
$DB_PASS = 'root';
$DB_NAME = 'dira_db';

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, 8889);

if ($conn->connect_error) {
    die("Database connection failed: " . $conn->connect_error);
}
$conn->set_charset("utf8mb4");
?>
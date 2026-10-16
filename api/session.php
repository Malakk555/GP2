<?php
// Starts the PHP session and stores it in the database instead of
// the server's temporary files. Railway wipes those files on every
// restart/redeploy, which logged users out silently.

require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {

    // Separate connection: pages call $conn->close() before PHP
    // saves the session at the end of the request.
    $sessionConn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
    $sessionConn->set_charset("utf8mb4");

    $sessionConn->query("
        CREATE TABLE IF NOT EXISTS php_sessions (
            id VARCHAR(128) NOT NULL PRIMARY KEY,
            data MEDIUMTEXT NOT NULL,
            last_access INT UNSIGNED NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    class DiraDbSessionHandler implements SessionHandlerInterface {
        private $db;
        public function __construct($db) { $this->db = $db; }
        public function open($path, $name): bool { return true; }
        public function close(): bool { return true; }

        #[\ReturnTypeWillChange]
        public function read($id) {
            $stmt = $this->db->prepare("SELECT data FROM php_sessions WHERE id = ? LIMIT 1");
            $stmt->bind_param("s", $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $stmt->close();
            return $row ? $row['data'] : '';
        }

        public function write($id, $data): bool {
            $now = time();
            $stmt = $this->db->prepare("
                INSERT INTO php_sessions (id, data, last_access) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE data = VALUES(data), last_access = VALUES(last_access)
            ");
            $stmt->bind_param("ssi", $id, $data, $now);
            $ok = $stmt->execute();
            $stmt->close();
            return $ok;
        }

        public function destroy($id): bool {
            $stmt = $this->db->prepare("DELETE FROM php_sessions WHERE id = ?");
            $stmt->bind_param("s", $id);
            $stmt->execute();
            $stmt->close();
            return true;
        }

        #[\ReturnTypeWillChange]
        public function gc($max) {
            $limit = time() - $max;
            $stmt = $this->db->prepare("DELETE FROM php_sessions WHERE last_access < ?");
            $stmt->bind_param("i", $limit);
            $stmt->execute();
            $n = $stmt->affected_rows;
            $stmt->close();
            return $n;
        }
    }

    // Keep users logged in for 7 days
    $lifetime = 60 * 60 * 24 * 7;
    ini_set('session.gc_maxlifetime', (string)$lifetime);
    session_set_cookie_params([
        'lifetime' => $lifetime,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    ]);

    session_set_save_handler(new DiraDbSessionHandler($sessionConn), true);
    session_start();
}

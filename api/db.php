<?php
// DIR'A Platform database connection for MAMP/phpMyAdmin


require_once __DIR__ . '/config.php';


function get_columns($conn, $table) {
    $columns = [];

    $result = $conn->query("SHOW COLUMNS FROM `$table`");

    if (!$result) {
        return $columns;
    }

    while ($row = $result->fetch_assoc()) {
        $columns[] = $row['Field'];
    }

    return $columns;
}

function pick_column($columns, $options) {
    foreach ($options as $option) {
        if (in_array($option, $columns)) {
            return $option;
        }
    }

    return null;
}
?>
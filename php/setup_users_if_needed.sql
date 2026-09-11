-- استخدمي هذا فقط إذا ما كان عندك جدول users جاهز
CREATE DATABASE IF NOT EXISTS dira_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dira_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Parent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

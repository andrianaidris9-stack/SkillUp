<?php
declare(strict_types=1);

/**
 * Konfigurasi koneksi SkillUp.
 * Isi variabel lingkungan atau salin .env.example ke konfigurasi server.
 */
// Muat file .env lokal jika tersedia; environment server tetap menjadi prioritas.
$envFile = __DIR__ . '/../.env';
if (is_file($envFile)) {
    $values = parse_ini_file($envFile, false, INI_SCANNER_RAW) ?: [];
    foreach ($values as $key => $value) {
        if (getenv((string)$key) === false) {
            putenv($key . '=' . $value);
            $_ENV[$key] = $value;
        }
    }
}

return [
    'db' => [
        'host' => getenv('SKILLUP_DB_HOST') ?: '127.0.0.1',
        'port' => getenv('SKILLUP_DB_PORT') ?: '3306',
        'name' => getenv('SKILLUP_DB_NAME') ?: 'skillup',
        'user' => getenv('SKILLUP_DB_USER') ?: 'root',
        'pass' => getenv('SKILLUP_DB_PASS') ?: '',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'base_url' => rtrim(getenv('SKILLUP_BASE_URL') ?: '', '/'),
        'debug' => filter_var(getenv('SKILLUP_DEBUG') ?: '0', FILTER_VALIDATE_BOOLEAN),
        'session_name' => 'SKILLUPSESSID',
        'max_upload_bytes' => 5 * 1024 * 1024,
        'reset_token_minutes' => 15,
    ],
    'mail' => [
        'host' => getenv('SKILLUP_SMTP_HOST') ?: '',
        'port' => (int)(getenv('SKILLUP_SMTP_PORT') ?: 587),
        'username' => getenv('SKILLUP_SMTP_USER') ?: '',
        'password' => getenv('SKILLUP_SMTP_PASS') ?: '',
        'from_email' => getenv('SKILLUP_MAIL_FROM') ?: '',
        'from_name' => getenv('SKILLUP_MAIL_NAME') ?: 'SkillUp Kota Ternate',
        'secure' => getenv('SKILLUP_SMTP_SECURE') ?: 'tls',
    ],
];

<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("Script ini hanya boleh dijalankan melalui CLI.\n");
}
$config = require __DIR__ . '/../config/config.php';
$d = $config['db'];
$pdo = new PDO(
    "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}",
    $d['user'], $d['pass'],
    [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]
);
function prompt(string $label): string {
    fwrite(STDOUT, $label);
    return trim((string)fgets(STDIN));
}
$name = prompt("Nama Admin: ");
$email = strtolower(prompt("Email Admin: "));
$phone = prompt("Nomor HP Admin (08xxxxxxxxxx): ");
$password = prompt("Password Admin (min. 8, besar/kecil/angka/simbol): ");
preg_match_all('/\\p{L}/u', $name, $nameLetters);
if (count($nameLetters[0] ?? []) < 3) {
    fwrite(STDERR,"Nama tidak valid.\n"); exit(1);
}
if (!filter_var($email,FILTER_VALIDATE_EMAIL) || !preg_match('/^[a-z0-9]+(?:\\.[a-z0-9]+)*@gmail\\.com$/', $email)) {
    fwrite(STDERR,"Email Admin harus menggunakan Gmail yang valid.\n"); exit(1);
}
if (!preg_match('/^08[0-9]{8,10}$/',$phone)) {
    fwrite(STDERR,"Nomor HP tidak valid.\n"); exit(1);
}
if (strlen($password)<8 || !preg_match('/[A-Z]/',$password) || !preg_match('/[a-z]/',$password) || !preg_match('/[0-9]/',$password) || !preg_match('/[^A-Za-z0-9]/',$password)) {
    fwrite(STDERR,"Password belum memenuhi ketentuan.\n"); exit(1);
}
$q=$pdo->prepare("SELECT id FROM users WHERE email=?");
$q->execute([$email]);
if($q->fetch()){fwrite(STDERR,"Email sudah digunakan.\n");exit(1);}
$pdo->beginTransaction();
$q=$pdo->prepare("INSERT INTO users (role,name,email,phone,password_hash) VALUES ('admin',?,?,?,?)");
$q->execute([$name,$email,$phone,password_hash($password,PASSWORD_DEFAULT)]);
$id=(int)$pdo->lastInsertId();
$pdo->prepare("INSERT INTO admin_profiles (user_id) VALUES (?)")->execute([$id]);
$pdo->commit();
fwrite(STDOUT,"Akun Admin berhasil dibuat. ID: {$id}\n");

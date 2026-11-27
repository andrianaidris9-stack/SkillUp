<?php
declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';

ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_STRICT);
date_default_timezone_set('Asia/Jayapura');

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_name($config['app']['session_name']);
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax',
]);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private');

function respond(int $status, array $data): never {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
function ok(array $data = [], int $status = 200): never {
    respond($status, ['success' => true] + $data);
}
function fail(string $message, int $status = 400, array $errors = []): never {
    respond($status, ['success' => false, 'message' => $message, 'errors' => $errors]);
}
function db(): PDO {
    static $pdo = null;
    global $config;
    if ($pdo instanceof PDO) return $pdo;
    $d = $config['db'];
    $dsn = "mysql:host={$d['host']};port={$d['port']};dbname={$d['name']};charset={$d['charset']}";
    try {
        $pdo = new PDO($dsn, $d['user'], $d['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (Throwable $e) {
        error_log('SkillUp DB connection: ' . $e->getMessage());
        fail('Koneksi database belum tersedia. Periksa konfigurasi Backend/config/config.php.', 503);
    }
    return $pdo;
}
function body(): array {
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_contains($contentType, 'multipart/form-data') || str_contains($contentType, 'application/x-www-form-urlencoded')) {
        return $_POST;
    }
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) fail('Format permintaan tidak valid.', 400);
    return $data;
}
function csrf_token(): string {
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}
function require_csrf(): void {
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!$sent || !hash_equals((string)($_SESSION['csrf'] ?? ''), $sent)) {
        fail('Sesi keamanan kedaluwarsa. Muat ulang halaman dan coba kembali.', 419);
    }
}
function current_user(): ?array {
    return $_SESSION['user'] ?? null;
}
function require_auth(?string $role = null): array {
    $user = current_user();
    if (!$user) fail('Sesi login tidak ditemukan. Silakan login kembali.', 401);
    if ($role !== null && $user['role'] !== $role) fail('Anda tidak memiliki izin untuk melakukan tindakan ini.', 403);
    $q = db()->prepare("SELECT id, role, name, email, phone, status, session_version FROM users WHERE id = ? LIMIT 1");
    $q->execute([(int)$user['id']]);
    $fresh = $q->fetch();
    if (!$fresh || $fresh['status'] !== 'active' || (int)($fresh['session_version'] ?? -1) !== (int)($_SESSION['session_version'] ?? -2)) {
        $_SESSION = [];
        session_destroy();
        fail('Akun tidak aktif. Hubungi Admin.', 403);
    }
    $_SESSION['user'] = [
        'id' => (int)$fresh['id'],
        'role' => $fresh['role'],
        'name' => $fresh['name'],
        'email' => $fresh['email'],
        'phone' => $fresh['phone'],
    ];
    return $_SESSION['user'];
}
function audit(?int $actor, string $action, string $type, $id = null, array $details = []): void {
    $q = db()->prepare("INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, details, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $q->execute([
        $actor, $action, $type, $id === null ? null : (string)$id,
        $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
    ]);
}
function normalize_email(string $email): string {
    return strtolower(trim($email));
}
function valid_gmail(string $email): bool {
    return (bool)filter_var($email, FILTER_VALIDATE_EMAIL)
        && preg_match('/^[a-z0-9]+(?:\\.[a-z0-9]+)*@gmail\\.com$/', $email) === 1;
}
function valid_password(string $password): bool {
    return strlen($password) >= 8
        && preg_match('/[A-Z]/', $password)
        && preg_match('/[a-z]/', $password)
        && preg_match('/[0-9]/', $password)
        && preg_match('/[^A-Za-z0-9]/', $password);
}
function valid_name(string $name): bool {
    preg_match_all('/\p{L}/u', $name, $letters);
    return count($letters[0] ?? []) >= 3
        && preg_match("/^[\p{L}][\p{L}\s.'’\\-]*$/u", $name) === 1;
}
function valid_date(string $date): bool {
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    return $parsed instanceof DateTimeImmutable && $parsed->format('Y-m-d') === $date;
}
function age_from_date(?string $date): ?int {
    if (!$date || !valid_date($date)) return null;
    try { return (new DateTimeImmutable($date))->diff(new DateTimeImmutable('today'))->y; }
    catch (Throwable $e) { return null; }
}
function json_user(array $row): array {
    return [
        'id' => (int)$row['id'], 'role' => $row['role'],
        'name' => $row['name'], 'email' => $row['email'], 'phone' => $row['phone'],
    ];
}
function category_name(string $code): string {
    $q = db()->prepare("SELECT name FROM training_categories WHERE code = ?");
    $q->execute([$code]);
    return (string)($q->fetchColumn() ?: '');
}
function upload_image(string $field, string $folder): ?string {
    global $config;
    if (empty($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) return null;
    $file = $_FILES[$field];
    if ($file['error'] !== UPLOAD_ERR_OK) fail('Foto gagal diunggah.', 422);
    if ($file['size'] > $config['app']['max_upload_bytes']) fail('Ukuran foto maksimal 5 MB.', 422);
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($extensions[$mime])) fail('Format foto harus JPG, PNG, atau WEBP.', 422);
    $relativeDir = '../uploads/' . $folder;
    $absoluteDir = __DIR__ . '/../uploads/' . $folder;
    if (!is_dir($absoluteDir) && !mkdir($absoluteDir, 0750, true) && !is_dir($absoluteDir)) {
        fail('Folder penyimpanan foto tidak dapat dibuat.', 500);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
    if (!move_uploaded_file($file['tmp_name'], $absoluteDir . '/' . $name)) fail('Foto tidak dapat disimpan.', 500);
    return 'Backend/uploads/' . $folder . '/' . $name;
}
function mail_reset_code(string $to, string $code): bool {
    global $config;
    $mail = $config['mail'];
    if (!$mail['host'] || !$mail['username'] || !$mail['password'] || !$mail['from_email']) {
        error_log("SkillUp SMTP belum dikonfigurasi; kode reset tidak dikirim.");
        return false;
    }
    $autoload = __DIR__ . '/../vendor/autoload.php';
    if (!is_file($autoload)) {
        error_log("PHPMailer belum terpasang. Jalankan composer install di folder Backend.");
        return false;
    }
    require_once $autoload;
    try {
        $m = new PHPMailer\PHPMailer\PHPMailer(true);
        $m->isSMTP();
        $m->Host = $mail['host'];
        $m->SMTPAuth = true;
        $m->Username = $mail['username'];
        $m->Password = $mail['password'];
        $m->SMTPSecure = $mail['secure'];
        $m->Port = $mail['port'];
        $m->CharSet = 'UTF-8';
        $m->setFrom($mail['from_email'], $mail['from_name']);
        $m->addAddress($to);
        $m->isHTML(true);
        $m->Subject = 'Kode Reset Password SkillUp';
        $m->Body = '<p>Kode verifikasi reset password SkillUp Anda:</p><h2 style="letter-spacing:4px">' . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') . '</h2><p>Kode berlaku selama 15 menit. Jangan bagikan kode ini kepada siapa pun.</p>';
        $m->AltBody = "Kode reset password SkillUp: {$code}. Kode berlaku 15 menit.";
        $m->send();
        return true;
    } catch (Throwable $e) {
        error_log('SkillUp SMTP: ' . $e->getMessage());
        return false;
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$route = trim((string)($_GET['route'] ?? ''), '/');
$input = in_array($method, ['POST','PUT','PATCH','DELETE'], true) ? body() : [];
$publicNoCsrf = [];
if (in_array($method, ['POST','PUT','PATCH','DELETE'], true) && !in_array($route, $publicNoCsrf, true)) require_csrf();

try {
    /* BOOTSTRAP / AUTH */
    if ($route === 'auth/bootstrap' && $method === 'GET') {
        $u = current_user();
        $profile = null;
        if ($u) {
            if ($u['role'] === 'user') {
                $q = db()->prepare("SELECT birth_date, education, work_experience, address, photo_path FROM participant_profiles WHERE user_id=?");
            } else {
                $q = db()->prepare("SELECT position, photo_path FROM admin_profiles WHERE user_id=?");
            }
            $q->execute([$u['id']]);
            $profile = $q->fetch() ?: [];
        }
        ok(['csrf' => csrf_token(), 'user' => $u, 'profile' => $profile]);
    }
    if ($route === 'auth/me' && $method === 'GET') {
        $u = require_auth();
        $profile = null;
        if ($u['role'] === 'user') {
            $q = db()->prepare("SELECT birth_date, education, work_experience, address, photo_path FROM participant_profiles WHERE user_id=?");
            $q->execute([$u['id']]); $profile = $q->fetch() ?: [];
        } else {
            $q = db()->prepare("SELECT position, photo_path FROM admin_profiles WHERE user_id=?");
            $q->execute([$u['id']]); $profile = $q->fetch() ?: [];
        }
        ok(['user' => $u, 'profile' => $profile]);
    }
    if ($route === 'auth/register' && $method === 'POST') {
        $name = trim((string)($input['name'] ?? ''));
        $email = normalize_email((string)($input['email'] ?? ''));
        $phone = trim((string)($input['phone'] ?? ''));
        $password = (string)($input['password'] ?? '');
        $errors = [];
        if (!valid_name($name)) $errors['name'] = 'Nama minimal 3 huruf dan hanya boleh memakai huruf serta pemisah nama.';
        if (!valid_gmail($email)) $errors['email'] = 'Email harus menggunakan format Gmail yang valid.';
        if (!preg_match('/^08[0-9]{8,10}$/', $phone)) $errors['phone'] = 'Nomor harus diawali 08 dan terdiri dari 10–12 digit.';
        if (!valid_password($password)) $errors['password'] = 'Password minimal 8 karakter dan harus memuat huruf besar, huruf kecil, angka, serta karakter khusus.';
        if ($errors) fail('Periksa kembali data pendaftaran.', 422, $errors);
        $pdo = db();
        $q = $pdo->prepare("SELECT id FROM users WHERE email=?");
        $q->execute([$email]);
        if ($q->fetch()) fail('Email ini sudah terdaftar.', 409, ['email'=>'Email ini sudah terdaftar.']);
        try {
            $pdo->beginTransaction();
            $q = $pdo->prepare("INSERT INTO users (role,name,email,phone,password_hash) VALUES ('user',?,?,?,?)");
            $q->execute([$name,$email,$phone,password_hash($password,PASSWORD_DEFAULT)]);
            $id = (int)$pdo->lastInsertId();
            $pdo->prepare("INSERT INTO participant_profiles (user_id) VALUES (?)")->execute([$id]);
            audit($id,'register','user',$id,['role'=>'user']);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            if ($e instanceof PDOException && (string)$e->getCode()==='23000') fail('Email ini sudah terdaftar.',409,['email'=>'Email ini sudah terdaftar.']);
            throw $e;
        }
        ok(['message'=>'Pendaftaran berhasil. Silakan login.'],201);
    }
    if ($route === 'auth/login' && $method === 'POST') {
        $email = normalize_email((string)($input['email'] ?? ''));
        $password = (string)($input['password'] ?? '');
        $role = (string)($input['role'] ?? 'user');
        if (!in_array($role,['user','admin'],true)) fail('Pilihan jenis akun tidak valid.',422);
        if (!valid_gmail($email)) fail('Email atau password tidak sesuai.',401);
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        db()->exec("DELETE FROM auth_login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $limit = db()->prepare("SELECT COUNT(*) FROM auth_login_attempts WHERE email=? AND ip_address=? AND succeeded=0 AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)");
        $limit->execute([$email,$ip]);
        if ((int)$limit->fetchColumn() >= 10) fail('Terlalu banyak percobaan login. Tunggu 15 menit sebelum mencoba kembali.',429);
        $q = db()->prepare("SELECT * FROM users WHERE email=? AND role=? LIMIT 1");
        $q->execute([$email,$role]); $row = $q->fetch();
        if (!$row || $row['status']!=='active' || !password_verify($password,$row['password_hash'])) {
            db()->prepare("INSERT INTO auth_login_attempts (email,ip_address,succeeded) VALUES (?,?,0)")->execute([$email,$ip]);
            usleep(250000);
            fail('Email atau password tidak sesuai.',401);
        }
        db()->prepare("INSERT INTO auth_login_attempts (email,ip_address,succeeded) VALUES (?,?,1)")->execute([$email,$ip]);
        db()->prepare("DELETE FROM auth_login_attempts WHERE email=? AND ip_address=? AND succeeded=0")->execute([$email,$ip]);
        if (password_needs_rehash($row['password_hash'],PASSWORD_DEFAULT)) {
            db()->prepare("UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?")->execute([password_hash($password,PASSWORD_DEFAULT),$row['id']]);
        }
        session_regenerate_id(true);
        $_SESSION['user'] = json_user($row);
        $_SESSION['session_version'] = (int)$row['session_version'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        db()->prepare("UPDATE users SET last_login_at=NOW() WHERE id=?")->execute([$row['id']]);
        audit((int)$row['id'],'login','user',$row['id']);
        ok(['user'=>$_SESSION['user'],'csrf'=>$_SESSION['csrf']]);
    }
    if ($route === 'auth/logout' && $method === 'POST') {
        $u = current_user();
        if ($u) audit((int)$u['id'],'logout','user',$u['id']);
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time()-42000, $params['path'], '', $params['secure'], $params['httponly']);
        }
        session_destroy();
        ok(['message'=>'Anda berhasil logout.']);
    }
    if ($route === 'auth/forgot-password' && $method === 'POST') {
        $email = normalize_email((string)($input['email'] ?? ''));
        if (!valid_gmail($email)) fail('Masukkan alamat Gmail yang valid.',422,['email'=>'Masukkan alamat Gmail yang valid.']);
        $mailConfig=$config['mail'];
        $smtpReady=$mailConfig['host']&&$mailConfig['username']&&$mailConfig['password']&&$mailConfig['from_email']&&is_file(__DIR__.'/../vendor/autoload.php');
        $devCode=null;
        if(!$smtpReady&&empty($config['app']['debug'])) {
            fail('Layanan email OTP belum dikonfigurasi. Admin perlu mengatur SMTP dan menjalankan composer install terlebih dahulu.',503);
        }
        $q = db()->prepare("SELECT id,email FROM users WHERE email=? AND status='active' LIMIT 1");
        $q->execute([$email]); $user = $q->fetch();
        // Pesan selalu sama untuk mencegah enumerasi akun.
        db()->exec("DELETE FROM password_reset_tokens WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY) OR used_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
        if ($user) {
            $limit=db()->prepare("SELECT COUNT(*) FROM password_reset_tokens WHERE user_id=? AND created_at>=DATE_SUB(NOW(),INTERVAL 15 MINUTE)");
            $limit->execute([$user['id']]);
            if((int)$limit->fetchColumn()<3){
                $code = (string)random_int(100000,999999);
                $hash = password_hash($code, PASSWORD_DEFAULT);
                db()->prepare("UPDATE password_reset_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL")->execute([$user['id']]);
                $expiresAt = (new DateTimeImmutable('now'))->modify('+' . (int)$config['app']['reset_token_minutes'] . ' minutes')->format('Y-m-d H:i:s');
                db()->prepare("INSERT INTO password_reset_tokens (user_id,token_hash,expires_at) VALUES (?,?,?)")
                    ->execute([$user['id'],$hash,$expiresAt]);
                $sent=$smtpReady&&mail_reset_code($email,$code);
                if (!$sent) {
                    error_log("SkillUp reset mail delivery failed for user ID " . $user['id']);
                    if(!empty($config['app']['debug']))$devCode=$code;
                }
            }
        }
        $res=['message'=>'Jika email terdaftar, kode verifikasi akan dikirim. Pastikan layanan email sudah dikonfigurasi.'];
        if($devCode!==null){$res['dev_code']=$devCode;$res['message']='Mode pengembangan: email belum dikirim karena SMTP belum diisi. Kode OTP ditampilkan pada pop-up.';}
        ok($res);
    }
    if ($route === 'auth/reset-password' && $method === 'POST') {
        $email = normalize_email((string)($input['email'] ?? ''));
        $code = preg_replace('/\D/','',(string)($input['code'] ?? ''));
        $password = (string)($input['password'] ?? '');
        if (!valid_password($password)) fail('Password minimal 8 karakter dan harus memuat huruf besar, huruf kecil, angka, serta karakter khusus.',422,['password'=>'Password belum memenuhi ketentuan.']);
        $q = db()->prepare("SELECT u.id,t.id token_id,t.token_hash,t.expires_at,t.attempts FROM users u JOIN password_reset_tokens t ON t.user_id=u.id WHERE u.email=? AND t.used_at IS NULL ORDER BY t.created_at DESC LIMIT 1");
        $q->execute([$email]); $row = $q->fetch();
        $validCode = $row ? password_verify($code, $row['token_hash']) : false;
        if (!$row || (int)$row['attempts']>=5 || strtotime($row['expires_at'])<time() || !$validCode) {
            if ($row) db()->prepare("UPDATE password_reset_tokens SET attempts=attempts+1 WHERE id=?")->execute([$row['token_id']]);
            fail('Kode verifikasi tidak valid atau sudah kedaluwarsa.',422,['code'=>'Kode verifikasi tidak valid atau sudah kedaluwarsa.']);
        }
        $pdo=db(); $pdo->beginTransaction();
        $pdo->prepare("UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?")->execute([password_hash($password,PASSWORD_DEFAULT),$row['id']]);
        $pdo->prepare("UPDATE password_reset_tokens SET used_at=NOW() WHERE id=?")->execute([$row['token_id']]);
        audit((int)$row['id'],'password_reset','user',$row['id']);
        $pdo->commit();
        ok(['message'=>'Password berhasil diperbarui. Silakan login kembali.']);
    }

    /* PROFILE */
    if ($route === 'profile' && $method === 'GET') {
        $u=require_auth();
        if ($u['role']==='user') {
            $q=db()->prepare("SELECT birth_date,education,work_experience,address,photo_path FROM participant_profiles WHERE user_id=?");
        } else {
            $q=db()->prepare("SELECT position,photo_path FROM admin_profiles WHERE user_id=?");
        }
        $q->execute([$u['id']]); ok(['user'=>$u,'profile'=>$q->fetch() ?: []]);
    }
    if ($route === 'profile' && in_array($method,['PUT','POST'],true)) {
        $u=require_auth();
        $name=trim((string)($_POST['name'] ?? $input['name'] ?? ''));
        if (!valid_name($name)) fail('Nama minimal 3 huruf dan hanya boleh memakai huruf serta pemisah nama.',422,['name'=>'Nama tidak valid.']);
        $pdo=db();
        $pdo->beginTransaction();
        $pdo->prepare("UPDATE users SET name=? WHERE id=?")->execute([$name,$u['id']]);
        if ($u['role']==='user') {
            $beforeQuery=$pdo->prepare("SELECT birth_date,education,work_experience FROM participant_profiles WHERE user_id=?");
            $beforeQuery->execute([$u['id']]);
            $beforeProfile=$beforeQuery->fetch() ?: [];
            $phone=trim((string)($_POST['phone'] ?? $input['phone'] ?? ''));
            $birth=trim((string)($_POST['birth_date'] ?? $input['birth_date'] ?? ''));
            $education=trim((string)($_POST['education'] ?? $input['education'] ?? ''));
            $experience=trim((string)($_POST['work_experience'] ?? $input['work_experience'] ?? ''));
            $address=trim((string)($_POST['address'] ?? $input['address'] ?? ''));
            $errors=[];
            if (!preg_match('/^08[0-9]{8,10}$/',$phone)) $errors['phone']='Nomor harus diawali 08 dan terdiri dari 10–12 digit.';
            $age=age_from_date($birth);
            if (!$age || $age<17 || !valid_date($birth) || $birth>date('Y-m-d')) $errors['birth_date']='Usia minimal 17 tahun dan tanggal lahir tidak boleh di masa depan.';
            if (!in_array($education,['SMA/SMK/MA','Diploma','S1','S2','S3'],true)) $errors['education']='Pendidikan terakhir minimal SMA/SMK/MA.';
            if (!in_array($experience,['Belum ada','Informal','Formal kurang dari 2 tahun','Formal 2 tahun atau lebih'],true)) $errors['work_experience']='Pilih pengalaman kerja yang tersedia.';
            if (strlen($address)<10 || preg_match('/^[\\p{L}\\p{N}\\s,\.\/#-]+$/u',$address)!==1) $errors['address']='Alamat minimal 10 karakter dan hanya boleh berisi huruf, angka, spasi, serta tanda baca alamat yang wajar.';
            if ($errors) { $pdo->rollBack(); fail('Periksa kembali data profil.',422,$errors); }
            $photo=upload_image('photo','profile');
            $removePhoto = (string)($_POST['remove_photo'] ?? $input['remove_photo'] ?? '') === '1';
            $sql="UPDATE participant_profiles SET birth_date=?,education=?,work_experience=?,address=?".($photo?",photo_path=?":($removePhoto?",photo_path=NULL":""))." WHERE user_id=?";
            $args=[$birth,$education,$experience,$address]; if($photo)$args[]=$photo; $args[]=$u['id'];
            $pdo->prepare($sql)->execute($args);
            $pdo->prepare("UPDATE users SET phone=? WHERE id=?")->execute([$phone,$u['id']]);
            // Hanya atribut yang menjadi input Decision Tree yang membatalkan hasil klasifikasi.
            $inputModelBerubah = ($beforeProfile['birth_date'] ?? null) !== $birth
                || ($beforeProfile['education'] ?? null) !== $education
                || ($beforeProfile['work_experience'] ?? null) !== $experience;
            if ($inputModelBerubah) {
                $pdo->prepare("UPDATE classifications SET is_current=0 WHERE participant_id=? AND is_current=1")->execute([$u['id']]);
                $pdo->prepare("UPDATE initial_assessments ia SET status=CASE WHEN EXISTS (SELECT 1 FROM practical_assessments pa WHERE pa.initial_assessment_id=ia.id AND pa.is_current=1) THEN 'ready' ELSE 'submitted' END WHERE ia.participant_id=? AND ia.is_current=1")->execute([$u['id']]);
            }
        } else {
            $photo=upload_image('photo','profile');
            $removePhoto = (string)($_POST['remove_photo'] ?? $input['remove_photo'] ?? '') === '1';
            $pdo->prepare("INSERT INTO admin_profiles (user_id) VALUES (?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)")->execute([$u['id']]);
            if ($photo) $pdo->prepare("UPDATE admin_profiles SET photo_path=? WHERE user_id=?")->execute([$photo,$u['id']]);
            elseif ($removePhoto) $pdo->prepare("UPDATE admin_profiles SET photo_path=NULL WHERE user_id=?")->execute([$u['id']]);
        }
        audit((int)$u['id'],'profile_update','profile',$u['id']);
        $pdo->commit();
        $q=$pdo->prepare("SELECT id,role,name,email,phone FROM users WHERE id=?");$q->execute([$u['id']]);$fresh=$q->fetch();
        $_SESSION['user']=json_user($fresh);
        ok(['user'=>$_SESSION['user'],'message'=>'Profil berhasil diperbarui.']);
    }
    if ($route === 'profile/photo' && $method === 'DELETE') {
        $u=require_auth();
        $table=$u['role']==='user'?'participant_profiles':'admin_profiles';
        $pdo=db();
        $pdo->prepare("UPDATE {$table} SET photo_path=NULL WHERE user_id=?")->execute([$u['id']]);
        audit((int)$u['id'],'profile_photo_remove','profile',$u['id']);
        ok(['message'=>'Foto profil dihapus.']);
    }

    /* CATEGORIES / TRAINING PROGRAMS */
    if ($route === 'categories' && $method === 'GET') {
        $q=db()->query("SELECT code,name FROM training_categories ORDER BY name");
        ok(['categories'=>$q->fetchAll()]);
    }
    if ($route === 'trainings' && $method === 'GET') {
        $u=current_user();
        if($u && $u['role']==='admin')$u=require_auth('admin');
        $admin=$u && $u['role']==='admin';
        $sql="SELECT p.*,c.name category FROM training_programs p JOIN training_categories c ON c.code=p.category_code WHERE p.deleted_at IS NULL";
        $params=[];
        if (!$admin) $sql.=" AND p.status='Published'";
        if (!empty($_GET['category'])) { $sql.=" AND p.category_code=?";$params[]=$_GET['category'];}
        if (!empty($_GET['q'])) {$sql.=" AND (p.title LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";$s='%'.$_GET['q'].'%';array_push($params,$s,$s,$s);}
        $sql.=" ORDER BY p.created_at DESC";
        $q=db()->prepare($sql);$q->execute($params);ok(['trainings'=>$q->fetchAll()]);
    }
    if (preg_match('#^trainings/(\d+)$#',$route,$m) && $method==='GET') {
        $u=current_user();if($u && $u['role']==='admin')$u=require_auth('admin');$admin=$u && $u['role']==='admin';
        $sql="SELECT p.*,c.name category FROM training_programs p JOIN training_categories c ON c.code=p.category_code WHERE p.id=? AND p.deleted_at IS NULL";
        if(!$admin)$sql.=" AND p.status='Published'";
        $q=db()->prepare($sql);$q->execute([(int)$m[1]]);$item=$q->fetch();if(!$item)fail('Program pelatihan tidak ditemukan.',404);ok(['training'=>$item]);
    }
    if ($route==='admin/trainings' && $method==='POST') {
        $u=require_auth('admin');
        $title=trim((string)($_POST['title']??''));$category=trim((string)($_POST['category_code']??''));$level=trim((string)($_POST['level']??''));$hours=(int)($_POST['duration_hours']??0);$fee=(float)($_POST['fee']??0);$instructor=trim((string)($_POST['instructor']??''));$start=(string)($_POST['start_date']??'');$end=(string)($_POST['end_date']??'');$status=(string)($_POST['status']??'Draft');$description=trim((string)($_POST['description']??''));
        $errors=[];if((preg_match_all('/./us',$title) ?: 0)<3)$errors['title']='Judul minimal 3 karakter.';if(!category_name($category))$errors['category_code']='Pilih kategori resmi.';if(!ctype_digit((string)($_POST['duration_hours']??''))||$hours<1||$hours>65535)$errors['duration_hours']='Durasi harus berupa bilangan bulat minimal 1 jam.';if(!is_numeric($_POST['fee']??null)||$fee<0||$fee>9999999999.99)$errors['fee']='Biaya harus berupa angka dan tidak boleh negatif.';if(!in_array($level,['Pemula','Menengah','Mahir'],true))$errors['level']='Pilih tingkat pelatihan.';if($instructor==='')$errors['instructor']='Instruktur wajib diisi.';if(!valid_date($start)||!valid_date($end)||$end<$start)$errors['end_date']='Tanggal selesai harus sama atau setelah tanggal mulai.';if(!in_array($status,['Draft','Published'],true))$errors['status']='Status tidak valid.';if($description==='')$errors['description']='Deskripsi wajib diisi.';if($errors)fail('Periksa formulir pelatihan.',422,$errors);
        $image=upload_image('cover','training');
        $q=db()->prepare("INSERT INTO training_programs (title,category_code,level,duration_hours,fee,instructor,start_date,end_date,status,description,cover_image,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
        $q->execute([$title,$category,$level,$hours,$fee,$instructor,$start,$end,$status,$description,$image,$u['id'],$u['id']]);
        $id=(int)db()->lastInsertId();audit((int)$u['id'],'training_create','training',$id);ok(['id'=>$id,'message'=>'Program pelatihan berhasil ditambahkan.'],201);
    }
    if (preg_match('#^admin/trainings/(\d+)$#',$route,$m) && $method==='POST') {
        $u=require_auth('admin');$id=(int)$m[1];
        $title=trim((string)($_POST['title']??''));$category=trim((string)($_POST['category_code']??''));$level=trim((string)($_POST['level']??''));$hours=(int)($_POST['duration_hours']??0);$fee=(float)($_POST['fee']??0);$instructor=trim((string)($_POST['instructor']??''));$start=(string)($_POST['start_date']??'');$end=(string)($_POST['end_date']??'');$status=(string)($_POST['status']??'Draft');$description=trim((string)($_POST['description']??''));
        $errors=[];if((preg_match_all('/./us',$title) ?: 0)<3)$errors['title']='Judul minimal 3 karakter.';if(!category_name($category))$errors['category_code']='Pilih kategori resmi.';if(!ctype_digit((string)($_POST['duration_hours']??''))||$hours<1||$hours>65535)$errors['duration_hours']='Durasi harus berupa bilangan bulat minimal 1 jam.';if(!is_numeric($_POST['fee']??null)||$fee<0||$fee>9999999999.99)$errors['fee']='Biaya harus berupa angka dan tidak boleh negatif.';if(!in_array($level,['Pemula','Menengah','Mahir'],true))$errors['level']='Pilih tingkat pelatihan.';if($instructor==='')$errors['instructor']='Instruktur wajib diisi.';if(!valid_date($start)||!valid_date($end)||$end<$start)$errors['end_date']='Tanggal selesai harus sama atau setelah tanggal mulai.';if(!in_array($status,['Draft','Published'],true))$errors['status']='Status tidak valid.';if($description==='')$errors['description']='Deskripsi wajib diisi.';if($errors)fail('Periksa formulir pelatihan.',422,$errors);
        $image=upload_image('cover','training');
        $sql="UPDATE training_programs SET title=?,category_code=?,level=?,duration_hours=?,fee=?,instructor=?,start_date=?,end_date=?,status=?,description=?,updated_by=?".($image?",cover_image=?":"")." WHERE id=? AND deleted_at IS NULL";
        $args=[$title,$category,$level,$hours,$fee,$instructor,$start,$end,$status,$description,$u['id']];if($image)$args[]=$image;$args[]=$id;
        $q=db()->prepare($sql);$q->execute($args);if(!$q->rowCount()){$check=db()->prepare("SELECT id FROM training_programs WHERE id=? AND deleted_at IS NULL");$check->execute([$id]);if(!$check->fetch())fail('Program pelatihan tidak ditemukan.',404);}
        audit((int)$u['id'],'training_update','training',$id);ok(['message'=>'Program pelatihan berhasil diperbarui.']);
    }
    if (preg_match('#^admin/trainings/(\d+)$#',$route,$m) && $method==='DELETE') {
        $u=require_auth('admin');$id=(int)$m[1];
        $q=db()->prepare("UPDATE training_programs SET deleted_at=NOW(),status='Draft',updated_by=? WHERE id=? AND deleted_at IS NULL");
        $q->execute([$u['id'],$id]);if(!$q->rowCount())fail('Program tidak ditemukan atau sudah dihapus.',404);
        audit((int)$u['id'],'training_archive','training',$id);ok(['message'=>'Program diarsipkan. Riwayat rekomendasi tetap aman.']);
    }

    /* PARTICIPANTS */
    if ($route==='admin/participants' && $method==='GET') {
        require_auth('admin');
        $q=db()->query("SELECT u.id,u.name,u.email,u.phone,u.status,u.created_at,p.birth_date,p.education,p.work_experience,p.address,p.photo_path,ia.id assessment_id,ia.status assessment_status,ia.submitted_at,pa.practical_level,cl.predicted_category_code,cl.processed_at FROM users u LEFT JOIN participant_profiles p ON p.user_id=u.id LEFT JOIN initial_assessments ia ON ia.participant_id=u.id AND ia.is_current=1 LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 LEFT JOIN classifications cl ON cl.participant_id=u.id AND cl.is_current=1 WHERE u.role='user' ORDER BY u.created_at DESC");
        ok(['participants'=>$q->fetchAll()]);
    }
        /* INITIAL ASSESSMENT */
    if ($route==='assessment/initial' && $method==='GET') {
        $u=require_auth('user');
        $q=db()->prepare("SELECT ia.*,c.name interest_category,pa.practical_level,cl.predicted_category_code,pc.name predicted_category,cl.explanation classification_explanation FROM initial_assessments ia JOIN training_categories c ON c.code=ia.interest_category_code LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 LEFT JOIN classifications cl ON cl.participant_id=ia.participant_id AND cl.is_current=1 LEFT JOIN training_categories pc ON pc.code=cl.predicted_category_code WHERE ia.participant_id=? AND ia.is_current=1 LIMIT 1");
        $q->execute([$u['id']]);$a=$q->fetch();ok(['assessment'=>$a ?: null]);
    }
    if ($route==='assessment/initial' && $method==='POST') {
        $u=require_auth('user');$code=strtoupper(trim((string)($input['interest_category_code']??'')));$computer=(string)($input['computer_level']??'');$communication=(string)($input['communication_level']??'');
        if(!category_name($code))fail('Minat bidang harus menggunakan kategori resmi.',422,['interest_category_code'=>'Pilih kategori minat.']);
        if(!in_array($computer,['Dasar','Menengah','Mahir'],true))fail('Kemampuan komputer tidak valid.',422,['computer_level'=>'Pilih tingkat kemampuan.']);
        if(!in_array($communication,['Dasar','Menengah','Mahir'],true))fail('Kemampuan komunikasi tidak valid.',422,['communication_level'=>'Pilih tingkat kemampuan.']);
        $p=db()->prepare("SELECT birth_date,education,work_experience FROM participant_profiles WHERE user_id=?");$p->execute([$u['id']]);$profile=$p->fetch();
        $age=age_from_date($profile['birth_date']??null);
        if(!$profile||!$age||$age<17||!$profile['education']||!$profile['work_experience'])fail('Lengkapi profil dan pastikan usia minimal 17 tahun sebelum mengisi asesmen.',422);
        $q=db()->prepare("SELECT id FROM initial_assessments WHERE participant_id=? AND is_current=1");$q->execute([$u['id']]);if($q->fetch())fail('Asesmen awal sudah dikirim. Hubungi Admin jika memerlukan koreksi.',409);
        $q=db()->prepare("INSERT INTO initial_assessments (participant_id,interest_category_code,computer_level,communication_level) VALUES (?,?,?,?)");$q->execute([$u['id'],$code,$computer,$communication]);$id=(int)db()->lastInsertId();audit((int)$u['id'],'initial_assessment_submit','assessment',$id);ok(['id'=>$id,'message'=>'Asesmen awal berhasil dikirim.'],201);
    }
    if ($route==='admin/assessments' && $method==='GET') {
        require_auth('admin');
        $sql="SELECT ia.id,ia.id assessment_id,ia.participant_id,u.name nama,u.email,u.phone,p.birth_date,TIMESTAMPDIFF(YEAR,p.birth_date,CURDATE()) usia,p.education pendidikan,p.work_experience pengalaman_kerja,p.address,ia.interest_category_code minat_bidang,c.name interest_category,ia.computer_level kemampuan_komputer,ia.communication_level kemampuan_komunikasi,ia.status,ia.submitted_at,pa.id practical_id,pa.practical_level keterampilan_praktik,pa.practical_level kemampuan_teknis,pa.independence_level kemandirian_praktik,pa.indicators indikator_json,pa.notes catatan_penilaian,pa.assessed_at FROM initial_assessments ia JOIN users u ON u.id=ia.participant_id JOIN participant_profiles p ON p.user_id=u.id JOIN training_categories c ON c.code=ia.interest_category_code LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.is_current=1 ORDER BY ia.submitted_at DESC";
        $q=db()->query($sql);ok(['assessments'=>$q->fetchAll()]);
    }
    if (preg_match('#^admin/assessments/(\d+)/practical$#',$route,$m) && $method==='POST') {
        $u=require_auth('admin');$assessmentId=(int)$m[1];
        $q=db()->prepare("SELECT id,participant_id,interest_category_code FROM initial_assessments WHERE id=? AND is_current=1");$q->execute([$assessmentId]);$a=$q->fetch();if(!$a)fail('Asesmen awal tidak ditemukan.',404);
        $level=(string)($input['practical_level']??'');$independence=(string)($input['independence_level']??'');$notes=trim((string)($input['notes']??''));$indicators=$input['indicators']??[];
        if(!in_array($level,['Dasar','Menengah','Mahir'],true)||!in_array($independence,['Memerlukan banyak bantuan','Dengan sedikit bantuan','Mandiri'],true))fail('Tingkat keterampilan praktik tidak valid.',422);
        if(!is_array($indicators))fail('Indikator penilaian tidak valid.',422);
        $indicatorIds=['indikator1','indikator2','indikator3','indikator4','indikator5'];
        foreach($indicatorIds as $indicatorId){
            if(!in_array($indicators[$indicatorId]??null,['Belum mampu','Dengan bantuan','Mandiri'],true)){
                fail('Semua lima indikator praktik wajib diisi dengan nilai yang valid.',422,['indicators'=>'Lengkapi seluruh indikator pengamatan.']);
            }
        }
        if($notes==='')fail('Catatan penilaian wajib diisi.',422,['notes'=>'Catatan penilaian wajib diisi.']);
        $pdo=db();$pdo->beginTransaction();
        $pdo->prepare("UPDATE practical_assessments SET is_current=0 WHERE initial_assessment_id=? AND is_current=1")->execute([$assessmentId]);
        $q=$pdo->prepare("INSERT INTO practical_assessments (initial_assessment_id,participant_id,admin_id,category_code,indicators,independence_level,practical_level,notes) VALUES (?,?,?,?,?,?,?,?)");
        $q->execute([$assessmentId,$a['participant_id'],$u['id'],$a['interest_category_code'],json_encode($indicators,JSON_UNESCAPED_UNICODE),$independence,$level,$notes]);
        $practicalId=(int)$pdo->lastInsertId();
        $pdo->prepare("UPDATE initial_assessments SET status='ready' WHERE id=?")->execute([$assessmentId]);
        $pdo->prepare("UPDATE classifications SET is_current=0 WHERE participant_id=? AND is_current=1")->execute([$a['participant_id']]);
        audit((int)$u['id'],'practical_assessment_create','practical_assessment',$practicalId,['initial_assessment_id'=>$assessmentId]);
        $pdo->commit();ok(['message'=>'Penilaian praktik berhasil disimpan.']);
    }

    /* CLASSIFICATIONS */
    if ($route==='admin/classifications' && $method==='GET') {
        require_auth('admin');
        $q=db()->query("SELECT cl.id,cl.id classification_id,cl.participant_id,u.name,u.email,ia.interest_category_code interest_code,ic.name interest_category,cl.predicted_category_code,c.name predicted_category,cl.model_version,cl.explanation,cl.processed_at,cl.is_current FROM classifications cl JOIN users u ON u.id=cl.participant_id JOIN initial_assessments ia ON ia.id=cl.initial_assessment_id JOIN training_categories ic ON ic.code=ia.interest_category_code JOIN training_categories c ON c.code=cl.predicted_category_code WHERE cl.is_current=1 ORDER BY cl.processed_at DESC");
        $rows=$q->fetchAll();
        foreach($rows as &$r){$rq=db()->prepare("SELECT p.id,p.title,p.category_code,p.duration_hours,p.fee,p.start_date,p.end_date,p.cover_image FROM classification_recommendations cr JOIN training_programs p ON p.id=cr.training_program_id WHERE cr.classification_id=? AND p.deleted_at IS NULL");$rq->execute([$r['id']]);$r['recommendations']=$rq->fetchAll();}
        ok(['classifications'=>$rows]);
    }
    if ($route==='admin/classifications/process' && $method==='POST') {
        $u=require_auth('admin');
        $dataset=realpath(__DIR__.'/../../Dataset/SkillUp_Dataset_100.csv');
        if(!$dataset||!is_file($dataset))fail('Dataset Decision Tree tidak ditemukan.',500);
        $rows=[];$fp=fopen($dataset,'r');$headers=fgetcsv($fp);if(!$headers)fail('Dataset kosong.',500);
        $headers=array_map(fn($v)=>strtolower(trim(preg_replace('/^\xEF\xBB\xBF/','',$v))),$headers);
        while(($line=fgetcsv($fp))!==false){if(count($line)!==count($headers))continue;$rows[]=array_combine($headers,$line);}fclose($fp);
        $attrs=['usia','pendidikan','pengalaman_kerja','minat_bidang','kemampuan_komputer','kemampuan_komunikasi','keterampilan_praktik'];
        $norm=function(array $r) {
            $age=(int)($r['usia']??0);$r['usia']=$age<=24?'18-24':($age<=34?'25-34':'35+');
            $edu=strtoupper(str_replace(' ','',(string)($r['pendidikan']??'')));$r['pendidikan']=in_array($edu,['SMA','SMK','MA','SMA/SMK','SMA/SMK/MA'],true)?'SMA/SMK':(in_array($edu,['DIPLOMA','S1','S2','S3','DIPLOMA/S1'],true)?'Diploma/S1':$edu);
            foreach(['kemampuan_komputer','kemampuan_komunikasi','keterampilan_praktik'] as $k){$v=strtolower(trim((string)($r[$k]??'')));$r[$k]=['1'=>'Dasar','dasar'=>'Dasar','2'=>'Menengah','menengah'=>'Menengah','3'=>'Mahir','mahir'=>'Mahir'][$v]??'';}
            $r['minat_bidang']=strtoupper(trim((string)($r['minat_bidang']??'')));$r['kebutuhan_pelatihan']=strtoupper(trim((string)($r['kebutuhan_pelatihan']??'')));
            return $r;
        };
        $rows=array_map($norm,$rows);
        $entropy=function(array $data):float{$counts=[];foreach($data as $r){$k=$r['kebutuhan_pelatihan'];$counts[$k]=($counts[$k]??0)+1;}$e=0;$n=count($data);foreach($counts as $c){$p=$c/$n;$e-=$p*log($p,2);}return $e;};
        $majority=function(array $data):string{$counts=[];foreach($data as $r){$k=$r['kebutuhan_pelatihan'];$counts[$k]=($counts[$k]??0)+1;}uksort($counts,function($a,$b)use($counts){return ($counts[$b]<=>$counts[$a])?:strcmp($a,$b);});return (string)array_key_first($counts);};
        $build=null;
        $build=function(array $data,array $available)use(&$build,$attrs,$entropy,$majority){
            $maj=$majority($data);$classes=array_unique(array_column($data,'kebutuhan_pelatihan'));
            if(count($classes)===1||!$available)return ['leaf'=>$maj,'majority'=>$maj];
            $base=$entropy($data);$best=null;$bestGain=0.0;
            foreach($available as $attr){$groups=[];foreach($data as $r)$groups[$r[$attr]][]=$r;$after=0;foreach($groups as $g)$after+=(count($g)/count($data))*$entropy($g);$gain=$base-$after;if($gain>$bestGain+1e-12||($gain>0&&abs($gain-$bestGain)<=1e-12&&($best===null||strcmp($attr,$best)<0))){$best=$attr;$bestGain=$gain;}}
            if($best===null)return ['leaf'=>$maj,'majority'=>$maj];
            $groups=[];foreach($data as $r)$groups[$r[$best]][]=$r;$branches=[];$next=array_values(array_diff($available,[$best]));ksort($groups);
            foreach($groups as $value=>$g)$branches[$value]=$build($g,$next);
            return ['attribute'=>$best,'majority'=>$maj,'branches'=>$branches];
        };
        if(!$rows)fail('Dataset tidak memiliki data.',500);
        $tree=$build($rows,$attrs);
        $predict=function(array $record)use($tree){$node=$tree;while(isset($node['attribute'])){$attr=$node['attribute'];$value=(string)($record[$attr]??'');if(!isset($node['branches'][$value]))return $node['majority'];$node=$node['branches'][$value];}return $node['leaf'];};
        $q=db()->query("SELECT ia.id initial_id,ia.participant_id,ia.interest_category_code,ia.computer_level,ia.communication_level,p.birth_date,p.education,p.work_experience,pa.id practical_id,pa.practical_level FROM initial_assessments ia JOIN participant_profiles p ON p.user_id=ia.participant_id LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.is_current=1 AND ia.status IN ('submitted','ready','classified')");
        $eligible=$q->fetchAll();$done=0;$incomplete=0;$pdo=db();$pdo->beginTransaction();
        foreach($eligible as $a){
            if(empty($a['practical_id'])){$incomplete++;continue;}
            $age=age_from_date($a['birth_date']);if(!$age||$age<17||!$a['education']||!$a['work_experience']){$incomplete++;continue;}
            $rec=['usia'=>(string)$age,'pendidikan'=>$a['education'],'pengalaman_kerja'=>$a['work_experience'],'minat_bidang'=>$a['interest_category_code'],'kemampuan_komputer'=>$a['computer_level'],'kemampuan_komunikasi'=>$a['communication_level'],'keterampilan_praktik'=>$a['practical_level']];
            $rec=$norm($rec);$target=$predict($rec);
            if(!category_name($target)){$incomplete++;continue;}
            $pdo->prepare("UPDATE classifications SET is_current=0 WHERE participant_id=? AND is_current=1")->execute([$a['participant_id']]);
            $pdo->prepare("INSERT INTO classifications (participant_id,initial_assessment_id,practical_assessment_id,predicted_category_code,model_version,explanation,input_snapshot,processed_by_admin_id) VALUES (?,?,?,?,?,?,?,?)")
                ->execute([$a['participant_id'],$a['initial_id'],$a['practical_id'],$target,'ID3-SkillUp-100-v1','Prediksi Decision Tree ID3 dari dataset contoh SkillUp_Dataset_100.csv.',json_encode($rec,JSON_UNESCAPED_UNICODE),$u['id']]);
            $classId=(int)$pdo->lastInsertId();
            $t=$pdo->prepare("SELECT id FROM training_programs WHERE category_code=? AND status='Published' AND deleted_at IS NULL AND end_date>=CURDATE()");
            $t->execute([$target]);foreach($t->fetchAll(PDO::FETCH_COLUMN) as $trainingId){$pdo->prepare("INSERT IGNORE INTO classification_recommendations (classification_id,training_program_id) VALUES (?,?)")->execute([$classId,$trainingId]);}
            $pdo->prepare("UPDATE initial_assessments SET status='classified' WHERE id=?")->execute([$a['initial_id']]);$done++;
        }
        audit((int)$u['id'],'classification_process','classification',null,['processed'=>$done,'incomplete'=>$incomplete,'dataset_rows'=>count($rows)]);
        $pdo->commit();ok(['processed'=>$done,'incomplete'=>$incomplete,'dataset_rows'=>count($rows),'message'=>"Klasifikasi selesai. {$done} peserta diproses; {$incomplete} peserta belum memenuhi syarat."]);
    }
    if (preg_match('#^admin/classifications/(\d+)$#',$route,$m) && $method==='DELETE') {
        $u=require_auth('admin');$id=(int)$m[1];
        $q=db()->prepare("UPDATE classifications SET is_current=0 WHERE id=? AND is_current=1");$q->execute([$id]);if(!$q->rowCount())fail('Hasil klasifikasi tidak ditemukan.',404);
        audit((int)$u['id'],'classification_archive','classification',$id);ok(['message'=>'Hasil klasifikasi diarsipkan. Asesmen tetap tersimpan.']);
    }
    if ($route==='participant/recommendations' && $method==='GET') {
        $u=require_auth('user');
        $q=db()->prepare("SELECT ia.id,ia.status,ia.interest_category_code,ia.computer_level,ia.communication_level,pa.practical_level FROM initial_assessments ia LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.participant_id=? AND ia.is_current=1 LIMIT 1");
        $q->execute([$u['id']]);$assessment=$q->fetch()?:null;
        $q=db()->prepare("SELECT cl.id,cl.predicted_category_code,c.name predicted_category,cl.explanation,cl.processed_at FROM classifications cl JOIN training_categories c ON c.code=cl.predicted_category_code WHERE cl.participant_id=? AND cl.is_current=1 LIMIT 1");
        $q->execute([$u['id']]);$classification=$q->fetch()?:null;
        $recommendations=[];
        if($classification){
            $q=db()->prepare("SELECT p.id training_id,p.title,p.level,p.duration_hours,p.fee,p.instructor,p.start_date,p.end_date,p.description,p.cover_image,tc.name category FROM classification_recommendations cr JOIN training_programs p ON p.id=cr.training_program_id JOIN training_categories tc ON tc.code=p.category_code WHERE cr.classification_id=? AND p.deleted_at IS NULL ORDER BY p.start_date ASC");
            $q->execute([$classification['id']]);$recommendations=$q->fetchAll();
        }
        ok(['assessment'=>$assessment,'classification'=>$classification,'recommendations'=>$recommendations]);
    }

    if ($route==='participant/dashboard' && $method==='GET') {
        $u=require_auth('user');
        $q=db()->prepare("SELECT birth_date,education,work_experience,address,photo_path FROM participant_profiles WHERE user_id=?");
        $q->execute([$u['id']]);$profile=$q->fetch()?:[];
        $q=db()->prepare("SELECT ia.id,ia.interest_category_code,ia.status,ia.submitted_at,ia.computer_level,ia.communication_level,c.name interest_category,pa.practical_level FROM initial_assessments ia JOIN training_categories c ON c.code=ia.interest_category_code LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.participant_id=? AND ia.is_current=1 LIMIT 1");
        $q->execute([$u['id']]);$assessment=$q->fetch()?:null;
        $q=db()->prepare("SELECT cl.id,cl.predicted_category_code,c.name predicted_category,cl.processed_at FROM classifications cl JOIN training_categories c ON c.code=cl.predicted_category_code WHERE cl.participant_id=? AND cl.is_current=1 LIMIT 1");
        $q->execute([$u['id']]);$classification=$q->fetch()?:null;
        ok(['profile'=>$profile,'assessment'=>$assessment,'classification'=>$classification]);
    }

    /* DASHBOARD */
    if ($route==='admin/dashboard' && $method==='GET') {
        require_auth('admin');
        $pdo=db();
        $participants=(int)$pdo->query("SELECT COUNT(*) FROM users WHERE role='user' AND status='active'")->fetchColumn();
        $trainings=(int)$pdo->query("SELECT COUNT(*) FROM training_programs WHERE deleted_at IS NULL")->fetchColumn();
        $assessments=(int)$pdo->query("SELECT COUNT(*) FROM initial_assessments WHERE is_current=1")->fetchColumn();
        $waiting=(int)$pdo->query("SELECT COUNT(*) FROM initial_assessments ia LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.is_current=1 AND pa.id IS NULL")->fetchColumn();
        $recent=$pdo->query("SELECT u.name,u.email,c.name interest_category,ia.status,ia.submitted_at,pa.practical_level FROM initial_assessments ia JOIN users u ON u.id=ia.participant_id JOIN training_categories c ON c.code=ia.interest_category_code LEFT JOIN practical_assessments pa ON pa.initial_assessment_id=ia.id AND pa.is_current=1 WHERE ia.is_current=1 ORDER BY ia.submitted_at DESC LIMIT 5")->fetchAll();
        $summary=$pdo->query("SELECT c.name category_name,COUNT(*) total FROM classifications cl JOIN training_categories c ON c.code=cl.predicted_category_code WHERE cl.is_current=1 GROUP BY c.code,c.name ORDER BY total DESC")->fetchAll();
        ok(['stats'=>['participants'=>$participants,'trainings'=>$trainings,'assessments'=>$assessments,'waiting_practical'=>$waiting],'recent_assessments'=>$recent,'classification_summary'=>$summary]);
    }

    fail('Endpoint tidak ditemukan.',404);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log('SkillUp API error: '.$e->getMessage());
    if ($config['app']['debug']) fail($e->getMessage(),500);
    fail('Terjadi kesalahan pada server. Silakan coba kembali.',500);
}
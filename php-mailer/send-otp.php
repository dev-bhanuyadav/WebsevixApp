<?php
/**
 * Websevix — OTP Mailer Endpoint (PHP native mail)
 * URL: https://sendotp.websevix.com/send-otp.php
 *
 * Accepts POST with JSON body:
 * {
 *   "to":      "user@example.com",
 *   "subject": "Your OTP Code",
 *   "message": "<h2>Your OTP is: <b>123456</b></h2>",
 *   "altText": "Your OTP is: 123456"   // optional
 * }
 *
 * Returns: { "success": true }  or  { "error": "..." }
 */

// ── Load .env ─────────────────────────────────────────────────────────────────
function loadEnv(): array {
    static $cache = null;
    if ($cache !== null) return $cache;
    $cache = [];
    $file  = __DIR__ . '/.env';
    if (!file_exists($file)) return $cache;
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $cache[trim($k)] = trim($v, " \t\n\r\"'");
    }
    return $cache;
}
function cfg(string $key, string $default = ''): string {
    return loadEnv()[$key] ?? (getenv($key) ?: $default);
}

// ── CORS ─────────────────────────────────────────────────────────────────────
$origin = cfg('ALLOWED_ORIGIN', '*');
header("Access-Control-Allow-Origin: {$origin}");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── Parse JSON body ───────────────────────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['to'], $body['subject'], $body['message'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: to, subject, message']);
    exit;
}

$to      = filter_var(trim($body['to']), FILTER_SANITIZE_EMAIL);
$subject = mb_encode_mimeheader(strip_tags(trim($body['subject'])), 'UTF-8', 'B');
$html    = $body['message'];
$altText = isset($body['altText']) ? trim($body['altText']) : strip_tags($html);

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// ── Build multipart MIME email ────────────────────────────────────────────────
$fromName  = cfg('SMTP_FROM_NAME', 'Websevix');
$fromEmail = cfg('SMTP_USER', 'login@websevix.com');
$boundary  = 'WBX_' . md5(uniqid((string)time(), true));

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";
$headers .= "From: {$fromName} <{$fromEmail}>\r\n";
$headers .= "Reply-To: {$fromEmail}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "X-Priority: 1\r\n";

$body_content  = "--{$boundary}\r\n";
$body_content .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body_content .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body_content .= chunk_split(base64_encode($altText)) . "\r\n";

$body_content .= "--{$boundary}\r\n";
$body_content .= "Content-Type: text/html; charset=UTF-8\r\n";
$body_content .= "Content-Transfer-Encoding: base64\r\n\r\n";
$body_content .= chunk_split(base64_encode($html)) . "\r\n";

$body_content .= "--{$boundary}--";

// ── Send ──────────────────────────────────────────────────────────────────────
$result = @mail($to, $subject, $body_content, $headers);

if ($result) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => "OTP sent to {$to}"]);
} else {
    $err = error_get_last();
    error_log("[send-otp] mail() failed to {$to}: " . ($err['message'] ?? 'unknown'));
    http_response_code(500);
    echo json_encode([
        'error'  => 'Failed to send email',
        'detail' => $err['message'] ?? 'mail() returned false',
    ]);
}

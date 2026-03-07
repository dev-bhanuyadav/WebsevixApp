<?php
/**
 * Websevix — SMTP Port Finder Debug
 * https://sendotp.websevix.com/debug-mail.php
 * DELETE after use!
 */

define('TEST_TO', 'login@websevix.com'); // change to your email

header('Content-Type: text/plain; charset=utf-8');
echo "=== Websevix SMTP Port Finder ===\n\n";

// Load .env
$envFile = __DIR__ . '/.env';
$cfg = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$k, $v] = explode('=', $line, 2);
        $cfg[trim($k)] = trim($v, " \t\n\r\"'");
    }
}
$user = $cfg['SMTP_USER'] ?? 'login@websevix.com';
$pass = $cfg['SMTP_PASS'] ?? '';
$host = $cfg['SMTP_HOST'] ?? 'mail.websevix.com';

echo "SMTP User : $user\n";
echo "SMTP Host : $host\n";
echo "Pass len  : " . strlen($pass) . " chars\n\n";

// ── Test raw TCP connectivity ─────────────────────────────────────────────────
$ports = [
    465  => 'SSL  (SMTPS)',
    587  => 'TLS  (STARTTLS)',
    25   => 'Plain (no auth)',
    2525 => 'Alt  (some hosts)',
];

echo "--- TCP Port Connectivity ---\n";
$openPort = null;
foreach ($ports as $port => $label) {
    $sock = @fsockopen("ssl://{$host}", $port, $errno, $errstr, 5);
    if (!$sock) {
        $sock = @fsockopen($host, $port, $errno, $errstr, 5);
    }
    if ($sock) {
        fclose($sock);
        echo "✅ Port $port ($label) — OPEN\n";
        if (!$openPort) $openPort = $port;
    } else {
        echo "❌ Port $port ($label) — BLOCKED ($errno: $errstr)\n";
    }
}

echo "\n";

// ── Load PHPMailer ─────────────────────────────────────────────────────────────
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) { echo "❌ Run setup.php first.\n"; exit(1); }
require $autoload;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailException;

// ── Try PHPMailer on each working port ────────────────────────────────────────
$configs = [
    ['port' => 587, 'secure' => PHPMailer::ENCRYPTION_STARTTLS, 'label' => 'Port 587 STARTTLS'],
    ['port' => 465, 'secure' => PHPMailer::ENCRYPTION_SMTPS,    'label' => 'Port 465 SSL'],
    ['port' => 25,  'secure' => '',                              'label' => 'Port 25 Plain'],
];

$sent = false;
foreach ($configs as $c) {
    echo "--- Trying {$c['label']} ---\n";
    $mail = new PHPMailer(true);
    try {
        $mail->SMTPDebug   = SMTP::DEBUG_SERVER;
        $mail->Debugoutput = function(string $str, int $level): void {
            echo "[SMTP] " . trim($str) . "\n"; flush(); ob_flush();
        };
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $user;
        $mail->Password   = $pass;
        $mail->Port       = $c['port'];
        $mail->SMTPSecure = $c['secure'];
        $mail->SMTPOptions = ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]];
        $mail->Timeout    = 10;
        $mail->setFrom($user, 'Websevix');
        $mail->addAddress(TEST_TO);
        $mail->isHTML(true);
        $mail->Subject = 'Websevix SMTP Test ' . $c['label'];
        $mail->Body    = '<h2>✅ SMTP Works!</h2><p>Config: ' . $c['label'] . '</p>';
        $mail->AltBody = 'SMTP works via ' . $c['label'];
        $mail->send();
        echo "\n✅ SUCCESS via {$c['label']}!\n";
        echo "💾 UPDATE your .env: SMTP_PORT={$c['port']}, SMTP_SECURE=" . ($c['port'] == 587 ? 'tls' : ($c['port'] == 25 ? 'none' : 'ssl')) . "\n\n";
        $sent = true;
        break;
    } catch (MailException $e) {
        echo "\n❌ FAILED: " . $mail->ErrorInfo . "\n\n";
    }
}

// ── Fallback: PHP native mail() ───────────────────────────────────────────────
if (!$sent) {
    echo "--- Trying PHP native mail() ---\n";
    $headers  = "From: Websevix <{$user}>\r\n";
    $headers .= "Reply-To: {$user}\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $result = @mail(TEST_TO, 'Websevix PHP mail() Test', 'If you receive this, PHP native mail() works.', $headers);
    if ($result) {
        echo "✅ PHP mail() queued! Check inbox.\n";
        echo "💡 Recommendation: Use PHP mail() — no SMTP config needed on this server.\n";
    } else {
        echo "❌ PHP mail() also failed. Ask your host to enable outbound email.\n";
        echo "   OR use an external relay like SendGrid/Mailgun free tier.\n";
    }
}

echo "\n🔒 DELETE this file after debugging!\n";

<?php
/**
 * Websevix PHPMailer Setup — NO Composer needed
 * Run once: https://sendotp.websevix.com/setup.php
 * Deletes itself after success.
 */

define('ALLOW_SETUP', true);
if (!ALLOW_SETUP) { http_response_code(403); die('Setup disabled.'); }

header('Content-Type: text/plain; charset=utf-8');

function ok(string $m): void   { echo "✅ $m\n"; flush(); ob_flush(); }
function err(string $m): void  { echo "❌ $m\n"; flush(); ob_flush(); }
function info(string $m): void { echo "ℹ️  $m\n"; flush(); ob_flush(); }

echo "=== Websevix PHPMailer Setup ===\n\n";

// ── 1. PHP version ────────────────────────────────────────────────────────────
if (version_compare(PHP_VERSION, '7.4.0', '<')) {
    err("PHP 7.4+ required. You have " . PHP_VERSION); exit(1);
}
ok("PHP " . PHP_VERSION);

// ── 2. Extensions ─────────────────────────────────────────────────────────────
foreach (['openssl','mbstring','json','curl','zip'] as $ext) {
    if (extension_loaded($ext)) { ok("ext: $ext"); }
    else { err("Missing: $ext — enable in php.ini"); exit(1); }
}

// ── 3. Download PHPMailer from GitHub (no Composer) ───────────────────────────
$zipUrl    = 'https://github.com/PHPMailer/PHPMailer/archive/refs/tags/v6.9.1.zip';
$zipPath   = __DIR__ . '/phpmailer.zip';
$vendorDir = __DIR__ . '/vendor/phpmailer/phpmailer/src';

if (is_dir($vendorDir)) {
    ok("PHPMailer already installed — skipping download.");
} else {
    info("Downloading PHPMailer v6.9.1 from GitHub...");

    // Try curl first, fall back to file_get_contents
    if (function_exists('curl_init')) {
        $ch = curl_init($zipUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_TIMEOUT        => 60,
            CURLOPT_USERAGENT      => 'Mozilla/5.0',
        ]);
        $data = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $cerr = curl_error($ch);
        curl_close($ch);

        if ($code !== 200 || !$data) {
            err("cURL download failed (HTTP $code): $cerr"); exit(1);
        }
        file_put_contents($zipPath, $data);
        ok("Downloaded via cURL.");
    } else {
        $ctx  = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
        $data = @file_get_contents($zipUrl, false, $ctx);
        if (!$data) {
            err("Download failed. Enable allow_url_fopen or curl."); exit(1);
        }
        file_put_contents($zipPath, $data);
        ok("Downloaded via file_get_contents.");
    }

    // ── 4. Extract ZIP ────────────────────────────────────────────────────────
    info("Extracting...");
    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) {
        err("Cannot open zip file."); exit(1);
    }
    $zip->extractTo(__DIR__ . '/phpmailer_tmp');
    $zip->close();
    unlink($zipPath);
    ok("Extracted.");

    // ── 5. Move src/ to vendor/phpmailer/phpmailer/src ────────────────────────
    $extractedRoot = __DIR__ . '/phpmailer_tmp/PHPMailer-6.9.1';
    @mkdir(__DIR__ . '/vendor/phpmailer/phpmailer', 0755, true);

    // Copy the whole extracted folder
    $srcDir = $extractedRoot . '/src';
    @mkdir($vendorDir, 0755, true);
    foreach (glob($srcDir . '/*.php') as $file) {
        copy($file, $vendorDir . '/' . basename($file));
    }
    ok("PHPMailer src files copied.");

    // Cleanup tmp
    $tmpFiles = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(__DIR__ . '/phpmailer_tmp', RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($tmpFiles as $f) {
        $f->isDir() ? rmdir($f->getRealPath()) : unlink($f->getRealPath());
    }
    rmdir(__DIR__ . '/phpmailer_tmp');
    ok("Temp files cleaned.");
}

// ── 6. Write simple autoloader ────────────────────────────────────────────────
$autoloadFile = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoloadFile)) {
    @mkdir(__DIR__ . '/vendor', 0755, true);
    file_put_contents($autoloadFile, '<?php
// Websevix simple autoloader for PHPMailer (no Composer needed)
spl_autoload_register(function (string $class): void {
    $map = [
        "PHPMailer\\PHPMailer\\PHPMailer"  => __DIR__ . "/phpmailer/phpmailer/src/PHPMailer.php",
        "PHPMailer\\PHPMailer\\SMTP"       => __DIR__ . "/phpmailer/phpmailer/src/SMTP.php",
        "PHPMailer\\PHPMailer\\Exception"  => __DIR__ . "/phpmailer/phpmailer/src/Exception.php",
    ];
    if (isset($map[$class])) {
        require_once $map[$class];
    }
});
');
    ok("autoload.php created.");
} else {
    ok("autoload.php already exists.");
}

// ── 7. Create .env if missing ─────────────────────────────────────────────────
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) {
    file_put_contents($envFile, 'SMTP_HOST=mail.websevix.com
SMTP_PORT=465
SMTP_SECURE=ssl
SMTP_USER=login@websevix.com
SMTP_PASS=Z&HzcZ4OaN#1WfY6
SMTP_FROM_NAME=Websevix
ALLOWED_ORIGIN=*
');
    ok(".env created with default credentials.");
} else {
    ok(".env already exists.");
}

// ── 8. Protect vendor/ and .env ───────────────────────────────────────────────
$vendorHt = __DIR__ . '/vendor/.htaccess';
if (!file_exists($vendorHt)) {
    @mkdir(__DIR__ . '/vendor', 0755, true);
    file_put_contents($vendorHt, "Order deny,allow\nDeny from all\n");
    ok("vendor/.htaccess written.");
}

$rootHt  = __DIR__ . '/.htaccess';
$addRule = "\n<Files .env>\n  Order allow,deny\n  Deny from all\n</Files>\n";
$cur     = file_exists($rootHt) ? file_get_contents($rootHt) : '';
if (strpos($cur, '<Files .env>') === false) {
    file_put_contents($rootHt, $cur . $addRule);
    ok(".htaccess updated to block .env.");
}

// ── 9. Quick smoke-test ───────────────────────────────────────────────────────
info("Smoke test — loading PHPMailer classes...");
require_once $autoloadFile;
if (class_exists('PHPMailer\\PHPMailer\\PHPMailer')) {
    ok("PHPMailer class loaded successfully!");
} else {
    err("PHPMailer class NOT found. Check vendor/phpmailer/phpmailer/src/");
    exit(1);
}

// ── 10. Self-delete ───────────────────────────────────────────────────────────
echo "\n=== Setup Complete! ===\n";
echo "📧 POST to send-otp.php to send emails.\n";
echo "🔒 Deleting setup.php...\n";
register_shutdown_function(function () { @unlink(__FILE__); });

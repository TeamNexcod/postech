<?php
/**
 * Contact, quote and careers forms.
 *
 * A page includes this file, checks the POST at the top (before any output), and on
 * success redirects back to itself with ?sent=1 so a reload does not send it twice.
 * Messages go out with PHP mail() to cfg('mail_to').
 *
 * For a local copy, set NX_MAIL_LOG=/path/to/file and messages are written there instead.
 *
 * Including this file starts the session, so it has to be included before any output.
 */

function form_session(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Lax',
            'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        ]);
        session_start();
    }
}

/** Hidden CSRF token plus a honeypot box that people never see and bots fill in. */
function form_hidden(): string
{
    return '<input type="hidden" name="csrf_token" value="' . e($_SESSION['csrf']) . '">'
        . '<div class="hp" aria-hidden="true"><label>Leave empty <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>';
}

function is_post(): bool
{
    return ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
}

function post(string $key): string
{
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
}

/**
 * Stops anything that is not a fresh submission from this site.
 * Returns null when the form may be processed, 'bot' for a filled honeypot, or a message.
 */
function form_guard(string $form): ?string
{
    form_session();
    if (!hash_equals($_SESSION['csrf'] ?? '', post('csrf_token'))) {
        return 'The page had been open too long and the form expired. Please send it again.';
    }
    if (post('website') !== '') {
        return 'bot';
    }
    if (time() - ($_SESSION['sent'][$form] ?? 0) < 30) {
        return 'This was sent a few seconds ago. Please wait half a minute before sending it again.';
    }
    return null;
}

function form_done(string $form, string $path): never
{
    $_SESSION['sent'][$form] = time();
    header('Location: ' . $path . '?sent=1', true, 303);
    exit;
}

function valid_email(string $v): bool
{
    return strlen($v) <= 190 && filter_var($v, FILTER_VALIDATE_EMAIL) !== false;
}

/** "+91 98765 43210", "098765-43210" and "9876543210" all become "9876543210". */
function mobile(string $v): string
{
    $digits = preg_replace('/\D/', '', $v);
    if (strlen($digits) === 12 && str_starts_with($digits, '91')) {
        $digits = substr($digits, 2);
    } elseif (strlen($digits) === 11 && str_starts_with($digits, '0')) {
        $digits = substr($digits, 1);
    }
    return $digits;
}

/** Indian mobile number, ten digits, without +91. */
function valid_mobile(string $v): bool
{
    return (bool) preg_match('/^[6-9]\d{9}$/', $v);
}

function too_long(string $v, int $max): bool
{
    return mb_strlen($v) > $max;
}

/**
 * Sends one form as a plain-text e-mail. $fields is label => value, in order.
 * $file, when given, is ['path' => ..., 'name' => ..., 'type' => ...] and is attached.
 */
function send_form_mail(string $subject, array $fields, string $replyTo = '', ?array $file = null): bool
{
    $body = '';
    foreach ($fields as $label => $value) {
        $body .= $label . ': ' . ($value === '' ? '-' : $value) . "\n";
    }
    $body .= "\n--\nSent from " . cfg('base_url') . ' on ' . date('d M Y, H:i')
        . ' from ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

    $headers = [
        'From'         => cfg('name') . ' <' . cfg('mail_from') . '>',
        'MIME-Version' => '1.0',
    ];
    if ($replyTo !== '' && valid_email($replyTo)) {
        $headers['Reply-To'] = $replyTo;
    }

    if ($file) {
        $boundary = 'nx-' . bin2hex(random_bytes(12));
        $headers['Content-Type'] = 'multipart/mixed; boundary="' . $boundary . '"';
        $message = "--$boundary\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n"
            . $body . "\r\n"
            . "--$boundary\r\n"
            . 'Content-Type: ' . $file['type'] . '; name="' . $file['name'] . "\"\r\n"
            . "Content-Transfer-Encoding: base64\r\n"
            . 'Content-Disposition: attachment; filename="' . $file['name'] . "\"\r\n\r\n"
            . chunk_split(base64_encode((string) file_get_contents($file['path'])))
            . "--$boundary--\r\n";
    } else {
        $headers['Content-Type'] = 'text/plain; charset=UTF-8';
        $message = $body;
    }

    $subject = preg_replace('/[\r\n]+/', ' ', $subject);

    $log = getenv('NX_MAIL_LOG');
    if ($log) {
        $out = 'To: ' . cfg('mail_to') . "\nSubject: $subject\n";
        foreach ($headers as $k => $v) {
            $out .= "$k: $v\n";
        }
        return file_put_contents($log, $out . "\n" . $message . "\n\n", FILE_APPEND) !== false;
    }

    return mail(
        cfg('mail_to'),
        '=?UTF-8?B?' . base64_encode($subject) . '?=',
        $message,
        $headers,
        '-f' . cfg('mail_from')
    );
}

/** Renders the error line for a field, if it has one. */
function field_error(array $errors, string $key): string
{
    return isset($errors[$key]) ? '<p class="error" id="err-' . e($key) . '">' . e($errors[$key]) . '</p>' : '';
}

/** aria attributes for a field that may have an error. */
function field_aria(array $errors, string $key): string
{
    return isset($errors[$key]) ? ' aria-invalid="true" aria-describedby="err-' . e($key) . '"' : '';
}

form_session();
$_SESSION['csrf'] ??= bin2hex(random_bytes(32));

<?php
/**
 * Router for PHP's built-in server, doing what .htaccess does on Apache:
 *
 *   php -S localhost:8000 tools/router.php
 *
 * Set NX_MAIL_LOG=/tmp/nx-mail.log to have the forms write mail there instead of sending it.
 */
$root = dirname(__DIR__);
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');

if (preg_match('#^/(includes|data|tools|\.git)(/|$)|^/(config\.php|README\.md)$#', $path)) {
    http_response_code(403);
    exit('Forbidden');
}
if ($path === '/sitemap.xml') {
    require $root . '/sitemap.php';
    return true;
}
if ($path !== '/' && is_file($root . $path) && !str_ends_with($path, '.php')) {
    return false; // static file, served as is
}

$serve = static function (string $file) use ($root): bool {
    chdir(dirname($file));
    require $file;
    return true;
};

if ($path === '/' || $path === '/index.php') {
    return $serve($root . '/index.php');
}
if (is_dir($root . $path) && is_file($root . rtrim($path, '/') . '/index.php')) {
    if (!str_ends_with($path, '/')) {
        header('Location: ' . $path . '/', true, 301);
        return true;
    }
    return $serve($root . $path . 'index.php');
}
if (str_ends_with($path, '/')) {
    header('Location: ' . rtrim($path, '/'), true, 301);
    return true;
}
if (preg_match('#^/([a-z0-9-]+)(\.php)?$#', $path, $m) && is_file($root . '/' . $m[1] . '.php')) {
    return $serve($root . '/' . $m[1] . '.php');
}

return $serve($root . '/404.php');

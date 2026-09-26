<?php
require __DIR__ . '/includes/bootstrap.php';

http_response_code(404);
$asked = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$page = [
    'title'       => 'Page not found',
    'description' => 'There is no page at this address.',
    'path'        => $asked,
    'noindex'     => true,
];
require ROOT . '/includes/header.php';
?>

<div class="wrap notfound">
  <p class="num">404</p>
  <h1>There is no page at <code><?= e($asked) ?></code></h1>
  <p class="lead">It may have moved when the site was rebuilt. One of these is probably what you wanted:</p>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/features">Features</a></li>
    <li><a href="/pricing">Pricing</a></li>
    <li><a href="/how-to-use">How to use</a></li>
    <li><a href="/find-my-bills">Find my bills</a></li>
    <li><a href="<?= e(cfg('app_login')) ?>">Log in to the software</a></li>
  </ul>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

<?php
/**
 * Opens the document. Each page sets $page before including this:
 *   title        shown in the tab; the home page passes the full title
 *   description  meta description
 *   path         canonical path, e.g. /pricing
 *   nav          key of the navigation item to mark as current
 *   schema       optional array of JSON-LD nodes for this page
 *   noindex      optional, keeps the page out of search engines
 */
$page += ['nav' => '', 'schema' => [], 'noindex' => false];
$fullTitle = $page['path'] === '/' ? $page['title'] : $page['title'] . ' | ' . cfg('name');
$canonical = cfg('base_url') . $page['path'];
$ogImage = cfg('base_url') . '/assets/img/brand/og-image.png';

$current = static fn (string $key): string => $key === $page['nav'] ? ' aria-current="page"' : '';
?>
<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= e($fullTitle) ?></title>
<meta name="description" content="<?= e($page['description']) ?>">
<?php if ($page['noindex']): ?>
<meta name="robots" content="noindex">
<?php endif ?>
<link rel="canonical" href="<?= e($canonical) ?>">
<meta name="theme-color" content="#0b2451">

<meta property="og:type" content="website">
<meta property="og:site_name" content="<?= e(cfg('name')) ?>">
<meta property="og:title" content="<?= e($fullTitle) ?>">
<meta property="og:description" content="<?= e($page['description']) ?>">
<meta property="og:url" content="<?= e($canonical) ?>">
<meta property="og:image" content="<?= e($ogImage) ?>">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="<?= asset('favicon/favicon-32x32.png') ?>">
<link rel="icon" type="image/png" sizes="96x96" href="<?= asset('favicon/favicon-96x96.png') ?>">
<link rel="apple-touch-icon" href="<?= asset('favicon/apple-touch-icon.png') ?>">
<link rel="manifest" href="/site.webmanifest">

<link rel="preload" href="/assets/fonts/ibm-plex-sans-latin-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="<?= asset('css/site.css') ?>">
<script src="<?= asset('js/site.js') ?>" defer></script>
<?php if ($page['schema']): ?>
<script type="application/ld+json"><?= json_encode(
    ['@context' => 'https://schema.org', '@graph' => $page['schema']],
    JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG
) ?></script>
<?php endif ?>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<div class="strip">
  <div class="wrap strip-in">
    <p>The Android app is out.<span class="strip-more"> Log in on the computer, open <b>Nexcod POS App</b> and scan the QR code with your phone.</span></p>
    <a href="<?= e(cfg('play_store')) ?>" rel="noopener">Get it on Google Play</a>
  </div>
</div>

<header class="top">
  <div class="wrap top-in">
    <a class="brand" href="/">
      <img src="<?= asset('img/brand/logo-64.png') ?>" width="32" height="32" alt="">
      <span>Nexcod <b>POS</b></span>
    </a>

    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>

    <nav class="nav" id="site-nav" aria-label="Main">
      <ul class="nav-main">
<?php foreach (nav_main() as [$href, $label, $key]): ?>
        <li><a href="<?= e($href) ?>"<?= $current($key) ?>><?= e($label) ?></a></li>
<?php endforeach ?>
        <li class="nav-more">
          <details>
            <summary>More</summary>
            <div class="more-panel">
<?php foreach (nav_more() as $group => $links): ?>
              <div>
                <p><?= e($group) ?></p>
<?php foreach ($links as [$href, $label, $key]): ?>
                <a href="<?= e($href) ?>"<?= $current($key) ?>><?= e($label) ?></a>
<?php endforeach ?>
              </div>
<?php endforeach ?>
            </div>
          </details>
        </li>
      </ul>
      <div class="nav-act">
        <a class="nav-quote" href="/quote">Get a quote</a>
        <a class="nav-login" href="<?= e(cfg('app_login')) ?>">Log in</a>
        <a class="btn btn-primary" href="<?= e(signup_url()) ?>">Start free</a>
      </div>
    </nav>
  </div>
</header>

<main id="main">

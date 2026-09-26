<?php
declare(strict_types=1);

define('ROOT', dirname(__DIR__));

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: https://i.ytimg.com; "
    . "frame-src https://www.youtube-nocookie.com; form-action 'self'; base-uri 'self'; "
    . "object-src 'none'; frame-ancestors 'self'");

function cfg(string $key): string
{
    static $config;
    $config ??= require ROOT . '/config.php';
    return $config[$key];
}

function e(null|string|int|float $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** Asset URL with the file's mtime on it, so every deploy busts the browser cache. */
function asset(string $path): string
{
    $file = ROOT . '/assets/' . $path;
    return '/assets/' . $path . (is_file($file) ? '?v=' . filemtime($file) : '');
}

/** Content lives in data/*.php so the templates stay free of copy. */
function data(string $name): array
{
    static $loaded = [];
    return $loaded[$name] ??= require ROOT . '/data/' . $name . '.php';
}

/** ₹1,23,456 with Indian digit grouping. */
function inr(int|float $amount, int $decimals = 0): string
{
    $parts = explode('.', number_format(abs($amount), $decimals, '.', ''));
    $int = $parts[0];
    if (strlen($int) > 3) {
        $int = preg_replace('/\B(?=(\d{2})+$)/', ',', substr($int, 0, -3)) . ',' . substr($int, -3);
    }
    return ($amount < 0 ? '-' : '') . '₹' . $int . (isset($parts[1]) ? '.' . $parts[1] : '');
}

function signup_url(?string $plan = null): string
{
    return cfg('app_signup') . ($plan ? '?plan=' . rawurlencode($plan) : '');
}

function whatsapp_url(string $text = ''): string
{
    return 'https://wa.me/' . cfg('whatsapp') . ($text !== '' ? '?text=' . rawurlencode($text) : '');
}

/** What a plan costs per month. Day-based plans use the average month (365.25 / 12 days). */
function per_month(array $plan): int
{
    if ($plan['price'] === 0) {
        return 0;
    }
    $months = isset($plan['days']) ? $plan['days'] / 30.4375 : $plan['months'];
    return (int) round($plan['price'] / $months);
}

/** Primary navigation. `key` is matched against $page['nav'] to mark the current page. */
function nav_main(): array
{
    return [
        ['/features',      'Features',      'features'],
        ['/pricing',       'Pricing',       'pricing'],
        ['/screenshots',   'Screens',       'screenshots'],
        ['/how-to-use',    'How to use',    'how-to-use'],
        ['/find-my-bills', 'Find my bills', 'find-my-bills'],
        ['/contact',       'Contact',       'contact'],
    ];
}

function nav_more(): array
{
    $company = [
        ['/about',   'About',        'about'],
        ['/team/',   'Team',         'team'],
        ['/founder', 'Founder',      'founder'],
        ['/careers', 'Work with us', 'careers'],
    ];
    $software = [
        [cfg('demo'), 'Software demo', 'demo'],
        ['/learn',    'Video guides',  'learn'],
        ['/quote',    'Get a quote',   'quote'],
    ];
    if (data('reviews')) {
        $software[] = ['/reviews', 'Reviews', 'reviews'];
    }
    return ['Company' => $company, 'The software' => $software];
}

/** JSON-LD for the business itself; pages add their own nodes next to these. */
function schema_org(): array
{
    $base = cfg('base_url');
    $plans = data('plans');
    $prices = array_column($plans, 'price');
    return [
        [
            '@type' => 'Organization',
            '@id' => $base . '/#organization',
            'name' => cfg('name'),
            'url' => $base . '/',
            'logo' => $base . '/assets/img/brand/logo.png',
            'email' => cfg('email'),
            'founder' => ['@id' => $base . '/#founder'],
            'address' => ['@type' => 'PostalAddress', 'addressCountry' => 'IN'],
            'contactPoint' => [
                '@type' => 'ContactPoint',
                'contactType' => 'customer support',
                'email' => cfg('email'),
                'telephone' => cfg('phone'),
                'areaServed' => 'IN',
                'availableLanguage' => ['en', 'hi'],
            ],
            'sameAs' => [cfg('instagram'), cfg('linkedin')],
        ],
        [
            '@type' => 'Person',
            '@id' => $base . '/#founder',
            'name' => 'Krishav Kumar Barman',
            'jobTitle' => 'Founder',
            'worksFor' => ['@id' => $base . '/#organization'],
            'url' => $base . '/founder',
        ],
        [
            '@type' => 'WebSite',
            '@id' => $base . '/#website',
            'url' => $base . '/',
            'name' => cfg('name'),
            'inLanguage' => 'en-IN',
            'publisher' => ['@id' => $base . '/#organization'],
        ],
        [
            '@type' => 'SoftwareApplication',
            '@id' => $base . '/#software',
            'name' => cfg('name'),
            'applicationCategory' => 'BusinessApplication',
            'applicationSubCategory' => 'Pharmacy billing and inventory',
            'operatingSystem' => 'Web, Android, Windows',
            'url' => $base . '/',
            'screenshot' => $base . '/assets/img/screens/billing.png',
            'offers' => [
                '@type' => 'AggregateOffer',
                'priceCurrency' => 'INR',
                'lowPrice' => (string) min($prices),
                'highPrice' => (string) max($prices),
                'offerCount' => (string) count($plans),
            ],
            'publisher' => ['@id' => $base . '/#organization'],
        ],
    ];
}

/** Title block at the top of every inner page. $lead is trusted HTML. */
function page_head(string $title, string $lead = '', ?string $crumb = null): void
{
    ?>
<header class="page-head">
  <div class="wrap">
    <p class="crumb"><a href="/">Home</a><span>/</span><?= e($crumb ?? $title) ?></p>
    <h1><?= e($title) ?></h1>
<?php if ($lead !== ''): ?>
    <p class="lead"><?= $lead ?></p>
<?php endif ?>
  </div>
</header>
<?php
}

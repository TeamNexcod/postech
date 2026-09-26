<?php
/** /sitemap.xml, built from the page files so a new page is listed once it exists. */
require __DIR__ . '/includes/bootstrap.php';

$pages = [
    '/'              => 'index.php',
    '/features'      => 'features.php',
    '/pricing'       => 'pricing.php',
    '/screenshots'   => 'screenshots.php',
    '/how-to-use'    => 'how-to-use.php',
    '/learn'         => 'learn.php',
    '/find-my-bills' => 'find-my-bills.php',
    '/about'         => 'about.php',
    '/team/'         => 'team/index.php',
    '/founder'       => 'founder.php',
    '/careers'       => 'careers.php',
    '/contact'       => 'contact.php',
    '/quote'         => 'quote.php',
    '/privacy'       => 'privacy.php',
    '/terms'         => 'terms.php',
    '/refund'        => 'refund.php',
];
if (data('reviews')) {
    $pages['/reviews'] = 'reviews.php';
}

header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>', "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', "\n";
foreach ($pages as $path => $file) {
    $modified = max(filemtime(ROOT . '/' . $file), filemtime(ROOT . '/data'));
    echo '  <url><loc>', e(cfg('base_url') . $path), '</loc><lastmod>', date('Y-m-d', $modified), "</lastmod></url>\n";
}
echo "</urlset>\n";

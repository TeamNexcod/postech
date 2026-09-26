<?php
require __DIR__ . '/includes/bootstrap.php';

$reviews = data('reviews');
$page = [
    'title'       => 'Reviews',
    'description' => 'What pharmacies and medical stores say about Nexcod POS, in their own words.',
    'path'        => '/reviews',
    'nav'         => 'reviews',
    'noindex'     => !$reviews,
];
require ROOT . '/includes/header.php';
page_head('What shops say', 'Pharmacies running their day on Nexcod POS, in their own words.', 'Reviews');
?>

<div class="page-body">
  <div class="wrap">
<?php if ($reviews): ?>
    <div class="reviews">
<?php foreach ($reviews as $r): ?>
      <figure class="review">
<?php if (!empty($r['rating'])): ?>
        <p class="rating" aria-label="<?= (int) $r['rating'] ?> out of 5"><?= str_repeat('&#9733;', (int) $r['rating']) ?></p>
<?php endif ?>
        <blockquote><?= e($r['text']) ?></blockquote>
        <figcaption>
          <b><?= e($r['name']) ?></b>
          <?= e(implode(', ', array_filter([$r['shop'] ?? '', $r['place'] ?? '']))) ?><?= !empty($r['since']) ? ' &middot; using it since ' . e($r['since']) : '' ?>
        </figcaption>
      </figure>
<?php endforeach ?>
    </div>
<?php else: ?>
    <div class="prose">
      <p>We are putting together reviews from the shops that use Nexcod POS, with the shop's name and town on each so you can check them.</p>
      <p>If your counter runs on it, tell us how it has gone, good or bad: <a href="<?= e(whatsapp_url('Review of Nexcod POS: ')) ?>" rel="noopener">on WhatsApp</a> or at <a href="mailto:<?= e(cfg('email')) ?>?subject=Review"><?= e(cfg('email')) ?></a>.</p>
      <p>Until then, the quickest way to judge it is to <a href="/#try">make a bill on the home page</a> or open the <a href="<?= e(cfg('demo')) ?>">demo</a>.</p>
    </div>
<?php endif ?>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

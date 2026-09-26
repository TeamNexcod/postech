<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Features',
    'description' => 'Everything Nexcod POS does today: batch and expiry billing, loose tablets, GST and composition bills, GSTR-1 figures, Schedule H registers, purchases, dues, staff permissions, Android and offline Windows apps.',
    'path'        => '/features',
    'nav'         => 'features',
];
$groups = data('features');
require ROOT . '/includes/header.php';
page_head('Features', 'Every feature Nexcod POS has right now, grouped by what a shop is doing. Nothing here is planned or in testing: if it is listed, it works today.');
?>

<div class="page-body">
  <div class="wrap docs">
    <aside class="docs-nav">
      <p>On this page</p>
      <nav aria-label="Feature groups" data-spy>
        <ol>
<?php foreach ($groups as $g): ?>
          <li><a href="#<?= e($g['id']) ?>"><?= e($g['title']) ?> <span class="num"><?= count($g['items']) ?></span></a></li>
<?php endforeach ?>
          <li><a href="#questions">Common questions</a></li>
        </ol>
      </nav>
    </aside>

    <div>
<?php foreach ($groups as $g): ?>
      <section class="fgroup" id="<?= e($g['id']) ?>">
        <h2><?= e($g['title']) ?></h2>
        <p><?= e($g['sub']) ?></p>
        <dl class="spec">
<?php foreach ($g['items'] as [$name, $text]): ?>
          <div><dt><?= e($name) ?></dt><dd><?= e($text) ?></dd></div>
<?php endforeach ?>
        </dl>
      </section>
<?php endforeach ?>

      <section class="fgroup" id="questions">
        <h2>Common questions</h2>
        <p>What shops ask before they switch.</p>
<?php $faqs = data('faq')['features']; require ROOT . '/includes/faq.php'; ?>
      </section>

      <div class="end-note">
        <h2>See it working rather than reading about it</h2>
        <p>The demo is the real software with sample data in it. Open the billing screen and make a bill.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="<?= e(cfg('demo')) ?>">Open the demo</a>
          <a class="btn btn-line" href="/pricing">Plans and prices</a>
          <a class="btn btn-line" href="/quote">Get a quote</a>
        </div>
      </div>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

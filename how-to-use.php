<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'How to use',
    'description' => 'Step-by-step guide to Nexcod POS: setting up the shop, billing by batch and loose tablets, purchase entry, returns, customers and dues, staff logins, reports, the Android app and keyboard shortcuts.',
    'path'        => '/how-to-use',
    'nav'         => 'how-to-use',
];
$guides = data('howto');
require ROOT . '/includes/header.php';
page_head('How to use Nexcod POS', 'Every screen, in the order you will meet it, from filling in your shop\'s name to taking the first bill. Type what you are stuck on in the search box and the list narrows down.', 'How to use');
?>

<div class="page-body">
  <div class="wrap docs">
    <aside class="docs-nav">
      <div class="guide-search">
        <label class="sr" for="guide-q">Search the guide</label>
        <input id="guide-q" type="search" placeholder="Search the guide" autocomplete="off" data-guide-search>
        <kbd aria-hidden="true">/</kbd>
      </div>
      <p class="guide-count" data-guide-count><?= count($guides) ?> sections</p>
      <nav aria-label="Guide sections" data-spy>
        <ol>
<?php foreach ($guides as $g): ?>
          <li><a href="#<?= e($g['id']) ?>"><?= e($g['title']) ?></a></li>
<?php endforeach ?>
        </ol>
      </nav>
    </aside>

    <div>
      <p class="guide-none" data-guide-none hidden>Nothing in the guide matches that. Try another word, or <a href="/contact">ask us</a>.</p>
<?php foreach ($guides as $g): ?>
      <section class="guide" id="<?= e($g['id']) ?>">
        <h2><?= e($g['title']) ?></h2>
        <p><?= e($g['sub']) ?></p>
        <ol>
<?php foreach ($g['steps'] as $step): ?>
          <li><?= $step ?></li>
<?php endforeach ?>
        </ol>
      </section>
<?php endforeach ?>

      <div class="end-note">
        <h2>Still stuck?</h2>
        <p>Write to <a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a>, call <?= e(cfg('phone')) ?>, or watch the <a href="/learn">video guides</a>.</p>
      </div>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

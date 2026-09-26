<?php
/** Shared frame for privacy, terms and refund. The page sets $page and $sections (heading => HTML). */
require ROOT . '/includes/header.php';
page_head($page['title']);
?>

<div class="page-body">
  <div class="wrap cols">
    <div>
      <p class="updated">Last updated <?= e(cfg('legal_updated')) ?></p>
      <p class="hint">Questions: <a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a></p>
    </div>
    <div class="prose">
<?php foreach ($sections as $heading => $html): ?>
      <h2><?= e($heading) ?></h2>
      <?= $html ?>
<?php endforeach ?>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

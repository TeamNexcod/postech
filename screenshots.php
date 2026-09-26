<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Screens',
    'description' => 'Screenshots of Nexcod POS: the dashboard, billing screen, medicine search, inventory, purchase entry, drug registers, and the sales, stock, account and GST reports.',
    'path'        => '/screenshots',
    'nav'         => 'screenshots',
];
require ROOT . '/includes/header.php';
page_head('What it looks like', 'The real screens, taken off the software at 1366 pixels wide. Select one to see it full size.', 'Screens');
?>

<div class="page-body">
  <div class="wrap">
    <div class="shots-grid">
<?php foreach (data('screens') as $s): ?>
      <figure class="shot" id="<?= e($s['id']) ?>">
        <a href="<?= asset('img/screens/' . $s['id'] . '.png') ?>" data-zoom>
          <img src="<?= asset('img/screens/' . $s['id'] . '.png') ?>" width="<?= $s['w'] ?>" height="<?= $s['h'] ?>" loading="lazy" alt="<?= e($s['title']) ?> in Nexcod POS">
        </a>
        <figcaption><b><?= e($s['title']) ?>.</b> <?= e($s['caption']) ?></figcaption>
      </figure>
<?php endforeach ?>
    </div>
  </div>
</div>

<dialog class="lightbox" aria-label="Screen, full size">
  <img src="" alt="">
  <div class="lightbox-bar">
    <p></p>
    <button class="btn btn-line btn-sm" type="button" data-close>Close</button>
  </div>
</dialog>

<?php require ROOT . '/includes/cta.php'; ?>
<?php require ROOT . '/includes/footer.php'; ?>

<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Video guides',
    'description' => 'Short video guides to Nexcod POS pharmacy billing software.',
    'path'        => '/learn',
    'nav'         => 'learn',
];
require ROOT . '/includes/header.php';
page_head('Video guides', 'Short videos on getting the most out of the software. For a written, searchable guide to every screen, see <a href="/how-to-use">How to use</a>.');
?>

<div class="page-body">
  <div class="wrap">
<?php foreach (data('videos') as $group => $videos): ?>
    <section class="video-group">
      <h2><?= e($group) ?></h2>
      <div class="video-grid">
<?php foreach ($videos as $v): ?>
        <figure class="video">
          <iframe src="https://www.youtube-nocookie.com/embed/<?= e($v['id']) ?>" title="<?= e($v['title']) ?>" loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          <figcaption><?= e($v['title']) ?></figcaption>
        </figure>
<?php endforeach ?>
      </div>
    </section>
<?php endforeach ?>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

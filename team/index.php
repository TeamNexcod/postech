<?php
require dirname(__DIR__) . '/includes/bootstrap.php';

$page = [
    'title'       => 'Team',
    'description' => 'The people who build and support Nexcod POS, the pharmacy billing software.',
    'path'        => '/team/',
    'nav'         => 'team',
];
require ROOT . '/includes/header.php';
page_head('The team', 'A small team building billing software for medical stores, and answering the phone when a counter needs help.', 'Team');
?>

<div class="page-body">
  <div class="wrap">
    <ul class="team-grid">
<?php foreach (data('team') as $m): ?>
      <li class="member">
<?php if ($m['photo']): ?>
        <img src="<?= asset('img/team/' . $m['photo']) ?>" width="480" height="600" loading="lazy" alt="<?= e($m['name']) ?>">
<?php else: ?>
        <span class="ini" aria-hidden="true"><?= e(mb_substr($m['name'], 0, 1)) ?></span>
<?php endif ?>
        <h2><?= e($m['name']) ?></h2>
        <p class="role"><?= e($m['role']) ?></p>
        <p><?= e($m['about']) ?></p>
      </li>
<?php endforeach ?>
    </ul>

    <div class="end-note">
      <h2>Want to work with us?</h2>
      <p>We hire for engineering, support, sales and pharmacy know-how. Tell us which role and a little about yourself.</p>
      <div class="cta-row"><a class="btn btn-primary" href="/careers">See roles and apply</a></div>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

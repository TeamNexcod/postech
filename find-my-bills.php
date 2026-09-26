<?php
require __DIR__ . '/includes/bootstrap.php';
require ROOT . '/includes/forms.php';
require ROOT . '/includes/bills.php';

$errors = [];
$problem = null;
$pending = $_SESSION['bills_email'] ?? null;

if (is_post()) {
    $problem = form_guard('bills');
    if ($problem === 'bot') {
        $problem = null;
    } elseif ($problem === null && post('action') === 'send') {
        $email = post('email');
        if (!valid_email($email)) {
            $errors['email'] = 'This does not look like an e-mail address.';
        } elseif (bills_send_code($email)) {
            $_SESSION['bills_email'] = $pending = $email;
        } else {
            $problem = 'Bill lookup is not available right now. Please ask the shop to send the bill again, or write to ' . cfg('email') . '.';
        }
    } elseif ($problem === null && post('action') === 'check' && $pending) {
        $url = preg_match('/^\d{6}$/', post('code')) ? bills_check_code($pending, post('code')) : null;
        if ($url) {
            unset($_SESSION['bills_email']);
            header('Location: ' . $url, true, 303);
            exit;
        }
        $errors['code'] = 'That code is not right, or it has expired. Check the latest e-mail, or ask for a new code.';
    } elseif (post('action') === 'restart') {
        unset($_SESSION['bills_email']);
        $pending = null;
    }
}

$page = [
    'title'       => 'Find my bills',
    'description' => 'Customers of shops that use Nexcod POS can see and download their bills. We e-mail a one-time code to confirm it is you.',
    'path'        => '/find-my-bills',
    'nav'         => 'find-my-bills',
];
require ROOT . '/includes/header.php';
page_head('Find my bills', 'For customers of shops that bill on Nexcod POS. See and download the bills made out to your e-mail address. We send a one-time code first, so only you can open them.');
?>

<div class="page-body">
  <div class="wrap cols">
    <div>
      <h2>How it works</h2>
      <ol class="steps">
        <li><span class="n">01</span><div><p>Enter the e-mail address you gave at the shop.</p></div></li>
        <li><span class="n">02</span><div><p>We e-mail you a one-time 6-digit code.</p></div></li>
        <li><span class="n">03</span><div><p>Enter the code to see the bills made out to that address, and download them.</p></div></li>
      </ol>
    </div>

    <div>
<?php if ($problem && $problem !== 'bot'): ?>
      <p class="notice notice-err" role="alert"><?= e($problem) ?></p>
<?php endif ?>

<?php if (!$pending): ?>
      <form class="form" method="post" action="/find-my-bills" novalidate>
        <?= form_hidden() ?>
        <input type="hidden" name="action" value="send">
        <div class="field">
          <label for="b-email">Your e-mail address</label>
          <input class="input" id="b-email" name="email" type="email" required maxlength="190" autocomplete="email" placeholder="you@example.com" value="<?= e(post('email')) ?>"<?= field_aria($errors, 'email') ?>>
          <?= field_error($errors, 'email') ?: '<p class="hint">Use the same address you gave at the shop.</p>' ?>
        </div>
        <button class="btn btn-primary" type="submit">Send me a code</button>
      </form>
<?php else: ?>
      <p class="notice notice-ok" role="status">If any bill carries <b><?= e($pending) ?></b>, a code is on its way there.</p>
      <form class="form" method="post" action="/find-my-bills" novalidate>
        <?= form_hidden() ?>
        <input type="hidden" name="action" value="check">
        <div class="field">
          <label for="b-code">6-digit code</label>
          <input class="input num" id="b-code" name="code" type="text" inputmode="numeric" required maxlength="6" autocomplete="one-time-code" data-digits<?= field_aria($errors, 'code') ?>>
          <?= field_error($errors, 'code') ?>
        </div>
        <button class="btn btn-primary" type="submit">Show my bills</button>
      </form>
      <form method="post" action="/find-my-bills" class="form-send">
        <?= form_hidden() ?>
        <input type="hidden" name="action" value="restart">
        <button class="btn btn-line btn-sm" type="submit">Use a different address</button>
      </form>
<?php endif ?>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

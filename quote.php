<?php
require __DIR__ . '/includes/bootstrap.php';
require ROOT . '/includes/forms.php';

$errors = [];
$problem = null;

if (is_post()) {
    $problem = form_guard('quote');
    if ($problem === 'bot') {
        form_done('quote', '/quote');
    }
    if ($problem === null) {
        $name = post('name');
        $phone = mobile(post('phone'));
        $email = post('email');
        $stores = post('stores');
        $message = post('message');

        if ($name === '' || too_long($name, 120)) $errors['name'] = 'Please give your name.';
        if (!valid_mobile($phone)) $errors['phone'] = 'Ten digits, without +91 or a leading 0.';
        if ($email !== '' && !valid_email($email)) $errors['email'] = 'This does not look like an e-mail address.';
        if (!in_array($stores, ['1', '2-3', '4+'], true)) $errors['stores'] = 'Please choose one.';
        if (too_long($message, 2000)) $errors['message'] = 'Up to 2000 characters, please.';

        if (!$errors) {
            $ok = send_form_mail('Quote request: ' . $name, [
                'Name'     => $name,
                'WhatsApp' => '+91 ' . $phone,
                'E-mail'   => $email,
                'Stores'   => $stores,
                'Message'  => "\n" . $message,
            ], $email);
            if ($ok) {
                form_done('quote', '/quote');
            }
            $problem = 'The request could not be sent from here. Please call ' . cfg('phone') . ' or message us on WhatsApp.';
        }
    }
}

$page = [
    'title'       => 'Get a quote',
    'description' => 'Leave your number and Nexcod POS will call you back with pricing for your pharmacy or medical store.',
    'path'        => '/quote',
    'nav'         => 'quote',
];
require ROOT . '/includes/header.php';
page_head('Get a quote', 'Leave your number and we will call you back with pricing for your shop. The plans themselves are on the <a href="/pricing">pricing page</a>; this is for when you want to talk it through first.');
?>

<div class="page-body">
  <div class="wrap cols">
    <div>
      <h2>What happens next</h2>
      <ol class="steps">
        <li><span class="n">01</span><div><p>We call you, or message you on WhatsApp, on the number you give.</p></div></li>
        <li><span class="n">02</span><div><p>We ask how many counters and stores you run and what you use now, and tell you which plan fits and what it costs.</p></div></li>
        <li><span class="n">03</span><div><p>If you have your medicine list in Excel, we show you how to bring it in with batches, expiry and rates.</p></div></li>
      </ol>
    </div>

    <div>
<?php if (isset($_GET['sent'])): ?>
      <p class="notice notice-ok" role="status">Thank you. We have your number and will be in touch shortly.</p>
<?php elseif ($problem): ?>
      <p class="notice notice-err" role="alert"><?= e($problem) ?></p>
<?php elseif ($errors): ?>
      <p class="notice notice-err" role="alert">Please check the fields marked below.</p>
<?php endif ?>

      <form class="form" method="post" action="/quote" data-once novalidate>
        <?= form_hidden() ?>
        <div class="form-grid">
          <div class="field">
            <label for="q-name">Your name</label>
            <input class="input" id="q-name" name="name" type="text" required maxlength="120" autocomplete="name" value="<?= e(post('name')) ?>"<?= field_aria($errors, 'name') ?>>
            <?= field_error($errors, 'name') ?>
          </div>
          <div class="field">
            <label for="q-phone">WhatsApp number</label>
            <div class="phone"><span>+91</span><input class="input" id="q-phone" name="phone" type="tel" inputmode="numeric" required autocomplete="tel-national" data-phone value="<?= e(post('phone')) ?>"<?= field_aria($errors, 'phone') ?>></div>
            <?= field_error($errors, 'phone') ?>
          </div>
          <div class="field">
            <label for="q-email">E-mail <i>(optional)</i></label>
            <input class="input" id="q-email" name="email" type="email" maxlength="190" autocomplete="email" value="<?= e(post('email')) ?>"<?= field_aria($errors, 'email') ?>>
            <?= field_error($errors, 'email') ?>
          </div>
          <div class="field">
            <label for="q-stores">Number of stores</label>
            <select class="input" id="q-stores" name="stores" required<?= field_aria($errors, 'stores') ?>>
<?php foreach (['1' => 'One store', '2-3' => '2 or 3 stores', '4+' => '4 or more'] as $v => $label): ?>
              <option value="<?= e($v) ?>"<?= post('stores') === $v ? ' selected' : '' ?>><?= e($label) ?></option>
<?php endforeach ?>
            </select>
            <?= field_error($errors, 'stores') ?>
          </div>
          <div class="field wide">
            <label for="q-message">Anything you want to tell us <i>(optional)</i></label>
            <textarea class="input" id="q-message" name="message" rows="4" maxlength="2000" placeholder="What you use now, how many counters, what you need it to do"<?= field_aria($errors, 'message') ?>><?= e(post('message')) ?></textarea>
            <?= field_error($errors, 'message') ?>
          </div>
        </div>
        <div class="form-send">
          <button class="btn btn-primary" type="submit">Request a call back</button>
          <span>We use your number to call you about Nexcod POS and nothing else.</span>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

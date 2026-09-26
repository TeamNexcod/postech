<?php
require __DIR__ . '/includes/bootstrap.php';
require ROOT . '/includes/forms.php';

$errors = [];
$problem = null;

if (is_post()) {
    $problem = form_guard('contact');
    if ($problem === 'bot') {
        form_done('contact', '/contact');
    }
    if ($problem === null) {
        $name = post('name');
        $email = post('email');
        $phone = mobile(post('phone'));
        $subject = post('subject');
        $message = post('message');

        if ($name === '' || too_long($name, 120)) $errors['name'] = 'Please give your name.';
        if (!valid_email($email)) $errors['email'] = 'This does not look like an e-mail address.';
        if ($phone !== '' && !valid_mobile($phone)) $errors['phone'] = 'Ten digits, without +91 or a leading 0.';
        if ($subject === '' || too_long($subject, 150)) $errors['subject'] = 'Please say what it is about.';
        if (mb_strlen($message) < 10 || too_long($message, 4000)) $errors['message'] = 'Please write a little more, up to 4000 characters.';

        if (!$errors) {
            $ok = send_form_mail('Contact: ' . $subject, [
                'Name'    => $name,
                'E-mail'  => $email,
                'Phone'   => $phone !== '' ? '+91 ' . $phone : '',
                'Subject' => $subject,
                'Message' => "\n" . $message,
            ], $email);
            if ($ok) {
                form_done('contact', '/contact');
            }
            $problem = 'The message could not be sent from here. Please e-mail ' . cfg('email') . ' directly.';
        }
    }
}

$page = [
    'title'       => 'Contact',
    'description' => 'Contact Nexcod POS by e-mail, phone or WhatsApp. Most messages are answered within a day.',
    'path'        => '/contact',
    'nav'         => 'contact',
];
require ROOT . '/includes/header.php';
page_head('Get in touch', 'We answer most messages within a day. If you already use the software, the Support page inside your account gets to us faster.', 'Contact');
?>

<div class="page-body">
  <div class="wrap cols">
    <div>
      <h2>Other ways</h2>
      <ul class="aside-list">
        <li><span>E-mail</span><a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a></li>
        <li><span>Phone</span><a href="tel:<?= e(cfg('phone_href')) ?>"><?= e(cfg('phone')) ?></a></li>
        <li><span>WhatsApp</span><a href="<?= e(whatsapp_url()) ?>" rel="noopener">Message us on WhatsApp</a></li>
        <li><span>Pricing for your shop</span><a href="/quote">Ask for a call back</a></li>
        <li><span>A bill from a shop</span><a href="/find-my-bills">Find my bills</a></li>
      </ul>
    </div>

    <div>
<?php if (isset($_GET['sent'])): ?>
      <p class="notice notice-ok" role="status">Thank you, your message has been sent. We will reply to the e-mail address you gave.</p>
<?php elseif ($problem): ?>
      <p class="notice notice-err" role="alert"><?= e($problem) ?></p>
<?php elseif ($errors): ?>
      <p class="notice notice-err" role="alert">Please check the fields marked below.</p>
<?php endif ?>

      <form class="form" method="post" action="/contact" data-once novalidate>
        <?= form_hidden() ?>
        <div class="form-grid">
          <div class="field">
            <label for="c-name">Your name</label>
            <input class="input" id="c-name" name="name" type="text" required maxlength="120" autocomplete="name" value="<?= e(post('name')) ?>"<?= field_aria($errors, 'name') ?>>
            <?= field_error($errors, 'name') ?>
          </div>
          <div class="field">
            <label for="c-email">E-mail</label>
            <input class="input" id="c-email" name="email" type="email" required maxlength="190" autocomplete="email" value="<?= e(post('email')) ?>"<?= field_aria($errors, 'email') ?>>
            <?= field_error($errors, 'email') ?>
          </div>
          <div class="field">
            <label for="c-phone">Phone <i>(optional)</i></label>
            <div class="phone"><span>+91</span><input class="input" id="c-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" data-phone value="<?= e(post('phone')) ?>"<?= field_aria($errors, 'phone') ?>></div>
            <?= field_error($errors, 'phone') ?>
          </div>
          <div class="field">
            <label for="c-subject">Subject</label>
            <input class="input" id="c-subject" name="subject" type="text" required maxlength="150" value="<?= e(post('subject')) ?>"<?= field_aria($errors, 'subject') ?>>
            <?= field_error($errors, 'subject') ?>
          </div>
          <div class="field wide">
            <label for="c-message">Message</label>
            <textarea class="input" id="c-message" name="message" rows="7" required maxlength="4000"<?= field_aria($errors, 'message') ?>><?= e(post('message')) ?></textarea>
            <?= field_error($errors, 'message') ?>
          </div>
        </div>
        <div class="form-send">
          <button class="btn btn-primary" type="submit">Send message</button>
          <span>We use these details only to reply to you.</span>
        </div>
      </form>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

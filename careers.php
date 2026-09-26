<?php
require __DIR__ . '/includes/bootstrap.php';
require ROOT . '/includes/forms.php';

$options = data('careers');
$flatten = static function (array $list): array {
    $out = [];
    array_walk_recursive($list, function ($v) use (&$out) { $out[] = $v; });
    return $out;
};
$cvTypes = [
    'pdf'  => ['application/pdf'],
    'doc'  => ['application/msword', 'application/vnd.ms-office', 'application/octet-stream'],
    'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/octet-stream'],
];
$maxCv = 5 * 1024 * 1024;

$errors = [];
$problem = null;

if (is_post()) {
    $problem = form_guard('careers');
    if ($problem === 'bot') {
        form_done('careers', '/careers');
    }
    if ($problem === null) {
        $f = [
            'name'       => post('name'),
            'phone'      => mobile(post('phone')),
            'email'      => post('email'),
            'position'   => post('position'),
            'experience' => post('experience'),
            'education'  => post('education'),
            'skills'     => post('skills'),
            'message'    => post('message'),
        ];

        if ($f['name'] === '' || too_long($f['name'], 150)) $errors['name'] = 'Please give your full name.';
        if (!valid_mobile($f['phone'])) $errors['phone'] = 'Ten digits, without +91 or a leading 0.';
        if (!valid_email($f['email'])) $errors['email'] = 'This does not look like an e-mail address.';
        if (!in_array($f['position'], $flatten($options['roles']), true)) $errors['position'] = 'Please choose a role from the list.';
        if (!in_array($f['experience'], $options['experience'], true)) $errors['experience'] = 'Please choose one.';
        if (!in_array($f['education'], $flatten($options['education']), true)) $errors['education'] = 'Please choose one.';
        if (too_long($f['skills'], 500)) $errors['skills'] = 'Up to 500 characters, please.';
        if (too_long($f['message'], 2000)) $errors['message'] = 'Up to 2000 characters, please.';

        $cv = null;
        $upload = $_FILES['cv'] ?? null;
        if ($upload && $upload['error'] !== UPLOAD_ERR_NO_FILE) {
            $ext = strtolower(pathinfo((string) $upload['name'], PATHINFO_EXTENSION));
            $mime = $upload['error'] === UPLOAD_ERR_OK ? (new finfo(FILEINFO_MIME_TYPE))->file($upload['tmp_name']) : '';
            if ($upload['error'] === UPLOAD_ERR_INI_SIZE || $upload['error'] === UPLOAD_ERR_FORM_SIZE || ($upload['size'] ?? 0) > $maxCv) {
                $errors['cv'] = 'The file is larger than 5 MB.';
            } elseif ($upload['error'] !== UPLOAD_ERR_OK) {
                $errors['cv'] = 'The file did not upload. Please try again, or apply without it.';
            } elseif (!isset($cvTypes[$ext]) || !in_array($mime, $cvTypes[$ext], true)) {
                $errors['cv'] = 'Please attach a PDF, DOC or DOCX file.';
            } else {
                $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($f['name'])), '-') ?: 'applicant';
                $cv = ['path' => $upload['tmp_name'], 'name' => 'cv-' . $slug . '.' . $ext, 'type' => $mime];
            }
        }

        if (!$errors) {
            $ok = send_form_mail('Application: ' . $f['position'] . ' - ' . $f['name'], [
                'Name'       => $f['name'],
                'Phone'      => '+91 ' . $f['phone'],
                'E-mail'     => $f['email'],
                'Role'       => $f['position'],
                'Experience' => $f['experience'],
                'Education'  => $f['education'],
                'Good at'    => $f['skills'],
                'Message'    => "\n" . $f['message'],
                'CV'         => $cv ? $cv['name'] . ' (attached)' : 'not attached',
            ], $f['email'], $cv);
            if ($ok) {
                form_done('careers', '/careers');
            }
            $problem = 'The application could not be sent from here. Please e-mail it to ' . cfg('email') . '.';
        }
    }
}

/** <option>s for a list that may be grouped into <optgroup>s. */
function options_html(array $list, string $selected): string
{
    $html = '';
    foreach ($list as $key => $value) {
        if (is_array($value)) {
            $html .= '<optgroup label="' . e($key) . '">' . options_html($value, $selected) . '</optgroup>';
        } else {
            $html .= '<option' . ($value === $selected ? ' selected' : '') . '>' . e($value) . '</option>';
        }
    }
    return $html;
}

$page = [
    'title'       => 'Work with us',
    'description' => 'Jobs at Nexcod POS: engineering, testing, design, sales, support, pharmacy and more. Pick a role and apply with or without a CV.',
    'path'        => '/careers',
    'nav'         => 'careers',
];
require ROOT . '/includes/header.php';
page_head('Work with us', 'Nexcod POS runs the counter in pharmacies across India: billing, stock, GST, the lot. If you would like to work on software people depend on to trade, pick the role and tell us a little about yourself.', 'Work with us');
?>

<div class="page-body">
  <div class="wrap">
<?php if (isset($_GET['sent'])): ?>
    <p class="notice notice-ok form" role="status">Thank you, your application has reached us. We read every one, and will write to you if there is a fit.</p>
<?php elseif ($problem): ?>
    <p class="notice notice-err form" role="alert"><?= e($problem) ?></p>
<?php elseif ($errors): ?>
    <p class="notice notice-err form" role="alert">Please check the fields marked below.</p>
<?php endif ?>

    <form class="form" method="post" action="/careers" enctype="multipart/form-data" data-once novalidate>
      <?= form_hidden() ?>
      <input type="hidden" name="MAX_FILE_SIZE" value="<?= $maxCv ?>">

      <fieldset>
        <legend><span class="num">01</span>About you</legend>
        <div class="form-grid">
          <div class="field wide">
            <label for="w-name">Full name</label>
            <input class="input" id="w-name" name="name" required maxlength="150" autocomplete="name" value="<?= e(post('name')) ?>"<?= field_aria($errors, 'name') ?>>
            <?= field_error($errors, 'name') ?>
          </div>
          <div class="field">
            <label for="w-phone">Phone</label>
            <div class="phone"><span>+91</span><input class="input" id="w-phone" name="phone" type="tel" inputmode="numeric" required autocomplete="tel-national" data-phone value="<?= e(post('phone')) ?>"<?= field_aria($errors, 'phone') ?>></div>
            <?= field_error($errors, 'phone') ?>
          </div>
          <div class="field">
            <label for="w-email">E-mail</label>
            <input class="input" id="w-email" name="email" type="email" required maxlength="190" autocomplete="email" value="<?= e(post('email')) ?>"<?= field_aria($errors, 'email') ?>>
            <?= field_error($errors, 'email') ?>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend><span class="num">02</span>The role</legend>
        <div class="form-grid">
          <div class="field wide">
            <label for="w-role">Role</label>
            <select class="input" id="w-role" name="position" required<?= field_aria($errors, 'position') ?>>
              <option value="">Choose a role</option>
              <?= options_html($options['roles'], post('position')) ?>
            </select>
            <?= field_error($errors, 'position') ?>
          </div>
          <div class="field">
            <label for="w-exp">Experience</label>
            <select class="input" id="w-exp" name="experience" required<?= field_aria($errors, 'experience') ?>>
              <option value="">Choose</option>
              <?= options_html($options['experience'], post('experience')) ?>
            </select>
            <?= field_error($errors, 'experience') ?>
          </div>
          <div class="field">
            <label for="w-edu">Highest education</label>
            <select class="input" id="w-edu" name="education" required<?= field_aria($errors, 'education') ?>>
              <option value="">Choose</option>
              <?= options_html($options['education'], post('education')) ?>
            </select>
            <?= field_error($errors, 'education') ?>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend><span class="num">03</span>A little more <i>(optional)</i></legend>
        <div class="field">
          <label for="w-skills">What are you good at?</label>
          <input class="input" id="w-skills" name="skills" maxlength="500" placeholder="Tools, languages, work you are proud of" value="<?= e(post('skills')) ?>"<?= field_aria($errors, 'skills') ?>>
          <?= field_error($errors, 'skills') ?>
        </div>
        <div class="field">
          <label for="w-msg">Anything you would like to tell us</label>
          <textarea class="input" id="w-msg" name="message" rows="4" maxlength="2000"<?= field_aria($errors, 'message') ?>><?= e(post('message')) ?></textarea>
          <?= field_error($errors, 'message') ?>
        </div>
        <div class="field">
          <label for="w-cv">CV <i>PDF, DOC or DOCX, up to 5 MB</i></label>
          <input class="input" id="w-cv" name="cv" type="file" accept=".pdf,.doc,.docx"<?= field_aria($errors, 'cv') ?>>
          <?= field_error($errors, 'cv') ?: '<p class="hint">No CV to hand? Apply anyway and send it later.</p>' ?>
        </div>
      </fieldset>

      <div class="form-send">
        <button class="btn btn-primary btn-lg" type="submit">Send application</button>
        <span>We read every application.</span>
      </div>
    </form>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

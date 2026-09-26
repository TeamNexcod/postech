<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Privacy policy',
    'description' => 'What Nexcod POS collects, how it is used and kept safe, and how to get a copy of your data or have it deleted.',
    'path'        => '/privacy',
];
$mail = '<a href="mailto:' . e(cfg('email')) . '">' . e(cfg('email')) . '</a>';
$sections = [
    '1. Information we collect' => '<p>When you create a Nexcod POS account, we collect your name, email, phone number, and business details. When you use our service, we collect billing data, product information, customer data you enter, and usage logs (IP address, browser, login times).</p>',
    '2. How we use it'          => '<p>We use your data to operate the service, communicate with you, send invoices and receipts, prevent fraud, and improve the product. We never sell your data to third parties.</p>',
    '3. Data security'          => '<p>Passwords are stored using bcrypt hashing. All API connections use TLS. Database backups are encrypted. We restrict access to your data to authorized team members on a need-to-know basis.</p>',
    '4. Payments'               => '<p>Plans are paid by UPI, from your own UPI app to ours. We keep the plan, the amount and the UTR reference number you enter, so the payment can be matched; we never see your UPI PIN or your bank details.</p>',
    '5. Cookies & sessions'     => '<p>We use HTTP-only session cookies to keep you logged in. We do not use third-party tracking cookies or advertising trackers.</p>',
    '6. Your rights'            => '<p>You can request a copy of your data, correct it, or delete your account at any time by emailing ' . $mail . '.</p>',
    '7. Contact'                => '<p>For privacy questions, contact ' . $mail . '.</p>',
];
require ROOT . '/includes/legal.php';

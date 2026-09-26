<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Refund policy',
    'description' => 'Try Nexcod POS on the free plan first. Paid plans have a 7-day money-back period; how to ask for a refund and when it is paid.',
    'path'        => '/refund',
];
$sections = [
    'Free plan'        => '<p>Every new account starts on the Free plan, with 100 bills total and up to 900 products, and no payment. Use it to try the software before you pay for anything.</p>',
    '7-day money-back' => '<p>If you paid for a plan and decide it isn\'t right for you, request a refund within 7 days of payment for a full refund. After 7 days, refunds are at our discretion and pro-rated.</p>',
    'How to request'   => '<p>Email <a href="mailto:' . e(cfg('email')) . '">' . e(cfg('email')) . '</a> from the account email with the transaction reference and reason. Refunds are paid back to the UPI account or card the payment came from, within 5&ndash;10 business days.</p>',
    'Exceptions'       => '<p>Refunds are not provided for accounts terminated for terms violations, fraud, abuse, or chargebacks.</p>',
];
require ROOT . '/includes/legal.php';

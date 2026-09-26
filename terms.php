<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Terms of service',
    'description' => 'The terms for using Nexcod POS: use of the service, plans and payment, availability, termination and liability.',
    'path'        => '/terms',
];
$sections = [
    '1. Acceptance'                => '<p>By creating a Nexcod POS account or using the service you agree to these terms.</p>',
    '2. Use of service'            => '<p>You must use Nexcod POS for legal business purposes only. You are responsible for the accuracy of the data you enter and the customers and transactions you record.</p>',
    '3. Subscription & payment'    => '<p>Paid plans are billed in advance for the duration shown at checkout. You may cancel anytime; service continues until the end of your current billing period.</p>',
    '4. Refunds'                   => '<p>See our <a href="/refund">refund policy</a>.</p>',
    '5. Service availability'      => '<p>We aim for high availability but do not guarantee uninterrupted service. We may schedule maintenance windows with prior notice.</p>',
    '6. Termination'               => '<p>We may suspend or terminate accounts that violate these terms, attempt to harm the service, or fail to pay. Your data remains accessible for 30 days after termination unless you request deletion.</p>',
    '7. Limitation of liability'   => '<p>Nexcod is provided "as is". To the extent permitted by law, our liability is limited to the amount you paid for the service in the previous 12 months.</p>',
    '8. Governing law'             => '<p>These terms are governed by the laws of India, and disputes will be resolved in the courts of India.</p>',
];
require ROOT . '/includes/legal.php';

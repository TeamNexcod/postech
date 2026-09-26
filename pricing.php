<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Pricing',
    'description' => 'Nexcod POS plans: a free plan with 100 bills, then ₹269 for 3 months, ₹499 for 6 months or ₹998 for a year. Every feature on every paid plan, paid by UPI, nothing renews on its own.',
    'path'        => '/pricing',
    'nav'         => 'pricing',
];
require ROOT . '/includes/header.php';
page_head('Pricing', 'Start on the free plan. When you need more, pay for a fixed period. Nothing renews on its own, and the paid plans differ only in how long they run.');
?>

<div class="page-body">
  <div class="wrap">
<?php require ROOT . '/includes/pricing-table.php'; ?>
    <p class="hint">Running several stores and need something different? <a href="/contact">Talk to us</a> or <a href="/quote">ask for a quote</a>.</p>
  </div>
</div>

<section class="sec">
  <div class="wrap narrow">
    <div class="sec-head">
      <h2>Pricing questions</h2>
    </div>
<?php $faqs = data('faq')['pricing']; require ROOT . '/includes/faq.php'; ?>
  </div>
</section>

<?php require ROOT . '/includes/cta.php'; ?>
<?php require ROOT . '/includes/footer.php'; ?>

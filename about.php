<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'About',
    'description' => 'Nexcod POS is billing and stock software for pharmacies and medical stores in India. It began at one medical store\'s counter and was rebuilt as cloud software shops across India use today.',
    'path'        => '/about',
    'nav'         => 'about',
    'schema'      => schema_org(),
];
require ROOT . '/includes/header.php';
page_head('About Nexcod POS', 'Billing and stock software for pharmacies and medical stores in India. It started at one medical store\'s counter and now runs in shops across 26 states.', 'About');
?>

<div class="page-body">
  <div class="wrap">
    <section class="cols">
      <h2>How it started</h2>
      <div class="prose">
        <p>Krishav Kumar Barman wrote the first version for his father, Kajal Kumar Barman, so that billing at their medical store would be faster and more reliable. It worked. It also showed a wider problem: the billing software a local shop could buy was too expensive, too complicated, or not made for the way such a shop runs.</p>
        <p>So it was rebuilt from the ground up as the cloud software shops use today, simple enough for anyone behind a counter and complete enough for a business with several stores. <a href="/founder">More about the founder</a>.</p>
      </div>
    </section>

    <section class="cols">
      <div>
        <h2>What it covers</h2>
        <p class="hint">The whole of a medical store's day, from the first bill to the books. <a href="/features">All features</a></p>
      </div>
      <ol class="steps">
        <li><span class="n">01</span><div><h3>Billing and GST</h3><p>GST invoices with HSN codes and the CGST, SGST or IGST split, a bill of supply for composition and unregistered shops, several bill designs, and print or share straight from the counter.</p></div></li>
        <li><span class="n">02</span><div><h3>Stock, batches and expiry</h3><p>Every batch keeps its own MRP, expiry and purchase rate. Low-stock and near-expiry lists, product codes and bulk edits.</p></div></li>
        <li><span class="n">03</span><div><h3>Stores and staff</h3><p>Several shops under one account, and a login for each member of staff that opens only the sections you allow.</p></div></li>
        <li><span class="n">04</span><div><h3>Reports</h3><p>Sales, HSN-wise GST, stock and profit reports on screen, or downloaded for your accountant.</p></div></li>
        <li><span class="n">05</span><div><h3>Customers</h3><p>Saved customers with their purchase history and dues, and a page where a customer can <a href="/find-my-bills">find their own bills</a>.</p></div></li>
        <li><span class="n">06</span><div><h3>Where the data is kept</h3><p>On our servers, not on the shop computer, so it is there from any device. Logins and changes are kept in an activity log.</p></div></li>
      </ol>
    </section>

    <section class="cols">
      <h2>Who uses it</h2>
      <div class="prose">
        <p>Retail pharmacies, medical stores and chemists, clinic and hospital pharmacies, dispensaries, and chains with more than one branch.</p>
      </div>
    </section>

    <section class="cols">
      <h2>Get in touch</h2>
      <ul class="aside-list">
        <li><span>E-mail</span><a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a></li>
        <li><span>Phone</span><a href="tel:<?= e(cfg('phone_href')) ?>"><?= e(cfg('phone')) ?></a></li>
        <li><span>Start</span><a href="<?= e(signup_url()) ?>">Open a free account</a> or <a href="/pricing">see the plans</a></li>
      </ul>
    </section>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

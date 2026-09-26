<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Nexcod POS | Pharmacy billing software with batch and expiry',
    'description' => 'Billing and stock software for pharmacies and medical stores in India. GST or composition bills by batch and expiry, Schedule H registers, an Android app and an offline Windows app. Free plan with 100 bills.',
    'path'        => '/',
    'nav'         => 'home',
    'schema'      => schema_org(),
];
$screens = array_values(array_filter(data('screens'), fn ($s) => $s['id'] !== 'product-search'));
$cheapest = min(array_filter(array_column(data('plans'), 'price')));

require ROOT . '/includes/header.php';
?>

<section class="hero">
  <div class="wrap hero-in">
    <div class="hero-copy">
      <h1>Pharmacy billing software <span>for medical stores and chemists in India</span></h1>
      <p class="lead">GST bills by batch and expiry, stock, purchases, customer dues and reports. On the computer, on the Android app, or on the Windows app that keeps billing when the internet does not.</p>
      <div class="cta-row">
        <a class="btn btn-primary btn-lg" href="<?= e(signup_url()) ?>">Start free</a>
        <a class="btn btn-line btn-lg" href="#try">Try the billing screen</a>
      </div>
      <p class="hero-price">Free plan with 100 bills, no card needed. Paid plans from <b><?= inr($cheapest) ?></b> for 3 months.</p>
      <div class="keys">
        <p>At the counter</p>
        <ul>
          <li><kbd>F2</kbd> Find medicine</li>
          <li><kbd>&uarr;</kbd><kbd>&darr;</kbd> Pick batch</li>
          <li><kbd>F1</kbd> Purchase rate</li>
          <li><kbd>F9</kbd> Save and print</li>
        </ul>
      </div>
    </div>
    <figure class="shot hero-shot">
      <img src="<?= asset('img/screens/product-search.png') ?>" width="1366" height="642" fetchpriority="high"
           alt="Billing screen in Nexcod POS with the medicine search open, listing composition, pack, batch, expiry, stock, MRP and GST for each match">
      <figcaption>Billing screen with the medicine search open. Every match shows its batch, expiry, stock and rates before you pick it.</figcaption>
    </figure>
  </div>
</section>

<section class="facts" aria-label="In short">
  <div class="wrap">
    <dl class="facts-grid">
      <div><dt>Free plan</dt><dd>100 bills and up to 900 products. No card and no end date.</dd></div>
      <div><dt>From <?= inr($cheapest) ?></dt><dd>for 3 months, with every feature and unlimited bills. Nothing renews on its own.</dd></div>
      <div><dt>Offline on Windows</dt><dd>The Windows app keeps billing when the internet goes, and syncs when it comes back.</dd></div>
      <div><dt>Android app</dt><dd>Bill, check stock and take payments from the owner's or the staff's phone.</dd></div>
    </dl>
  </div>
</section>

<section class="sec" id="try">
  <div class="wrap">
    <div class="sec-head">
      <h2>Make a bill here</h2>
      <p>A cut-down copy of the billing screen with nine sample medicines. Search by name or salt, pick the batch, enter the quantity in tablets and save. On the right is the bill as an 80mm counter printer prints it.</p>
    </div>
<?php require ROOT . '/includes/counter.php'; ?>
  </div>
</section>

<section class="sec sec-alt">
  <div class="wrap split">
    <div class="split-head">
      <h2>What it does at the counter</h2>
      <p>Built around what a medical store does between opening the shutter and closing the till.</p>
      <p><a href="/features">Every feature, in detail</a></p>
    </div>
    <ol class="steps">
      <li><span class="n">01</span><div><h3>Bill a 20-item prescription without leaving the screen</h3>
        <p>Type three letters to find a medicine, pick the batch you are holding, sell a strip or four loose tablets out of it, and print.</p></div></li>
      <li><span class="n">02</span><div><h3>Send the bill on WhatsApp or e-mail</h3>
        <p>The customer gets a link and a PDF of the same bill you printed, not a different-looking copy. If WhatsApp is reconnecting, it waits and goes on its own.</p></div></li>
      <li><span class="n">03</span><div><h3>Retail and wholesale on the same screen</h3>
        <p>One switch turns the bill from counter prices to trade rates and re-prices what is already on it. The wholesale bill prints as a proper tax invoice: both GSTINs, place of supply, HSN and the tax split on every line.</p></div></li>
      <li><span class="n">04</span><div><h3>GST the way a chemist files it</h3>
        <p>HSN, CGST and SGST or IGST by place of supply, and a bill of supply if you are unregistered or on composition. Schedule H and H1 registers with the prescriber, ready to show.</p></div></li>
      <li><span class="n">05</span><div><h3>Stock that knows its batches and expiry</h3>
        <p>Every batch keeps its own MRP, expiry and purchase rate. Near-expiry lists at 30, 60, 90, 120 or 180 days, with finished medicines left out.</p></div></li>
      <li><span class="n">06</span><div><h3>Who owes you, and which bill you paid</h3>
        <p>Customer dues settle oldest bill first. Pay a distributor and it clears his bills one by one, so the voucher says which. Double-entry books behind all of it.</p></div></li>
      <li><span class="n">07</span><div><h3>Cashier, manager and owner see different things</h3>
        <p>Give staff their own login and decide which sections they may open. Purchase rates and supplier bills can stay the owner's alone.</p></div></li>
    </ol>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec-head sec-head-row">
      <div>
        <h2>The screens</h2>
        <p>Taken off the running software, not drawn for this page.</p>
      </div>
      <a href="/screenshots">All screens</a>
    </div>
    <div class="viewer" data-viewer>
      <ol class="viewer-list" role="tablist" aria-label="Screens" aria-orientation="vertical">
<?php foreach ($screens as $i => $s): ?>
        <li role="presentation"><a role="tab" id="tab-<?= e($s['id']) ?>" href="#screen-<?= e($s['id']) ?>" aria-controls="screen-<?= e($s['id']) ?>" aria-selected="<?= $i === 0 ? 'true' : 'false' ?>"<?= $i === 0 ? '' : ' tabindex="-1"' ?>><span class="num"><?= sprintf('%02d', $i + 1) ?></span><?= e($s['title']) ?></a></li>
<?php endforeach ?>
      </ol>
      <div class="viewer-panes">
<?php foreach ($screens as $i => $s): ?>
        <figure class="shot" id="screen-<?= e($s['id']) ?>" role="tabpanel" aria-labelledby="tab-<?= e($s['id']) ?>">
          <img src="<?= asset('img/screens/' . $s['id'] . '.png') ?>" width="<?= $s['w'] ?>" height="<?= $s['h'] ?>" loading="lazy" alt="<?= e($s['title']) ?> in Nexcod POS">
          <figcaption><b><?= e($s['title']) ?>.</b> <?= e($s['caption']) ?></figcaption>
        </figure>
<?php endforeach ?>
      </div>
    </div>
  </div>
</section>

<section class="sec sec-alt" id="pricing">
  <div class="wrap">
    <div class="sec-head">
      <h2>Pricing</h2>
      <p>Start on the free plan. When you need more, pay for a fixed period. Nothing renews on its own.</p>
    </div>
<?php require ROOT . '/includes/pricing-table.php'; ?>
  </div>
</section>

<section class="sec">
  <div class="wrap narrow">
    <div class="sec-head">
      <h2>Questions shops ask first</h2>
    </div>
<?php $faqs = data('faq')['home']; require ROOT . '/includes/faq.php'; ?>
  </div>
</section>

<?php require ROOT . '/includes/cta.php'; ?>

<?php require ROOT . '/includes/footer.php'; ?>

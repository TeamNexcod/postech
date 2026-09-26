</main>

<footer class="foot">
  <div class="wrap">
    <div class="foot-grid">
      <div class="foot-about">
        <a class="brand brand-foot" href="/">
          <img src="<?= asset('img/brand/logo-64.png') ?>" width="32" height="32" alt="">
          <span>Nexcod <b>POS</b></span>
        </a>
        <p>Billing and stock software for pharmacies and medical stores in India. GST bills by batch and expiry, on the computer, the phone and offline on Windows.</p>
        <p class="foot-contact">
          <a href="mailto:<?= e(cfg('email')) ?>"><?= e(cfg('email')) ?></a><br>
          <a href="tel:<?= e(cfg('phone_href')) ?>"><?= e(cfg('phone')) ?></a>
        </p>
      </div>
      <div>
        <h2>Software</h2>
        <ul>
          <li><a href="/features">Features</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/screenshots">Screens</a></li>
          <li><a href="/how-to-use">How to use</a></li>
          <li><a href="/learn">Video guides</a></li>
          <li><a href="<?= e(cfg('demo')) ?>">Software demo</a></li>
          <li><a href="<?= e(cfg('play_store')) ?>" rel="noopener">Android app</a></li>
        </ul>
      </div>
      <div>
        <h2>Company</h2>
        <ul>
          <li><a href="/about">About</a></li>
          <li><a href="/team/">Team</a></li>
          <li><a href="/founder">Founder</a></li>
          <li><a href="/careers">Work with us</a></li>
<?php if (data('reviews')): ?>
          <li><a href="/reviews">Reviews</a></li>
<?php endif ?>
        </ul>
      </div>
      <div>
        <h2>Help</h2>
        <ul>
          <li><a href="/find-my-bills">Find my bills</a></li>
          <li><a href="/contact">Contact</a></li>
          <li><a href="/quote">Get a quote</a></li>
          <li><a href="<?= e(whatsapp_url()) ?>" rel="noopener">WhatsApp</a></li>
          <li><a href="<?= e(cfg('instagram')) ?>" rel="noopener">Instagram</a></li>
          <li><a href="<?= e(cfg('linkedin')) ?>" rel="noopener">LinkedIn</a></li>
        </ul>
      </div>
      <div>
        <h2>Legal</h2>
        <ul>
          <li><a href="/privacy">Privacy policy</a></li>
          <li><a href="/terms">Terms of service</a></li>
          <li><a href="/refund">Refund policy</a></li>
        </ul>
      </div>
    </div>
    <div class="foot-base">
      <span>&copy; <?= date('Y') ?> Nexcod POS</span>
      <span class="made"><span class="tri" aria-hidden="true"></span>Made in India, for Indian pharmacies</span>
    </div>
  </div>
</footer>
</body>
</html>

<?php
require __DIR__ . '/includes/bootstrap.php';

$page = [
    'title'       => 'Founder',
    'description' => 'Krishav Kumar Barman wrote the first version of Nexcod POS for his father\'s pharmacy, then rebuilt it as cloud billing software medical stores across India can afford.',
    'path'        => '/founder',
    'nav'         => 'founder',
];
require ROOT . '/includes/header.php';
page_head('Built from a real need', 'How Nexcod POS grew from one pharmacy counter into billing software for medical stores across India.', 'Founder');
?>

<div class="page-body">
  <div class="wrap founder">
    <figure class="founder-photo">
      <img src="<?= asset('img/team/krishav-kumar-barman.jpg') ?>" width="480" height="600" alt="Krishav Kumar Barman">
      <figcaption>Krishav Kumar Barman, founder. <a href="<?= e(cfg('instagram')) ?>" rel="noopener">Instagram</a> &middot; <a href="<?= e(cfg('linkedin')) ?>" rel="noopener">LinkedIn</a></figcaption>
    </figure>
    <div class="prose">
      <blockquote>&ldquo;Good billing software shouldn't be a luxury. Every seller in India, big or small, deserves tools that are simple, reliable and affordable.&rdquo;</blockquote>
      <p>It began close to home. I wrote the first version of Nexcod POS for my father, <strong>Kajal Kumar Barman</strong>, to run the billing at his pharmacy: a fast, dependable system for a local medical store. It soon showed how much a good billing system changes the way a shop runs, every single day.</p>
      <p>That first version was made for a pharmacy counter, and everything we know came from it. Every bill, and every odd case at that counter, taught us how an Indian shop actually works.</p>
      <p>While building it, one thing kept coming up. Small pharmacies and medical stores all over India wanted proper billing software, but what was on offer was either too expensive or too complicated, and many simply could not afford it. The shops that needed it most were the ones it left out.</p>
      <p>So Nexcod POS was rebuilt from the ground up as cloud software that any medical store, large or small, can afford and actually use: low-cost plans, several stores and staff logins, GST-ready invoicing, and a login that works from any device.</p>
      <p>What started as a tool for one pharmacy now runs in medical stores across India. It is still early, and thank you for being part of it.</p>
      <p><a class="btn btn-primary" href="<?= e(signup_url()) ?>">Start with the free plan</a></p>
    </div>
  </div>
</div>

<?php require ROOT . '/includes/footer.php'; ?>

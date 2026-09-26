<?php
/** Question list. Expects $faqs as [[question, answer], ...]. */
?>
<div class="faq">
<?php foreach ($faqs as $i => [$q, $a]): ?>
  <details<?= $i === 0 ? ' open' : '' ?>>
    <summary><?= e($q) ?></summary>
    <p><?= e($a) ?></p>
  </details>
<?php endforeach ?>
</div>

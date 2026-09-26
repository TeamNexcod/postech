<?php
/** Plans table and what the paid plans include. Used on the home page and on /pricing. */
?>
<div class="plans">
  <div class="table-scroll">
    <table class="plan-table">
      <thead>
        <tr>
          <th scope="col">Plan</th>
          <th scope="col">Runs for</th>
          <th scope="col" class="r">Price</th>
          <th scope="col" class="r">Per month</th>
          <th scope="col"><span class="sr">Choose</span></th>
        </tr>
      </thead>
      <tbody>
<?php foreach (data('plans') as $plan): ?>
        <tr>
          <th scope="row"><?= e($plan['name']) ?><?php if (!empty($plan['note'])): ?><small><?= e($plan['note']) ?></small><?php endif ?></th>
          <td><?= e($plan['period']) ?></td>
          <td class="r num"><?= inr($plan['price']) ?></td>
          <td class="r num"><?= inr(per_month($plan)) ?></td>
          <td class="r"><a class="btn btn-sm <?= $plan['price'] ? 'btn-line' : 'btn-primary' ?>" href="<?= e(signup_url($plan['signup'])) ?>"><?= $plan['price'] ? 'Choose' : 'Start free' ?><span class="sr"> <?= e($plan['name']) ?></span></a></td>
        </tr>
<?php endforeach ?>
      </tbody>
    </table>
  </div>
  <div class="plan-incl">
    <h3>Every paid plan includes</h3>
    <ul>
<?php foreach (data('plan-includes') as $line): ?>
      <li><?= e($line) ?></li>
<?php endforeach ?>
    </ul>
    <p>The paid plans differ only in how long they run. Payment is by UPI from inside your account. See the <a href="/refund">refund policy</a> if it turns out not to be right for you.</p>
  </div>
</div>

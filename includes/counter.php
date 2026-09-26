<?php
/**
 * Working copy of the billing screen. The markup is the empty screen; assets/js/site.js
 * holds the sample stock and does the billing. Without JavaScript it shows a note instead.
 */
?>
<div class="pos" data-pos>
  <div class="pos-app">
    <div class="pos-bar">
      <span class="pos-brand">Nexcod <b>POS</b></span>
      <span class="pos-title">Billing / POS</span>
      <span class="pos-clock num" data-clock></span>
    </div>
    <div class="pos-tools">
      <label class="sr" for="pos-q">Search medicine</label>
      <input class="pos-q" id="pos-q" type="text" autocomplete="off" spellcheck="false" disabled
             placeholder="Search by name, brand or salt (F2)"
             role="combobox" aria-expanded="false" aria-controls="pos-results" aria-autocomplete="list">
      <div class="pos-results" id="pos-results" role="listbox" aria-label="Matching medicines" hidden></div>
      <div class="pos-pick" data-pick hidden></div>
    </div>
    <div class="pos-lines-wrap">
      <table class="pos-lines">
        <thead>
          <tr>
            <th scope="col" class="c-n">#</th>
            <th scope="col">Product</th>
            <th scope="col" class="c-batch">Batch</th>
            <th scope="col" class="c-exp">Expiry</th>
            <th scope="col" class="r">Qty</th>
            <th scope="col" class="r c-rate">Rate</th>
            <th scope="col" class="r c-gst">GST</th>
            <th scope="col" class="r">Amount</th>
            <th scope="col"><span class="sr">Remove</span></th>
          </tr>
        </thead>
        <tbody data-lines>
          <tr class="pos-empty"><td colspan="9"><noscript>This part of the page needs JavaScript. </noscript>Search a medicine above to start the bill.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="pos-foot">
      <dl class="pos-tot">
        <div><dt>Items</dt><dd class="num" data-t="items">0</dd></div>
        <div><dt>Taxable</dt><dd class="num" data-t="taxable">₹0.00</dd></div>
        <div><dt>GST</dt><dd class="num" data-t="gst">₹0.00</dd></div>
        <div class="pos-grand"><dt>Total</dt><dd class="num" data-t="total">₹0.00</dd></div>
      </dl>
      <button class="pos-save" type="button" data-save disabled>Save and print <kbd>F9</kbd></button>
    </div>
    <p class="pos-status" role="status" aria-live="polite" data-status></p>
  </div>
  <div class="pos-paper">
    <p class="pos-paper-label">Printed bill, 80mm</p>
    <div class="receipt" data-receipt aria-label="Printed bill preview"></div>
    <button class="btn btn-line btn-sm pos-print" type="button" data-print hidden>Print this bill</button>
  </div>
</div>
<p class="pos-keys"><span class="pos-keys-k">Keys inside the screen: <kbd>F2</kbd> search, <kbd>&uarr;</kbd> <kbd>&darr;</kbd> move, <kbd>Enter</kbd> choose, <kbd>Esc</kbd> back, <kbd>F9</kbd> save. </span>The full software, with purchases, returns and reports, is in the <a href="<?= e(cfg('demo')) ?>">demo</a>.</p>

/*
 * nexcodpos.in
 *
 * No framework and no build step. Each block below looks for its own markup and
 * returns early when the page does not have it.
 */
(function () {
  'use strict';

  var $ = function (sel, el) { return (el || document).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isTyping(el) {
    return el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  }

  /* Header: the menu button on small screens, and closing "More" ---------- */

  (function () {
    var btn = $('.menu-btn');
    var nav = $('#site-nav');
    var more = $('.nav-more details');
    if (!btn || !nav) return;

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Close' : 'Menu';
      if (more) more.open = open;
    });

    if (!more) return;
    document.addEventListener('click', function (e) {
      if (more.open && !nav.classList.contains('open') && !more.contains(e.target)) more.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && more.open && !nav.classList.contains('open')) {
        more.open = false;
        $('summary', more).focus();
      }
    });
  })();

  /* Screens viewer on the home page: a list of screens as tabs ------------ */

  $$('[data-viewer]').forEach(function (viewer) {
    var tabs = $$('[role="tab"]', viewer);
    var panes = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function show(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panes[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
      tabs[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function (e) { e.preventDefault(); show(i); });
      tab.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); show(n, true); }
      });
    });

    viewer.classList.add('ready');
    panes.forEach(function (p, j) { p.hidden = j !== 0; });
  });

  /* Contents list that follows the reader down a long page ---------------- */

  $$('[data-spy]').forEach(function (nav) {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('a[href^="#"]', nav);
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      links.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        if (visible[id] && current === null) current = a;
      });
      if (!current) return;
      links.forEach(function (a) { a.classList.toggle('on', a === current); });
    }, { rootMargin: '-90px 0px -55% 0px' });

    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  });

  /* How-to page: filter the sections as you type -------------------------- */

  (function () {
    var input = $('[data-guide-search]');
    if (!input) return;
    var guides = $$('.guide');
    var count = $('[data-guide-count]');
    var none = $('[data-guide-none]');
    var text = guides.map(function (g) { return g.textContent.toLowerCase().replace(/\s+/g, ' '); });

    function run() {
      var terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      guides.forEach(function (g, i) {
        var hit = terms.every(function (t) { return text[i].indexOf(t) !== -1; });
        g.hidden = !hit;
        var link = $('[data-spy] a[href="#' + g.id + '"]');
        if (link) link.parentNode.hidden = !hit;
        if (hit) shown++;
      });
      count.textContent = terms.length ? shown + ' of ' + guides.length + ' sections match' : guides.length + ' sections';
      none.hidden = shown !== 0;
    }

    input.addEventListener('input', run);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { input.value = ''; run(); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !isTyping(document.activeElement)) { e.preventDefault(); input.focus(); }
    });
    run();
  })();

  /* Screenshots page: open a screen full size ----------------------------- */

  (function () {
    var dlg = $('dialog.lightbox');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    var img = $('img', dlg);
    var cap = $('p', dlg);

    $$('[data-zoom]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var fig = a.closest('figure');
        img.src = a.getAttribute('href');
        img.alt = $('img', a).alt;
        cap.innerHTML = $('figcaption', fig).innerHTML;
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close();
    });
  })();

  /* Forms: digits only in phone boxes, and no second submit --------------- */

  $$('input[data-digits]').forEach(function (el) {
    el.addEventListener('input', function () {
      var v = el.value.replace(/\D/g, '');
      if (v !== el.value) el.value = v;
    });
  });
  // Mobile numbers: a pasted "+91 98765 43210" or "098765 43210" ends up as the ten digits.
  $$('input[data-phone]').forEach(function (el) {
    el.addEventListener('input', function () {
      var v = el.value.replace(/\D/g, '');
      if (v.length > 10 && v.indexOf('91') === 0) v = v.slice(2);
      else if (v.length > 10 && v.charAt(0) === '0') v = v.slice(1);
      v = v.slice(0, 10);
      if (v !== el.value) el.value = v;
    });
  });
  $$('form[data-once]').forEach(function (form) {
    form.addEventListener('submit', function () {
      var btn = $('button[type="submit"]', form);
      if (!btn) return;
      setTimeout(function () { btn.disabled = true; btn.textContent = 'Sending...'; }, 0);
    });
  });

  /* The billing screen on the home page ------------------------------------ */

  (function () {
    var root = $('[data-pos]');
    if (!root) return;

    /*
     * Sample stock. Rates include GST, as they do on a chemist's counter. `exp` is in
     * months from today so the batches age with the calendar: there is always one
     * expired batch to show blocking, and a couple close to expiry.
     */
    var STOCK = [
      { name: 'Augmentin 625 Duo', comp: 'Amoxicillin + Clavulanic acid', pack: '1x10', per: 10, unit: 'strip', schH: true,
        batches: [{ no: 'AG1120', exp: -1, qty: 3, mrp: 223, rate: 214 }, { no: 'AG1307', exp: 8, qty: 14, mrp: 223, rate: 214 }] },
      { name: 'Azithral 500 Tablet', comp: 'Azithromycin 500mg', pack: '1x5', per: 5, unit: 'strip', schH: true,
        batches: [{ no: 'AZ0921', exp: 4, qty: 18, mrp: 132, rate: 128 }] },
      { name: 'Benadryl Cough Syrup 100ml', comp: 'Diphenhydramine', pack: '100ml', per: 1, unit: 'bottle',
        batches: [{ no: 'BD3302', exp: 0, qty: 4, mrp: 118, rate: 112 }, { no: 'BD3419', exp: 12, qty: 7, mrp: 118, rate: 112 }] },
      { name: 'Crocin Advance', comp: 'Paracetamol 500mg', pack: '1x20', per: 20, unit: 'strip',
        batches: [{ no: 'CR7644', exp: 2, qty: 6, mrp: 30, rate: 28.5 }, { no: 'CR7801', exp: 9, qty: 57, mrp: 30, rate: 29 }] },
      { name: 'Dolo 650 Tablet', comp: 'Paracetamol 650mg', pack: '1x15', per: 15, unit: 'strip',
        batches: [{ no: 'DL2338', exp: 1, qty: 12, mrp: 33.6, rate: 32 }, { no: 'DL2410', exp: 13, qty: 32, mrp: 33.6, rate: 32 }] },
      { name: 'Electral Powder', comp: 'ORS, WHO formula', pack: '21.8g', per: 1, unit: 'sachet',
        batches: [{ no: 'EL8812', exp: 6, qty: 80, mrp: 22, rate: 21 }] },
      { name: 'Pantop 40 Tablet', comp: 'Pantoprazole 40mg', pack: '1x10', per: 10, unit: 'strip',
        batches: [{ no: 'PT5511', exp: 15, qty: 7, mrp: 155, rate: 148 }] },
      { name: 'Volini Spray 100g', comp: 'Diclofenac, topical', pack: '100g', per: 1, unit: 'piece',
        batches: [{ no: 'VL2210', exp: 11, qty: 9, mrp: 335, rate: 320 }] },
      { name: 'Zincovit Tablet', comp: 'Multivitamin + Zinc', pack: '1x15', per: 15, unit: 'strip',
        batches: [{ no: 'ZV1105', exp: 18, qty: 24, mrp: 105, rate: 99 }] }
    ];
    var GST = 5;
    var NEAR = 3; // months; the software's own near-expiry list defaults to 90 days

    var today = new Date();
    STOCK.forEach(function (m) {
      m.batches.forEach(function (b) {
        var d = new Date(today.getFullYear(), today.getMonth() + b.exp, 1);
        b.label = pad(d.getMonth() + 1) + '/' + d.getFullYear();
        b.short = pad(d.getMonth() + 1) + '/' + String(d.getFullYear()).slice(2);
        b.expired = b.exp < 0;
        b.near = !b.expired && b.exp < NEAR;
      });
    });

    var q = $('#pos-q', root);
    var results = $('#pos-results', root);
    var pick = $('[data-pick]', root);
    var linesEl = $('[data-lines]', root);
    var saveBtn = $('[data-save]', root);
    var status = $('[data-status]', root);
    var receipt = $('[data-receipt]', root);
    var printBtn = $('[data-print]', root);
    var clock = $('[data-clock]', root);

    var matches = [];
    var active = -1;
    var picking = null;   // { med, batches, on }
    var lines = [];       // { med, batch, qty } where qty is in tablets (or bottles, sachets...)
    var billNo = 0;
    var saved = null;     // { no, at } once the current bill is saved

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function paise(n) { return Math.round(n * 100) / 100; }
    function money(n) { return n.toFixed(2); }
    function rs(n) { return '₹' + money(n); }
    function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

    function stockOf(med) {
      return med.batches.reduce(function (s, b) { return b.expired ? s : s + b.qty; }, 0);
    }

    /** "1 : 5 loose" for one strip and five tablets, the way the software prints it. */
    function qtyText(med, qty) {
      if (med.per === 1) return String(qty);
      var full = Math.floor(qty / med.per);
      var loose = qty % med.per;
      return loose ? full + ' : ' + loose + ' loose' : String(full);
    }
    function packsText(med, qty) {
      if (med.per === 1) return plural(qty, med.unit);
      var packs = Math.round(qty / med.per * 100) / 100;
      return (packs === 1 ? '1 ' + med.unit : packs + ' ' + med.unit + 's');
    }
    function amountOf(line) {
      return paise(line.batch.rate * line.qty / line.med.per);
    }

    function tick() {
      var d = new Date();
      clock.textContent = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) +
        '  ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    function say(msg, kind) {
      status.textContent = msg;
      status.className = 'pos-status' + (kind ? ' ' + kind : '');
    }

    /* Search */

    function search(text) {
      var t = text.trim().toLowerCase();
      if (!t) return [];
      return STOCK.map(function (m) {
        var name = m.name.toLowerCase();
        var rank = name.indexOf(t) === 0 ? 0 : name.indexOf(t) > 0 ? 1 : m.comp.toLowerCase().indexOf(t) !== -1 ? 2 : -1;
        return { m: m, rank: rank };
      }).filter(function (x) { return x.rank >= 0; })
        .sort(function (a, b) { return a.rank - b.rank || a.m.name.localeCompare(b.m.name); })
        .map(function (x) { return x.m; });
    }

    function renderResults() {
      q.setAttribute('aria-expanded', String(results.hidden === false));
      if (!matches.length) {
        results.innerHTML = '<p class="none">Nothing matches "' + esc(q.value.trim()) +
          '". The sample stock has: Crocin, Dolo, Pantop, Azithral, Augmentin, Benadryl, Electral, Volini and Zincovit.</p>';
        q.removeAttribute('aria-activedescendant');
        return;
      }
      var rows = matches.map(function (m, i) {
        var stock = stockOf(m);
        return '<tr role="option" id="pos-opt-' + i + '" data-i="' + i + '" aria-selected="' + (i === active) + '">' +
          '<td>' + esc(m.name) + (m.schH ? '<span class="tag tag-h">Sch H</span>' : '') + '</td>' +
          '<td class="comp c-comp">' + esc(m.comp) + '</td>' +
          '<td class="c-pack">' + esc(m.pack) + '</td>' +
          '<td class="r num ' + (stock < 10 ? 'stock-low' : 'stock-ok') + '">' + stock + ' ' + esc(m.unit.toUpperCase()) + '</td>' +
          '<td class="r num">' + money(m.batches[m.batches.length - 1].mrp) + '</td>' +
          '<td class="r num c-gst">' + GST + '%</td></tr>';
      }).join('');
      results.innerHTML = '<table><thead><tr><th>Medicine</th><th class="c-comp">Composition</th><th class="c-pack">Pack</th>' +
        '<th class="r">Stock</th><th class="r">MRP</th><th class="r c-gst">GST</th></tr></thead><tbody>' + rows + '</tbody></table>';
      if (active >= 0) {
        q.setAttribute('aria-activedescendant', 'pos-opt-' + active);
        var row = $('#pos-opt-' + active, results);
        if (row) row.scrollIntoView({ block: 'nearest' });
      }
    }

    function openResults() {
      matches = search(q.value);
      active = matches.length ? 0 : -1;
      results.hidden = !q.value.trim();
      renderResults();
    }
    function closeResults() {
      results.hidden = true;
      q.setAttribute('aria-expanded', 'false');
      q.removeAttribute('aria-activedescendant');
    }

    /* Batch picker */

    function openPick(med) {
      closeResults();
      var batches = med.batches.slice().sort(function (a, b) { return a.exp - b.exp; });
      var on = 0;
      while (on < batches.length && batches[on].expired) on++;   // first to expire, first out
      if (on === batches.length) {
        say(med.name + ': every batch in stock has expired, so it cannot be billed.', 'err');
        return;
      }
      picking = { med: med, batches: batches, on: on };
      renderPick();
      pick.hidden = false;
      var input = $('input', pick);
      input.value = String(med.per);
      input.focus();
      input.select();
      updatePickHint();
    }

    function renderPick() {
      var p = picking;
      var rows = p.batches.map(function (b, i) {
        var tag = b.expired ? '<span class="tag tag-exp">Expired, blocked</span>' : b.near ? '<span class="tag tag-near">Expires soon</span>' : '';
        return '<tr data-b="' + i + '" class="' + (b.expired ? 'off' : i === p.on ? 'on' : '') + '">' +
          '<td class="num">' + esc(b.no) + '</td><td class="num">' + b.label + '</td>' +
          '<td class="r num">' + b.qty + '</td><td class="r num">' + money(b.mrp) + '</td>' +
          '<td class="r num c-rate">' + money(b.rate) + '</td><td>' + tag + '</td></tr>';
      }).join('');
      var unitWord = p.med.per > 1 ? 'tablets' : p.med.unit + 's';
      pick.innerHTML =
        '<div class="pos-pick-head"><h3>' + esc(p.med.name) + (p.med.schH ? '<span class="tag tag-h">Sch H</span>' : '') + '</h3>' +
        '<span>' + esc(p.med.comp) + ' &middot; pack ' + esc(p.med.pack) + '</span></div>' +
        '<table><thead><tr><th>Batch</th><th>Expiry</th><th class="r">Stock</th><th class="r">MRP</th><th class="r c-rate">Rate</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table>' +
        '<div class="pos-pick-qty"><label for="pos-qty">Quantity in ' + unitWord + '</label>' +
        '<input id="pos-qty" type="text" inputmode="numeric" autocomplete="off">' +
        '<output for="pos-qty"></output><span class="grow"></span>' +
        '<button type="button" class="btn btn-line btn-sm" data-cancel>Back <kbd>Esc</kbd></button>' +
        '<button type="button" class="btn btn-primary btn-sm" data-add>Add to bill <kbd>Enter</kbd></button>' +
        '<p class="pos-err" hidden></p></div>';
    }

    function setBatch(i) {
      var b = picking.batches[i];
      if (!b || b.expired) return;
      picking.on = i;
      $$('tbody tr', pick).forEach(function (tr, j) { if (!tr.classList.contains('off')) tr.className = j === i ? 'on' : ''; });
      updatePickHint();
    }

    function moveBatch(dir) {
      var i = picking.on;
      do { i += dir; } while (picking.batches[i] && picking.batches[i].expired);
      if (picking.batches[i]) setBatch(i);
    }

    function pickQty() {
      var v = $('input', pick).value.trim();
      return /^\d+$/.test(v) ? parseInt(v, 10) : 0;
    }

    function updatePickHint() {
      var med = picking.med;
      var b = picking.batches[picking.on];
      var qty = pickQty();
      var out = $('output', pick);
      if (!qty) { out.textContent = ''; return; }
      var line = { med: med, batch: b, qty: qty };
      out.textContent = (med.per > 1 ? '= ' + packsText(med, qty) + ', ' : '') + rs(amountOf(line));
    }

    function closePick() {
      if (!picking) return;
      picking = null;
      pick.hidden = true;
      pick.innerHTML = '';
    }

    function addFromPick() {
      var med = picking.med;
      var b = picking.batches[picking.on];
      var qty = pickQty();
      var err = $('.pos-err', pick);
      var existing = lines.filter(function (l) { return l.batch === b; })[0];
      var want = qty + (existing ? existing.qty : 0);
      var have = b.qty * med.per;
      if (!qty) {
        err.textContent = 'Enter how many ' + (med.per > 1 ? 'tablets' : med.unit + 's') + ', as a whole number.';
      } else if (want > have) {
        err.textContent = 'Batch ' + b.no + ' has ' + packsText(med, have) + ' left' +
          (existing ? ', and ' + packsText(med, existing.qty) + ' of it is already on this bill.' : '.');
      } else {
        if (existing) existing.qty = want; else lines.push({ med: med, batch: b, qty: qty });
        closePick();
        say('');
        render();
        q.value = '';
        q.focus();
        return;
      }
      err.hidden = false;
    }

    /* The bill */

    function totals() {
      var gross = 0;
      var taxable = 0;
      lines.forEach(function (l) {
        var amt = amountOf(l);
        gross += amt;
        taxable += amt / (1 + GST / 100);
      });
      gross = paise(gross);
      taxable = paise(taxable);
      var gst = paise(gross - taxable);
      var cgst = paise(gst / 2);
      var total = Math.round(gross);
      // The two halves are split so they always add back up to the GST, paisa for paisa.
      return { gross: gross, taxable: taxable, gst: gst, cgst: cgst, sgst: paise(gst - cgst), total: total, round: paise(total - gross) };
    }

    function render() {
      if (!lines.length) {
        linesEl.innerHTML = '<tr class="pos-empty"><td colspan="9">Search a medicine above to start the bill.</td></tr>';
      } else {
        linesEl.innerHTML = lines.map(function (l, i) {
          return '<tr><td class="c-n num">' + (i + 1) + '</td>' +
            '<td>' + esc(l.med.name) + (l.med.schH ? '<span class="tag tag-h">Sch H</span>' : '') + '</td>' +
            '<td class="num c-batch">' + esc(l.batch.no) + '</td><td class="num c-exp">' + l.batch.short + '</td>' +
            '<td class="r num">' + qtyText(l.med, l.qty) + '</td>' +
            '<td class="r num c-rate">' + money(l.batch.rate) + '</td><td class="r num c-gst">' + GST + '%</td>' +
            '<td class="r num">' + money(amountOf(l)) + '</td>' +
            '<td class="r">' + (saved ? '' : '<button type="button" class="pos-del" data-del="' + i + '">Remove<span class="sr"> ' + esc(l.med.name) + '</span></button>') + '</td></tr>';
        }).join('');
      }
      var t = totals();
      $('[data-t="items"]', root).textContent = lines.length;
      $('[data-t="taxable"]', root).textContent = rs(t.taxable);
      $('[data-t="gst"]', root).textContent = rs(t.gst);
      $('[data-t="total"]', root).textContent = rs(t.total);
      saveBtn.disabled = !lines.length || !!saved;
      printBtn.hidden = !saved;
      renderReceipt(t);
    }

    function financialYear(d) {
      var y = d.getFullYear() % 100;
      var start = d.getMonth() >= 3 ? y : y - 1;
      return pad(start) + '-' + pad((start + 1) % 100);
    }

    function billLabel(s) {
      return 'NX/' + financialYear(s.at) + '/' + ('000' + s.no).slice(-4);
    }

    function renderReceipt(t) {
      if (!lines.length) {
        receipt.innerHTML = '<div class="rc-empty">The bill appears here<br>as you add medicines.</div>';
        return;
      }
      var at = saved ? saved.at : new Date();
      var no = saved ? billLabel(saved) : null;
      var half = (GST / 2).toString();
      var items = lines.map(function (l) {
        return '<div class="rc-item"><div class="rc-row"><span>' + esc(l.med.name) + '</span><span>' + money(amountOf(l)) + '</span></div>' +
          '<div class="rc-meta">' + esc(l.batch.no) + ' Exp ' + l.batch.short + ' Qty ' + qtyText(l.med, l.qty) + ' x ' + money(l.batch.rate) + '</div></div>';
      }).join('');
      receipt.innerHTML =
        '<div class="rc-c rc-shop">YOUR MEDICAL STORE</div>' +
        '<div class="rc-c rc-sub">Your address, GSTIN and drug<br>licence number print here</div>' +
        '<div class="rc-rule"></div>' +
        '<div class="rc-c">TAX INVOICE</div>' +
        '<div class="rc-row"><span>' + (no ? 'Bill ' + no : '<span class="rc-draft">Not saved yet</span>') + '</span>' +
        '<span>' + pad(at.getDate()) + '/' + pad(at.getMonth() + 1) + '/' + at.getFullYear() + '</span></div>' +
        '<div class="rc-row"><span>Walk-in customer</span><span>' + pad(at.getHours()) + ':' + pad(at.getMinutes()) + '</span></div>' +
        '<div class="rc-rule"></div>' + items +
        '<div class="rc-rule"></div>' +
        '<div class="rc-row"><span>Taxable value</span><span>' + money(t.taxable) + '</span></div>' +
        '<div class="rc-row"><span>CGST ' + half + '%</span><span>' + money(t.cgst) + '</span></div>' +
        '<div class="rc-row"><span>SGST ' + half + '%</span><span>' + money(t.sgst) + '</span></div>' +
        (t.round ? '<div class="rc-row"><span>Round off</span><span>' + (t.round > 0 ? '+' : '') + money(t.round) + '</span></div>' : '') +
        '<div class="rc-rule"></div>' +
        '<div class="rc-row rc-total"><span>TOTAL</span><span>' + rs(t.total) + '</span></div>' +
        '<div class="rc-words">Rupees ' + words(t.total) + ' Only</div>' +
        '<div class="rc-row"><span>Paid by</span><span>Cash</span></div>' +
        '<div class="rc-rule"></div>' +
        '<div class="rc-c rc-sub">Items ' + lines.length + ' &middot; HSN 3004<br>Thank you. Get well soon.</div>';
    }

    /** Whole rupees in words, Indian style: lakh and crore. */
    function words(n) {
      var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
        'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      function two(x) { return x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : ''); }
      function three(x) {
        var h = Math.floor(x / 100);
        var r = x % 100;
        return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
      }
      if (n === 0) return 'Zero';
      var out = [];
      var crore = Math.floor(n / 1e7); n %= 1e7;
      var lakh = Math.floor(n / 1e5); n %= 1e5;
      var thousand = Math.floor(n / 1e3); n %= 1e3;
      if (crore) out.push(three(crore) + ' Crore');
      if (lakh) out.push(two(lakh) + ' Lakh');
      if (thousand) out.push(two(thousand) + ' Thousand');
      if (n) out.push(three(n));
      return out.join(' ');
    }

    function save() {
      if (!lines.length || saved) return;
      closePick();
      closeResults();
      billNo++;
      saved = { no: billNo, at: new Date() };
      lines.forEach(function (l) {
        l.batch.qty = Math.round((l.batch.qty - l.qty / l.med.per) * 100) / 100;
      });
      render();
      var t = totals();
      say('Bill ' + billLabel(saved) + ' saved for ' + rs(t.total) +
        '. Stock has come off the batches on the bill. Type in the search box to start the next one.', 'ok');
      q.value = '';
      q.focus();
    }

    function newBillIfSaved() {
      if (!saved) return;
      saved = null;
      lines = [];
      say('');
      render();
    }

    /* Wiring */

    q.disabled = false;
    tick();
    setInterval(tick, 30000);
    render();

    q.addEventListener('input', function () {
      newBillIfSaved();
      closePick();
      openResults();
    });
    q.addEventListener('focus', function () { if (q.value.trim() && !picking) openResults(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (results.hidden) { if (q.value.trim()) openResults(); return; }
        e.preventDefault();
        if (!matches.length) return;
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length;
        renderResults();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!results.hidden && matches[active]) openPick(matches[active]);
      } else if (e.key === 'Escape') {
        if (!results.hidden) { e.preventDefault(); closeResults(); }
      }
    });

    results.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the search box
    results.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-i]');
      if (tr) openPick(matches[+tr.getAttribute('data-i')]);
    });

    pick.addEventListener('click', function (e) {
      var tr = e.target.closest('tr[data-b]');
      if (tr) { setBatch(+tr.getAttribute('data-b')); $('input', pick).focus(); }
      if (e.target.closest('[data-cancel]')) { closePick(); q.focus(); }
      if (e.target.closest('[data-add]')) addFromPick();
    });
    pick.addEventListener('input', function () {
      $('.pos-err', pick).hidden = true;
      updatePickHint();
    });
    pick.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveBatch(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); moveBatch(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); addFromPick(); }
      else if (e.key === 'Escape') { e.preventDefault(); closePick(); q.focus(); }
    });

    linesEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-del]');
      if (!btn) return;
      lines.splice(+btn.getAttribute('data-del'), 1);
      render();
      q.focus();
    });

    saveBtn.addEventListener('click', save);
    printBtn.addEventListener('click', function () { window.print(); });

    // Function keys only while the reader is working inside the billing screen.
    root.addEventListener('keydown', function (e) {
      if (e.key === 'F2') { e.preventDefault(); closePick(); q.focus(); q.select(); }
      else if (e.key === 'F9') { e.preventDefault(); save(); }
    });

    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) closeResults();
    });
  })();
})();

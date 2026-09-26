# nexcodpos.in

The public website for Nexcod POS: home, features, pricing, screens, the how-to guide,
company pages, forms and legal pages. Plain PHP 8.1+, one stylesheet, one script.
No framework, no build step, nothing to install.

```
php -S localhost:8000 tools/router.php
```

Then open http://localhost:8000. To try the forms without sending mail:

```
NX_MAIL_LOG=/tmp/nx-mail.log php -S localhost:8000 tools/router.php
```

## Layout

```
index.php, pricing.php, ...   one file per page, served at /pricing etc.
team/index.php                /team/
includes/                     header, footer and shared parts (not web-reachable)
  bootstrap.php               helpers: cfg(), e(), asset(), data(), inr(), per_month()
  forms.php                   CSRF, honeypot, validation, PHP mail()
  counter.php                 the "Make a bill here" billing screen on the home page
  bills.php                   Find My Bills hand-over to the billing software (see below)
data/                         all the copy: plans, features, how-to guide, FAQs, team...
assets/css/site.css           the whole stylesheet
assets/js/site.js             the whole script, including the billing screen demo
assets/fonts/                 IBM Plex Sans and Mono, self-hosted (₹ cut from Plex Devanagari)
assets/img/                   logo, team photos, screenshots, og-image.png
tools/router.php              local stand-in for .htaccess
tools/og-image.html           source of assets/img/brand/og-image.png
config.php                    phone, e-mail, app URLs, where form mail goes
```

## Changing things

- **Prices:** `data/plans.php`. The per-month figure is worked out from the price and
  the length (`days` or `months`), and the home page, pricing page and the structured
  data for search engines all read from here.
- **Features, guide, FAQs, team, videos:** the matching file in `data/`.
- **Screenshots:** drop a PNG into `assets/img/screens/` and add a line to
  `data/screens.php` with its width and height.
- **Reviews:** `data/reviews.php` is empty, so the Reviews page and its links are hidden.
  Add reviews that shops actually gave, with the shop's name and town, and the page,
  links and sitemap entry appear.
- **Contact details and links:** `config.php`.

CSS and JS URLs carry the file's modification time, so a deploy is picked up by
browsers straight away.

## Deploying on Hostinger

Upload the repository into `public_html` (the `.htaccess` needs `mod_rewrite`, which
Hostinger has). `includes/`, `data/`, `tools/` and `config.php` are refused to browsers
by `.htaccess`.

In `config.php`, `mail_from` must be a mailbox on the domain (create
`no-reply@nexcodpos.in` in hPanel, or change it to one that exists), otherwise Hostinger
drops the form mail.

## What this site does not do on its own

These live in the billing software, which shares the domain:

- **`/demo`** is the software's demo sign-in. The Demo links point there (`cfg('demo')`).
- **Find My Bills** needs the bills database. `includes/bills.php` has two functions,
  `bills_send_code()` and `bills_check_code()`, for the software's existing lookup. Until
  they are connected the page tells the customer the lookup is unavailable.
- **Get a quote** used to confirm the number with a WhatsApp code first. Here it mails
  the request; the WhatsApp check can go back in once the software's WhatsApp sender is
  reachable from this code.

## Security headers

`includes/bootstrap.php` sends a Content-Security-Policy that allows only this site's
own scripts, styles and fonts, plus YouTube embeds on /learn. Inline `<script>` and
`style=""` attributes are blocked by it, so keep styles in `site.css` and scripts in
`site.js`.

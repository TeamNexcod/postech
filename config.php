<?php
/*
 * Everything that changes between the live server and a local copy, or that
 * the business may want to change without touching a template.
 */
return [
    'name'        => 'Nexcod POS',
    'base_url'    => 'https://nexcodpos.in',

    'email'       => 'support@nexcodpos.in',
    'phone'       => '+91 73198 33790',
    'phone_href'  => '+917319833790',
    'whatsapp'    => '917281921783',

    // The billing software itself lives on its own host.
    'app_login'   => 'https://myaccount.nexcodpos.in/',
    'app_signup'  => 'https://myaccount.nexcodpos.in/signup',
    'demo'        => '/demo',
    'play_store'  => 'https://play.google.com/store/apps/details?id=in.nexcodpos.app',

    'instagram'   => 'https://www.instagram.com/nexcoddevelopers',
    'linkedin'    => 'https://www.linkedin.com/in/krishav-kumar-barman-82ab21410',

    // Contact, quote and careers forms are mailed here with PHP mail().
    // On Hostinger the From address must be a mailbox on this domain.
    'mail_to'     => 'support@nexcodpos.in',
    'mail_from'   => 'no-reply@nexcodpos.in',

    // Shown as the date on privacy, terms and refund.
    'legal_updated' => '19 Sep 2026',
];

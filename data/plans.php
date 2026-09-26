<?php
// `signup` is the plan key the account app expects in /signup?plan=.
// A plan is either `days` or `months` long; per_month() turns it into a monthly figure.
return [
    ['name' => 'Free',     'period' => 'No end date', 'price' => 0,   'signup' => 'free',
     'note' => '100 bills in all, up to 900 products'],
    ['name' => 'Silver',   'period' => '3 months',    'price' => 269, 'signup' => 'silver_90d',   'days' => 90],
    ['name' => 'Gold',     'period' => '6 months',    'price' => 499, 'signup' => 'gold_180d',    'days' => 180],
    ['name' => 'Platinum', 'period' => '1 year',      'price' => 998, 'signup' => 'platinum_12m', 'months' => 12],
];

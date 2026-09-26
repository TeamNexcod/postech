<?php
// The how-to guide, one entry per screen, in the order a new shop meets them.
// `steps` is trusted HTML: <b>, <kbd> and entities only.
return [
    [
        'id'    => 'start',
        'title' => 'Getting Started',
        'sub'   => 'First-time setup before you start billing.',
        'steps' => [
            'Open <b>Settings</b> (More menu &rsaquo; Settings, or the Settings button on the dashboard) and fill your <b>store name, address, GSTIN, phone and logo</b>. This information prints on every bill.',
            'Choose your <b>invoice theme</b> (Nexcod 1 / 2 / 3) and paper size (A4 / thermal 80mm / 58mm) in Settings.',
            'Add your opening stock: go to <b>Inventory &rsaquo; + Add Product</b>, or bulk-upload with <b>Import Excel</b>.',
            'You are ready. Press <b>New Bill</b> on the dashboard to start selling.',
        ],
    ],
    [
        'id'    => 'dashboard',
        'title' => 'Dashboard',
        'sub'   => 'Your daily control centre.',
        'steps' => [
            'The coloured <b>quick-action buttons</b> jump straight to New Bill, Add Purchase, Add Payment, Add Product, Reports, Staff Management, Settings and more.',
            'The <b>health strip</b> shows Near-Expiry, Expired Batches, Low Stock, Out of Stock, Pending Collection and Pending Payment, click any tile to see the list.',
            '<b>Today&rsquo;s Sales</b> and recent activity are shown so you always know the day&rsquo;s position at a glance.',
        ],
    ],
    [
        'id'    => 'billing',
        'title' => 'Billing / POS',
        'sub'   => 'Create a GST bill in seconds.',
        'steps' => [
            'Press <b>New Bill</b>. In the search box type the product name, salt/composition or scan the barcode. Suggestions appear as a compact list, click one (or press Enter) to add it.',
            'A box opens for the medicine you picked. Choose the <b>batch</b> you are handing over (the list shows the expiry, how many are left and that batch\'s MRP), then set how many and press <b>Add to bill</b>.',
            '<b>Quantity is counted in tablets, not strips.</b> A strip of 10 and you type 15, the software shows <b>1.5 strips</b> and charges one and a half strips\' worth. Selling 5 out of a strip? Type 5. Nothing to switch, nothing to work out.',
            'You can type in the <b>STRIPS</b> box instead if that is easier: type 2 and the tablet count fills in by itself. Both boxes always agree.',
            'For a syrup, cream or anything sold whole, there is nothing to divide: type 1 for one bottle.',
            'Change the rate or add a per-item <b>discount %</b> if you need to. GST is worked out for you (CGST/SGST for your own state, IGST for another state).',
            'Add a <b>customer</b> and <b>doctor</b> (optional), start typing to pick from your saved list, or add new on the fly.',
            'Apply a <b>bill-level discount</b> and choose payment: Cash, UPI, Card, Credit (Due), or <b>Split</b> across modes.',
            'Press <b>Save</b> (or <kbd>F9</kbd>). The bill is stored, stock comes off the batch you chose, and the print dialog opens. If that batch cannot cover it, the rest comes off the nearest-expiry batch.',
            'The medicine appears <b>once</b> on the bill, however it was sold. If part of it was loose, the quantity reads like <b>2 : 3 loose</b>: two full strips and three single tablets.',
            'Expired batches are blocked from sale automatically (if enabled in Settings).',
        ],
    ],
    [
        'id'    => 'inventory',
        'title' => 'Products & Inventory',
        'sub'   => 'Manage stock, batches and purchase info.',
        'steps' => [
            'The inventory table is an <b>Excel-style grid</b>: edit MRP, Sale Rate, GST% and Stock directly in the cells, then click <b>Save changes</b>.',
            '<b>Always enter prices for the FULL pack, never for one tablet.</b> A strip of 15 that sells for &#8377;32: put 32. The software works out the per-tablet price itself when someone buys loose.',
            '<b>Units per Pack</b> is how many tablets are in one strip or box. Type the Pack (like <b>1x15</b>) and it fills in by itself; if you change it to something the pack does not say, you get a warning. Leave it blank for a syrup or cream. Those are sold whole.',
            'Stock is always counted in <b>strips / packs</b>, never in loose tablets. Sell 5 out of a 15-strip and the stock drops by 0.33 of a strip.',
            'The <b>Pack Size Check</b> tab lists any medicine where the pack size is missing or does not match the pack text. Those are the ones where loose selling could charge the wrong amount, so it is worth clearing that tab.',
            'Each product expands into a <b>batch grid</b> showing Batch, Qty, Expiry, <b>Purchased On, Supplier and PO No.</b> (blank if that batch has no purchase record).',
            'Use the filters (Supplier / Brand / Category) and the tabs (All / Near-Expiry / Low Stock / Least Selling) to focus the list.',
            'Add one product with <b>+ Add Product</b>, or many at once with <b>Import Excel</b>. Download the sample first: it has a <b>drop-down for the Form</b> and fills the Unit in for you, and you can upload it back as .xlsx or .csv.',
            'Select rows with the checkboxes for <b>Bulk Edit</b> or <b>Delete</b>.',
        ],
    ],
    [
        'id'    => 'barcode',
        'title' => 'Barcode Labels',
        'sub'   => 'Print stick-on labels for your shelves.',
        'steps' => [
            'Open <b>Inventory &rsaquo; Barcode Labels</b>.',
            'Search and tick the batches you want, set how many labels each, then press <b>Print Labels</b>.',
            'Every label shows your store name, product, <b>batch no, expiry and MRP</b> with a scannable barcode, scanning it in Billing finds the product instantly.',
        ],
    ],
    [
        'id'    => 'purchase',
        'title' => 'Purchase Entry',
        'sub'   => 'Record stock you buy from suppliers.',
        'steps' => [
            'Open <b>Purchase &rsaquo; Purchase Entry &rsaquo; + New</b>. Pick the supplier, enter the supplier bill/invoice number and date.',
            'Add each product with batch no, expiry, quantity, purchase rate and GST, stock and batches are created automatically on save.',
            '<b>+ Add New Product</b> opens the whole Item Master without leaving the bill. <b>Composition, Brand, Drug category and Supplier</b> are each &ldquo;type or pick&rdquo;, choose one from the list or type a name that is not in it, and it is created and attached. The Supplier box starts on whoever the bill is from. The same four boxes work the same way when you correct a medicine from the purchase line.',
            '<b>Free / scheme goods:</b> put the free quantity in the <b>Free</b> box. Those strips go on the shelf and the cost of the line is spread over all of them, so a free strip never reads as pure profit when it sells.',
            '<b>&ldquo;Free goods are&rdquo;</b> (beside &ldquo;Purchase rate is&rdquo;) tells the software how your distributor bills a scheme. <b>Extra only</b>: the bill charges Qty &times; Rate, which is what most distributors do. <b>Less on the bill</b>: the scheme comes off the money as well, so a 5+1 at &#8377;19.63 is billed &#8377;81.79 and not &#8377;98.15. It is remembered for next time.',
            '<b>Bill Amount</b> is the quickest way to make a line agree with the paper: type the figure in the Amount column of the distributor&rsquo;s bill and the scheme is worked out for you. Your <b>Disc %</b> stays exactly as the bill prints it.',
            'Type the <b>bill total</b> in the totals panel and the screen tells you if the entry does not agree with the invoice, and which box is wrong. Never force a total down with a discount; that recosts every medicine on the entry at a price you never paid.',
            '<b>AI Bill Scan:</b> click &ldquo;Scan bill photo&rdquo;, upload a photo of the supplier bill, and the rows are filled for you to review. Nothing is saved until you check and press Save.',
        ],
    ],
    [
        'id'    => 'units',
        'title' => 'Units of Measure',
        'sub'   => 'Box, Strip, Tablet: what you count in.',
        'steps' => [
            'Open <b>Inventory &rsaquo; Units of Measure</b> to keep your own list, Box, Strip, Tablet, Bottle, Vial. Every shop starts with the common ones already filled in.',
            'A medicine is counted the way you buy it. <b>You buy and stock it as</b> (Strip, Bottle, Box) and that is what <b>1</b> means on every bill and report. If you also sell single pieces, say how many <b>one of those contains</b> and what each piece is called. The third row is only for a Box &rsaquo; Strip &rsaquo; Tablet shop. The green line under the boxes reads the whole thing back, <b>1 BOX = 10 STRIP = 150 TABLET</b>, so you can see the software understood you.',
            'The unit boxes on the Item Master are &ldquo;type or pick&rdquo;: choose from your list, or type a new name and it is added to the list for next time.',
            'A unit that medicines are using cannot be deleted, because the stock list, the bill and the app all print that name, switch it off instead and it stops being offered for new products. Renaming one changes it on every medicine that uses it.',
        ],
    ],
    [
        'id'    => 'suppliers',
        'title' => 'Suppliers',
        'sub'   => 'Your vendor master.',
        'steps' => [
            'Add suppliers with GSTIN, phone, address and drug licence.',
            'Open a supplier to see purchases, payments and outstanding balance.',
        ],
    ],
    [
        'id'    => 'preturn',
        'title' => 'Purchase Returns',
        'sub'   => 'Return goods to a supplier.',
        'steps' => [
            'Open <b>Purchase &rsaquo; Purchase Returns &rsaquo; + New</b>. Enter the invoice/PO number and press <b>Load data</b> to prefill the items, or add rows manually.',
            'Delete rows you are not returning (partial return), then <b>Save Return</b>. Stock is reduced accordingly.',
            '<b>Duplicate protection:</b> once a return has been made for a bill, the system blocks a second return of the same bill so stock is never reduced twice.',
        ],
    ],
    [
        'id'    => 'sreturn',
        'title' => 'Sales Returns',
        'sub'   => 'Take back goods sold to a customer.',
        'steps' => [
            'Open <b>Sales &rsaquo; Sales Returns</b>, find the invoice and press <b>Return this</b>.',
            'Tick the items and enter the return quantity. You can never return more than what is left; a fully-returned bill shows <b>FULLY RETURNED</b> and cannot be returned again.',
            'On save, stock and batches are restored and, if the customer had paid, the amount becomes <b>store credit</b> usable on their next bill.',
        ],
    ],
    [
        'id'    => 'customers',
        'title' => 'Customers',
        'sub'   => 'Customer master with bills & dues.',
        'steps' => [
            '<b>Credit limit:</b> set how much a customer may owe on their record. Leave it blank for no limit; <b>0</b> means cash only. While a bill is being made the counter shows what they would owe against that limit, and if you switch on <b>Stop a bill that takes a customer past their credit limit</b> in Settings, the bill is refused until payment is taken. Only bills that leave money owing are checked, a customer at their limit can still buy for cash.',
            'Add customers with phone, email, state (for GST) and GSTIN.',
            'Press <b>Bills</b> on any customer to see all their invoices, <b>filter by date, print the list, and View</b> each individual bill.',
            'Collect pending dues right from the list, or open the <b>Ledger</b> for a full statement.',
        ],
    ],
    [
        'id'    => 'patients',
        'title' => 'Patients',
        'sub'   => 'Patient records for pharmacies.',
        'steps' => [
            'Save patient details; selecting a patient during billing keeps their purchase history for Schedule-H records.',
        ],
    ],
    [
        'id'    => 'doctors',
        'title' => 'Doctors',
        'sub'   => 'Doctor master & prescription bills.',
        'steps' => [
            'Add referring doctors with registration no and clinic.',
            'Press <b>Bills</b> on a doctor to see every prescription-linked invoice, <b>filter by date, print the list, and View</b> each bill individually.',
        ],
    ],
    [
        'id'    => 'payments',
        'title' => 'Payments In / Out',
        'sub'   => 'Record money received and paid.',
        'steps' => [
            'Use <b>Payment In</b> to collect customer dues, <b>Payment Out</b> to pay suppliers.',
            'Payments auto-adjust against outstanding invoices/bills and update the ledger.',
        ],
    ],
    [
        'id'    => 'expenses',
        'title' => 'Expenses',
        'sub'   => 'Track shop expenses.',
        'steps' => [
            'Record rent, electricity, salaries and other costs by category. They feed into your day-end and profit reports.',
        ],
    ],
    [
        'id'    => 'ledger',
        'title' => 'Party Ledger',
        'sub'   => 'Full account statement.',
        'steps' => [
            'Open <b>Accounts &rsaquo; Party Ledger</b> and pick a customer or supplier to see every bill, return and payment with a running balance.',
        ],
    ],
    [
        'id'    => 'demand',
        'title' => 'Demand Register',
        'sub'   => 'Track out-of-stock requests.',
        'steps' => [
            'When a customer asks for something you don&rsquo;t have, add it to the Demand Register so you remember to order it and follow up.',
        ],
    ],
    [
        'id'    => 'stock',
        'title' => 'Stock Register & Adjustment',
        'sub'   => 'Movement history and corrections.',
        'steps' => [
            'The <b>Stock Register</b> has a movement ledger, a <b>Batch-wise register</b> (with Supplier, Purchased On, PO No.) and an <b>Expired Stock</b> list (with supplier and bill number).',
            'Use <b>Stock Adjustment</b> to write off expired/damaged goods or correct counts, every change is logged.',
        ],
    ],
    [
        'id'    => 'reports',
        'title' => 'Reports',
        'sub'   => 'Sales, Purchase, Stock, Account & GST.',
        'steps' => [
            'Open <b>Reports</b>, pick a category and a report, set the date range and press <b>Apply</b>.',
            'Every report can be <b>Printed clean</b> (only the table with a proper header, not the whole screen) or <b>downloaded as CSV</b> for your accountant.',
            'The <b>Day-End Z-Report</b> summarises the day&rsquo;s cash, digital, credit, returns and expenses.',
        ],
    ],
    [
        'id'    => 'staff',
        'title' => 'Multi Staff Login',
        'sub'   => 'Counter staff, attendance & salary.',
        'steps' => [
            'Owners open <b>Staff Management</b> to add counter staff, each staff logs in with their own email &amp; password and can bill, but only the owner can open Settings.',
            '<b>What each person may do:</b> open a staff member from Staff Management and you get every switch in the software for them alone, billing, discounts, the cost column, purchases, the books, reports, even which boxes they see on the dashboard. Tick what they should have. It applies on the website <b>and on their phone</b>: switching something off closes it on the app straight away, they do not need to update it. Switch off <b>Use the Android app</b> and they are signed out of the phone entirely.',
            '<b>Their own timing:</b> each staff member has their own start time, end time and weekly off, set on the same screen. Leave it blank if they do not work fixed hours.',
            '<b>Email verification:</b> when you add a staff member, a 6-digit code goes to their email. Ask them for the code and enter it on the Staff Management page, their login activates only after this, so a wrongly typed email can never get access to your store. Changing a staff email later requires verifying the new email the same way.',
            'Mark <b>attendance</b> (present / half / absent); salary is earned per present day and tracked in the staff <b>wallet</b>.',
            'Record salary payments (Cash or Bank) and email a <b>payslip</b>. Staff can log in and see their own <b>wallet &amp; month-wise passbook statement</b>.',
        ],
    ],
    [
        'id'    => 'scanner',
        'title' => 'Phone Scanner',
        'sub'   => 'Use your phone as a barcode scanner.',
        'steps' => [
            'Open the Phone Scanner page, scan the QR with your phone to pair, then scan product barcodes with the phone camera. They appear on the billing screen instantly.',
            'The <b>Nexcod POS Android app</b> has the scanner built in. No browser needed, and it works even without logging in.',
        ],
    ],
    [
        'id'    => 'app',
        'title' => 'Android App',
        'sub'   => 'Bill, check stock and take payments from your phone.',
        'steps' => [
            'Install the Nexcod POS app and sign in with your <b>phone number</b>. A code arrives on WhatsApp, or by e-mail if you prefer. Staff sign in the same way. There is also <b>Use Scanner Only</b>, which needs no login at all.',
            '<b>You can bill from the app.</b> It is no longer view-only: make a bill, take a payment against a customer\'s dues, and add a product. Everything the counter machine does that a phone sensibly can.',
            '<b>Home</b> shows the day: takings, bills, profit, what you are owed and what you owe, and a week of sales. Tapping any of those numbers opens the list behind it.',
            '<b>Stock</b> has filters for Low, Out, Expiring and Expired with the count on each, and shows the batch that expires first rather than a date off the product.',
            '<b>Customers</b> lists who owes you and how long they have owed it, and each one opens a full ledger: every bill and every payment with the balance carried forward.',
            '<b>Books</b> shows profit for today, this month or the year, cash and bank, and opens the full Profit &amp; Loss, Balance Sheet and Day Book.',
            'Website pages opened from the app no longer ask you to log in a second time.',
            'Which sections appear is decided by the server, so new features arrive without waiting for an app update, and anything switched off for your shop simply is not there.',
            '<b>Staff attendance:</b> staff open the app, take a photo with the store visible behind them, choose Full or Half day, and submit. The day is added to their salary only after the owner <b>approves</b> it.',
            '<b>Owner controls:</b> tap a staff member to approve or reject their attendance, mark today\'s attendance yourself if they forgot, filter attendance by date, edit their details, set a new password, enable/disable or remove them. The staff member gets an email and an app notification for every action.',
            '<b>Staff passwords:</b> staff have no "forgot password", the owner sets a new one from the app and shares it, so a lost email can never be used to take over the account.',
            '<b>Send a bill on WhatsApp:</b> open any bill in the app and tap the WhatsApp button, the customer receives a thank-you message with a link to view, download or print the bill as a PDF.',
            'Notifications for attendance, salary and stock alerts reach the phone even when the app is closed.',
        ],
    ],
    [
        'id'    => 'backup',
        'title' => 'Backup & Data Safety',
        'sub'   => 'Never lose your data.',
        'steps' => [
            'Your data lives securely in the cloud. From Settings you can <b>export a full data backup</b> anytime.',
            'Connect <b>Google Drive</b> in Settings for automatic weekly backups to your own Drive.',
        ],
    ],
    [
        'id'    => 'settings',
        'title' => 'Settings',
        'sub'   => 'Store, tax, invoice & branding.',
        'steps' => [
            'Set store details, logo, GST type, invoice theme &amp; paper size, and the &ldquo;Block sale of expired stock&rdquo; option.',
            'Manage bill branding and view your software version &amp; copyright at the bottom of the page.',
        ],
    ],
    [
        'id'    => 'po',
        'title' => 'Purchase Orders',
        'sub'   => 'Ask the supplier for what you are short of.',
        'steps' => [
            'Open <b>Purchase &rsaquo; Purchase Orders</b> to write down what you want to order before the supplier arrives.',
            'The software can fill the order from what has fallen below your minimum stock level, so nothing that sells is forgotten.',
            'Once the goods arrive, turn the order into a Purchase Entry instead of typing every line a second time.',
        ],
    ],
    [
        'id'    => 'batchrep',
        'title' => 'Batch-wise Stock',
        'sub'   => 'Every batch on its own line.',
        'steps' => [
            'Open <b>Purchase &rsaquo; Batch-wise Stock</b> to see each batch separately with its own expiry, quantity and purchase rate.',
            'Use it before returning goods to a supplier. You need the batch number and its expiry to claim a credit note.',
            'The normal Inventory page adds all batches of a medicine together; this one keeps them apart.',
        ],
    ],
    [
        'id'    => 'reconcile',
        'title' => 'Stock Check',
        'sub'   => 'When the shelf and the screen disagree.',
        'steps' => [
            'Open <b>Inventory &rsaquo; Stock Check</b>, count what is actually on the shelf, and enter that figure.',
            'The software shows the difference and, once you confirm it, corrects the stock and keeps a record of the correction.',
            'Do this for fast-moving items every month. A wrong stock figure quietly becomes a wrong profit figure.',
        ],
    ],
    [
        'id'    => 'masters',
        'title' => 'Brands & Drug Categories',
        'sub'   => 'The lists behind the medicine names.',
        'steps' => [
            '<b>Inventory &rsaquo; Brands</b> keeps your company list (Cipla, Sun, Mankind and the rest) so a medicine is filed under the right maker.',
            '<b>Inventory &rsaquo; Drug Categories</b> keeps the category and the schedule type, which is what marks a medicine as Schedule H or H1.',
            'Fill these once. After that they appear as a dropdown everywhere a medicine is added, so two people spell the same company the same way.',
        ],
    ],
    [
        'id'    => 'docs',
        'title' => 'Store Documents',
        'sub'   => 'Your licences, kept where you can find them.',
        'steps' => [
            'Open <b>Accounts &rsaquo; Store Documents</b> and upload your drug licence, GST certificate, shop agreement and anything else you are asked for at inspection.',
            'Enter the expiry date with each one and the software warns you before it runs out.',
            'A drug licence that lapses closes a shop. This is the page that stops that from happening quietly.',
        ],
    ],
    [
        'id'    => 'activity',
        'title' => 'Activity Log',
        'sub'   => 'What was done, and when.',
        'steps' => [
            'Open <b>More &rsaquo; Activity Log</b> to see the actions taken in your store with the date and time of each.',
            'Useful when a bill was edited or deleted and nobody remembers who did it or why.',
            'Owners see the whole store. A staff member sees only their own work.',
        ],
    ],
    [
        'id'    => 'sellonline',
        'title' => 'Sell Online',
        'sub'   => 'Your counter stock, on a customer’s phone.',
        'steps' => [
            'Open the <b>Sell Online</b> link in the menu to put your shop on Nexcod Pharmacy, where nearby customers can order from you.',
            'It reads the stock you already keep for billing, so there is no second list to maintain.',
            'Orders come back into the same software and are billed the way a counter sale is billed.',
        ],
    ],
    [
        'id'    => 'shortcuts',
        'title' => 'Keyboard Shortcuts',
        'sub'   => 'Work faster.',
        'steps' => [
            'Press the <b>keyboard button in the top bar</b> to see the whole list at any time, or <kbd>?</kbd> from anywhere, and <kbd>Esc</kbd> to close it.',
            'To move between screens hold <b>Alt</b> and press a number: <kbd>Alt+1</kbd> Dashboard &middot; <kbd>Alt+2</kbd> Billing &middot; <kbd>Alt+3</kbd> Inventory &middot; <kbd>Alt+4</kbd> Invoices &middot; <kbd>Alt+5</kbd> Customers &middot; <kbd>Alt+6</kbd> Purchase Entry &middot; <kbd>Alt+7</kbd> Suppliers &middot; <kbd>Alt+8</kbd> Reports &middot; <kbd>Alt+9</kbd> Books.',
            'These work with the cursor anywhere, including inside the search box, which on the billing screen is where it always is.',
            'Most screens also answer to <b>Alt</b> and their first letter: <kbd>Alt+B</kbd> Billing, <kbd>Alt+I</kbd> Inventory, <kbd>Alt+C</kbd> Customers, <kbd>Alt+R</kbd> Reports, <kbd>Alt+U</kbd> Suppliers. <kbd>Alt+D</kbd>, <kbd>Alt+E</kbd> and <kbd>Alt+V</kbd> are taken by the browser itself. That is why the numbers exist.',
            'On any page: <kbd>/</kbd> jumps to the search box &middot; <kbd>Alt+N</kbd> New/Add &middot; <kbd>Alt+S</kbd> Save &middot; <kbd>Alt+P</kbd> Print.',
            'On the billing screen, <kbd>F1</kbd> opens the <b>Rate desk</b>: search any medicine and see what every distributor actually charged for it: the billed rate, the scheme, the discount, and the <b>flat rate</b> that comes out of all three, per pack and per tablet. It also shows what you make at your selling price and the rate you break even at, so you can quote a bulk customer a price with a rupee in it. <kbd>F2</kbd> jumps to the search box, <kbd>F9</kbd> saves the bill.',
        ],
    ],
    [
        'id'    => 'plans',
        'title' => 'Plans & Support',
        'sub'   => 'Upgrade and get help.',
        'steps' => [
            'See your current plan and upgrade under <b>More &rsaquo; Plan</b>.',
            'Need help? Use <b>More &rsaquo; Support</b> or the contact details there.',
        ],
    ],
];

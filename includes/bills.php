<?php
/**
 * Find My Bills: a customer gets the bills shops made out to their e-mail address.
 *
 * The bills live in the billing software's database, which this site does not have.
 * These two functions are where the page hands over to it. Until they are wired to the
 * software they return failure, and the page tells the customer the service is not
 * available rather than pretending a code was sent.
 */

/** E-mails a one-time code to $email if any bill carries that address. */
function bills_send_code(string $email): bool
{
    return false;
}

/** Checks the code. Returns the URL of the customer's bill list, or null if it is wrong. */
function bills_check_code(string $email, string $code): ?string
{
    return null;
}

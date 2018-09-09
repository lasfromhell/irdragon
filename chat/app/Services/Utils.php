<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 09.09.2018
 * Time: 21:03
 */

namespace App\Services;


class Utils
{
    public static function generateGuid() {
        if (function_exists('com_create_guid') === true)
        {
            return trim(com_create_guid(), '{}');
        }
        return  bin2hex(openssl_random_pseudo_bytes(4)) . '-' . bin2hex(openssl_random_pseudo_bytes(2)) . '-' . bin2hex(openssl_random_pseudo_bytes(2)) .
            '-' . bin2hex(openssl_random_pseudo_bytes(2)) . '-' . bin2hex(openssl_random_pseudo_bytes(6));
    }
}
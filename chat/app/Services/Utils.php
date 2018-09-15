<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 09.09.2018
 * Time: 21:03
 */

namespace App\Services;


use Mobile_Detect;

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

    public static function detectDeviceType($userAgent) {
        $detect = new Mobile_Detect();
        $deviceType = 'desktop';
        if ($detect->is('AndroidOS', $userAgent)) {
            $deviceType = 'android';
        }
        else if ($detect->is('iOS', $userAgent)) {
            if ($detect->is('iPhone', $userAgent)) {
                $deviceType = 'iphone';
            }
            else if ($detect->is('iPad', $userAgent)) {
                $deviceType = 'ipad';
            }
        }
        else if ($detect->isMobile($userAgent)) {
            $deviceType = 'mobile';
        }
        else if ($detect->isTablet($userAgent)) {
            $deviceType = 'tablet';
        }
        return $deviceType;
    }
}
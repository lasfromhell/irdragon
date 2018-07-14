<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 02.07.2018
 * Time: 22:28
 */

namespace App\Services;

class ResponseUtils
{
    public static function buildErrorResponse(string $message, string $code, int $httpCode) {
        return response()->json(['error' => $message, 'code' => $code], $httpCode);
    }

    public static function buildEmptyOkResponse() {
        return response('', 200);
    }

    public static function buildUnauthorized() {
        return response('', 401);
    }

    public static function buildAccessDenied()
    {
        return response('', 403);
    }
}
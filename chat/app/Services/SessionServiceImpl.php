<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 18:44
 */

namespace App\Services;


use App\Contracts\CacheService;
use App\Contracts\SessionService;

class SessionServiceImpl implements SessionService
{
    const TOKEN = 'token_';
    protected $cacheService;

    const TTL = 300;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }


    private function combineSessionKey($token) {
        return self::TOKEN . $token;
    }

    public function fetchData($token) {
        return json_decode($this->cacheService->get($this->combineSessionKey($token)));
    }

    public function storeData($token, $userData) {
        $this->cacheService->set($this->combineSessionKey($token), json_encode($userData), self::TTL);
    }

    public function updateTTL($token) {
        $this->cacheService->touch($this->combineSessionKey($token), self::TTL);
    }

    public function generateToken(): string {
        do {
            $token = bin2hex(random_bytes(128));
        } while ($this->cacheService->exists($token));
        return $token;
    }
}
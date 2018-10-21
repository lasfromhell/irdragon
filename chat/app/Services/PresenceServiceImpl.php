<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 16.07.2018
 * Time: 21:51
 */

namespace App\Services;


use App\Contracts\CacheService;
use App\Contracts\PresenceService;
use App\Http\Models\PresenceItem;
use DateInterval;
use Illuminate\Support\Carbon;

class PresenceServiceImpl implements PresenceService
{
    protected $cacheService;
    protected $LATEST_TTL;

    const PRESENCE = 'presence_';
    const PRESENCE_ACTION = 'presence_action';

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
        $this->LATEST_TTL = new DateInterval("P14D");
    }

    public function updateOnlineDate($userId, $displayName, $device) {
        $key = self::PRESENCE . $userId;
        $this->cacheService->mutex($key)->synchronized(function () use ($userId, $displayName, $device, $key) {
            $this->cacheService->set($key, new PresenceItem(Carbon::now()->timestamp, $displayName, $device), $this->LATEST_TTL);
        });
    }

    public function getOnlineDate($userId) {
        $key = self::PRESENCE . $userId;
        $result = null;
        $this->cacheService->mutex($key)->synchronized(function () use ($userId, $key, &$result) {
            $result = $this->cacheService->get(self::PRESENCE . $userId);
        });
        return $result;
    }

    public function updateActionDate($userId, $displayName, $device) {
        $key = self::PRESENCE_ACTION . $userId;
        $this->cacheService->mutex($key)->synchronized(function () use ($userId, $displayName, $device, $key) {
            $this->cacheService->set($key, new PresenceItem(Carbon::now()->timestamp, $displayName, $device), $this->LATEST_TTL);
        });
    }

    public function getActionDate($userId) {
        $key = self::PRESENCE_ACTION . $userId;
        $result = null;
        $this->cacheService->mutex($key)->synchronized(function () use ($userId, $key, &$result) {
            $result = $this->cacheService->get(self::PRESENCE_ACTION . $userId);
        });
        return $result;
    }
}
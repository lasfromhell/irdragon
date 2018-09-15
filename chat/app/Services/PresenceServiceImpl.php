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
        $this->cacheService->set(self::PRESENCE . $userId, new PresenceItem(Carbon::now()->timestamp, $displayName, $device), $this->LATEST_TTL);
    }

    public function getOnlineDate($userId) {
        return $this->cacheService->get(self::PRESENCE . $userId);
    }

    public function updateActionDate($userId, $displayName, $device) {
        $this->cacheService->set(self::PRESENCE_ACTION . $userId, new PresenceItem(Carbon::now()->timestamp, $displayName, $device), $this->LATEST_TTL);
    }

    public function getActionDate($userId) {
        return $this->cacheService->get(self::PRESENCE_ACTION . $userId);
    }
}
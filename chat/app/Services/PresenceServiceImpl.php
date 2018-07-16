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
use App\Http\Models\PresenceData;
use DateInterval;
use Illuminate\Support\Carbon;

class PresenceServiceImpl implements PresenceService
{
    protected $cacheService;
    protected $LATEST_TTL;

    const PRESENCE = 'presence_';

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
        $this->LATEST_TTL = new DateInterval("P14D");
    }

    public function updateOnlineDate($userId, $displayName) {
        $this->cacheService->set(self::PRESENCE . $userId, new PresenceData(Carbon::now()->timestamp, $displayName), $this->LATEST_TTL);
    }

    public function getOnlineDate($userId) {
        return $this->cacheService->get(self::PRESENCE . $userId);
    }
}
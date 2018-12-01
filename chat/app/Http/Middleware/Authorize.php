<?php

namespace App\Http\Middleware;

use App\Contracts\CacheService;
use App\Contracts\NotificationService;
use App\Contracts\PresenceService;
use App\Contracts\SessionService;
use App\Contracts\UserService;
use App\Services\ResponseUtils;
use App\Services\Utils;
use Carbon\Carbon;
use Closure;
use Illuminate\Support\Facades\Log;

class Authorize
{
    protected $sessionService;
    protected $presenceService;
    protected $cacheService;

    const NOTIFICATION_PRESENCE_DIFF = 30;
    /**
     * @var NotificationService
     */
    private $notificationService;
    /**
     * @var UserService
     */
    private $userService;

    public function __construct(SessionService $sessionService, PresenceService $presenceService, CacheService $cacheService,
        NotificationService $notificationService, UserService $userService)
    {
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
        $this->cacheService = $cacheService;
        $this->notificationService = $notificationService;
        $this->userService = $userService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string|null  $guard
     * @return mixed
     */
    public function handle($request, Closure $next, $guard = null)
    {
        $token = $request->cookie('token');
        $token = $token ?? $request->header('Authentication-Token');
        $token = $token ?? $request->json('token');
        $token = $token ?? $request->input('token');
        $token = $token ?? $request->cookie('token');
        if (isset($token)) {
            $userData = null;
            $this->cacheService->mutex($token)->synchronized(function() use ($token, &$userData) {
                $userData = $this->sessionService->fetchData($token);
                if (isset($userData)) {
                    $this->sessionService->updateTTL($token);
                }
            });
            if ($userData) {
                $item = $this->presenceService->getOnlineDate($userData->id);
                try {
                    if (!$item || (Carbon::now()->timestamp - $item->activityDate > self::NOTIFICATION_PRESENCE_DIFF)) {
                        $this->userService->getUserChats($userData->id)->each(function($uc) use ($userData) {
                            $this->notificationService->sendNotification($userData->id, $uc->chat_id, NotificationService::PRESENCE, 'User ' . $userData->displayName . ' online');
                        });
                    }
                } catch (\Throwable $t) {
                    Log::error("Unable to send presence online notification " . $t);
                }
                $this->presenceService->updateOnlineDate($userData->id, $userData->displayName, Utils::detectDeviceType($request->userAgent()));
                $request->merge(['user' => $userData ]);
                $request->setUserResolver(function () use ($userData) {
                    return $userData;
                });
                return $next($request);
            }
            else {
                $this->cacheService->dmutex_file($token);
            }
        }
        return ResponseUtils::buildUnauthorized();
    }
}

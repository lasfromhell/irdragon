<?php

namespace App\Http\Middleware;

use App\Contracts\CacheService;
use App\Contracts\PresenceService;
use App\Contracts\SessionService;
use App\Services\ResponseUtils;
use App\Services\Utils;
use Closure;

class Authorize
{
    protected $sessionService;
    protected $presenceService;
    protected $cacheService;

    public function __construct(SessionService $sessionService, PresenceService $presenceService, CacheService $cacheService)
    {
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
        $this->cacheService = $cacheService;
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

<?php

namespace App\Http\Middleware;

use App\Contracts\PresenceService;
use App\Contracts\SessionService;
use App\Services\ResponseUtils;
use Closure;

class Authorize
{
    protected $sessionService;
    protected $presenceService;

    public function __construct(SessionService $sessionService, PresenceService $presenceService)
    {
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
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
        $token = $request->header('Authentication-Token');
        $token = $token ?? $request->json('token');
        $token = $token ?? $request->input('token');
        $token = $token ?? $request->cookie('token');
        if (isset($token)) {
            $userData = $this->sessionService->fetchData($token);
            if (isset($userData)) {
                $this->presenceService->updateOnlineDate($userData->id, $userData->displayName);
                $this->sessionService->updateTTL($token);
                $request->merge(['user' => $userData ]);
                $request->setUserResolver(function () use ($userData) {
                    return $userData;
                });
                return $next($request);
            }
        }
        return ResponseUtils::buildUnauthorized();
    }
}

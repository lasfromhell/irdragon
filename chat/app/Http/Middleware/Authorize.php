<?php

namespace App\Http\Middleware;

use App\Contracts\SessionService;
use App\Services\ResponseUtils;
use Closure;

class Authorize
{
    protected $sessionService;

    public function __construct(SessionService $sessionService)
    {
        $this->sessionService = $sessionService;
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
        if (isset($token)) {
            $userData = $this->sessionService->fetchData($token);
            if (isset($userData)) {
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

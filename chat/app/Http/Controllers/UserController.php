<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 01.07.2018
 * Time: 23:24
 */

namespace App\Http\Controllers;

use App\Contracts\PresenceService;
use App\Contracts\SessionService;
use App\Contracts\UserService;
use App\Http\Models\UserData;
use App\Services\ResponseUtils;
use App\Services\Utils;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Cookie;

class UserController extends Controller
{
    protected $userService;
    protected $sessionService;
    protected $presenceService;

    public function __construct(UserService $userService, SessionService $sessionService, PresenceService $presenceService) {
        $this->userService = $userService;
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
    }

    public function encodePassword(Request $request) {
        $plain_password = $request->json()->get('plain_password');
        if (!isset($plain_password)) {
            return ResponseUtils::buildErrorResponse('Need to specify plain_password', 0, 404);
        }
        $encoded_password = password_hash($plain_password, PASSWORD_BCRYPT);
        return response()->json(['result' => $encoded_password], 200);
    }

    public function authenticate(Request $request) {
        try {
            $this->validate($request, [
                'login' => 'required',
                'password' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        $data = json_decode($request->getContent());
        $user = $this->userService->getUserByLoginWithChats($data->login);
        $isOk = false;
        if (isset($user)) {
            $isOk = password_verify($data->password, $user->password);
        }
        $this->userService->registerLoginAttempt($data->login, $isOk);
        if ($isOk) {
            try {
                $token = $this->sessionService->generateToken();
            } catch (\Exception $e) {
                return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 500);
            }
            $userData = new UserData();
            $userData->login = $user->login;
            $userData->displayName = $user->display_name;
            $userData->id = $user->id;
            $userData->token = $token;
            $userData->chats = $user->chats()->get()->map(function ($userChat) {
                return $userChat->chat_id;
            })->toArray();
            $this->sessionService->storeData($token, $userData);
            $response = new Response();
            if ($data->rememberCookie) {
//                $response->withCookie(new Cookie('token', $token, 300));
                $response->withCookie(new Cookie('token', $token, time() + (3600 * 128), '/',  null, false, false));
            }
            return $response->setContent(json_encode($userData));
        }
        else {
            return response("Wrong login or password", 401);
        }
    }

    public function authorizeRequest(Request $request) {
        return response()->json($request->user(), 200);
    }

    public function logout(Request $request) {
        $this->sessionService->removeToken($request->user()->token);
        return ResponseUtils::buildEmptyOkResponse();
    }

    public function userAction(Request $request) {
        $userData = $request->user();
        $this->presenceService->updateActionDate($userData->id, $userData->displayName, Utils::detectDeviceType($request->userAgent()));
    }
}
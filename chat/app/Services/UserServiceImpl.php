<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 18:35
 */

namespace App\Services;


use App\Contracts\CacheService;
use App\Contracts\UserService;
use App\User;
use App\UserChatACL;
use Illuminate\Support\Collection;

class UserServiceImpl implements UserService
{
    const USER_PREFIX = 'user_';
    private $cacheService;

    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }


    public function getUserById($id) {
        $user = $this->cacheService->get(self::USER_PREFIX . $id);
        if (isset($user)) {
            return $user;
        }
        $user = User::find($id);
        if (isset($user)) {
            $this->cacheService->set(self::USER_PREFIX . $id, $user, 30);
        }
        return $user;
    }

    public function getUserByLoginWithChats($login) {
        return User::with('chats')->where('login', $login)->first();
    }

    public function getUserChats($userId) : Collection {
        return UserChatACL::where('user_id', $userId)->get();
    }
}
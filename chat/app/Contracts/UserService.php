<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 18:35
 */

namespace App\Contracts;

use Illuminate\Support\Collection;

interface UserService
{
    public function getUserByLoginWithChats($login);
    public function getUserChats($userId) : Collection;
    public function getUserById($id);
    public function registerLoginAttempt($login, $success);
    public function getChatUsers($chatId) : Collection;
}
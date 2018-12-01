<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 28.10.2018
 * Time: 14:07
 */

namespace App\Contracts;

interface NotificationService {

    public const MESSAGE = 'message';
    public const PRESENCE = 'presence';

    public function addUserNotification($userId, int $chatId, $type, $subscription, string $device);

    public function removeUserNotification($userId, int $chatId, $type, $subscription);

    public function getUserNotificationTypes($userId, int $chatId, $subscription);

    public function sendNotification($userId, int $chatId, $type, $payload);
}
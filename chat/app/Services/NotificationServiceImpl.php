<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 28.10.2018
 * Time: 14:08
 */

namespace App\Services;

use App\Contracts\NotificationService;
use App\DB\UserNotification;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class NotificationServiceImpl implements NotificationService
{

    public function addUserNotification($userId, int $chatId, $type, $subscription, string $device)
    {
        $userNotification = new UserNotification();
        $userNotification->fill(['user_id' => $userId, 'chat_id' => $chatId, 'type' => $type,
            'device' => $device, 'subscription' => json_encode($subscription)]);
        $userNotification->saveOrFail();
        return $userNotification;
    }

    public function removeUserNotification($userId, int $chatId, $type, $subscription)
    {
        UserNotification::where('user_id', $userId)->where('chat_id', $chatId)->where('type', $type)
            ->where('subscription', json_encode($subscription))->delete();
    }

    public function getUserNotificationTypes($userId, int $chatId, $subscription)
    {
        return UserNotification::where('user_id', $userId)->where('chat_id', $chatId)->where('subscription', json_encode($subscription))
            ->get()->map(function($s) {
                return $s->type;
            })->values()->toArray();
    }

    /**
     * @param $userId
     * @param int $chatId
     * @param $type
     * @param $payload
     * @throws \ErrorException
     */
    public function sendNotification($userId, int $chatId, $type, $payload) {
        $webPush = new WebPush(
            ['VAPID' => [
                'subject' => 'https://irdragon.ru',
                'publicKey' => 'BLJ5g_bxh4jpJ0rjRlqI8qc974JEaA5--BWdor0QRlSNflw5e9DcIfL2RAE54BY3YWQCv_t_SFhszjWw5c-QWOU',
                'privateKey' => 'T8MQpBqZRXY2AY1YIaBUz_pJ6XEMJFVBjIjFRETgJ4o'
            ]]);
        UserNotification::where('chat_id', $chatId)->where('type', $type)
            ->get()->filter(function($s) use ($userId) {
                return $s->user_id != $userId;
            })->each(function($s) use ($webPush, $payload) {
                $subObject = json_decode($s->subscription);
                $subscription = Subscription::create(['publicKey' => $subObject->keys->p256dh, 'authToken' => $subObject->keys->auth, 'endpoint' => $subObject->endpoint]);
                $webPush->sendNotification($subscription, $payload);
            });
        $webPush->flush();
    }
}
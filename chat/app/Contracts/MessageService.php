<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 20:07
 */

namespace App\Contracts;


interface MessageService
{
    public function getLastMessagesAfterDB($chatId, $userId, $initId = -1, $limit = 100);
    public function getLatestMessages($chatId, $userId, $messagesCount = 10);
//    public function getLatestMessages($chatId, $messagesCount);
//    public function getMessagesAfter($chatId, $iidAfter);
//    public function getMessage($chatId, $iid);
    public function addMessage($data, $userId, $chatId, $device);
    public function getLastMessagesBeforeDB($chatId, $userId, $initId, $limit = 10);

    public function typingStarted($userId, $chatId);
    public function typingFinished($userId, $chatId);
    public function typingProgress($userId, $chatId);

    public function setLastReadMessage(int $chatId, int $userId, int $messageId);
}
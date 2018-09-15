<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 20:07
 */

namespace App\Services;

use App\Contracts\CacheService;
use App\Contracts\MessageService;
use App\Contracts\UserService;
use App\DB\UserChatACL;
use App\Http\Models\MessageBlockData;
use App\Http\Models\MessageData;
use App\DB\Message;
use App\Http\Models\TypingData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;

class MessageServiceImpl implements MessageService
{
    private $userService;
    private $cacheService;
    const TYPING_PREFIX = 'user_typing_';
//    protected $LATEST_TTL;

    const TYPING_TTL = 5;

    public function __construct(
        UserService $userService, CacheService $cacheService
    ) {
        $this->userService = $userService;
        $this->cacheService = $cacheService;
//        $this->LATEST_TTL = new DateInterval("P10Y");
    }

    public function getLastMessagesAfterDB($chatId, $userId, $initId = -1, $limit = 100) {
        return $this->toMessageBlockData(Message::where('chat_id', $chatId)->where('id', '>', $initId)->take($limit)->get()->map([$this, 'toMessageData'])->values()->toArray(),
            $chatId, $userId);
    }

    public function getLatestMessages($chatId, $userId, $messagesCount = 10) {
        return $this->toMessageBlockData(Message::where('chat_id', $chatId)->orderBy('id', 'desc')->take($messagesCount)->get()->reverse()
            ->map([$this, 'toMessageData'])->values()->toArray(), $chatId, $userId);
    }

    public function getLastMessagesBeforeDB($chatId, $userId, $initId, $limit = 10) {
        return $this->toMessageBlockData(Message::where('chat_id', $chatId)->where('id', '<', $initId)->orderBy('id', 'desc')->take($limit)->get()->reverse()
            ->map([$this, 'toMessageData'])->values()->toArray(), $chatId, $userId);
    }

    public function addMessage($data, $userId, $chatId, $device) {
        $message = new Message();
        $message->fill(['data' => $data, 'from' => $userId, 'from_date' => Carbon::now(),
            'read' => false, 'chat_id' => $chatId, 'fake' => false, 'private' => true, 'device' => $device]);
        $message->saveOrFail();
        return $message->id;
    }

//    public function getLatestMessages($chatId, $messagesCount)
//    {
//        $msgArray = array();
//        $latestIID = null;
//        $this->cacheService->mutex($this->getLatestMessageIIDVarname($chatId))->check(function() use ($chatId, $messagesCount, &$checkValue, &$latestIID) {
//            $latestIID = $this->getLatestMessageIID($chatId);
//            return !isset($latestIID);
//        })->then(function() use ($chatId, $messagesCount, $latestIID, &$msgArray) {
//            $messages = Message::where('chat_id', $chatId)->orderBy('id', 'desc')->take($messagesCount)->get()->reverse();
//            $currentId = 0;
//            foreach ($messages as $message) {
//                $messageData = $this->toMessageData($message, $currentId);
//                $msgArray[] = $messageData;
//                $this->addMessageDataWithIID($chatId, $currentId++, $messageData);
//            }
//            $this->cacheService->set($this->getLatestMessageIIDVarname($chatId), count($msgArray)-1, $this->LATEST_TTL);
//        });
//        if (isset($latestIID)) {
//            for ($i = max(0, $latestIID - $messagesCount + 1); $i <= $latestIID; $i++) {
//                $msgArray[] = $this->getMessage($chatId, $i);
//            }
//        }
//        return $msgArray;
//    }

//    public function getMessage($chatId, $iid) {
//        return $this->cacheService->get('message_' . $chatId . '_' . $iid);
//    }
//
//    public function getMessagesAfter($chatId, $iidAfter) {
//        $msg_array = array();
//        $latestIid = $this->getLatestMessageIID($chatId);
//        for ($i = $iidAfter + 1; $i <= $latestIid; $i++) {
//            $msg_array[] = $this->getMessage($chatId, $i);
//        }
//        return $msg_array;
//    }
//
//    public function addMessage($chatId, $message) {
//        $this->cacheService->mutex($this->getLatestMessageIIDVarname($chatId), function() use ($chatId, $message) {
//            $latestIid = $this->getLatestMessageIID($chatId);
//            if (!isset($latestIid)) {
//                $latestIid = -1;
//            }
//            $latestIid++;
//            $this->cacheService->set($this->getLatestMessageIIDVarname($chatId), $latestIid++, $this->LATEST_TTL);
//            $messageData = $this->toMessageData($message,  $latestIid);
//            $this->addMessageDataWithIID($chatId, $latestIid, $messageData);
//        });

//        $messageData = $this->toMessageData($message);
//        do {
//            $latestIid = $this->getLatestMessageIID($chatId);
//            if (!isset($latestIid)) {
//                $latestIid = -1;
//            }
//        } while (!$this->addMessageDataWithIID($chatId, $latestIid + 1, $messageData));
//        if ($latestIid == -1) {
//            apcu_add($this->getLatestMessageIIDVarname($chatId), 0);
//        }
//        apcu_inc($this->getLatestMessageIIDVarname($chatId));
//    }
//
//    private function getLatestMessageIID($chatId) {
//        return $this->cacheService->get($this->getLatestMessageIIDVarname($chatId));
//    }
//
//    private function getLatestMessageIIDVarname($chatId) {
//        return 'message_' . $chatId . '_latest_iid';
//    }
//
    public function toMessageData($message) {
        $messageData = new MessageData();
        $messageData->message = $message->data;
        $messageData->from = $this->userService->getUserById($message->from)->display_name;
        $messageData->date = $message->from_date->timestamp;
        $messageData->id = $message->id;
        $messageData->fromId = $message->from;
        $messageData->device = $message->device;
        return $messageData;
    }
//
//    private function addMessageDataWithIID($chatId, $iid, $messageData) {
//        $this->cacheService->set('message_' . $chatId . '_' . $iid, $messageData, $this->LATEST_TTL);
//    }


    public function typingStarted($userId, $chatId) {
        $typingData = new TypingData();
        $typingData->displayName = $this->userService->getUserById($userId)->display_name;
        $typingData->userId = $userId;
        $this->cacheService->set($this->constructTypingKey($chatId), $typingData, self::TYPING_TTL);
    }

    public function typingFinished($userId, $chatId) {
        $this->cacheService->delete($this->constructTypingKey($chatId));
    }

    public function toMessageBlockData($messages, $chatId, $userId) {
        $messageBlockData = new MessageBlockData();
        $messageBlockData->messages = $messages;
        $typingKey = $this->constructTypingKey($chatId);
        $messageBlockData->typing = $this->cacheService->get($typingKey);
        $messageBlockData->last_read_message = UserChatACL::where('chat_id', $chatId)->where('user_id', $userId)->first()->last_read_message;
        return $messageBlockData;
    }

    private function constructTypingKey($chatId) {
        return self::TYPING_PREFIX . $chatId;
    }

    public function typingProgress($userId, $chatId) {
        $this->cacheService->touch($this->constructTypingKey($chatId), self::TYPING_TTL);
    }

    public function setLastReadMessage(int $chatId, int $userId, int $messageId) {
        UserChatACL::where('chat_id', $chatId)->where('user_id', $userId)->update(array('last_read_message' => $messageId));
    }
}
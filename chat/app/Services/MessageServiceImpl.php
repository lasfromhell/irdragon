<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 20:07
 */

namespace App\Services;

use App\Contracts\MessageService;
use App\Contracts\UserService;
use App\Http\Models\MessageData;
use App\Message;
use Illuminate\Support\Carbon;

class MessageServiceImpl implements MessageService
{
    private $userService;
//    private $cacheService;
//    protected $LATEST_TTL;

    public function __construct(
        UserService $userService
// ,CacheService $cacheService
    ) {
        $this->userService = $userService;
//        $this->cacheService = $cacheService;
//        $this->LATEST_TTL = new DateInterval("P10Y");
    }

    public function getLastMessagesAfterDB($chatId, $initId = -1, $limit = 100) {
        return Message::where('chat_id', $chatId)->where('id', '>', $initId)->take($limit)->get()->map([$this, 'toMessageData'])->values()->toArray();
    }

    public function getLatestMessages($chatId, $messagesCount = 10) {
        return Message::where('chat_id', $chatId)->orderBy('id', 'desc')->take($messagesCount)->get()->reverse()
            ->map([$this, 'toMessageData'])->values()->toArray();
    }

    public function getLastMessagesBeforeDB($chatId, $initId, $limit = 10) {
        return Message::where('chat_id', $chatId)->where('id', '<', $initId)->orderBy('id', 'desc')->take($limit)->get()->reverse()
            ->map([$this, 'toMessageData'])->values()->toArray();
    }

    public function addMessage($data, $userId, $chatId) {
        $message = new Message();
        $message->fill(['data' => $data, 'from' => $userId, 'from_date' => Carbon::now(),
            'read' => false, 'chat_id' => $chatId, 'fake' => false, 'private' => true]);
        $message->saveOrFail();
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
        $messageData->date = $message->from_date;
        $messageData->id = $message->id;
        return $messageData;
    }
//
//    private function addMessageDataWithIID($chatId, $iid, $messageData) {
//        $this->cacheService->set('message_' . $chatId . '_' . $iid, $messageData, $this->LATEST_TTL);
//    }
}
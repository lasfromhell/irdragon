<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 02.07.2018
 * Time: 22:13
 */

namespace App\Http\Controllers;

use App\Contracts\MessageService;
use App\Contracts\PresenceService;
use App\Contracts\SessionService;
use App\Contracts\UserService;
use App\Http\Models\PresenceData;
use App\Http\Models\SendMessageData;
use App\Services\ResponseUtils;
use App\Services\Utils;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChatController extends Controller
{
    protected $userService;
    protected $messageService;
    protected $sessionService;
    protected $presenceService;

    function __construct(UserService $userService, MessageService $messageService, SessionService $sessionService,
                         PresenceService $presenceService)
    {
        $this->userService = $userService;
        $this->messageService = $messageService;
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
    }

    public function sendMessage(int $chatId, Request $request) {
        try {
            $this->validate($request, [
                'data' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        $data = $request::capture()->json()->get('data');
        $device = Utils::detectDeviceType($request->userAgent());
        try {
            $messageId = $this->messageService->addMessage($data, $userData->id, $chatId, $device);
        } catch (\Throwable $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        return response()->json(new SendMessageData($messageId, $device));
    }

    public function getLatestMessages(int $chatId, $number, Request $request) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLatestMessages($chatId, $userData->id, $number));
    }

    public function getMessagesAfter(int $chatId, $after, Request $request, $number = 50) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLastMessagesAfterDB($chatId, $userData->id, $after, $number));
    }

    public function getMessagesBefore(int $chatId, $before, Request $request, int $number = 50) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLastMessagesBeforeDB($chatId, $userData->id, $before, $number));
    }

    public function getPresence(int $chatId) {
        $userDates = array();
        $this->userService->getChatUsers($chatId)->each(function($uc) use (&$userDates) {
            $userDates[$uc->user_id] =
                new PresenceData($this->presenceService->getOnlineDate($uc->user_id), $this->presenceService->getActionDate($uc->user_id));
        });
        return response()->json($userDates);
    }

    public function typingStarted(int $chatId, Request $request) {
        $userData = $request->user();
        $this->messageService->typingStarted($userData->id, $chatId);
    }

    public function typingFinished(int $chatId, Request $request) {
        $userData = $request->user();
        $this->messageService->typingFinished($userData->id, $chatId);
    }

    public function typingProgress(int $chatId, Request $request) {
        $userData = $request->user();
        $this->messageService->typingProgress($userData->id, $chatId);
    }

    public function setLastReadMessage(int $chatId, int $messageId, Request $request) {
        $userData = $request->user();
        $this->messageService->setLastReadMessage($chatId, $userData->id, $messageId);
        return ResponseUtils::buildEmptyOkResponse();
    }

    private function checkUserChat($chatId, $userData) {
        return $this->userService->getUserChats($userData->id)->map(function($uc) {
                return $uc->chat_id;
            })->contains($chatId);
    }

//    public function events(Request $request) {
//        try {
//            $this->validate($request, [
//                'chatId' => 'required'
//            ]);
//        } catch (ValidationException $e) {
//            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
//        }
//        $initialMessagesCount = $request->input('initialMessagesCount', 10);
//        return new StreamedResponse(function() use ($request, $initialMessagesCount) {
//            $chatId = $request->input('chatId');
//            $latestIID = -1;
//            $token = $request->user()->token;
//            $messagesData = $this->messageService->getLatestMessages($chatId, $initialMessagesCount);
//            if (count($messagesData) > 0) {
//                echo 'data: ' . json_encode($this->createMessageArrayNotification($messagesData)) . "\n\n";
//                ob_flush();
//                flush();
//                $latestIID = $messagesData[count($messagesData)-1]->getIid();
//            }
//            while (true) {
//                Log::info('Get messages');
//                $this->sessionService->updateTTL($token);
//                $messagesData = $this->messageService->getMessagesAfter($chatId, $latestIID);
//                if (count($messagesData) > 0) {
//                    echo 'data: ' . json_encode($this->createMessageArrayNotification($messagesData)) . "\n\n";
//                    $latestIID = $messagesData[count($messagesData)-1]->getIid();
//                }
//                ob_flush();
//                flush();
//                sleep(1);
//            }
//        }, 200, ['Content-Type' => 'text/event-stream', 'X-Accel-Buffering' => 'no', 'Cache-Control' => 'no-cache']);
//    }

//    private function createMessageArrayNotification($messagesData) {
//        $notification = new NotificationData();
//        $notification->type = NotificationData::NOTIFICATION_MESSAGE_ARRAY;
//        $notification->data = $messagesData;
//        return $notification;
//    }
}
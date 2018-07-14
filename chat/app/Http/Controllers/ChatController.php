<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 02.07.2018
 * Time: 22:13
 */

namespace App\Http\Controllers;

use App\Contracts\MessageService;
use App\Contracts\SessionService;
use App\Contracts\UserService;
use App\Http\Models\NotificationData;
use App\Message;
use App\Services\ResponseUtils;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ChatController extends Controller
{
    protected $userService;
    protected $messageService;
    protected $sessionService;

    function __construct(UserService $userService, MessageService $messageService, SessionService $sessionService)
    {
        $this->userService = $userService;
        $this->messageService = $messageService;
        $this->sessionService = $sessionService;
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
        try {
            $this->messageService->addMessage($data, $userData->id, $chatId);
        } catch (\Throwable $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        return ResponseUtils::buildEmptyOkResponse();
    }

    public function getLatestMessages(int $chatId, $number, Request $request) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLatestMessages($chatId, $number));
    }

    public function getMessagesAfter(int $chatId, $after, Request $request) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLastMessagesAfterDB($chatId, $after));
    }

    public function getMessagesBefore(int $chatId, $before, Request $request) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLastMessagesBeforeDB($chatId, $before));
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
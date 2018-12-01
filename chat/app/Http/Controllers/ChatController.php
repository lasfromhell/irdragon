<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 02.07.2018
 * Time: 22:13
 */

namespace App\Http\Controllers;

use App\Contracts\MessageService;
use App\Contracts\NotificationService;
use App\Contracts\PresenceService;
use App\Contracts\RTCService;
use App\Contracts\SessionService;
use App\Contracts\UserService;
use App\Http\Models\CommunicationData;
use App\Http\Models\PresenceData;
use App\Http\Models\SendMessageData;
use App\Services\ResponseUtils;
use App\Services\Utils;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Mockery\Matcher\Not;

class ChatController extends Controller
{
    protected $userService;
    protected $messageService;
    protected $sessionService;
    protected $presenceService;
    protected $rtcService;
    /**
     * @var NotificationService
     */
    private $notificationService;


    function __construct(UserService $userService, MessageService $messageService, SessionService $sessionService,
                         PresenceService $presenceService, RTCService $rtcService, NotificationService $notificationService)
    {
        $this->userService = $userService;
        $this->messageService = $messageService;
        $this->sessionService = $sessionService;
        $this->presenceService = $presenceService;
        $this->rtcService = $rtcService;
        $this->notificationService = $notificationService;
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
        try {
            $this->notificationService->sendNotification($userData->id, $chatId, NotificationService::MESSAGE, "New message from " . $userData->displayName);
        } catch (\Throwable $e) {
            Log::error('Error while sending push notifications to notification service ' . $e);
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
        $this->userService->getChatUsers($chatId)->each(function($uc) use (&$userDates) {
            $userOnlineDate = $this->presenceService->getOnlineDate($uc->user_id);
            $userActionDate = $this->presenceService->getActionDate($uc->user_id);
            if ($userOnlineDate || $userActionDate) {
                $userDates[$uc->user_id] = new PresenceData($userOnlineDate, $userActionDate);
            }
        });
        return response()->json(new CommunicationData(
            $this->messageService->getLastMessagesAfterDB($chatId, $userData->id, $after, $number),
            $this->rtcService->getCall($chatId, $userData->displayName),
            $userDates
        ));
    }

    public function getMessagesBefore(int $chatId, $before, Request $request, int $number = 50) {
        $userData = $request->user();
        if (!$this->checkUserChat($chatId, $userData)) {
            return ResponseUtils::buildAccessDenied();
        }
        return response()->json($this->messageService->getLastMessagesBeforeDB($chatId, $userData->id, $before, $number));
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

    public function makeRtcCall(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'target' => 'required',
                'sdp' => 'required',
                'type' => 'required',
                'video' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        $callData = $this->rtcService->assignCall($chatId, $request->target, $request->sdp, $request->type, $userData->displayName, $request->video);
        return response()->json(['callId' => $callData->callId]);
    }

    public function answerRtcCall(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'callId' => 'required',
                'sdp' => 'required',
                'type' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }

        if ($this->rtcService->answerCall($chatId, $request->callId, $userData->displayName, $request->sdp, $request->type)) {
            return ResponseUtils::buildEmptyOkResponse();
        }
        else {
            return ResponseUtils::buildErrorResponse('Call not found to answer', 0, 404);
        }
    }

    public function addRtcCandidate(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'callId' => 'required',
                'candidate' => 'required',
                'sdpMid' => 'required',
                'sdpMLineIndex' => 'required',
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        if ($this->rtcService->addCandidate($chatId, $request->callId, $request->candidate, $request->sdpMid, $request->sdpMLineIndex, $userData->displayName)) {
            return ResponseUtils::buildEmptyOkResponse();
        }
        else {
            return ResponseUtils::buildErrorResponse('Call not found to add RTC candidate', 0, 404);
        }
    }

    public function cancelRtcCall(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'callId' => 'required',
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        if ($this->rtcService->cancelCall($chatId, $request->callId, $userData->displayName)) {
            return ResponseUtils::buildEmptyOkResponse();
        }
        else {
            return ResponseUtils::buildErrorResponse('Call not found to cancel', 0, 404);
        }
    }

    public function onRtcCall(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'callId' => 'required',
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        if ($this->rtcService->onCall($chatId, $request->callId, $userData->displayName)) {
            return ResponseUtils::buildEmptyOkResponse();
        }
        else {
            return ResponseUtils::buildErrorResponse('Call not found to set as in progress', 0, 404);
        }
    }

    public function rtcCallHeartBeat(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'callId' => 'required',
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        if ($this->rtcService->heartbeat($chatId, $request->callId, $userData->displayName)) {
            return ResponseUtils::buildEmptyOkResponse();
        }
        else {
            return ResponseUtils::buildErrorResponse('Call not found to set as in progress', 0, 404);
        }
    }

    public function subscribeNotification(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'type' => 'in:' . NotificationService::MESSAGE . ',' . NotificationService::PRESENCE,
                'subscription' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        try {
            $this->notificationService->addUserNotification($userData->id, $chatId, $request->type, $request->subscription, Utils::detectDeviceType($request->userAgent()));
        } catch (\Throwable $throwable) {
            return ResponseUtils::buildErrorResponse('Unable to register notification. Possible that notification already added', 0, 401);
        }
        return ResponseUtils::buildEmptyOkResponse();
    }

    public function unsubscribeNotification(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'type' => 'in:' . NotificationService::MESSAGE . ',' . NotificationService::PRESSENCE,
                'subscription' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        try {
            $this->notificationService->removeUserNotification($userData->id, $chatId, $request->type, $request->subscription);
        } catch (\Throwable $throwable) {
            return ResponseUtils::buildErrorResponse('Unable to unregister notification', 0, 401);
        }
        return ResponseUtils::buildEmptyOkResponse();
    }

    public function getSubscriptionTypes(int $chatId, Request $request) {
        $userData = $request->user();
        try {
            $this->validate($request, [
                'subscription' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        try {
            return response()->json($this->notificationService->getUserNotificationTypes($userData->id, $chatId, $request->subscription));
        } catch (\Throwable $throwable) {
            return ResponseUtils::buildErrorResponse('Unable to get notification types', 0, 401);
        }
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
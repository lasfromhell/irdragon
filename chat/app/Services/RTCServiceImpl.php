<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 04.10.2018
 * Time: 22:51
 */

namespace App\Services;


use App\Contracts\CacheService;
use App\Contracts\RTCService;
use App\Http\Models\RTCCallData;
use App\Http\Models\RTCCandidateData;

class RTCServiceImpl implements RTCService
{
    /**
     * @var CacheService
     */
    private $cacheService;

    const RTC_CALL_TTL = 45;
    const RTC_CANDIDATE_TTL = 15;

    const STATE_INITIAL = 'initial';
    const STATE_ANSWER = 'answer';
    const STATE_ON_CALL = 'in_call';
    const STATE_CANCELLED = 'cancelled';

    /**
     * RTCServiceImpl constructor.
     * @param CacheService $cacheService
     */
    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    public function assignCall(int $chatId, $target, $sdp, $type, $displayName)
    {
        $key = $this->prepareRTCTargetKey($chatId, $target);
        if (!$this->cacheService->exists($key)) {
            $callId = null;
            $callKey = null;
            do {
                $callId = Utils::generateGuid();
                $callKey = $this->prepareCallKey($chatId, $callId);
            } while ($this->cacheService->exists($callKey));
            $this->cacheService->set($key, $callId, $this::RTC_CALL_TTL);
            $otherPartyKey = $this->prepareRTCTargetKey($chatId, $displayName);
            $this->cacheService->set($otherPartyKey, $callId, $this::RTC_CALL_TTL);
            $callData = new RTCCallData($chatId, $target, $sdp, $type, $this::STATE_INITIAL, $callId, [], $displayName);
            $this->cacheService->set($callKey, $callData, $this::RTC_CALL_TTL);
            return $callData;
        }
        else {
            return null;
        }
    }

    public function getCall(int $chatId, $displayName) {
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $callId = $this->cacheService->get($key);
        if ($callId) {
            $callKey = $this->prepareCallKey($chatId, $callId);
            return $this->cacheService->get($callKey);
        }
        return null;
    }

    public function answerCall(int $chatId, $callId, $displayName, $sdp, $type)
    {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $this->cacheService->mutex($callId)->check(function() use ($key, $callId) {
            return $this->checkCallId($key, $callId);
        })->then(function () use ($callId, $displayName, $chatId, $sdp, $type, &$result) {
            $callKey = $this->prepareCallKey($chatId, $callId);
            $callData = $this->cacheService->get($callKey);
            if ($callData && $callData->state == $this::STATE_INITIAL) {
                $callData->state = $this::STATE_ANSWER;
                $callData->callee = $displayName;
                $callData->answerSdp = $sdp;
                $callData->answerType = $type;
                $this->cacheService->set($callKey, $callData, $this::RTC_CALL_TTL);
                $result = $callData;
            }
        });
        return $result;
    }

    public function addCandidate(int $chatId, $callId, $candidate, $sdpMid, $sdpMLineIndex, $displayName)
    {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $this->cacheService->mutex($callId)->check(function() use ($key, $callId) {
            return $this->checkCallId($key, $callId);
        })->then(function () use ($callId, $displayName, $candidate, $sdpMid, $sdpMLineIndex, &$result, $chatId){
            $callKey = $this->prepareCallKey($chatId, $callId);
            $callData = $this->cacheService->get($callKey);
            if ($callData && ($callData->state == $this::STATE_INITIAL || $callData->state == $this::STATE_ANSWER)) {
                if (!array_key_exists($displayName, $callData->candidates)) {
                    $callData->candidates[$displayName] = [];
                }
                $callData->candidates[$displayName][] = new RTCCandidateData($candidate, $sdpMid, $sdpMLineIndex);
                $this->cacheService->set($callKey, $callData, $this::RTC_CANDIDATE_TTL);
                $result = $callData;
            }
            if ($callData && $callData->state == $this::STATE_ON_CALL) {
                $result = $callData;
            }
        });
        return $result;
    }

    public function cancelCall(int $chatId, $callId, $displayName) {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $this->cacheService->mutex($callId)->check(function() use ($key, $callId) {
            return $this->checkCallId($key, $callId);
        })->then(function () use ($chatId, $callId, &$result) {
            $result = $this->cancelCallByCallId($chatId, $callId);
        });
        return $result;
    }

    public function onCall(int $chatId, $callId, $displayName) {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $this->cacheService->mutex($callId)->check(function() use ($key, $callId) {
            return $this->checkCallId($key, $callId);
        })->then(function () use ($chatId, $callId, &$result) {
            $callKey = $this->prepareCallKey($chatId, $callId);
            $callData = $this->cacheService->get($callKey);
            if ($callData && ($callData->state == $this::STATE_ANSWER)) {
                $callData->state = $this::STATE_ON_CALL;
                $this->cacheService->set($callKey, $callData, $this::RTC_CANDIDATE_TTL);
                $result = $callData;
            }
            if ($callData && $callData->state == $this::STATE_ON_CALL) {
                $result = $callData;
            }
        });
        return $result;
    }

    public function cancelAnyCall(int $chatId, $displayName) {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $callId = $this->cacheService->get($key);
        if ($callId) {
            $this->cacheService->mutex($callId)->synchronized(function () use ($chatId, $callId, &$result) {
                $result = $this->cancelCallByCallId($chatId, $callId);
            });
        }
        return $result;
    }

    private function cancelCallByCallId($chatId, $callId) {
        $callKey = $this->prepareCallKey($chatId, $callId);
        $callData = $this->cacheService->get($callKey);
        if ($callData && ($callData->state == $this::STATE_ON_CALL || $callData->state == $this::STATE_INITIAL ||
                $callData->state == $this::STATE_ANSWER)) {
            $callData->state = $this::STATE_CANCELLED;
            $this->cacheService->set($callKey, $callData, $this::RTC_CANDIDATE_TTL);
//            if ($callData->caller) {
//                $key = $this->prepareRTCTargetKey($chatId, $callData->caller);
//                $this->cacheService->delete($key);
//            }
//            if ($callData->callee) {
//                $key = $this->prepareRTCTargetKey($chatId, $callData->callee);
//                $this->cacheService->delete($key);
//            }
            return $callData;
        }
        return null;
    }

    private function checkCallId($key, $callId) {
        $dbCallId = $this->cacheService->get($key);
        return $dbCallId && $callId === $dbCallId;
    }

    private function prepareRTCTargetKey($chatId, $target) {
        return 'RTCTarget-' . $chatId . '-' . $target;
    }

    private function prepareCallKey($chatId, $callId) {
        return 'RTCCall-' . $chatId . '-' . $callId;
    }

    public function heartbeat(int $chatId, $callId, $displayName) {
        $result = null;
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $this->cacheService->mutex($callId)->check(function() use ($key, $callId) {
            return $this->checkCallId($key, $callId);
        })->then(function () use ($chatId, $callId, &$result) {
            $callKey = $this->prepareCallKey($chatId, $callId);
            $this->cacheService->touch($callKey, $this::RTC_CALL_TTL);
            $callData = $this->cacheService->get($callKey);
            if ($callData->caller) {
                $key = $this->prepareRTCTargetKey($chatId, $callData->caller);
                $this->cacheService->touch($key, $this::RTC_CALL_TTL);
            }
            if ($callData->callee) {
                $key = $this->prepareRTCTargetKey($chatId, $callData->callee);
                $this->cacheService->touch($key, $this::RTC_CALL_TTL);
            }
            $result = $callData;
        });
        return $result;
    }
}
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

    /**
     * RTCServiceImpl constructor.
     * @param CacheService $cacheService
     */
    public function __construct(CacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    public function assignCall($chatId, $target, $sdp, $type, $displayName)
    {
        $key = $this->prepareRTCTargetKey($chatId, $target);
        if (!$this->cacheService->exists($key)) {
            $callId = Utils::generateGuid();
            $this->cacheService->set($key, $callId, $this::RTC_CALL_TTL);
            $this->cacheService->set($callId, new RTCCallData($chatId, $target, $sdp, $type, $this::STATE_INITIAL, $callId, [], $displayName), $this::RTC_CALL_TTL);
            return $callId;
        }
        else {
            return null;
        }
    }

    public function getCall($chatId, $displayName) {
        $key = $this->prepareRTCTargetKey($chatId, $displayName);
        $callId = $this->cacheService->get($key);
        if ($callId) {
            return $this->cacheService->get($callId);
        }
        return null;
    }

    public function answerCall(int $chatId, $callId, $displayName, $sdp, $type)
    {
        $this->cacheService->mutex($callId)->synchronized(function () use ($callId, $displayName, $chatId, $sdp, $type) {
            $callData = $this->cacheService->get($callId);
            if ($callData) {
                if ($callData->state == $this::STATE_INITIAL) {
                    $callData->state = $this::STATE_ANSWER;
                    $callData->callee = $displayName;
                    $callData->answerSdp = $sdp;
                    $callData->answerType = $type;
                    $key = $this->prepareRTCTargetKey($chatId, $callData->caller);
                    $this->cacheService->set($callId, $callData, $this::RTC_CALL_TTL);
                    $this->cacheService->set($key, $callId, $this::RTC_CALL_TTL);
                    return $key;
                }
            }
        });
        return null;
    }

    public function addCandidate(int $chatId, $callId, $candidate, $sdpMid, $sdpMLineIndex, $displayName)
    {
//        $candidateKey = $this->prepareCandidateKey($chatId, $displayName);
//        $candidates = $this->cacheService->get($candidateKey);
//        if (!$candidates) {
//            $candidates = [];
//        }
//        $candidates[] = new RTCCandidateData($candidate, $sdpMid, $sdpMLineIndex);
//        $this->cacheService->set($candidateKey, $candidates, $this::RTC_CANDIDATE_TTL);

        $this->cacheService->mutex($callId)->synchronized(function () use ($callId, $displayName, $candidate, $sdpMid, $sdpMLineIndex){
            $callData = $this->cacheService->get($callId);
            if ($callData) {
                if ($callData->state == $this::STATE_INITIAL || $callData->state == $this::STATE_ANSWER) {
                    if (!array_key_exists($displayName, $callData->candidates)) {
                        $callData->candidates[$displayName] = [];
                    }
                    $callData->candidates[$displayName][] = new RTCCandidateData($candidate, $sdpMid, $sdpMLineIndex);
                    $this->cacheService->set($callId, $callData, $this::RTC_CANDIDATE_TTL);
                }
            }
        });
        return null;
    }

    private function prepareRTCTargetKey($chatId, $target) {
        return 'RTCTarget-' . $chatId . '-' . $target;
    }

    private function prepareCandidateKey($chatId, $target) {
        return 'RTCCandidate-' . $chatId . '-' . $target;
    }
}
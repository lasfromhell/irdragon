<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 04.10.2018
 * Time: 22:51
 */

namespace App\Contracts;


interface RTCService
{
    public function assignCall(int $chatId, $target, $sdp, $type, $displayName, $video);
    public function getCall(int $chatId, $displayName);
    public function answerCall(int $chatId, $callId, $displayName, $sdp, $type);
    public function addCandidate(int $chatId, $callId, $candidate, $sdpMid, $sdpMLineIndex, $displayName);
    public function cancelCall(int $chatId, $callId, $displayName);
    public function cancelAnyCall(int $chatId, $displayName);
    public function onCall(int $chatId, $callId, $displayName);
    public function heartbeat(int $chatId, $callId, $displayName);
}
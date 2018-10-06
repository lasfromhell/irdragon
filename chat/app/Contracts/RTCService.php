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
    public function assignCall($chatId, $target, $sdp, $type, $displayName);
    public function getCall($chatId, $displayName);
    public function answerCall(int $chatId, $callId, $displayName, $sdp, $type);
    public function addCandidate(int $chatId, $callId, $candidate, $sdpMid, $sdpMLineIndex, $displayName);
}
<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 04.10.2018
 * Time: 22:56
 */

namespace App\Http\Models;


class RTCCallData
{
    public $chatId;
    public $target;
    public $sdp;
    public $type;
    public $state;
    public $callId;
    public $candidates;
    public $caller;
    public $callee;
    public $answerSdp;
    public $answerType;
    public $video;

    /**
     * RTCCallData constructor.
     * @param $chatId
     * @param $target
     * @param $sdp
     * @param $type
     * @param $state
     * @param $callId
     * @param $candidates
     * @param $caller
     * @param $video
     */
    public function __construct($chatId, $target, $sdp, $type, $state, $callId, $candidates, $caller, $video)
    {
        $this->chatId = $chatId;
        $this->target = $target;
        $this->sdp = $sdp;
        $this->type = $type;
        $this->state = $state;
        $this->callId = $callId;
        $this->caller = $caller;
        $this->candidates = $candidates;
        $this->video = $video;
    }
}
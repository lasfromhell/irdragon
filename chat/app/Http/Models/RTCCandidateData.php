<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 05.10.2018
 * Time: 0:32
 */

namespace App\Http\Models;


class RTCCandidateData
{
    public $candidate;
    public $sdpMid;
    public $sdpMLineIndex;

    /**
     * RTCCandidateData constructor.
     * @param $candidate
     * @param $sdpMid
     * @param $sdpMLineIndex
     */
    public function __construct($candidate, $sdpMid, $sdpMLineIndex)
    {
        $this->candidate = $candidate;
        $this->sdpMid = $sdpMid;
        $this->sdpMLineIndex = $sdpMLineIndex;
    }
}
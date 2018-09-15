<?php

namespace App\Http\Models;


class SendMessageData
{
    public $messageId;
    public $device;

    public function __construct($messageId, $device) {
        $this->messageId = $messageId;
        $this->device = $device;
    }


}
<?php

namespace App\Http\Models;


class SendMessageData
{
    public $messageId;

    public function __construct($messageId)
    {
        $this->messageId = $messageId;
    }


}
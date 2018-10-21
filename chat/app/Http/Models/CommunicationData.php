<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 04.10.2018
 * Time: 23:07
 */

namespace App\Http\Models;


class CommunicationData
{
    public $messages;
    public $communications;
    public $presence;

    /**
     * CommunicationData constructor.
     * @param $messages
     * @param $communications
     */
    public function __construct($messages, $communications, $presence)
    {
        $this->messages = $messages;
        $this->communications = $communications;
        $this->presence = $presence;
    }


}
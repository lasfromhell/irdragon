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

    /**
     * CommunicationData constructor.
     * @param $messages
     * @param $communications
     */
    public function __construct($messages, $communications)
    {
        $this->messages = $messages;
        $this->communications = $communications;
    }


}
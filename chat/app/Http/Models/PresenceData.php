<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 03.08.2018
 * Time: 23:18
 */

namespace App\Http\Models;


class PresenceData
{
    public $online;
    public $action;

    /**
     * PresenceData constructor.
     * @param $online
     * @param $action
     */
    public function __construct($online, $action)
    {
        $this->online = $online;
        $this->action = $action;
    }


}
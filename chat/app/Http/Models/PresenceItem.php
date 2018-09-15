<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 16.07.2018
 * Time: 22:18
 */

namespace App\Http\Models;


class PresenceItem
{
    public $activityDate;
    public $displayName;
    public $device;

    /**
     * PresenceData constructor.
     * @param $activityDate
     * @param $displayName
     * @param $device
     */
    public function __construct($activityDate, $displayName, $device)
    {
        $this->activityDate = $activityDate;
        $this->displayName = $displayName;
        $this->device = $device;
    }


}
<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 16.07.2018
 * Time: 22:18
 */

namespace App\Http\Models;


class PresenceData
{
    public $activityDate;
    public $displayName;

    /**
     * PresenceData constructor.
     * @param $activityDate
     * @param $displayName
     */
    public function __construct($activityDate, $displayName)
    {
        $this->activityDate = $activityDate;
        $this->displayName = $displayName;
    }


}
<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 16.07.2018
 * Time: 21:50
 */

namespace App\Contracts;


interface PresenceService
{
    public function updateOnlineDate($userId, $displayName, $device);
    public function getOnlineDate($userId);
    public function updateActionDate($userId, $displayName, $device);
    public function getActionDate($userId);
}
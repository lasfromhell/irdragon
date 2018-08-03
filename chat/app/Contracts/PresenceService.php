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
    public function updateOnlineDate($userId, $displayName);
    public function getOnlineDate($userId);
    public function updateActionDate($userId, $displayName);
    public function getActionDate($userId);
}
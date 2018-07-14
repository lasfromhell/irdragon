<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.07.2018
 * Time: 18:44
 */

namespace App\Contracts;


interface SessionService
{
    public function storeData($token, $userData);
    public function fetchData($token);
    public function updateTTL($token);
    public function generateToken(): string;
}
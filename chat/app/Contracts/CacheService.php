<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 09.07.2018
 * Time: 22:41
 */

namespace App\Contracts;


interface CacheService
{
    public function get($key);
    public function set($key, $value, $ttl);
    public function inc($key, $by = 1);
    public function dec($key, $by = 1);
    public function mutex($key);
    public function touch($key, $ttl);
    public function exists($key);
    public function delete($key);
    public function dmutex_file($token);
}
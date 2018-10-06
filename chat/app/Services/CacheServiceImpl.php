<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 09.07.2018
 * Time: 22:42
 */

namespace App\Services;

use App\Contracts\CacheService;
use malkusch\lock\mutex\FlockMutex;
use Phpfastcache\CacheManager;
use Phpfastcache\Config\ConfigurationOption;

class CacheServiceImpl implements CacheService
{
    private $cache;

    const TTL = 30;

    const MUTEX_PATH = 'mutex/key_';

    public function __construct()
    {
        $this->cache = CacheManager::Files(new ConfigurationOption(['path' => realpath('.') . '/cache/']));
    }

    public function get($key)
    {
        return $this->cache->getItem($key)->get();
    }

    public function set($key, $value, $ttl)
    {
        $item = $this->cache->getItem($key);
        $item->set($value)->expiresAfter($ttl ?? $this::TTL);
        $this->cache->save($item);
    }

    public function mutex($key)
    {
        return new FlockMutex(fopen(self::MUTEX_PATH . md5($key), 'w+'));
    }

    public function inc($key, $by = 1)
    {
        $item = $this->cache->getItem($key);
        $item->increment($by);
        $this->cache->save($item);
    }

    public function dec($key, $by = 1)
    {
        $item = $this->cache->getItem($key);
        $item->decrement($by);
        $this->cache->save($item);
    }

    public function touch($key, $ttl)
    {
        $item = $this->cache->getItem($key);
        $item->expiresAfter($ttl);
        $this->cache->save($item);
    }

    public function exists($key)
    {
        $this->cache->getItem($key)->isEmpty();
    }

    public function delete($key) {
        $this->cache->deleteItem($key);
    }

    public function dmutex_file($key)
    {
        unlink(self::MUTEX_PATH . md5($key));
    }
}
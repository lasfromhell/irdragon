<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 28.10.2018
 * Time: 1:09
 */

namespace App\DB;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id', 'chat_id', 'subscription', 'type', 'device'
    ];

    protected $table = 'user_notification';
}
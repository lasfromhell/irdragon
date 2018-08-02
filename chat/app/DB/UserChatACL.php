<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 01.07.2018
 * Time: 23:19
 */

namespace App\DB;


use Illuminate\Database\Eloquent\Model;

class UserChatACL extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id', 'chat_id', 'last_read_message'
    ];

    protected $table = 'user_chat_acl';
}
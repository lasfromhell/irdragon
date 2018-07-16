<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 01.07.2018
 * Time: 23:18
 */

namespace App\DB;


use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'moderator'
    ];

    protected $table = 'user';
}
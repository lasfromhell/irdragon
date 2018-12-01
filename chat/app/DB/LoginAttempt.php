<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 16.07.2018
 * Time: 21:43
 */

namespace App\DB;

use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    protected $fillable = [
        'login', 'success', 'device'
    ];

    protected $table = 'login_attempt';
}
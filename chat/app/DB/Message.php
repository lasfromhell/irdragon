<?php

namespace App\DB;

use App\Contracts\UserService;
use App\Http\Models\MessageData;
use Illuminate\Database\Eloquent\Model;

class Message extends Model {
    protected $fillable = [
        'data', 'from', 'from_date', 'read', 'chat_id', 'fake', 'private', 'device'
    ];

    protected $table = 'message';
    protected $dates = ['created_at', 'updated_at', 'from_date'];
}

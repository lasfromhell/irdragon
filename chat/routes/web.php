<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/api/version', function () use ($router) {
    return $router->app->version();
});

$router->get('/', function () use ($router) {
    return redirect('/chat');
});

$router->group(['prefix' => 'api'], function () use ($router) {

    $router->post('user/authenticate', 'UserController@authenticate');

    $router->group(['middleware' => 'auth'], function () use ($router) {
        $router->post('user/encodePassword', 'UserController@encodePassword');
        $router->post('user/authorize', 'UserController@authorizeRequest');
        $router->post('user/logout', 'UserController@logout');
        $router->post('chat/{chatId}/message', 'ChatController@sendMessage');
        $router->get('chat/{chatId}/latest/{number}', 'ChatController@getLatestMessages');
        $router->get('chat/{chatId}/after/{after}/{number}', 'ChatController@getMessagesAfter');
        $router->get('chat/{chatId}/before/{before}/{number}', 'ChatController@getMessagesBefore');
        $router->get('chat/{chatId}/presence', 'ChatController@getPresence');
        $router->get('chat/events', 'ChatController@events');
        $router->post('chat/{chatId}/typingStarted', 'ChatController@typingStarted');
        $router->post('chat/{chatId}/typingFinished', 'ChatController@typingFinished');
        $router->post('chat/{chatId}/typingProgress', 'ChatController@typingProgress');
        $router->post('chat/{chatId}/lastReadMessage/{messageId}', 'ChatController@setLastReadMessage');
        $router->post('user/action', 'UserController@userAction');
        $router->post('image/upload', 'ImageController@upload');
        $router->post('file/upload', 'FileController@upload');
        $router->post('chat/{chatId}/rtc/call', 'ChatController@makeRtcCall');
        $router->post('chat/{chatId}/rtc/candidate', 'ChatController@AddRtcCandidate');
        $router->post('chat/{chatId}/rtc/answer', 'ChatController@answerRtcCall');
    });
});

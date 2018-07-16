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
        $router->post('chat/{chatId}/message', 'ChatController@sendMessage');
        $router->get('chat/{chatId}/latest/{number}', 'ChatController@getLatestMessages');
        $router->get('chat/{chatId}/after/{after}', 'ChatController@getMessagesAfter');
        $router->get('chat/{chatId}/before/{before}', 'ChatController@getMessagesBefore');
        $router->get('chat/{chatId}/presence', 'ChatController@getPresence');
        $router->get('chat/events', 'ChatController@events');
    });
});

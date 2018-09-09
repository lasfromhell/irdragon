<?php
/**
 * Created by PhpStorm.
 * User: lasfr
 * Date: 07.08.2018
 * Time: 23:32
 */

namespace App\Http\Controllers;


use App\Services\ResponseUtils;
use App\Services\Utils;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Imagick;

class FileController extends Controller {
    public function upload(Request $request) {
        try {
            $this->validate($request, [
                'file' => 'required',
                'name' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        $file = $request->file('file');
        if (!$file->isValid()) {
            return ResponseUtils::buildErrorResponse('File is not valid', 0, 406);
        }
        $guid = Utils::generateGuid();
        $path = './chat/files/uploaded/' . $guid . '/';
        $file->storeAs($path, $request->name);
        return response()->json(['id' => $guid]);
    }
}
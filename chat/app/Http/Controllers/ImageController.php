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

class ImageController extends Controller {
    public function upload(Request $request) {
        try {
            $this->validate($request, [
                'image' => 'required',
                'name' => 'required'
            ]);
        } catch (ValidationException $e) {
            return ResponseUtils::buildErrorResponse($e->getMessage(), 0, 404);
        }
        $file = $request->file('image');
        if (!$file->isValid()) {
            return ResponseUtils::buildErrorResponse('File is not valid', 0, 406);
        }
        $ext = $file->getClientOriginalExtension();
        $guid = Utils::generateGuid();
        $path = './chat/images/uploaded/';
        $filename = $guid . '.' . $ext;
        $file->storeAs($path, $filename);
        $this->createThumbnail(__DIR__ . '/../../../' . $path . $filename,  $path . 'thumbnails/' . $filename);
        return response()->json(['id' => $filename]);
    }

    private function createThumbnail($srcPath, $dstPath) {
        $imagick = new Imagick($srcPath);
        $imagick->setImageFormat('png');
        $imagick->thumbnailImage(128, 128, true, false);
        file_put_contents($dstPath, $imagick);
    }
}
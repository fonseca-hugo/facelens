/**! ===================================================
 * @name faceLens.js
 * @author Hugo Fonseca (http://hugofonseca.co.uk)
 * @version 0.1.0
 * @date 05/10/2016
 *
 * https://github.com/fonseca-hugo/facelens
 * ===================================================
 * Copyright (c) 2017 Hugo Fonseca (fonseca.hugo@gmail.com)
 *
 * Using Microsoft Face API, allows to generate Snapchat like lenses, by applying the lens/mask
 * on the identified coordinates of lips, eye brows, eyes, ets.
 *
 * ==========================================================
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ==========================================================
 */
FACELENS = (function () {
    "use strict"; /* global FACELENS, $, console */

    var faceAttributes = "age,gender,headPose,smile,facialHair,glasses",
        apiURL = "https://api.projectoxford.ai/face/v1.0/detect?returnFaceLandmarks=true&returnFaceAttributes=" + faceAttributes,
        apiKey = "5ea8690dc2bb4ab7a1e0a3295b781079";

    return {
        currentLens: 'dog',
        currentData: {},
        operationLocation: '',
        init: function () {
            $('#fileToUpload').change(function() {
                FACELENS.readURL(this);
            });
            $('.controls input').change(function (e) {
                var selected = $('.controls input:checked').val();
                if (selected != FACELENS.currentLens) {
                    //reset and add new
                    FACELENS.resetLens();
                    FACELENS.currentLens = selected;
                    FACELENS.addElementsToImage(FACELENS.currentData, FACELENS.currentLens);
                }
            });
        },
        resetLens: function (){
            $('.prop').remove();
        },
        readURL: function (input) {

            if (input.files && input.files[0]) {
                var reader = new FileReader();

                FACELENS.resetLens();

                reader.onload = function (e) {
                    $('#image').attr('src', e.target.result);
                    FACELENS.getFaceDetails(input.files[0]);
                };

                reader.readAsDataURL(input.files[0]);
            }
        },
        getFaceDetails: function (data) {
            var contentType = "application/octet-stream";

            $.ajax({
                type: 'POST',
                url: apiURL,
                data: data,
                processData: false,
                headers: {
                    "Content-Type": contentType,
                    "Ocp-Apim-Subscription-Key": apiKey
                }
            }).done(function(data) {
                FACELENS.currentData = data; //cache data, in case the lens is changed
                FACELENS.addElementsToImage(FACELENS.currentData, FACELENS.currentLens);
            });

            return true;
        },
        addElementsToImage: function (data, type) {
            var record,
                attributes,
                headPose,
                landmarks,
                rectangle,
                width,
                height,
                correction,
                proportion,
                newWidth,
                newHeight,
                newNoseWidth,
                newNoseHeight,
                newEyeWidth,
                newEyeHeight,
                transform,
                template = $('#' + type).clone(),
                templateContent = $(template.prop('content'));

            for (var i = 0; i < data.length; i++) {
                record = data[i];
                attributes = record['faceAttributes'];
                headPose = attributes['headPose'];
                landmarks = record['faceLandmarks'];
                rectangle = record['faceRectangle'];
                width = rectangle['width'];
                height = rectangle['height'];
                correction = template.data('nose-correction');
                proportion = template.data('ear-width') / width;
                newWidth = (template.data('ear-width') / proportion) / 2;
                newHeight = (template.data('ear-height') / proportion) / 2;
                newEyeWidth = (template.data('eye-width') / proportion) / 2;
                newEyeHeight = (template.data('eye-height') / proportion) / 2;
                newNoseWidth = (template.data('nose-width') / proportion) / 2;
                newNoseHeight = (template.data('nose-height') / proportion) / 2;
                transform = "rotateZ(" + headPose['roll'] + "deg) rotateY(" + headPose['yaw'] + "deg)";

                templateContent.find('.ear-right').css({
                    top: landmarks['eyebrowLeftOuter']['y'] - newHeight - 10,
                    left: landmarks['eyebrowLeftOuter']['x'] - (newWidth / 2),
                    width: newWidth,
                    height: newHeight,
                    transform: transform
                });

                templateContent.find('.ear-left').css({
                    top: landmarks['eyebrowRightOuter']['y'] - newHeight - 10,
                    left: landmarks['eyebrowRightOuter']['x'] - (newWidth / 2),
                    width: newWidth,
                    height: newHeight,
                    transform: transform
                });
                templateContent.find('.nose').css({
                    top: landmarks['noseTip']['y'] - (newNoseHeight / 2) + (correction / proportion),
                    left: landmarks['noseTip']['x'] - (newNoseWidth / 2),
                    width: newNoseWidth,
                    height: newNoseHeight,
                    transform: transform
                });

                templateContent.find('.eye-left').css({
                    top: landmarks['eyeRightInner']['y'] - (newEyeHeight / 2),
                    left: landmarks['eyeRightInner']['x'] - (newEyeWidth / 3),
                    width: newEyeWidth,
                    height: newEyeHeight,
                    transform: transform
                });
                templateContent.find('.eye-right').css({
                    top: landmarks['eyeLeftInner']['y'] - (newEyeHeight / 2),
                    left: landmarks['eyeLeftInner']['x'] - (newEyeWidth / 1.5),
                    width: newEyeWidth,
                    height: newEyeHeight,
                    transform: transform
                });

                $('.imageWrapper').prepend(template.html());
            }
        }
    }
})();
// Import jQuery
var jquery = require("jquery");
window.$ = window.jQuery = jquery;

// Import Bootstrap
import * as bootstrap from 'bootstrap';

// initialize boostrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
})

const BACKEND_URL = "https://rlemotion.cloud.edu.au/api"

const emotion_map = {
    'hap': 'Happy 😊',
    'sad': "Sad 😞️",
    'ang': 'Angry 😡',
    'neu': "Neutral 😐"
}

$(document).ready(function () {

    let recorder, audio_stream;
    let chunks = [];
    const preview = document.getElementById("audio-playback");
    let audioId = undefined
    let supported = true


    function fnBrowserDetect() {

        let userAgent = navigator.userAgent;
        let browserName;

        if (userAgent.match(/chrome|chromium|crios/i)) {
            browserName = "chrome";
        } else if (userAgent.match(/firefox|fxios/i)) {
            browserName = "firefox";
        } else if (userAgent.match(/safari/i)) {
            browserName = "safari";
        } else if (userAgent.match(/opr\//i)) {
            browserName = "opera";
        } else if (userAgent.match(/edg/i)) {
            browserName = "edge";
        } else {
            browserName = "No browser detection";
        }

        if (!['chrome', 'firefox'].includes(browserName)) {
            $('#unsupported_alert').removeClass('hidden').add('visible')
            supported = false
        } else {
            supported = true
        }
    }

    fnBrowserDetect()

    function showStep(step) {
        for (let i = 0; i < 6; i++) {
            if (i !== step) {
                $('#step-' + i).removeClass('visible').addClass('hidden');
            }
        }
        $('#step-' + step).removeClass('hidden').addClass('visible');
    }

    function startRecording() {
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(function (stream) {
                audio_stream = stream;

                recorder = new MediaRecorder(stream, {mimeType: 'audio/webm'});

                // when there is data, compile into object for preview src
                recorder.ondataavailable = function (e) {
                    preview.src = URL.createObjectURL(e.data);
                    chunks.push(e.data);
                };
                recorder.start();

                setTimeout(function () {
                    console.log("2 sec timeout");
                    stopRecording();
                }, 2000);
            });
    }

    function stopRecording() {
        recorder.stop();
        audio_stream.getAudioTracks()[0].stop();
        showStep(3);
    }

    function submitFeedback(model, feedback) {

        const xhr = new XMLHttpRequest();

        xhr.open("POST", BACKEND_URL + "/feedback?audio_id=" + audioId + "&feedback=" + feedback + "&model=" + model);
        xhr.setRequestHeader("Accept", "application/json");

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4) {
                console.log(this.responseText);
                showStep(1);
            }
        });

        xhr.send();
    }


    $('#btnStartRecording').click(function () {
        if (supported) {
            showStep(2);
            startRecording();
        }
    });

    $('#btnStopRecording').click(function () {
        showStep(3);
        stopRecording()
    });

    $('#btnUploadRecording').click(function () {
        const blob = new Blob(chunks, {type: "audio/wav"});

        let data = new FormData();
        data.append('audio_file', blob, 'recording.webm');
        // Make the HTTP request
        let oReq = new XMLHttpRequest();

        // POST the data to upload.php
        oReq.open("POST", BACKEND_URL + '/uploadfile', true);
        oReq.onload = function (oEvent) {
            // Data has been uploaded
            chunks = []
            const response = JSON.parse(oEvent.target['response'])
            audioId = response['audio_id']
            $('#rl_emotion_result').html(emotion_map[response['rl_emotion']])
            $('#sl_emotion_result').html(emotion_map[response['sl_emotion']])
            showStep(5)

        };
        oReq.send(data);


        showStep(4);
    });

    $('#thumbsUp').click(function () {
        submitFeedback('RL', 'true')
    });

    $('#thumbsDown').click(function () {
        submitFeedback('RL', 'false')
    });


})

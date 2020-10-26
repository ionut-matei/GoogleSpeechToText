'use strict'


//connection to socket
const socket = io.connect();

//================= CONFIG =================
// Stream Audio
let bufferSize = 2048,
	AudioContext,
	context,
	processor,
	input,
	globalStream,
	audioRecorder;

//vars
let audioElement = document.querySelector('audio'),
	finalWord = false,
	resultText = document.getElementById('ResultText'),
	removeLastSentence = true,
	streamStreaming = false;


//audioStream constraints
const constraints = {
	audio: true,
	video: false
};

//================= RECORDING =================
function initRecording2() {
	socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
	streamStreaming = true;
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext({
		// https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
		latencyHint: 'interactive',
	});
	processor = context.createScriptProcessor(bufferSize, 1, 1);
	processor.connect(context.destination);
	context.resume();

	var handleSuccess = function (stream) {
		globalStream = stream;
		input = context.createMediaStreamSource(stream);
		input.connect(processor);

		processor.onaudioprocess = function (e) {
			microphoneProcess(e);
		};
	};

	navigator.mediaDevices.getUserMedia(constraints)
		.then(handleSuccess);

}

function initRecording() {
	socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
	streamStreaming = true;
	
	var onSuccessCallback = function (audioStream) {
		audioRecorder = RecordRTC(audioStream, {
			type: 'audio',
			mimeType: 'audio/webm',
			sampleRate: 44100,

			// let us force 16khz recording:
			desiredSampRate: 16000,
		 
			recorderType: StereoAudioRecorder,
			// Dialogflow / STT requires mono audio
			numberOfAudioChannels: 1,

			timeSlice: 300,

			ondataavailable: async function (blob) {
				console.log("Speech chunk ready")
				
				try {
					socket.emit('binaryData', blob);
				} catch (err) {
					console.error(err);
				}
			}
		});
		
		audioRecorder.startRecording();
	};

	var onErrorCallback = function(error){
		debugger
		console.error(JSON.stringify(error));
	}

	navigator.getUserMedia({ audio: true }, onSuccessCallback, onErrorCallback)


}

function microphoneProcess(e) {
	var left = e.inputBuffer.getChannelData(0);
	// var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
	var left16 = downsampleBuffer(left, 44100, 16000)
	socket.emit('binaryData', left16);
}


//================= INTERFACE =================
var startButton = document.getElementById("startRecButton");
startButton.addEventListener("click", startRecording);

var endButton = document.getElementById("stopRecButton");
endButton.addEventListener("click", stopRecording);
endButton.disabled = true;

var recordingStatus = document.getElementById("recordingStatus");


function startRecording() {
	startButton.disabled = true;
	endButton.disabled = false;
	recordingStatus.style.visibility = "visible";
	initRecording();
}

function stopRecording() {
	// waited for FinalWord
	startButton.disabled = false;
	endButton.disabled = true;
	recordingStatus.style.visibility = "hidden";
	streamStreaming = false;
	if(audioRecorder)
	{
		audioRecorder.stopRecording(function(){
			console.log("Audio recording stopped")
		})
	}
	socket.emit('endGoogleCloudStream', '');


	// let track = globalStream.getTracks()[0];
	// track.stop();

	// input.disconnect(processor);
	// processor.disconnect(context.destination);
	// context.close().then(function () {
	// 	input = null;
	// 	processor = null;
	// 	context = null;
	// 	AudioContext = null;
	// 	startButton.disabled = false;
	// });
}

//================= SOCKET IO =================
socket.on('connect', function (data) {
	socket.emit('join', 'Server Connected to Client');
});


socket.on('messages', function (data) {
	console.log(data);
});


socket.on('speechData', function (data) {
	
	var dataFinal = undefined || data.results[0].isFinal;
	let transcript = data.results[0].alternatives[0].transcript;

	if (dataFinal === false) {
		// console.log(resultText.lastElementChild);
		if (removeLastSentence) { resultText.lastElementChild.remove(); }
		removeLastSentence = true;

		//add empty span
		let empty = document.createElement('span');
		resultText.appendChild(empty);
		resultText.lastElementChild.appendChild(document.createTextNode(transcript));
		resultText.lastElementChild.appendChild(document.createTextNode('\u00A0'));

	} else if (dataFinal === true) {
		resultText.lastElementChild.remove();

		//add empty span
		let empty = document.createElement('span');
		resultText.appendChild(empty);
		resultText.lastElementChild.appendChild(document.createTextNode(transcript));
		resultText.lastElementChild.appendChild(document.createTextNode('\u00A0'));

		console.log("Google Speech sent 'final' Sentence.");
		finalWord = true;
		endButton.disabled = false;

		removeLastSentence = false;
	}
});

window.onbeforeunload = function () {
	if (streamStreaming) { socket.emit('endGoogleCloudStream', ''); }
};

//================= SANTAS HELPERS =================

// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
	let l = buffer.length;
	let buf = new Int16Array(l / 3);

	while (l--) {
		if (l % 3 == 0) {
			buf[l / 3] = buffer[l] * 0xFFFF;
		}
	}
	return buf.buffer
}

var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
	if (outSampleRate == sampleRate) {
		return buffer;
	}
	if (outSampleRate > sampleRate) {
		throw "downsampling rate show be smaller than original sample rate";
	}
	var sampleRateRatio = sampleRate / outSampleRate;
	var newLength = Math.round(buffer.length / sampleRateRatio);
	var result = new Int16Array(newLength);
	var offsetResult = 0;
	var offsetBuffer = 0;
	while (offsetResult < result.length) {
		var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
		var accum = 0, count = 0;
		for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
			accum += buffer[i];
			count++;
		}

		result[offsetResult] = Math.min(1, accum / count) * 0x7FFF;
		offsetResult++;
		offsetBuffer = nextOffsetBuffer;
	}
	return result.buffer;
}

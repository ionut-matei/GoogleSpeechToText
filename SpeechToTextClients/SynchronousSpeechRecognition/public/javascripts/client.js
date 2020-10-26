

let bufferSize = 4096,
	AudioContext,
	context,
	processor,
	input,
	globalStream;


let finalWord = false,
	resultText = document.getElementById('ResultText'),
	removeLastSentence = true,
	streamStreaming = false;



const constraints = {
	audio: true,
	video: false
};




function initRecording() {
	//send('startGoogleCloudStream', ''); //init socket Google Speech Connection
	streamStreaming = true;
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context = new AudioContext({
		// if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
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

function microphoneProcess(e) {
	var left = e.inputBuffer.getChannelData(0);
	var left16 = downsampleBuffer(left, 44100, 16000)

	try {
		//const buf = await blob.arrayBuffer();
		//await connection.invoke("ProcessSpeech", buf);
		debugger
		const data = new FormData();
		data.append('speechBlob', left16);


		
		axios.post("http://localhost:5000/api/processSpeech", data)
		.then(function(response){

			let resultText = document.getElementById('ResultText')

			if(response.data[0])
			{
				let newSpan = document.createElement('span');
				newSpan.innerHTML = response.data[0];

				resultText.lastElementChild.appendChild(newSpan);
				resultText.lastElementChild.appendChild(document.createTextNode('\u002E\u00A0'));
			}
			console.log(response)
		})
	} catch (err) {
		console.error(err);
	}
	//send it to server
}



//interface
var startButton = document.getElementById("startRecButton");
startButton.addEventListener("click", startRecording);

var endButton = document.getElementById("stopRecButton");
endButton.addEventListener("click", stopRecording);
endButton.disabled = true;

// var sendMessasgeButton = document.getElementById("sendMessageButton");
// sendMessasgeButton.addEventListener("click", sendMessage);

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
	// send('endGoogleCloudStream', '');


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

// //SignalR 
// const connection = new signalR.HubConnectionBuilder()
//     .withUrl("http://localhost:5000/speechToText")
//     .configureLogging(signalR.LogLevel.Information)
//     .build();

// async function start() {
//     try {
//         await connection.start();
//         console.log("SignalR Connected.");
//     } catch (err) {
//         console.log(err);
//         setTimeout(start, 5000);
//     }
// };

// connection.onclose(start);

// async function sendMessage(){
// 	try {
// 		await connection.invoke("SendMessage", "user", "message");
// 	} catch (err) {
// 		console.error(err);
// 	}
// }

// connection.on("ReceiveMessage", (user, message) => {
//     const li = document.createElement("li");
//     li.textContent = `${user}: ${message}`;
//     document.getElementById("messageList").appendChild(li);
// });

// // Start the connection.
// start();
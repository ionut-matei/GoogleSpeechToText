
let bufferSize = 2048,
	context,
	processor,
	input,
	globalStream,
	audioRecorder


let finalWord = false,
	resultText = document.getElementById('ResultText'),
	removeLastSentence = true,
	streamStreaming = false;

const constraints = {
	audio: true,
	video: false
};

//interface
var startButton = document.getElementById("startRecButton");
startButton.addEventListener("click", startRecording);

var endButton = document.getElementById("stopRecButton");
endButton.addEventListener("click", stopRecording);
endButton.disabled = true;

// var sendMessasgeButton = document.getElementById("sendMessageButton");
// sendMessasgeButton.addEventListener("click", sendMessage);

var recordingStatus = document.getElementById("recordingStatus");

function initRecording() {
	
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

			timeSlice: 2000,

			ondataavailable: async function (blob) {
				console.log("Speech chunk ready")
				
				try {
					//const buf = await blob.arrayBuffer();
					//await connection.invoke("ProcessSpeech", buf);
					
					const data = new FormData();
					data.append('speechBlob', blob);

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

async function startRecording() {
	//await connection.invoke("StartRecording");
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
	
	audioRecorder.stopRecording(function(){
		console.log("Audio recording stopped")
	})

}


// //SignalR 
// const connection = new signalR.HubConnectionBuilder()
//     .withUrl("http://localhost:5000/speechToText")
// 	.configureLogging(signalR.LogLevel.Information)
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

// connection.on("ReceiveMessage", (message) => {
//     const li = document.createElement("li");
//     li.textContent = `${message}`;
//     document.getElementById("messageList").appendChild(li);
// });

// // Start the connection.
// start();
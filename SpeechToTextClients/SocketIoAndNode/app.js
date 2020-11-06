'use strict';

const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const environmentVars = require('dotenv').config();

const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient(); // Creates a client

const app = express();

console.log("------------- process.env.PORT: " + process.env.PORT)

let port = process.env.PORT || 80;

console.log("------------- port: " + port)

app.set('port', port)
const server = require('http').createServer(app);

const io = require('socket.io')(server);

// =========================== SOCKET.IO ================================ //

io.on('connection', function (client) {
  console.log('Client Connected to server');
  let recognizeStream = null;

  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  client.on('startCloudStream', function (data) {
    startRecognitionStream(this, data);
  });

  client.on('endCloudStream', function () {
    stopRecognitionStream();
  });

  client.on('binaryData', function (data) {
    if (recognizeStream !== null) {
      recognizeStream.write(data);
    }
  });

  function startRecognitionStream(client) {
    recognizeStream = speechClient
      .streamingRecognize(request)
      .on('error', console.error)
      .on('data', (data) => {
        process.stdout.write(data.results[0] && data.results[0].alternatives[0] ? `Transcription: ${data.results[0].alternatives[0].transcript}\n` : '\n\nReached transcription time limit, press Ctrl+C\n');
        client.emit('speechData', data);

        // if end of utterance, let's restart stream
        // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
        if (data.results[0] && data.results[0].isFinal) {
          stopRecognitionStream();
          startRecognitionStream(client);
          // console.log('restarted stream serverside');
        }
      });
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
    }
    recognizeStream = null;
  }
});

// =========================== Speech recognition SETTINGS ================================ //

// The encoding of the audio file
const encoding = 'LINEAR16';
// The sample rate of the audio
const sampleRateHertz = 16000;
const languageCode = 'ro-RO'; 

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: true,
    enableWordTimeOffsets: true,
    enableAutomaticPunctuation: true

    // speechContexts: [{
    //     phrases: ["diagnistic","medicamente", "analize"]
    //    }] // add your own speech context for better recognition
  },
  interimResults: true, // If you want interim results, set this to true
};

// =========================== START SERVER ================================ //

app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
//app.set('view engine', 'html');

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  //res.sendFile('./public/index.html');
  res.sendFile('./public/index.html', { root: __dirname });
});

app.use('/', function (req, res, next) {
  next();
});

server.listen(port, function () {
  //http listen, to make socket work
  // app.address = "127.0.0.1";
  console.log('Server started on port:' + port);
});

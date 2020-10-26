# Synchronuous Cloud Speech Client

Synchronuous Google Speech Recognition 

## Run Local
4. run `npm install`
5. run `npm run watch:dev` or `npm run dev`
6. go to `http://127.0.0.1:3000/`


## Config

It's possible to set a recognition context / add misunderstood words for better recognition results in the app.js `request` params. For more details on the configuration, go [here](https://cloud.google.com/speech-to-text/docs/reference/rest/v1/RecognitionConfig#SpeechContext).

For other languages than english, look up your [language code](https://cloud.google.com/speech-to-text/docs/languages).

## How Does the Client Process the Stream?

The client sends audio content (once every x seconds for example) and Google Cloud sends the response after audio stream is processed. No intermittent responses are generated.


using Google.Cloud.Speech.V1;
using Microsoft.AspNetCore.SignalR;
using System;
using System.IO;
using System.Threading.Tasks;
using static Google.Cloud.Speech.V1.SpeechClient;

namespace SpeechToTextService.Hubs
{
    public class SpeechToTextHub : Hub
    {
        private SpeechClient _speechClient;
        private StreamingRecognizeStream _streamingRecognizeStream;
        private Task _sendResponses;
        public async Task SendMessage(string name, string message)
        {
            await Clients.All.SendAsync("ReceiveMessage", name, message);
        }

        public async Task StartRecording()
        {
            _speechClient = SpeechClient.Create();
            _streamingRecognizeStream = _speechClient.StreamingRecognize();

            // Write the initial request with the config.
            await _streamingRecognizeStream.WriteAsync(
                new StreamingRecognizeRequest()
                {
                    StreamingConfig = new StreamingRecognitionConfig()
                    {
                        Config = new RecognitionConfig()
                        {
                            Encoding =
                            RecognitionConfig.Types.AudioEncoding.Linear16,
                            SampleRateHertz = 16000,
                            LanguageCode = "ro"
                        },
                        InterimResults = false,
                        SingleUtterance = false
                    }
                });

            _sendResponses = Task.Run(async () =>
            {
                var responseStream = _streamingRecognizeStream.GetResponseStream();
                while (await responseStream.MoveNextAsync())
                {
                    StreamingRecognizeResponse response = responseStream.Current;
                    foreach (StreamingRecognitionResult result in response.Results)
                    {
                        foreach (SpeechRecognitionAlternative alternative in result.Alternatives)
                        {
                            await Clients.All.SendAsync("ReceiveMessage", alternative.Transcript);
                        }
                    }
                }
            });

            
        }

        public async Task StopRecording()
        {
            await _streamingRecognizeStream.WriteCompleteAsync();
        }

        public async Task ProcessSpeech(Stream stream)
        {
            await _streamingRecognizeStream.WriteAsync(new StreamingRecognizeRequest()
            {
                AudioContent = Google.Protobuf.ByteString.FromStream(stream)
            });

            await _sendResponses;
        }
    }
}

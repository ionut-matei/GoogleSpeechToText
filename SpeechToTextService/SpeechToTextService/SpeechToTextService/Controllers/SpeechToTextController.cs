using Google.Cloud.Speech.V1;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SpeechToTextService.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SpeechToTextService.Controllers
{
    [ApiController]
    public class SpeechToTextController: ControllerBase
    {
        [Route("api/processSpeech")]
        [HttpPost]
        public async Task<List<string>> ProcessSpeech(IFormFile speechBlob)
        {

            var speech = SpeechClient.Create();
            var response = speech.Recognize(new RecognitionConfig()
            {
                Encoding = RecognitionConfig.Types.AudioEncoding.Linear16,
                SampleRateHertz = 16000,
                LanguageCode = "ro",
            }, RecognitionAudio.FromStream(speechBlob.OpenReadStream()));

            var transcripts = new List<string>();

            foreach (var result in response.Results)
            {
                foreach (var alternative in result.Alternatives)
                {
                    transcripts.Add(alternative.Transcript);

                }
            }

            return await Task.FromResult(transcripts);
        }
        //[Route("api/processSpeech")]
        //[HttpPost]
        //public async Task<List<string>> ProcessSpeech([FromForm] byte[] speechBlob)
        //{

        //    var speech = SpeechClient.Create();
        //    var response = speech.Recognize(new RecognitionConfig()
        //    {
        //        Encoding = RecognitionConfig.Types.AudioEncoding.Linear16,
        //        SampleRateHertz = 16000,
        //        LanguageCode = "ro",
        //    }, RecognitionAudio.FromBytes(speechBlob));

        //    var transcripts = new List<string>();

        //    foreach (var result in response.Results)
        //    {
        //        foreach (var alternative in result.Alternatives)
        //        {
        //            transcripts.Add(alternative.Transcript);

        //        }
        //    }

        //    return await Task.FromResult(transcripts);
        //}

        [Route("api/get")]
        [HttpGet]
        public async Task<string> Get()
        {
            return await Task.FromResult("response");
        }
    }
}

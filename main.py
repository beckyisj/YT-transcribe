from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/transcript")
def get_transcript(video_id: str = Query(..., description="YouTube video ID")):
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        text = "\n".join([entry["text"] for entry in transcript])
        return {"success": True, "transcript": text}
    except (TranscriptsDisabled, NoTranscriptFound):
        return {"success": False, "error": "No transcript available for this video"}
    except Exception as e:
        return {"success": False, "error": str(e)} 
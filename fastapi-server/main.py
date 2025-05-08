from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from typing import Dict, List, Optional

app = FastAPI(title="Transcription API", description="API for retrieving podcast transcriptions")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to store transcription data
TRANSCRIPTIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "transcriptions")
os.makedirs(TRANSCRIPTIONS_DIR, exist_ok=True)

class Transcription(BaseModel):
    id: str
    title: Optional[str] = None
    source_type: str  # "file" or "youtube"
    source_name: str
    text: str
    timestamp: str

@app.get("/")
async def root():
    return {"message": "Welcome to the Transcription API"}

@app.get("/transcriptions", response_model=List[Dict])
async def get_all_transcriptions():
    """Get a list of all available transcriptions."""
    transcriptions = []
    
    try:
        for filename in os.listdir(TRANSCRIPTIONS_DIR):
            if filename.endswith('.json'):
                with open(os.path.join(TRANSCRIPTIONS_DIR, filename), 'r') as f:
                    data = json.load(f)
                    # Add a simplified preview
                    transcriptions.append({
                        "id": data["id"],
                        "title": data.get("title", "Untitled"),
                        "source_type": data["source_type"],
                        "source_name": data["source_name"],
                        "timestamp": data["timestamp"],
                        "preview": data["text"][:100] + "..." if len(data["text"]) > 100 else data["text"]
                    })
        return transcriptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading transcriptions: {str(e)}")

@app.get("/transcriptions/{transcription_id}", response_model=Transcription)
async def get_transcription(transcription_id: str):
    """Get a specific transcription by ID."""
    try:
        filepath = os.path.join(TRANSCRIPTIONS_DIR, f"{transcription_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Transcription not found")
            
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error retrieving transcription: {str(e)}")

@app.post("/transcriptions", response_model=Transcription)
async def save_transcription(transcription: Transcription):
    """Save a new transcription."""
    try:
        filepath = os.path.join(TRANSCRIPTIONS_DIR, f"{transcription.id}.json")
        with open(filepath, 'w') as f:
            json.dump(transcription.dict(), f, indent=2)
        return transcription
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving transcription: {str(e)}")

@app.delete("/transcriptions/{transcription_id}")
async def delete_transcription(transcription_id: str):
    """Delete a transcription by ID."""
    try:
        filepath = os.path.join(TRANSCRIPTIONS_DIR, f"{transcription_id}.json")
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Transcription not found")
            
        os.remove(filepath)
        return {"message": f"Transcription {transcription_id} deleted successfully"}
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error deleting transcription: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
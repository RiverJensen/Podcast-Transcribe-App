# FastAPI Transcription Server

This is a FastAPI-based server that provides a REST API for retrieving podcast transcriptions. The server stores and serves transcription data in JSON format.

## API Endpoints

### Get all transcriptions
```
GET /transcriptions
```
Returns a list of all available transcriptions with preview data.

### Get a specific transcription
```
GET /transcriptions/{transcription_id}
```
Returns the full transcription data for a specific ID.

### Save a new transcription
```
POST /transcriptions
```
Saves a new transcription. The request body should be a JSON object with the following structure:
```json
{
  "id": "unique-id",
  "title": "Title of the transcription",
  "source_type": "file or youtube",
  "source_name": "filename or YouTube URL",
  "text": "Full transcription text",
  "timestamp": "ISO timestamp"
}
```

### Delete a transcription
```
DELETE /transcriptions/{transcription_id}
```
Deletes a specific transcription by ID.

## Integration with Main Application

The FastAPI server is started automatically when the main Node.js server starts. It runs on port 8000 by default.

The main application communicates with this server by:
1. Saving transcriptions when they are created
2. Providing links to view transcription data via the API

## Documentation

Interactive API documentation is available at:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## Data Storage

Transcription data is stored as JSON files in the `transcriptions` directory. 
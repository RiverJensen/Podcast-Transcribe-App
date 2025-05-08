# Podcast Transcription App

A web application for transcribing podcast audio and video files using AI.

## Features

- Upload audio or video files for transcription (up to 50MB)
- Transcribe YouTube videos by URL (up to 20 minutes)
- Display audio waveforms and video playback
- Store and retrieve transcriptions
- Search through transcription content

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following:

```
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

4. Start the server:

```bash
npm start
```

5. Open your browser to [http://localhost:3000](http://localhost:3000)

## Using the App

1. Upload an audio/video file or enter a YouTube URL
2. Wait for the transcription to complete
3. View and interact with the transcription results
4. Access your transcription history

## API Endpoints

- `GET /api/transcription` - Get all transcriptions
- `GET /api/transcription/:id` - Get a specific transcription
- `POST /api/transcription` - Upload and transcribe a file
- `POST /api/transcription/youtube` - Transcribe from YouTube URL
- `DELETE /api/transcription/:id` - Delete a transcription

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
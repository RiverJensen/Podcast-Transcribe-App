# Podcast Transcription App

A web application for transcribing audio and video files using OpenAI's Whisper API.

## Features

- Upload and transcribe audio/video files
- Transcribe YouTube videos by URL
- Visualize audio with waveforms using WaveSurfer.js
- Play video files with native video controls
- Store transcriptions in Supabase database
- View and manage transcription history

## Project Structure

- **Frontend**: React.js application with two-page structure
- **Backend**: Node.js/Express server with modular architecture
- **Storage**: Supabase SQL database
- **Transcription**: OpenAI Whisper API

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/podcast-transcribe-app.git
   cd podcast-transcribe-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create `.env` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ```

4. Add a test video:
   - Create directories: `public/TestVideo/` and `TestVideo/`
   - Add a test video file named `RPReplay_Final1701485574.mov` to both directories
   - The app is configured to use this specific file for testing purposes

5. Start the application:
   ```
   npm run dev
   ```

## Using the App

### Upload Page
- Drag and drop audio/video files or click to browse
- Enter YouTube URL for transcription
- Click "Use Test Video" to use the default test video

### Editor Page
- View the uploaded media (video player or audio waveform)
- Control playback with play/pause button or native controls
- View the transcription as it processes
- Access transcription details and history

## Development Mode

In development mode (NODE_ENV=development), the app automatically redirects to the editor page with the test video loaded for convenience during development.

## Supabase Integration

For information on Supabase setup, refer to [SUPABASE_SETUP.md](SUPABASE_SETUP.md).

## License

MIT 
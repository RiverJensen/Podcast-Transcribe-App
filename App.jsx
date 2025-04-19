import React, { useState, useCallback } from "react";
import "./App.css";

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      startTranscription(file);
    } else {
      alert('Please upload an audio or video file');
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      startTranscription(file);
    } else {
      alert('Please upload an audio or video file');
    }
  }, []);

  const startTranscription = async (file) => {
    setIsTranscribing(true);
    setTranscription("Transcribing...");
    
    try {
      // Here you would integrate with your transcription service
      // For now, we'll simulate a transcription
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTranscription("This is a sample transcription. In a real app, this would be the actual transcribed text from your audio file.");
    } catch (error) {
      setTranscription("Error during transcription. Please try again.");
      console.error("Transcription error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        Podcast to Transcribe Explanation
      </header>
      <main className="App-main">
        <div className="audio-upload">
          <h2>Audio File Drop</h2>
          <div 
            className={`drop-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input').click()}
          >
            {selectedFile ? (
              <p>Selected file: {selectedFile.name}</p>
            ) : (
              <p>Drag and drop an audio file here or click to upload.</p>
            )}
            <input
              id="file-input"
              type="file"
              accept="audio/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        </div>
        <div className="audio-controls">
          <h2>Audio Scrubber and Progress Bar</h2>
          <div className="scrubber">
            {/* Placeholder for audio controls */}
            <p>Audio controls will go here.</p>
          </div>
        </div>
        <div className="transcription">
          <h2>Transcribed Text</h2>
          <div className="transcription-text">
            {isTranscribing ? (
              <div className="transcribing-indicator">
                <p>Transcribing...</p>
                <div className="loading-spinner"></div>
              </div>
            ) : (
              <p>{transcription || "No transcription available. Upload a file to begin."}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
import React, { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";
import WaveSurfer from "wavesurfer.js";

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (waveformRef.current) {
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#4CAF50',
        progressColor: '#2E7D32',
        cursorColor: '#2E7D32',
        barWidth: 2,
        barRadius: 3,
        responsive: true,
        height: 100,
        normalize: true,
        partialRender: true
      });

      wavesurfer.current.on('ready', () => {
        console.log('Waveform is ready');
      });

      wavesurfer.current.on('audioprocess', () => {
        setIsPlaying(true);
      });

      wavesurfer.current.on('pause', () => {
        setIsPlaying(false);
      });

      wavesurfer.current.on('finish', () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, []);

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
      setIsVideo(file.type.startsWith('video/'));
      handleFileLoad(file);
    } else {
      alert('Please upload an audio or video file');
    }
  }, []);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      setIsVideo(file.type.startsWith('video/'));
      handleFileLoad(file);
    } else {
      alert('Please upload an audio or video file');
    }
  }, []);

  const handleFileLoad = (file) => {
    const mediaUrl = URL.createObjectURL(file);
    if (isVideo) {
      if (videoRef.current) {
        videoRef.current.src = mediaUrl;
      }
    } else {
      if (wavesurfer.current) {
        wavesurfer.current.load(mediaUrl);
      }
    }
    startTranscription(file);
  };

  const togglePlayPause = () => {
    if (isVideo) {
      if (videoRef.current) {
        if (videoRef.current.paused) {
          videoRef.current.play();
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else {
      if (wavesurfer.current) {
        wavesurfer.current.playPause();
      }
    }
  };

  const startTranscription = async (file) => {
    setIsTranscribing(true);
    setTranscription("Transcribing...");
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3001/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscription(data.transcription);
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
          <h2>Media File Drop</h2>
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
              <p>Drag and drop an audio or video file here or click to upload.</p>
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
        <div className="media-controls">
          <h2>{isVideo ? 'Video Player' : 'Audio Waveform'}</h2>
          <div className="media-container">
            {isVideo ? (
              <div className="video-container">
                <video
                  ref={videoRef}
                  className="video-player"
                  controls={false}
                />
              </div>
            ) : (
              <div ref={waveformRef} className="waveform"></div>
            )}
            <button 
              className="play-button"
              onClick={togglePlayPause}
              disabled={!selectedFile}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
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
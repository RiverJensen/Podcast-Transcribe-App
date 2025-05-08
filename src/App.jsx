import React, { useState, useCallback, useRef, useEffect } from "react";
import "./App.css";
import WaveSurfer from "wavesurfer.js";

function App() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcription, setTranscription] = useState("");
  const [transcriptionId, setTranscriptionId] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [processingYoutube, setProcessingYoutube] = useState(false);
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
    setTranscriptionId(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:3002/api/transcription', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      setTranscription(data.transcription);
      if (data.transcriptionId) {
        setTranscriptionId(data.transcriptionId);
      }
    } catch (error) {
      setTranscription("Error during transcription. Please try again.");
      console.error("Transcription error:", error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleYoutubeUrlChange = (e) => {
    setYoutubeUrl(e.target.value);
  };

  const handleYoutubeSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) {
      alert('Please enter a YouTube URL');
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeRegex.test(youtubeUrl)) {
      alert('Please enter a valid YouTube URL');
      return;
    }

    setProcessingYoutube(true);
    setIsTranscribing(true);
    setTranscription("Processing YouTube video and transcribing...");
    setTranscriptionId(null);

    try {
      const response = await fetch('http://localhost:3002/api/transcription/youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process YouTube video');
      }

      const data = await response.json();
      
      // If video title is returned, show it
      if (data.videoTitle) {
        setTranscription(`${data.videoTitle}\n\n${data.transcription}`);
      } else {
        setTranscription(data.transcription);
      }

      // Set transcription ID if available
      if (data.transcriptionId) {
        setTranscriptionId(data.transcriptionId);
      }
    } catch (error) {
      setTranscription(`Error: ${error.message || 'Failed to process YouTube video'}`);
      console.error("YouTube processing error:", error);
    } finally {
      setIsTranscribing(false);
      setProcessingYoutube(false);
    }
  };

  // Get all transcriptions
  const getAllTranscriptions = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/transcription');
      if (!response.ok) {
        throw new Error('Failed to fetch transcriptions');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      return [];
    }
  };

  // Get a single transcription by ID
  const getTranscription = async (id) => {
    try {
      const response = await fetch(`http://localhost:3002/api/transcription/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch transcription');
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching transcription ${id}:`, error);
      return null;
    }
  };

  // View all transcriptions
  const viewAllTranscriptions = async () => {
    try {
      const transcriptions = await getAllTranscriptions();
      
      // Create a new window with formatted transcriptions list
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>All Transcriptions</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              .transcription-item { 
                margin-bottom: 20px; 
                padding: 15px; 
                border: 1px solid #ddd; 
                border-radius: 5px;
              }
              .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .meta { color: #666; font-size: 14px; margin-bottom: 10px; }
              .preview { color: #333; }
              .view-btn {
                padding: 5px 10px;
                background-color: #2196F3;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <h1>All Transcriptions</h1>
            ${transcriptions.length === 0 ? '<p>No transcriptions found.</p>' : 
              transcriptions.map(t => `
                <div class="transcription-item">
                  <div class="title">${t.title || 'Untitled'}</div>
                  <div class="meta">
                    Source: ${t.source_type} | Date: ${new Date(t.created_at).toLocaleString()}
                  </div>
                  <div class="preview">
                    ${t.text.substring(0, 150)}${t.text.length > 150 ? '...' : ''}
                  </div>
                  <a href="http://localhost:3002/api/transcription/${t.id}" target="_blank" class="view-btn">
                    View Full Transcription
                  </a>
                </div>
              `).join('')
            }
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error('Error displaying transcriptions:', error);
      alert('Failed to load transcriptions. See console for details.');
    }
  };

  // View a single transcription in a new window
  const viewTranscription = async () => {
    if (!transcriptionId) return;
    
    try {
      const data = await getTranscription(transcriptionId);
      if (!data) {
        throw new Error('Transcription not found');
      }
      
      // Open a new window with formatted transcription
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head>
            <title>${data.title || 'Transcription'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; line-height: 1.6; }
              h1 { color: #333; }
              .meta { color: #666; margin-bottom: 20px; }
              .text { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h1>${data.title || 'Transcription'}</h1>
            <div class="meta">
              <p><strong>Source:</strong> ${data.source_type}</p>
              <p><strong>Date:</strong> ${new Date(data.created_at).toLocaleString()}</p>
              ${data.source_type === 'youtube' ? 
                `<p><strong>YouTube:</strong> <a href="${data.source_name}" target="_blank">${data.source_name}</a></p>` : 
                `<p><strong>File:</strong> ${data.source_name}</p>`
              }
            </div>
            <div class="text">${data.text}</div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.error('Error displaying transcription:', error);
      alert('Failed to load transcription. See console for details.');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        Podcast to Transcribe Explanation
      </header>
      <main className="App-main">
        <div className="audio-upload">
          <h2>Upload Media</h2>
          <div className="upload-options">
            <div className="upload-section">
              <h3>Option 1: Upload File</h3>
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

            <div className="upload-section">
              <h3>Option 2: YouTube URL</h3>
              <form onSubmit={handleYoutubeSubmit} className="youtube-form">
                <input
                  type="text"
                  placeholder="Paste YouTube URL here"
                  value={youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  className="youtube-input"
                  disabled={processingYoutube}
                />
                <button 
                  type="submit" 
                  className="youtube-submit-btn"
                  disabled={!youtubeUrl || processingYoutube}
                >
                  {processingYoutube ? 'Processing...' : 'Transcribe'}
                </button>
              </form>
            </div>
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
              disabled={!selectedFile && !processingYoutube}
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
              <>
                <p>{transcription || "No transcription available. Upload a file or provide a YouTube URL to begin."}</p>
                {transcriptionId && (
                  <div className="transcription-info">
                    <p className="transcription-id">
                      Transcription ID: <code>{transcriptionId}</code>
                    </p>
                    <div className="api-buttons">
                      <button onClick={viewTranscription} className="api-button">
                        View This Transcription
                      </button>
                      <button onClick={viewAllTranscriptions} className="api-button">
                        View All Transcriptions
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [processingYoutube, setProcessingYoutube] = useState(false);
  const navigate = useNavigate();

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
      const isVideoFile = file.type.startsWith('video/');
      
      // Navigate to editor with the file
      const fileObj = {
        name: file.name,
        type: file.type,
        isVideo: isVideoFile,
        url: URL.createObjectURL(file)
      };
      navigate("/editor", { state: { file: fileObj, source: "upload" } });
    } else {
      alert('Please upload an audio or video file');
    }
  }, [navigate]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      setSelectedFile(file);
      const isVideoFile = file.type.startsWith('video/');
      
      // Navigate to editor with the file
      const fileObj = {
        name: file.name,
        type: file.type,
        isVideo: isVideoFile,
        url: URL.createObjectURL(file)
      };
      navigate("/editor", { state: { file: fileObj, source: "upload" } });
    } else {
      alert('Please upload an audio or video file');
    }
  }, [navigate]);

  const loadTestVideo = () => {
    // Navigate to editor with test video
    navigate("/editor", { state: { useTestVideo: true } });
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

    // Navigate to editor with YouTube URL
    navigate("/editor", { state: { youtubeUrl, source: "youtube" } });
  };

  return (
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
          <button 
            onClick={loadTestVideo} 
            className="test-video-btn"
          >
            Use Test Video
          </button>
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
  );
}

export default UploadPage; 
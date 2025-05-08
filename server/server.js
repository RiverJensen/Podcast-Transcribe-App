const express = require('express');
const cors = require('cors');
const path = require('path');
const { fork } = require('child_process');
require('dotenv').config();

// Import routes
const transcriptionRoutes = require('./routes/transcription');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/transcription', transcriptionRoutes);

// Add FastAPI proxy route
app.use('/api/fastapi', async (req, res) => {
    const fastApiUrl = `http://localhost:8000${req.url}`;
    try {
        const axios = require('axios');
        const response = await axios({
            method: req.method,
            url: fastApiUrl,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('FastAPI proxy error:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'FastAPI server error',
            details: error.message
        });
    }
});

// For any other routes, serve the index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start FastAPI server
let fastApiProcess = null;
function startFastApiServer() {
    console.log('Starting FastAPI server...');
    const fastApiPath = path.join(__dirname, '..', 'fastapi-server', 'start.js');
    fastApiProcess = fork(fastApiPath);
    
    fastApiProcess.on('error', (error) => {
        console.error('Failed to start FastAPI server:', error);
    });
    
    fastApiProcess.on('exit', (code) => {
        console.log(`FastAPI server exited with code ${code}`);
        if (code !== 0) {
            // Restart the server if it crashes
            setTimeout(startFastApiServer, 5000);
        }
    });
}

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
    
    // Start FastAPI server
    startFastApiServer();
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    
    // Kill FastAPI process if it exists
    if (fastApiProcess) {
        fastApiProcess.kill();
    }
    
    process.exit(0);
}); 
const express = require('express');
const cors = require('cors');
const path = require('path');
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

// For any other routes, serve the index.html file for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 
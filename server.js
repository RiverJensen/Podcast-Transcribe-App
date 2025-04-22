const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle file upload and transcription
app.post('/transcribe', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create a readable stream from the uploaded file
        const fileStream = fs.createReadStream(req.file.path);

        const transcription = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        // Clean up - delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        res.json({ transcription: transcription.text });
    } catch (error) {
        console.error('Transcription error:', error);
        
        // Clean up in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 
const fs = require('fs');
const OpenAI = require('openai');
const openaiConfig = require('../config/openai');

// Create OpenAI instance
const openai = new OpenAI({
    apiKey: openaiConfig.apiKey
});

/**
 * Transcribe audio/video file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transcribeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Create a readable stream from the uploaded file
        const fileStream = fs.createReadStream(req.file.path);

        // Send file to OpenAI for transcription
        const transcription = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        // Clean up - delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        // Return the transcription
        res.json({ transcription: transcription.text });
    } catch (error) {
        console.error('Transcription error:', error);
        
        // Clean up in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: 'Transcription failed', 
            details: error.message 
        });
    }
}; 
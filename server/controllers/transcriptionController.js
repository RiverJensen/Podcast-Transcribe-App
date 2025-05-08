const fs = require('fs');
const OpenAI = require('openai');
const openaiConfig = require('../config/openai');
const path = require('path');

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

        console.log('File received:', req.file.originalname, 'Size:', req.file.size, 'bytes', 'Type:', req.file.mimetype);
        
        // Check file size - OpenAI has a 25MB limit
        if (req.file.size > 25 * 1024 * 1024) {
            return res.status(400).json({ 
                error: 'File too large', 
                details: 'OpenAI has a 25MB file size limit. Please upload a smaller file.' 
            });
        }

        // Create a readable stream from the uploaded file
        const fileStream = fs.createReadStream(req.file.path);

        // Set a longer timeout for the OpenAI API call
        const transcriptionPromise = openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        // Add a timeout to the promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('OpenAI API request timed out after 30 seconds')), 30000);
        });

        // Race the transcription against the timeout
        const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);

        // Clean up - delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        // Return the transcription
        console.log('Transcription successful, returning text');
        res.json({ transcription: transcription.text });
    } catch (error) {
        console.error('Transcription error details:', error);
        
        // Clean up in case of error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        // Provide more helpful error messages
        let errorMessage = 'Transcription failed';
        let errorDetails = error.message;
        
        if (error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
            errorMessage = 'Connection to OpenAI was reset';
            errorDetails = 'This usually happens due to network issues or when processing large files. Try a smaller file or check your internet connection.';
        } else if (error.status === 401) {
            errorMessage = 'Invalid API key';
            errorDetails = 'Your OpenAI API key may be invalid or expired.';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: errorDetails 
        });
    }
}; 
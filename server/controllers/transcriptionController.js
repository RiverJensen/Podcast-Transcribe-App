const fs = require('fs');
const OpenAI = require('openai');
const openaiConfig = require('../config/openai');
const path = require('path');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { v4: uuidv4 } = require('uuid');
const transcriptionService = require('../services/transcriptionService');

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Create OpenAI instance
const openai = new OpenAI({
    apiKey: openaiConfig.apiKey
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Make sure default data exists on server startup
transcriptionService.ensureDefaultSampleExists().then(() => {
    console.log('Default transcription sample checked/created');
}).catch(error => {
    console.error('Error ensuring default sample:', error);
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
        
        // Check file size - Increasing OpenAI's limit to allow for 2-minute videos
        // The 25MB limit is being increased to 50MB to accommodate larger video files
        if (req.file.size > 50 * 1024 * 1024) {
            return res.status(400).json({ 
                error: 'File too large', 
                details: 'File size limit is 50MB. Please upload a smaller file.' 
            });
        }

        // Create a readable stream from the uploaded file
        const fileStream = fs.createReadStream(req.file.path);

        // Set a longer timeout for the OpenAI API call
        const transcriptionPromise = openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        // Add a timeout to the promise - increasing from 30 seconds to 2 minutes for larger files
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('OpenAI API request timed out after 2 minutes')), 120000);
        });

        // Race the transcription against the timeout
        const transcription = await Promise.race([transcriptionPromise, timeoutPromise]);

        // Generate a unique ID for the transcription
        const transcriptionId = uuidv4();
        
        // Create transcription data object
        const now = new Date().toISOString();
        const transcriptionData = {
            id: transcriptionId,
            title: req.file.originalname,
            source_type: "file",
            source_name: req.file.originalname,
            text: transcription.text,
            created_at: now,
            file_type: req.file.mimetype,
            file_size: req.file.size
        };

        // Save to Supabase
        const savedTranscription = await transcriptionService.saveTranscription(transcriptionData);

        // Clean up - delete the uploaded file after processing
        fs.unlinkSync(req.file.path);

        // Return the transcription
        console.log('Transcription successful, returning text');
        res.json({ 
            transcription: transcription.text,
            transcriptionId: transcriptionId
        });
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

/**
 * Transcribe audio from YouTube URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.transcribeYouTube = async (req, res) => {
    const { youtubeUrl } = req.body;
    const tempFilePath = path.join(uploadsDir, `youtube-${Date.now()}.mp3`);

    try {
        // Validate YouTube URL
        if (!youtubeUrl) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        // Validate if URL is a valid YouTube URL
        if (!ytdl.validateURL(youtubeUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        console.log('Processing YouTube URL:', youtubeUrl);

        // Get info about the video
        const info = await ytdl.getInfo(youtubeUrl);
        const videoTitle = info.videoDetails.title;
        console.log('YouTube video title:', videoTitle);

        // Check video duration - Increasing from 10 minutes to allow for any reasonable podcast length
        const videoDurationSec = parseInt(info.videoDetails.lengthSeconds);
        // Allow videos up to 20 minutes (1200 seconds)
        if (videoDurationSec > 1200) {
            return res.status(400).json({
                error: 'Video too long',
                details: 'Videos longer than 20 minutes cannot be processed. Please choose a shorter video.'
            });
        }

        // Download and convert to MP3
        await new Promise((resolve, reject) => {
            console.log('Downloading and converting YouTube audio...');
            // Download audio only
            const stream = ytdl(youtubeUrl, {
                quality: 'highestaudio',
                filter: 'audioonly'
            });

            // Convert to MP3 using ffmpeg
            ffmpeg(stream)
                .audioBitrate(128)
                .toFormat('mp3')
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error('Failed to convert YouTube video to MP3'));
                })
                .on('end', () => {
                    console.log('YouTube audio extraction finished');
                    resolve();
                })
                .save(tempFilePath);
        });

        // Check file size - Increasing OpenAI's limit to match our new 50MB limit
        const fileStats = fs.statSync(tempFilePath);
        if (fileStats.size > 50 * 1024 * 1024) {
            fs.unlinkSync(tempFilePath);
            return res.status(400).json({
                error: 'File too large',
                details: 'The extracted audio exceeds the 50MB limit. Please choose a shorter video.'
            });
        }

        // Create a readable stream from the converted file
        const fileStream = fs.createReadStream(tempFilePath);

        // Transcribe the audio using OpenAI
        console.log('Transcribing YouTube audio...');
        const transcription = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        // Generate a unique ID for the transcription
        const transcriptionId = uuidv4();
        
        // Create transcription data object
        const now = new Date().toISOString();
        const transcriptionData = {
            id: transcriptionId,
            title: videoTitle,
            source_type: "youtube",
            source_name: youtubeUrl,
            text: transcription.text,
            created_at: now,
            video_id: info.videoDetails.videoId,
            duration: videoDurationSec,
            author: info.videoDetails.author.name
        };

        // Save to Supabase
        const savedTranscription = await transcriptionService.saveTranscription(transcriptionData);

        // Clean up the temporary file
        fs.unlinkSync(tempFilePath);

        // Return the transcription
        console.log('YouTube transcription successful, returning text');
        res.json({
            transcription: transcription.text,
            videoTitle: videoTitle,
            transcriptionId: transcriptionId
        });
    } catch (error) {
        console.error('YouTube transcription error:', error);
        
        // Clean up temporary file if it exists
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        // Provide helpful error messages
        let errorMessage = 'YouTube transcription failed';
        let errorDetails = error.message;
        
        if (error.message.includes('Video unavailable')) {
            errorMessage = 'YouTube video unavailable';
            errorDetails = 'The video may be private, deleted, or region-restricted.';
        } else if (error.code === 'ECONNRESET' || error.cause?.code === 'ECONNRESET') {
            errorMessage = 'Connection to OpenAI was reset';
            errorDetails = 'This usually happens due to network issues or when processing large files.';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: errorDetails 
        });
    }
};

/**
 * Get all transcriptions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllTranscriptions = async (req, res) => {
    try {
        // Get optional filter parameters
        const { source_type } = req.query;
        
        // Get transcriptions from Supabase with optional filters
        const transcriptions = await transcriptionService.getAllTranscriptions({
            source_type: source_type
        });
        
        res.json(transcriptions);
    } catch (error) {
        console.error('Error getting transcriptions:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve transcriptions', 
            details: error.message 
        });
    }
};

/**
 * Get a single transcription by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getTranscription = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get transcription from Supabase
        const transcription = await transcriptionService.getTranscription(id);
        
        if (!transcription) {
            return res.status(404).json({ error: 'Transcription not found' });
        }
        
        res.json(transcription);
    } catch (error) {
        console.error(`Error getting transcription ${req.params.id}:`, error);
        res.status(500).json({ 
            error: 'Failed to retrieve transcription', 
            details: error.message 
        });
    }
};

/**
 * Delete a transcription by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteTranscription = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Delete from Supabase
        await transcriptionService.deleteTranscription(id);
        
        res.json({ message: `Transcription ${id} deleted successfully` });
    } catch (error) {
        console.error(`Error deleting transcription ${req.params.id}:`, error);
        res.status(500).json({ 
            error: 'Failed to delete transcription', 
            details: error.message 
        });
    }
};

/**
 * Search transcriptions by content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.searchTranscriptions = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        // Search transcriptions in Supabase
        const results = await transcriptionService.searchTranscriptions(q);
        
        res.json(results);
    } catch (error) {
        console.error('Error searching transcriptions:', error);
        res.status(500).json({ 
            error: 'Failed to search transcriptions', 
            details: error.message 
        });
    }
}; 
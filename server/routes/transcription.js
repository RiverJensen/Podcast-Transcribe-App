const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');
const upload = require('../middleware/upload');

// POST /api/transcription - Transcribe uploaded file
router.post('/', upload.single('file'), transcriptionController.transcribeAudio);

// POST /api/transcription/youtube - Transcribe YouTube video
router.post('/youtube', express.json(), transcriptionController.transcribeYouTube);

module.exports = router; 
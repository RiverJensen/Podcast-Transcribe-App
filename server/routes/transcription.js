const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');
const upload = require('../middleware/upload');

// POST /api/transcription - Transcribe uploaded file
router.post('/', upload.single('file'), transcriptionController.transcribeAudio);

// POST /api/transcription/youtube - Transcribe YouTube video
router.post('/youtube', express.json(), transcriptionController.transcribeYouTube);

// GET /api/transcription/search - Search transcriptions
router.get('/search', transcriptionController.searchTranscriptions);

// GET /api/transcription - Get all transcriptions
router.get('/', transcriptionController.getAllTranscriptions);

// GET /api/transcription/:id - Get a single transcription by ID
router.get('/:id', transcriptionController.getTranscription);

// DELETE /api/transcription/:id - Delete a transcription by ID
router.delete('/:id', transcriptionController.deleteTranscription);

module.exports = router; 
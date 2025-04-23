const express = require('express');
const router = express.Router();
const transcriptionController = require('../controllers/transcriptionController');
const upload = require('../middleware/upload');

// POST /api/transcription
router.post('/', upload.single('file'), transcriptionController.transcribeAudio);

module.exports = router; 
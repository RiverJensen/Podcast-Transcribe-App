const { PythonShell } = require('python-shell');
const path = require('path');

// Determine if we're in production
const isDev = process.env.NODE_ENV !== 'production';

// Log that we're starting the FastAPI server
console.log('Starting FastAPI Transcription server...');

// Options for the Python shell
const options = {
  mode: 'text',
  pythonPath: 'python3', // Use python3 executable
  pythonOptions: ['-u'], // Get print results in real-time
  scriptPath: __dirname,
  args: []
};

// Start the Python FastAPI server
let pyshell = new PythonShell('main.py', options);

// Print Python output
pyshell.on('message', function (message) {
  console.log('FastAPI server:', message);
});

// Handle errors
pyshell.on('error', function (err) {
  console.error('FastAPI server error:', err);
});

// Exit handler
pyshell.on('close', function () {
  console.log('FastAPI server closed');
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Stopping FastAPI server...');
  pyshell.terminate();
  process.exit();
});

console.log('FastAPI Transcription server running at http://localhost:8000');
console.log('API documentation available at http://localhost:8000/docs'); 
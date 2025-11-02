// ========================================
// FULL-STACK AIRPLANE INSPECTION APP
// Backend Server - Node.js/Express
// ========================================

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE SETUP
// ========================================

// Enable CORS for mobile and browser access
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from frontend public directory
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Configure multer for file uploads (in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Only accept image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// ========================================
// ROBOFLOW API CONFIGURATION
// ========================================
const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || 'YOUR_KEY_HERE';
const ROBOFLOW_MODEL_ID = process.env.ROBOFLOW_MODEL_ID || 'YOUR_MODEL_ID_HERE';
const ROBOFLOW_API_URL = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}`;

// ========================================
// API ENDPOINTS
// ========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Airplane Inspection API is running',
        timestamp: new Date().toISOString()
    });
});

// Analyze image endpoint with error handling wrapper (supports single or multiple images)
app.post('/api/analyze', (req, res, next) => {
    upload.any()(req, res, (err) => {
        // Handle multer errors
        if (err) {
            // File type validation error
            if (err.message === 'Only image files are allowed') {
                return res.status(400).json({
                    error: 'Invalid file type',
                    message: 'Only image files are allowed'
                });
            }
            // Other multer errors
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        error: 'File too large',
                        message: 'Image must be less than 10MB'
                    });
                }
                return res.status(400).json({
                    error: 'Upload error',
                    message: err.message
                });
            }
            // Pass other errors to error handler
            return next(err);
        }
        // No error, proceed to handler
        next();
    });
}, async (req, res) => {
    try {
        // Check if files were uploaded FIRST (before API config check for proper error codes)
        const files = req.files || (req.file ? [req.file] : []);
        if (!files || files.length === 0) {
            return res.status(400).json({
                error: 'No images provided',
                message: 'Please upload at least one image file'
            });
        }

        // Check if API is configured (using placeholder check)
        if (ROBOFLOW_API_KEY === 'YOUR_KEY_HERE' || ROBOFLOW_MODEL_ID === 'YOUR_MODEL_ID_HERE' || 
            !ROBOFLOW_API_KEY || !ROBOFLOW_MODEL_ID) {
            return res.status(500).json({
                error: 'API not configured',
                message: 'Please set ROBOFLOW_API_KEY and ROBOFLOW_MODEL_ID in your .env file'
            });
        }

        // Get the selected area from request body
        const selectedArea = req.body.area || 'unknown';

        // Process all images
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                // Prepare FormData for Roboflow API
                const formData = new FormData();
                
                // Create a buffer from the uploaded file
                formData.append('file', file.buffer, {
                    filename: file.originalname || `image_${i + 1}.jpg`,
                    contentType: file.mimetype
                });

                // Call Roboflow API
                const response = await axios.post(
                    `${ROBOFLOW_API_URL}?api_key=${ROBOFLOW_API_KEY}`,
                    formData,
                    {
                        headers: {
                            ...formData.getHeaders()
                        },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                // Store results with image index
                results.push({
                    imageIndex: i,
                    imageName: file.originalname || `image_${i + 1}.jpg`,
                    predictions: (response.data.predictions || []).map(p => ({
                        ...p,
                        imageIndex: i,
                        imageName: file.originalname || `image_${i + 1}.jpg`
                    })),
                    image_width: response.data.image?.width || null,
                    image_height: response.data.image?.height || null
                });
            } catch (error) {
                console.error(`Error processing image ${i + 1}:`, error);
                // Continue with other images even if one fails
                results.push({
                    imageIndex: i,
                    imageName: file.originalname || `image_${i + 1}.jpg`,
                    error: error.message || 'Failed to process image',
                    predictions: []
                });
            }
        }

        // Aggregate all predictions
        const allPredictions = results.flatMap(r => r.predictions || []);
        
        // Return aggregated results
        res.json({
            success: true,
            area: selectedArea,
            results: results, // Individual image results
            predictions: allPredictions, // All predictions flattened
            image_count: results.length,
            total_defects: allPredictions.length
        });

    } catch (error) {
        console.error('Error analyzing image:', error);
        
        // Handle specific error cases
        if (error.response) {
            const status = error.response.status || 500;
            const statusText = error.response.statusText || 'Unknown error';
            const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
            
            // Provide helpful error messages based on status code
            let userMessage = errorMessage;
            
            if (status === 403) {
                userMessage = 'Access forbidden. Possible issues:\n' +
                    '1. Invalid API key - Check your Roboflow API key in .env file\n' +
                    '2. API key doesn\'t have permission for this model\n' +
                    '3. Model ID might be incorrect - Format should be: project-name/version-number\n' +
                    '4. Model might not be deployed or public\n\n' +
                    `Error details: ${errorMessage}`;
            } else if (status === 401) {
                userMessage = 'Unauthorized. Check your Roboflow API key in .env file.';
            } else if (status === 404) {
                userMessage = 'Model not found. Check your MODEL_ID in .env file. Format: project-name/version-number';
            }
            
            // Roboflow API error
            res.status(status).json({
                error: 'Roboflow API error',
                message: userMessage,
                status: status,
                statusText: statusText,
                roboflowError: errorMessage
            });
        } else if (error.code === 'LIMIT_FILE_SIZE') {
            // File too large
            res.status(400).json({
                error: 'File too large',
                message: 'Image must be less than 10MB'
            });
        } else {
            // Generic error
            res.status(500).json({
                error: 'Internal server error',
                message: error.message || 'Failed to analyze image'
            });
        }
    }
});

// Serve the main app (fallback to index.html for SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public', 'index.html'));
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================
app.use((error, req, res, next) => {
    // Generic error handler for unhandled errors
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred'
    });
});

// ========================================
// START SERVER
// ========================================
// Only start listening if not in test mode
if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════╗
║   Airplane Inspection App - Server    ║
╚════════════════════════════════════════╝
    
 Server running on: http://localhost:${PORT}
 Mobile access: http://[YOUR_IP]:${PORT}
 Browser access: http://localhost:${PORT}

  Make sure to configure:
   - ROBOFLOW_API_KEY in .env file
   - ROBOFLOW_MODEL_ID in .env file
        `);
    });
}

module.exports = app;

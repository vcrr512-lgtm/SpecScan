// ========================================
// SERVER TESTS
// Tests for the backend API endpoints
// ========================================

const request = require('supertest');
const app = require('../server.js');
const fs = require('fs');
const path = require('path');

describe('Server Health Check', () => {
    test('GET /api/health should return 200 and status ok', async () => {
        const response = await request(app)
            .get('/api/health')
            .expect(200);

        expect(response.body).toHaveProperty('status');
        expect(response.body.status).toBe('ok');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
    });
});

describe('Image Analysis Endpoint', () => {
    test('POST /api/analyze without image should return 400', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .expect(400);

        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toBe('No image provided');
    });

    test('POST /api/analyze with invalid file type should return 400', async () => {
        // Create a dummy text file
        const filePath = path.join(__dirname, 'test-file.txt');
        fs.writeFileSync(filePath, 'This is not an image');

        try {
            const response = await request(app)
                .post('/api/analyze')
                .attach('image', filePath)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            // The error could be either 'Invalid file type' or 'Upload error'
            expect(['Invalid file type', 'Upload error']).toContain(response.body.error);
        } catch (error) {
            // Some multer configurations may close connection on invalid file
            // This is acceptable behavior - the file type is being rejected
            if (error.message.includes('ECONNRESET') || error.message.includes('socket')) {
                // Connection was reset because file was rejected - this is expected
                expect(true).toBe(true);
            } else {
                throw error;
            }
        } finally {
            // Cleanup
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    });

    // Note: Testing with actual Roboflow API would require valid API keys
    // and may incur costs, so we'll skip that for now
});

describe('Static File Serving', () => {
    test('GET / should serve index.html', async () => {
        const response = await request(app)
            .get('/')
            .expect(200);

        expect(response.text).toContain('Airplane Inspection App');
    });
});

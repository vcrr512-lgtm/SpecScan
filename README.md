# Airplane Inspection App

A full-stack web application for airplane inspection with AI-powered defect detection using Roboflow. Works seamlessly on both desktop browsers and mobile devices.

## Features

- **3-Step Inspection Process:**
  1. Select airplane area (Fuselage, Wings, Tail, Landing Gear, Engine)
  2. Capture or upload inspection image
  3. AI-powered defect detection and visualization

- **Mobile-First Design:**
  - Large touch targets (60px+ buttons)
  - Camera integration for on-site photos
  - Responsive layout for all screen sizes

- **Secure Backend:**
  - API keys stored securely on server
  - File upload validation
  - Error handling and logging

## Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- Roboflow account and API key ([Get one here](https://app.roboflow.com/))

## Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   ROBOFLOW_API_KEY=your_roboflow_api_key_here
   ROBOFLOW_MODEL_ID=your-project-name/1
   PORT=3000
   ```
   
   **Getting your Roboflow credentials:**
   - Sign up/login at [Roboflow](https://app.roboflow.com/)
   - Go to your workspace settings
   - Copy your API key
   - Your Model ID format is: `project-name/version-number`
     - Example: `airplane-inspection/1`

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   - Desktop: http://localhost:3000
   - Mobile: http://[YOUR_COMPUTER_IP]:3000
     - Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

## Testing

### Run Tests
```bash
npm test
```

### Manual Testing Checklist

1. **Browser Testing:**
   - [ ] Open http://localhost:3000
   - [ ] Select an airplane area
   - [ ] Upload an image
   - [ ] Analyze image (requires API key)
   - [ ] Verify results display correctly

2. **Mobile Testing:**
   - [ ] Connect mobile device to same network
   - [ ] Access app via http://[YOUR_IP]:3000
   - [ ] Test camera capture
   - [ ] Test file upload
   - [ ] Verify touch interactions work
   - [ ] Check responsive layout

3. **API Testing:**
   - [ ] Health check: http://localhost:3000/api/health
   - [ ] Verify CORS is enabled
   - [ ] Test error handling

## Mobile Testing Setup

### Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

**Mac/Linux:**
```bash
ifconfig
```
Or:
```bash
ip addr show
```

### Access from Mobile Device

1. Ensure your mobile device is on the same Wi-Fi network
2. Open browser on mobile device
3. Navigate to: `http://[YOUR_IP]:3000`
   - Example: `http://192.168.1.100:3000`

### Troubleshooting Mobile Access

- **Can't connect:** Check firewall settings, ensure port 3000 is allowed
- **Connection refused:** Make sure server is running
- **Slow performance:** Check network speed, image file sizes

## Project Structure

```
SpecScan_v1/
├── server.js              # Backend Express server
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create this)
├── .gitignore            # Git ignore rules
├── jest.config.js        # Jest test configuration
├── README.md             # This file
├── public/
│   └── index.html        # Frontend application
└── tests/
    └── server.test.js    # API tests
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ROBOFLOW_API_KEY` | Your Roboflow API key | Yes |
| `ROBOFLOW_MODEL_ID` | Your model ID (format: `project/version`) | Yes |
| `PORT` | Server port (default: 3000) | No |

### Customizing Airplane Areas

Edit `public/index.html` to modify the available inspection areas:
```html
<select id="areaSelect">
    <option value="fuselage">Fuselage</option>
    <!-- Add more options here -->
</select>
```

## Troubleshooting

### Server Issues

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Issues

**"API not configured" error:**
- Check your `.env` file exists
- Verify `ROBOFLOW_API_KEY` and `ROBOFLOW_MODEL_ID` are set
- Restart server after changing `.env`

**"Failed to analyze image" error:**
- Verify API key is correct
- Check model ID format (should be `project-name/version`)
- Ensure model is deployed in Roboflow
- Check image file size (max 10MB)

### Mobile Issues

**Camera not working:**
- Ensure HTTPS or localhost (required for camera access)
- Check browser permissions for camera
- Some browsers may require user gesture to access camera

**Can't access from mobile:**
- Verify both devices on same network
- Check firewall/antivirus settings
- Try accessing with IP address instead of localhost

## API Endpoints

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Airplane Inspection API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `POST /api/analyze`
Analyze an image for defects.

**Request:**
- `multipart/form-data`
- Field: `image` (file)
- Field: `area` (string)

**Response:**
```json
{
  "success": true,
  "area": "fuselage",
  "predictions": [
    {
      "class": "defect",
      "confidence": 0.95,
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 50
    }
  ]
}
```

## Security Notes

- API keys are stored server-side only (never exposed to client)
- File uploads are validated (images only, max 10MB)
- CORS is enabled for development (restrict in production)

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

This is a simple demonstration project. Feel free to fork and modify as needed!

## Support

For issues:
1. Check the troubleshooting section
2. Verify your Roboflow configuration
3. Check server logs for detailed error messages

---


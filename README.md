# Smart Tutor AI - Frontend

A modern, professional frontend for the Smart Tutor AI application with a beautiful UI and seamless backend integration.

## 🎨 Features

- **Modern Design**: Clean, professional interface with smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **Real-time Chat**: Interactive chat interface with markdown support
- **Source Citations**: View sources for AI-generated answers
- **Session Management**: Persistent sessions across page reloads
- **Toast Notifications**: User-friendly notifications for all actions
- **Error Handling**: Comprehensive error handling and user feedback

## 📁 File Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # Complete styling and animations
├── app.js          # JavaScript application logic
└── README.md       # This file
```

## 🚀 Getting Started

### Prerequisites

Make sure your backend server is running at `http://localhost:8000`

### Setup

1. **Start the Backend Server**
   ```bash
   cd /path/to/Smart_Tutor
   uvicorn app.main:app --reload
   ```

2. **Open the Frontend**
   - Simply open `index.html` in your web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 3000
     
     # Using Node.js
     npx serve .
     
     # Using VS Code Live Server extension
     Right-click index.html -> "Open with Live Server"
     ```

3. **Access the Application**
   - Direct file: `file:///path/to/frontend/index.html`
   - With server: `http://localhost:3000`

## 🎯 How to Use

### Upload Documents

1. **Initial Screen**: You'll see the upload interface
2. **Upload Methods**:
   - Click the upload zone to browse files
   - Drag and drop PDF files directly
3. **Supported Files**: PDF format only, max 10MB per file
4. **Multiple Files**: You can upload multiple PDFs at once
5. **Processing**: Wait for the system to analyze your documents

### Chat with AI

1. **Ask Questions**: Type your question in the input box
2. **Send Message**: Click send or press Enter
3. **View Sources**: Click on "Sources" to see where information came from
4. **Clear Chat**: Use the "Clear" button to remove all messages
5. **New Session**: Start fresh with the "New Session" button

## 🔧 Configuration

You can modify the configuration in `app.js`:

```javascript
const CONFIG = {
    API_BASE_URL: 'http://localhost:8000',  // Backend URL
    MAX_FILE_SIZE: 10 * 1024 * 1024,        // 10MB
    MAX_MESSAGE_LENGTH: 2000,               // Max characters
    TOAST_DURATION: 4000,                   // Toast display time (ms)
    SESSION_STORAGE_KEY: 'smart_tutor_session_id'
};
```

## 🎨 Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --primary-dark: #5a67d8;
    --primary-light: #9f7aea;
    /* ... more colors ... */
}
```

### Fonts

The application uses:
- **Inter**: Main UI font
- **Space Grotesk**: Headers and titles
- **Font Awesome**: Icons

To change fonts, update the Google Fonts import in `index.html`.

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Opera

## 🐛 Troubleshooting

### Backend Connection Issues

**Problem**: "Failed to connect to server" error

**Solution**:
1. Make sure backend is running: `uvicorn app.main:app --reload`
2. Check backend URL in `app.js` matches your server
3. Verify CORS is enabled in backend (`app/main.py`)

### File Upload Fails

**Problem**: Upload doesn't complete

**Solution**:
1. Check file size (must be < 10MB)
2. Ensure file is PDF format
3. Check backend logs for errors
4. Verify session is initialized

### Chat Not Working

**Problem**: Messages don't send

**Solution**:
1. Check browser console for errors
2. Verify session ID exists in localStorage
3. Ensure documents are uploaded first
4. Check backend `/chat` endpoint

### Styling Issues

**Problem**: Layout looks broken

**Solution**:
1. Clear browser cache
2. Ensure `styles.css` is loading correctly
3. Check browser console for CSS errors
4. Try different browser

## 🔒 Security Notes

- Session IDs are stored in localStorage
- Files are processed server-side
- No sensitive data stored in frontend
- HTTPS recommended for production

## 🚀 Production Deployment

### Step 1: Update Configuration

Change `API_BASE_URL` in `app.js` to your production backend URL:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-backend.com',  // Production URL
    // ... other config
};
```

### Step 2: Deploy Files

Upload all frontend files to your hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting

### Step 3: Configure CORS

Ensure your backend allows requests from your frontend domain:

```python
# app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend.com"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📊 Performance

- **Initial Load**: < 1s
- **File Upload**: Depends on file size and network
- **Chat Response**: 1-3s (depends on AI processing)
- **Smooth Animations**: 60 FPS

## 🎓 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with variables and animations
- **JavaScript (ES6+)**: Application logic
- **Marked.js**: Markdown parsing
- **Font Awesome**: Icon library
- **Google Fonts**: Typography

## 📝 API Integration

The frontend integrates with these backend endpoints:

### POST `/session/init`
Initialize a new session
```javascript
Response: { session_id: "string" }
```

### POST `/upload`
Upload PDF files
```javascript
Query Params: session_id
Body: FormData with files
Response: { status: "success", chunks_indexed: number }
```

### GET `/chat`
Send chat message
```javascript
Query Params: query
Headers: session-id
Response: { query: "string", answer: "string", context: [] }
```

## 🤝 Contributing

Feel free to customize and enhance the frontend:

1. Fork the project
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

## 📄 License

This frontend is part of the Smart Tutor AI project.

## 💬 Support

If you encounter issues:
1. Check this README
2. Review browser console logs
3. Check backend logs
4. Verify configuration settings

---

**Built with ❤️ for Smart Tutor AI**

// ==================== CONFIGURATION ====================
const CONFIG = {
    API_BASE_URL: 'https://1530a510a334.ngrok-free.app',
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_MESSAGE_LENGTH: 2000,
    TOAST_DURATION: 4000,
    SESSION_STORAGE_KEY: 'smart_tutor_session_id' // Note: Using sessionStorage (not localStorage) for tab isolation
};

// ==================== STATE MANAGEMENT ====================
const state = {
    sessionId: null,
    isProcessing: false,
    currentFiles: []
};

// ==================== DOM ELEMENTS ====================
const elements = {
    // Screens
    uploadScreen: document.getElementById('upload-screen'),
    chatScreen: document.getElementById('chat-screen'),
    
    // Upload elements
    uploadZone: document.getElementById('upload-zone'),
    fileInput: document.getElementById('file-input'),
    uploadIdle: document.getElementById('upload-idle'),
    uploadProcessing: document.getElementById('upload-processing'),
    uploadStatus: document.getElementById('upload-status'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    
    // Chat elements
    chatMessages: document.getElementById('chat-messages'),
    messageInput: document.getElementById('message-input'),
    sendBtn: document.getElementById('send-btn'),
    clearBtn: document.getElementById('clear-btn'),
    newSessionBtn: document.getElementById('new-session-btn'),
    sessionStatus: document.getElementById('session-status'),
    charCounter: document.getElementById('char-counter'),
    
    // Toast container
    toastContainer: document.getElementById('toast-container'),
    
    // Loading overlay
    loadingOverlay: document.getElementById('loading-overlay')
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, CONFIG.TOAST_DURATION);
}

/**
 * Show/hide loading overlay
 */
function setLoading(show, message = 'Loading...') {
    if (show) {
        elements.loadingOverlay.querySelector('p').textContent = message;
        elements.loadingOverlay.classList.remove('hidden');
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Switch between screens
 */
function switchScreen(screen) {
    elements.uploadScreen.classList.remove('active');
    elements.chatScreen.classList.remove('active');
    
    if (screen === 'upload') {
        elements.uploadScreen.classList.add('active');
    } else if (screen === 'chat') {
        elements.chatScreen.classList.add('active');
    }
}

/**
 * Auto-resize textarea
 */
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// ==================== API FUNCTIONS ====================

/**
 * Initialize session
 */
async function initializeSession() {
    try {
        // Check if session exists in sessionStorage (unique per tab)
        // Using sessionStorage instead of localStorage ensures each tab gets its own session
        let sessionId = sessionStorage.getItem(CONFIG.SESSION_STORAGE_KEY);
        
        if (!sessionId) {
            // Create new session
            const response = await fetch(`${CONFIG.API_BASE_URL}/session/init`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                throw new Error('Failed to initialize session');
            }
            
            const data = await response.json();
            sessionId = data.session_id;
            sessionStorage.setItem(CONFIG.SESSION_STORAGE_KEY, sessionId);
            
            console.log('✅ New session created:', sessionId);
        } else {
            console.log('✅ Existing session loaded:', sessionId);
        }
        
        state.sessionId = sessionId;
        return sessionId;
        
    } catch (error) {
        console.error('❌ Session initialization failed:', error);
        showToast('Failed to connect to server. Please check if the backend is running.', 'error');
        return null;
    }
}

/**
 * Upload files to server
 */
async function uploadFiles(files) {
    if (!state.sessionId) {
        showToast('No active session. Please refresh the page.', 'error');
        return false;
    }
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
        formData.append('files', file);
    });
    
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/upload?session_id=${state.sessionId}`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Upload failed');
        }
        
        const data = await response.json();
        console.log('✅ Upload successful:', data);
        console.log('📝 Welcome message from backend:', data.welcome_message);
        return data;
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        throw error;
    }
}

/**
 * Send chat message
 */
async function sendChatMessage(query) {
    if (!state.sessionId) {
        showToast('No active session. Please refresh the page.', 'error');
        return null;
    }
    
    try {
        const response = await fetch(
            `${CONFIG.API_BASE_URL}/chat?query=${encodeURIComponent(query)}`,
            {
                method: 'GET',
                headers: {
                    'session-id': state.sessionId
                }
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Chat request failed');
        }
        
        const data = await response.json();
        console.log('✅ Chat response received:', data);
        return data;
        
    } catch (error) {
        console.error('❌ Chat request failed:', error);
        throw error;
    }
}

// ==================== FILE UPLOAD HANDLERS ====================

/**
 * Validate files before upload
 */
function validateFiles(files) {
    const errors = [];
    
    Array.from(files).forEach(file => {
        // Check file type
        if (file.type !== 'application/pdf') {
            errors.push(`${file.name}: Only PDF files are allowed`);
        }
        
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            errors.push(`${file.name}: File size exceeds ${formatFileSize(CONFIG.MAX_FILE_SIZE)} limit`);
        }
    });
    
    return errors;
}

/**
 * Show welcome message after file upload
 * @param {File[]} files - The uploaded files
 * @param {string|null} welcomeMessage - Custom welcome message from backend
 */
function showWelcomeMessage(files, welcomeMessage = null) {
    // Use backend message or fallback
    const displayMessage = welcomeMessage || "I've finished processing your documents. What would you like to explore?";
    
    // Use the same addMessage function to match bot message styling
    addMessage('bot', displayMessage);
}

/**
 * Handle file upload process
 */
async function handleFileUpload(files) {
    if (state.isProcessing) return;
    
    // Validate files
    const errors = validateFiles(files);
    if (errors.length > 0) {
        errors.forEach(error => showToast(error, 'error'));
        return;
    }
    
    state.isProcessing = true;
    state.currentFiles = Array.from(files);
    
    // Update UI to processing state
    elements.uploadIdle.classList.add('hidden');
    elements.uploadProcessing.classList.remove('hidden');
    elements.uploadZone.style.pointerEvents = 'none';
    
    // Simulate progress
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        updateProgress(progress);
    }, 300);
    
    try {
    // Upload files
    const result = await uploadFiles(files);
    
    // Complete progress
    clearInterval(progressInterval);
    updateProgress(100);
    
    showToast(`Successfully processed ${state.currentFiles.length} file(s)`, 'success');
    
    // Wait a bit before switching screens
    setTimeout(() => {
        switchScreen('chat');
        
        // Pass the welcome_message returned from your FastAPI backend
        // result.welcome_message comes from your main.py return statement
        showWelcomeMessage(state.currentFiles, result.welcome_message);
        
        elements.messageInput.focus();
    }, 800);
    
} catch (error) {
        // Clear progress interval
        clearInterval(progressInterval);
        
        // Show error
        showToast(error.message || 'Failed to upload files. Please try again.', 'error');
        
        // Reset UI
        elements.uploadIdle.classList.remove('hidden');
        elements.uploadProcessing.classList.add('hidden');
        elements.uploadZone.style.pointerEvents = 'auto';
        updateProgress(0);
        
    } finally {
        state.isProcessing = false;
    }
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `${Math.round(percent)}%`;
}

// ==================== CHAT FUNCTIONS ====================

/**
 * Add message to chat
 */
function addMessage(role, content, context = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatarIcon = role === 'bot' ? 'fa-robot' : 'fa-user';
    
    let messageHTML = `
        <div class="message-avatar">
            <i class="fas ${avatarIcon}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
    `;
    
    if (role === 'bot') {
        // Parse markdown for bot messages
        messageHTML += marked.parse(content);
    } else {
        // Plain text for user messages
        messageHTML += content;
    }
    
    messageHTML += `</div>`;
    
    // Add sources if available
    if (context && context.length > 0) {
        messageHTML += `
            <div class="message-sources">
                <div class="sources-header" onclick="toggleSources(this)">
                    <i class="fas fa-book"></i>
                    <span>Sources (${context.length})</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="sources-list">
                    ${context.map(c => `
                        <div class="source-item">
                            <i class="fas fa-bookmark"></i>
                            <span>${c.source} - Page ${c.page}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    messageHTML += `</div>`;
    messageDiv.innerHTML = messageHTML;
    
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Toggle sources visibility
 */
function toggleSources(headerElement) {
    headerElement.classList.toggle('expanded');
    const sourcesList = headerElement.nextElementSibling;
    sourcesList.classList.toggle('expanded');
}

// Make it globally accessible for onclick
window.toggleSources = toggleSources;

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    elements.chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    elements.chatMessages.parentElement.scrollTop = elements.chatMessages.parentElement.scrollHeight;
}

/**
 * Handle sending message
 */
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message || state.isProcessing) return;
    
    // Check message length
    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showToast(`Message exceeds ${CONFIG.MAX_MESSAGE_LENGTH} characters`, 'warning');
        return;
    }
    
    state.isProcessing = true;
    elements.sendBtn.disabled = true;
    
    // Add user message
    addMessage('user', message);
    
    // Clear input
    elements.messageInput.value = '';
    autoResizeTextarea(elements.messageInput);
    updateCharCounter();
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to API
        const response = await sendChatMessage(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response
        if (response && response.answer) {
            addMessage('bot', response.answer, response.context || []);
        } else {
            addMessage('bot', 'I apologize, but I couldn\'t generate a response. Please try again.');
        }
        
    } catch (error) {
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        addMessage('bot', '⚠️ I\'m having trouble connecting to the server. Please check your connection and try again.');
        showToast('Failed to send message. Please try again.', 'error');
        
    } finally {
        state.isProcessing = false;
        elements.sendBtn.disabled = false;
        elements.messageInput.focus();
    }
}

/**
 * Clear chat messages
 */
function clearChat() {
    if (confirm('Are you sure you want to clear all messages? This action cannot be undone.')) {
        elements.chatMessages.innerHTML = '';
        showToast('Chat cleared', 'info');
    }
}

/**
 * Start new session
 */
function startNewSession() {
    if (confirm('Start a new session? Your current chat will be lost.')) {
        sessionStorage.removeItem(CONFIG.SESSION_STORAGE_KEY);
        window.location.reload();
    }
}

/**
 * Update character counter
 */
function updateCharCounter() {
    const length = elements.messageInput.value.length;
    elements.charCounter.textContent = `${length} / ${CONFIG.MAX_MESSAGE_LENGTH}`;
    
    if (length > 0) {
        elements.charCounter.classList.remove('hidden');
    } else {
        elements.charCounter.classList.add('hidden');
    }
    
    if (length > CONFIG.MAX_MESSAGE_LENGTH * 0.9) {
        elements.charCounter.style.color = 'var(--error)';
    } else {
        elements.charCounter.style.color = 'var(--text-tertiary)';
    }
}

// ==================== EVENT LISTENERS ====================

/**
 * Upload zone click handler
 */
elements.uploadZone.addEventListener('click', () => {
    if (!state.isProcessing) {
        elements.fileInput.click();
    }
});

/**
 * File input change handler
 */
elements.fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        handleFileUpload(files);
    }
});

/**
 * Drag and drop handlers
 */
elements.uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.add('dragging');
});

elements.uploadZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragging');
});

elements.uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    elements.uploadZone.classList.remove('dragging');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && !state.isProcessing) {
        handleFileUpload(files);
    }
});

/**
 * Send button click handler
 */
elements.sendBtn.addEventListener('click', handleSendMessage);

/**
 * Message input handlers
 */
elements.messageInput.addEventListener('input', (e) => {
    autoResizeTextarea(e.target);
    updateCharCounter();
});

elements.messageInput.addEventListener('keydown', (e) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

/**
 * Clear button handler
 */
elements.clearBtn.addEventListener('click', clearChat);

/**
 * New session button handler
 */
elements.newSessionBtn.addEventListener('click', startNewSession);

// ==================== INITIALIZATION ====================

/**
 * Initialize application
 */
async function initializeApp() {
    console.log('🚀 Initializing Smart Tutor AI...');
    
    // Initialize session
    const sessionId = await initializeSession();
    
    if (sessionId) {
        console.log('✅ Application ready');
        showToast('Welcome to Smart Tutor AI!', 'success');
    } else {
        console.error('❌ Failed to initialize application');
        showToast('Failed to initialize. Please refresh the page.', 'error');
    }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Log for debugging
console.log('📚 Smart Tutor AI - Frontend Loaded');
console.log('🔗 API Base URL:', CONFIG.API_BASE_URL);

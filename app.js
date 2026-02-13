// State Management
let state = {
    roomId: null,
    username: null,
    videoUrl: null,
    subtitleFile: null,
    subtitleData: null,
    hls: null,
    isHost: false,
    syncInterval: null,
    messageCheckInterval: null,
    viewers: 1,
    lastSyncTime: 0,
    lastMessageCount: 0,
    displayedMessageIds: new Set() // Track displayed messages to prevent duplicates
};

// Upstash Redis Configuration
// IMPORTANT: Replace these with your Upstash credentials from https://console.upstash.com
const UPSTASH_CONFIG = {
    url: 'https://one-feline-39646.upstash.io', // e.g., https://your-db.upstash.io
    token: 'AZreAAIncDI2YTIyMjBmODllYzU0ZGE1ODZjMGMyZGFhNzQyYTBjMHAyMzk2NDY'
};

// Check if Upstash is configured
const isUpstashConfigured = UPSTASH_CONFIG.url !== 'YOUR_UPSTASH_REDIS_REST_URL';

// Upstash Redis Helper Functions
const upstash = {
    async request(command) {
        if (!isUpstashConfigured) {
            console.error('Upstash not configured! Please add your credentials to app.js');
            return null;
        }
        
        try {
            const response = await fetch(`${UPSTASH_CONFIG.url}/${command.join('/')}`, {
                headers: {
                    'Authorization': `Bearer ${UPSTASH_CONFIG.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('Upstash request error:', error);
            return null;
        }
    },
    
    async set(key, value, expirySeconds = 86400) {
        const stringValue = JSON.stringify(value);
        return await this.request(['SET', key, stringValue, 'EX', expirySeconds]);
    },
    
    async get(key) {
        const result = await this.request(['GET', key]);
        if (result) {
            try {
                return JSON.parse(result);
            } catch {
                return result;
            }
        }
        return null;
    },
    
    async push(key, value) {
        const stringValue = JSON.stringify(value);
        return await this.request(['RPUSH', key, stringValue]);
    },
    
    async getList(key, start = 0, end = -1) {
        const results = await this.request(['LRANGE', key, start, end]);
        if (results && Array.isArray(results)) {
            return results.map(item => {
                try {
                    return JSON.parse(item);
                } catch {
                    return item;
                }
            });
        }
        return [];
    },
    
    async getListLength(key) {
        return await this.request(['LLEN', key]) || 0;
    }
};

// Fallback localStorage for when Upstash is not configured
const localStorage_fallback = {
    data: {},
    
    init() {
        try {
            const saved = localStorage.getItem('chamoussa_storage');
            if (saved) this.data = JSON.parse(saved);
        } catch (e) {
            console.log('localStorage not available');
        }
    },
    
    async set(key, value) {
        this.data[key] = value;
        this.persist();
        this.broadcast(key, value);
        return true;
    },
    
    async get(key) {
        return this.data[key] || null;
    },
    
    async push(key, value) {
        if (!this.data[key]) this.data[key] = [];
        this.data[key].push(value);
        this.persist();
        return true;
    },
    
    async getList(key) {
        return this.data[key] || [];
    },
    
    async getListLength(key) {
        return (this.data[key] || []).length;
    },
    
    persist() {
        try {
            localStorage.setItem('chamoussa_storage', JSON.stringify(this.data));
        } catch (e) {}
    },
    
    broadcast(key, value) {
        try {
            localStorage.setItem('chamoussa_broadcast', JSON.stringify({
                key, value, timestamp: Date.now()
            }));
        } catch (e) {}
    },
    
    listen() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'chamoussa_broadcast') {
                try {
                    const { key, value } = JSON.parse(e.newValue);
                    this.data[key] = value;
                } catch (err) {}
            } else if (e.key === 'chamoussa_storage') {
                try {
                    this.data = JSON.parse(e.newValue);
                } catch (err) {}
            }
        });
    }
};

// Use Upstash if configured, otherwise fallback to localStorage
const storage = isUpstashConfigured ? upstash : localStorage_fallback;

// Generate random room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate random username
function generateUsername() {
    const adjectives = ['Happy', 'Cool', 'Swift', 'Bright', 'Lucky', 'Brave', 'Smart', 'Kind'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Phoenix', 'Dragon', 'Wolf', 'Fox'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}`;
}

// Storage helper
async function saveToStorage(key, value) {
    try {
        await storage.set(key, value);
        console.log('Saved to storage:', key);
        return true;
    } catch (error) {
        console.error('Storage save error:', error);
        return false;
    }
}

async function getFromStorage(key) {
    try {
        const result = await storage.get(key);
        return result;
    } catch (error) {
        console.log('Storage get error:', key);
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Show configuration warning if Upstash not configured
    if (!isUpstashConfigured) {
        console.warn('⚠️ Upstash Redis not configured! Using localStorage (same-browser only).');
        console.warn('📖 For multi-device support, see UPSTASH_SETUP.md');
        localStorage_fallback.init();
        localStorage_fallback.listen();
    } else {
        console.log('✅ Upstash Redis configured - multi-device support enabled!');
    }
    
    state.username = generateUsername();
    setupEventListeners();
    loadRoomFromURL();
});

function setupEventListeners() {
    document.getElementById('startButton').addEventListener('click', startParty);
    document.getElementById('joinButton').addEventListener('click', joinRoom);
    document.getElementById('sendButton').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    document.getElementById('syncButton').addEventListener('click', syncWithRoom);
    document.getElementById('subtitleToggle').addEventListener('click', toggleSubtitles);
    document.getElementById('shareButton').addEventListener('click', shareRoom);
    
    // File input handlers
    const subtitleInput = document.getElementById('subtitleInput');
    const subtitleLabel = document.getElementById('subtitleLabel');
    
    subtitleInput.addEventListener('change', handleSubtitleFileSelect);
    
    // Drag and drop for subtitle file
    subtitleLabel.addEventListener('dragover', (e) => {
        e.preventDefault();
        subtitleLabel.style.borderColor = 'var(--accent-primary)';
    });
    
    subtitleLabel.addEventListener('dragleave', (e) => {
        e.preventDefault();
        subtitleLabel.style.borderColor = 'var(--border-color)';
    });
    
    subtitleLabel.addEventListener('drop', (e) => {
        e.preventDefault();
        subtitleLabel.style.borderColor = 'var(--border-color)';
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].name.endsWith('.vtt')) {
            subtitleInput.files = files;
            handleSubtitleFileSelect({ target: subtitleInput });
        }
    });
    
    subtitleLabel.addEventListener('click', () => {
        subtitleInput.click();
    });
    
    // Video event listeners
    const video = document.getElementById('videoPlayer');
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);
    video.addEventListener('seeked', handleVideoSeek);
}

// Handle subtitle file selection
function handleSubtitleFileSelect(event) {
    const file = event.target.files[0];
    const label = document.getElementById('subtitleLabel');
    
    if (file && file.name.endsWith('.vtt')) {
        state.subtitleFile = file;
        label.classList.add('has-file');
        label.querySelector('span').textContent = file.name;
        
        // Read file content
        const reader = new FileReader();
        reader.onload = (e) => {
            state.subtitleData = e.target.result;
        };
        reader.readAsText(file);
    } else {
        alert('Please select a valid .vtt file');
    }
}

// Start a new party
async function startParty() {
    const m3u8Input = document.getElementById('m3u8Input').value.trim();
    
    if (!m3u8Input) {
        alert('Please enter an M3U8 URL');
        return;
    }
    
    // Generate room ID and set state FIRST
    state.roomId = generateRoomId();
    state.videoUrl = m3u8Input;
    state.isHost = true;
    
    console.log('Creating room:', state.roomId);
    
    // Create and save room data BEFORE initializing video
    const roomData = {
        videoUrl: state.videoUrl,
        subtitleData: state.subtitleData || null,
        currentTime: 0,
        isPlaying: false,
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        hostUsername: state.username,
        viewers: [state.username]
    };
    
    // CRITICAL: Save room data first
    const saved = await saveToStorage(`room:${state.roomId}`, roomData);
    
    if (!saved) {
        alert('Error creating room. Please check your browser settings and try again.');
        state.roomId = null;
        state.isHost = false;
        return;
    }
    
    console.log('Room saved successfully:', state.roomId);
    
    // Add initial welcome message
    const welcomeMessage = {
        username: 'System',
        text: `${state.username} created the room`,
        timestamp: Date.now(),
        id: `system-create-${state.roomId}-${Date.now()}`
    };
    
    const messagesKey = `messages:${state.roomId}`;
    
    if (isUpstashConfigured) {
        await storage.push(messagesKey, welcomeMessage);
        await storage.request(['EXPIRE', messagesKey, 86400]);
    } else {
        await saveToStorage(messagesKey, [welcomeMessage]);
    }
    
    console.log('Room fully initialized, now loading UI');
    
    // NOW initialize the UI and video player
    initializeRoom();
}

// Join existing room
async function joinRoom() {
    const roomId = document.getElementById('joinRoomInput').value.trim().toUpperCase();
    
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    
    console.log('=== JOINING ROOM ===');
    console.log('Attempting to join room:', roomId);
    console.log('Storage configured:', isUpstashConfigured ? 'Upstash' : 'localStorage');
    
    const roomData = await getFromStorage(`room:${roomId}`);
    
    console.log('Room data retrieved:', roomData);
    
    if (!roomData) {
        console.error('Room not found in storage');
        alert('Room not found. Please check the room ID and try again.\n\nMake sure the host created the room first!');
        return;
    }
    
    console.log('Room found! Video URL:', roomData.videoUrl);
    
    state.roomId = roomId;
    state.videoUrl = roomData.videoUrl;
    state.subtitleData = roomData.subtitleData;
    state.isHost = false;
    
    // Add viewer to room
    if (!roomData.viewers) {
        roomData.viewers = [];
    }
    if (!roomData.viewers.includes(state.username)) {
        roomData.viewers.push(state.username);
        await saveToStorage(`room:${roomId}`, roomData);
        console.log('Added viewer to room:', state.username);
    }
    
    // Add join message
    const joinMessage = {
        username: 'System',
        text: `${state.username} joined the room`,
        timestamp: Date.now(),
        id: `system-join-${state.roomId}-${state.username}-${Date.now()}`
    };
    
    const messagesKey = `messages:${state.roomId}`;
    
    if (isUpstashConfigured) {
        await storage.push(messagesKey, joinMessage);
    } else {
        const messages = await getFromStorage(messagesKey) || [];
        messages.push(joinMessage);
        await saveToStorage(messagesKey, messages);
    }
    
    console.log('Successfully joined room:', roomId);
    console.log('=== JOIN COMPLETE ===');
    
    initializeRoom();
}

// Initialize room
function initializeRoom() {
    console.log('Initializing room UI');
    
    // Update UI FIRST - before video loading
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('videoContainer').classList.remove('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    document.getElementById('roomId').textContent = `Room: ${state.roomId}`;
    
    // Update URL so people can share/refresh
    window.history.pushState({}, '', `?room=${state.roomId}`);
    
    // Show subtitle button if subtitle data exists
    if (state.subtitleData) {
        document.getElementById('subtitleToggle').classList.remove('hidden');
    }
    
    // Add system messages
    addSystemMessage(`Welcome to room ${state.roomId}!`);
    addSystemMessage(`You joined as ${state.username}`);
    
    // Load existing messages
    loadExistingMessages();
    
    // Start syncing
    startSync();
    startMessageSync();
    
    console.log('Room initialized:', state.roomId, 'isHost:', state.isHost);
    
    // Setup video player LAST - this way room exists even if video fails
    // Use setTimeout to ensure it doesn't block
    setTimeout(() => {
        console.log('Now loading video player...');
        setupVideoPlayer();
    }, 100);
}

// Load existing messages when joining
async function loadExistingMessages() {
    const messagesKey = `messages:${state.roomId}`;
    
    let messages;
    if (isUpstashConfigured) {
        messages = await storage.getList(messagesKey);
    } else {
        messages = await getFromStorage(messagesKey) || [];
    }
    
    messages.forEach(msg => {
        // Add ID to message if it doesn't have one
        if (!msg.id) {
            msg.id = `${msg.username}-${msg.timestamp}`;
        }
        
        if (msg.username === 'System') {
            addSystemMessage(msg.text);
        } else {
            displayMessage(msg);
        }
    });
    
    // Track message count for sync
    state.lastMessageCount = messages.length;
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Setup HLS video player
function setupVideoPlayer() {
    const video = document.getElementById('videoPlayer');
    
    console.log('Setting up video player with URL:', state.videoUrl);
    
    if (Hls.isSupported()) {
        state.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            debug: false,
            // Add error recovery options
            maxLoadingDelay: 4,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
        });
        
        state.hls.loadSource(state.videoUrl);
        state.hls.attachMedia(video);
        
        state.hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('Stream loaded successfully');
            if (state.subtitleData) {
                addSubtitles();
            }
        });
        
        state.hls.on(Hls.Events.ERROR, (event, data) => {
            console.warn('HLS error:', data.type, data.details);
            
            if (data.fatal) {
                console.error('Fatal HLS error:', data);
                
                // Show error but don't break the room
                const errorMsg = getHLSErrorMessage(data);
                addSystemMessage(`⚠️ Video error: ${errorMsg}`);
                addSystemMessage('Room is still active - chat and sync still work!');
                
                // Try to recover
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Network error - attempting recovery');
                        state.hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Media error - attempting recovery');
                        state.hls.recoverMediaError();
                        break;
                    default:
                        console.log('Unrecoverable error');
                        // Don't destroy HLS, keep room functional
                        break;
                }
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = state.videoUrl;
        
        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            addSystemMessage('⚠️ Video loading error - check the M3U8 URL');
            addSystemMessage('Room is still active - chat and sync still work!');
        });
        
        video.addEventListener('loadedmetadata', () => {
            console.log('Video loaded (native)');
            if (state.subtitleData) {
                addSubtitles();
            }
        });
    } else {
        console.error('HLS not supported');
        addSystemMessage('⚠️ HLS is not supported in your browser');
        addSystemMessage('Try Chrome, Firefox, Safari, or Edge');
    }
}

// Get user-friendly error message
function getHLSErrorMessage(data) {
    if (data.details === 'manifestLoadError') {
        return 'Cannot load stream - check URL or CORS settings';
    } else if (data.details === 'manifestParsingError') {
        return 'Invalid M3U8 format - check the stream URL';
    } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        return 'Network error - check your connection';
    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        return 'Media error - stream may be incompatible';
    }
    return 'Stream error - check the M3U8 URL';
}

// Add subtitles from uploaded file data
function addSubtitles() {
    const video = document.getElementById('videoPlayer');
    
    // Create a blob from the subtitle data
    const blob = new Blob([state.subtitleData], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Subtitles';
    track.srclang = 'en';
    track.src = url;
    track.default = true;
    video.appendChild(track);
}

// Toggle subtitles
function toggleSubtitles() {
    const video = document.getElementById('videoPlayer');
    const button = document.getElementById('subtitleToggle');
    
    if (video.textTracks.length > 0) {
        const track = video.textTracks[0];
        if (track.mode === 'showing') {
            track.mode = 'hidden';
            button.classList.remove('active');
        } else {
            track.mode = 'showing';
            button.classList.add('active');
        }
    }
}

// Video event handlers
async function handleVideoPlay() {
    if (state.isHost) {
        await updateRoomState({ isPlaying: true });
    }
}

async function handleVideoPause() {
    if (state.isHost) {
        await updateRoomState({ isPlaying: false });
    }
}

async function handleVideoSeek() {
    if (state.isHost) {
        const video = document.getElementById('videoPlayer');
        await updateRoomState({ currentTime: video.currentTime });
    }
}

// Update room state
async function updateRoomState(updates) {
    const roomData = await getFromStorage(`room:${state.roomId}`);
    if (!roomData) {
        console.error('Room not found when updating state');
        return;
    }
    
    Object.assign(roomData, updates);
    roomData.lastUpdate = Date.now();
    
    const saved = await saveToStorage(`room:${state.roomId}`, roomData);
    console.log('Room state updated:', updates, 'Success:', saved);
}

// Sync with room
async function syncWithRoom() {
    const roomData = await getFromStorage(`room:${state.roomId}`);
    
    if (!roomData) {
        console.error('Room not found');
        addSystemMessage('Error: Room not found');
        return;
    }
    
    const video = document.getElementById('videoPlayer');
    
    // Sync time
    const timeDiff = Math.abs(video.currentTime - (roomData.currentTime || 0));
    if (timeDiff > 2) {
        video.currentTime = roomData.currentTime || 0;
        console.log('Synced time to:', roomData.currentTime);
    }
    
    // Sync play state
    if (roomData.isPlaying && video.paused) {
        video.play().catch(e => console.log('Autoplay prevented:', e));
    } else if (!roomData.isPlaying && !video.paused) {
        video.pause();
    }
    
    addSystemMessage('✓ Synced with room');
}

// Start periodic sync
function startSync() {
    // Clear any existing interval
    if (state.syncInterval) {
        clearInterval(state.syncInterval);
    }
    
    // Sync every 2 seconds
    state.syncInterval = setInterval(async () => {
        try {
            if (!state.isHost) {
                // Viewers sync from room
                const roomData = await getFromStorage(`room:${state.roomId}`);
                if (roomData) {
                    const video = document.getElementById('videoPlayer');
                    
                    // Auto-sync if difference is more than 3 seconds
                    const timeDiff = Math.abs(video.currentTime - (roomData.currentTime || 0));
                    if (timeDiff > 3) {
                        video.currentTime = roomData.currentTime || 0;
                        console.log('Auto-synced time');
                    }
                    
                    // Sync play state
                    if (roomData.isPlaying && video.paused) {
                        video.play().catch(() => {});
                    } else if (!roomData.isPlaying && !video.paused) {
                        video.pause();
                    }
                    
                    // Update viewer count
                    const viewerCount = (roomData.viewers || []).length;
                    document.getElementById('viewerCount').textContent = `👥 ${viewerCount}`;
                }
            } else {
                // Host updates current time
                const video = document.getElementById('videoPlayer');
                const now = Date.now();
                
                // Only update every 2 seconds to reduce storage calls
                if (now - state.lastSyncTime > 2000) {
                    await updateRoomState({ 
                        currentTime: video.currentTime,
                        isPlaying: !video.paused 
                    });
                    state.lastSyncTime = now;
                }
            }
        } catch (error) {
            console.error('Sync error:', error);
        }
    }, 2000);
    
    console.log('Sync started');
}

// Chat functions
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessage = {
        username: state.username,
        text: message,
        timestamp: Date.now(),
        id: `${state.username}-${Date.now()}-${Math.random()}` // Unique ID
    };
    
    try {
        const messagesKey = `messages:${state.roomId}`;
        
        // Add message to storage
        if (isUpstashConfigured) {
            // Use Redis list for Upstash
            await storage.push(messagesKey, chatMessage);
            // Set expiry on the list (24 hours)
            await storage.request(['EXPIRE', messagesKey, 86400]);
        } else {
            // Use array for localStorage
            const messages = await getFromStorage(messagesKey) || [];
            messages.push(chatMessage);
            if (messages.length > 100) messages.shift();
            await saveToStorage(messagesKey, messages);
        }
        
        // Clear input
        input.value = '';
        
        // Trigger immediate sync for faster display
        if (!isUpstashConfigured) {
            // Force immediate display for localStorage since it's instant
            setTimeout(() => {
                triggerMessageSync();
            }, 100);
        }
        
    } catch (error) {
        console.error('Send message error:', error);
        alert('Error sending message');
    }
}

function displayMessage(message) {
    // Check if we've already displayed this message
    const messageId = message.id || `${message.username}-${message.timestamp}`;
    
    if (state.displayedMessageIds.has(messageId)) {
        return; // Skip duplicate
    }
    
    state.displayedMessageIds.add(messageId);
    
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.setAttribute('data-message-id', messageId);
    
    messageDiv.innerHTML = `
        <div class="message-user">${message.username}</div>
        <div class="message-text">${escapeHtml(message.text)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addSystemMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Share room
function shareRoom() {
    const url = `${window.location.origin}?room=${state.roomId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my Chamoussa Party!',
            text: `Join my watch party with room ID: ${state.roomId}`,
            url: url
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Room link copied to clipboard!');
    }).catch(() => {
        alert(`Share this link: ${text}`);
    });
}

// Load room from URL
function loadRoomFromURL() {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    
    if (roomId) {
        document.getElementById('joinRoomInput').value = roomId;
    }
}

// Load messages periodically
function startMessageSync() {
    // Clear any existing interval
    if (state.messageCheckInterval) {
        clearInterval(state.messageCheckInterval);
    }
    
    state.messageCheckInterval = setInterval(async () => {
        if (!state.roomId) return;
        
        try {
            const messagesKey = `messages:${state.roomId}`;
            
            let messages;
            let currentCount;
            
            if (isUpstashConfigured) {
                // For Upstash, check list length first to avoid fetching all messages
                currentCount = await storage.getListLength(messagesKey);
                
                if (currentCount > state.lastMessageCount) {
                    // Only fetch new messages
                    messages = await storage.getList(messagesKey, state.lastMessageCount, -1);
                    
                    messages.forEach(msg => {
                        // Add ID to message if it doesn't have one
                        if (!msg.id) {
                            msg.id = `${msg.username}-${msg.timestamp}`;
                        }
                        
                        if (msg.username === 'System') {
                            addSystemMessage(msg.text);
                        } else {
                            displayMessage(msg);
                        }
                    });
                    
                    state.lastMessageCount = currentCount;
                }
            } else {
                // For localStorage, check full array
                messages = await getFromStorage(messagesKey) || [];
                currentCount = messages.length;
                
                if (currentCount > state.lastMessageCount) {
                    // Display new messages
                    for (let i = state.lastMessageCount; i < currentCount; i++) {
                        const msg = messages[i];
                        
                        // Add ID to message if it doesn't have one
                        if (!msg.id) {
                            msg.id = `${msg.username}-${msg.timestamp}`;
                        }
                        
                        if (msg.username === 'System') {
                            addSystemMessage(msg.text);
                        } else {
                            displayMessage(msg);
                        }
                    }
                    
                    state.lastMessageCount = currentCount;
                }
            }
        } catch (error) {
            console.error('Message sync error:', error);
        }
    }, isUpstashConfigured ? 1000 : 1500); // Faster sync with Upstash
    
    console.log('Message sync started');
}

// Manual trigger for immediate sync (used after sending message)
async function triggerMessageSync() {
    if (!state.roomId) return;
    
    try {
        const messagesKey = `messages:${state.roomId}`;
        
        if (isUpstashConfigured) {
            const currentCount = await storage.getListLength(messagesKey);
            if (currentCount > state.lastMessageCount) {
                const messages = await storage.getList(messagesKey, state.lastMessageCount, -1);
                messages.forEach(msg => {
                    if (!msg.id) {
                        msg.id = `${msg.username}-${msg.timestamp}`;
                    }
                    if (msg.username === 'System') {
                        addSystemMessage(msg.text);
                    } else {
                        displayMessage(msg);
                    }
                });
                state.lastMessageCount = currentCount;
            }
        } else {
            const messages = await getFromStorage(messagesKey) || [];
            const currentCount = messages.length;
            
            if (currentCount > state.lastMessageCount) {
                for (let i = state.lastMessageCount; i < currentCount; i++) {
                    const msg = messages[i];
                    if (!msg.id) {
                        msg.id = `${msg.username}-${msg.timestamp}`;
                    }
                    if (msg.username === 'System') {
                        addSystemMessage(msg.text);
                    } else {
                        displayMessage(msg);
                    }
                }
                state.lastMessageCount = currentCount;
            }
        }
    } catch (error) {
        console.error('Message sync error:', error);
    }
}

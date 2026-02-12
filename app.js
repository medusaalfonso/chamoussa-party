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
    lastSyncTime: 0
};

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

// Storage helper using Claude's persistent storage
async function saveToStorage(key, value) {
    try {
        const result = await window.storage.set(key, JSON.stringify(value), true);
        console.log('Saved to storage:', key, result ? 'success' : 'failed');
        return result !== null;
    } catch (error) {
        console.error('Storage save error:', error);
        return false;
    }
}

async function getFromStorage(key) {
    try {
        const result = await window.storage.get(key, true);
        if (result && result.value) {
            return JSON.parse(result.value);
        }
        return null;
    } catch (error) {
        console.log('Storage get error (key may not exist):', key);
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
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
    
    state.roomId = generateRoomId();
    state.videoUrl = m3u8Input;
    state.isHost = true;
    
    // Save room data including subtitle content
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
    
    const saved = await saveToStorage(`room:${state.roomId}`, roomData);
    
    if (!saved) {
        alert('Error creating room. Please try again.');
        return;
    }
    
    console.log('Room created:', state.roomId, roomData);
    
    // Add initial welcome message
    await saveToStorage(`messages:${state.roomId}`, [{
        username: 'System',
        text: `${state.username} created the room`,
        timestamp: Date.now()
    }]);
    
    initializeRoom();
}

// Join existing room
async function joinRoom() {
    const roomId = document.getElementById('joinRoomInput').value.trim().toUpperCase();
    
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    
    console.log('Attempting to join room:', roomId);
    
    const roomData = await getFromStorage(`room:${roomId}`);
    
    console.log('Room data retrieved:', roomData);
    
    if (!roomData) {
        alert('Room not found. Please check the room ID and try again.');
        return;
    }
    
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
    }
    
    // Add join message
    const messages = await getFromStorage(`messages:${state.roomId}`) || [];
    messages.push({
        username: 'System',
        text: `${state.username} joined the room`,
        timestamp: Date.now()
    });
    await saveToStorage(`messages:${state.roomId}`, messages);
    
    console.log('Successfully joined room:', roomId);
    
    initializeRoom();
}

// Initialize room
function initializeRoom() {
    // Update UI
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('videoContainer').classList.remove('hidden');
    document.getElementById('chatSection').classList.remove('hidden');
    document.getElementById('roomId').textContent = `Room: ${state.roomId}`;
    
    // Update URL
    window.history.pushState({}, '', `?room=${state.roomId}`);
    
    // Setup video
    setupVideoPlayer();
    
    // Show subtitle button if subtitle data exists
    if (state.subtitleData) {
        document.getElementById('subtitleToggle').classList.remove('hidden');
    }
    
    // Add system message
    addSystemMessage(`Welcome to room ${state.roomId}!`);
    addSystemMessage(`You joined as ${state.username}`);
    
    // Load existing messages
    loadExistingMessages();
    
    // Start syncing
    startSync();
    startMessageSync();
    
    console.log('Room initialized:', state.roomId, 'isHost:', state.isHost);
}

// Load existing messages when joining
async function loadExistingMessages() {
    const messagesKey = `messages:${state.roomId}`;
    const messages = await getFromStorage(messagesKey) || [];
    
    messages.forEach(msg => {
        if (msg.username === 'System') {
            addSystemMessage(msg.text);
        } else {
            displayMessage(msg);
        }
    });
    
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Setup HLS video player
function setupVideoPlayer() {
    const video = document.getElementById('videoPlayer');
    
    if (Hls.isSupported()) {
        state.hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
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
            if (data.fatal) {
                console.error('Fatal error:', data);
                alert('Error loading stream. Please check the URL.');
            }
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = state.videoUrl;
        if (state.subtitleData) {
            addSubtitles();
        }
    } else {
        alert('HLS is not supported in your browser');
    }
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
        timestamp: Date.now()
    };
    
    try {
        // Save to storage
        const messagesKey = `messages:${state.roomId}`;
        const messages = await getFromStorage(messagesKey) || [];
        messages.push(chatMessage);
        
        // Keep only last 100 messages
        if (messages.length > 100) {
            messages.shift();
        }
        
        const saved = await saveToStorage(messagesKey, messages);
        
        if (saved) {
            // Display message locally immediately
            displayMessage(chatMessage);
            
            input.value = '';
            
            // Scroll to bottom
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } else {
            console.error('Failed to save message');
            alert('Failed to send message. Please try again.');
        }
    } catch (error) {
        console.error('Send message error:', error);
        alert('Error sending message');
    }
}

function displayMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    messageDiv.innerHTML = `
        <div class="message-user">${message.username}</div>
        <div class="message-text">${escapeHtml(message.text)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
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
            const messages = await getFromStorage(messagesKey) || [];
            const chatMessages = document.getElementById('chatMessages');
            const currentCount = chatMessages.querySelectorAll('.message').length;
            
            if (messages.length > currentCount) {
                // Display new messages
                for (let i = currentCount; i < messages.length; i++) {
                    displayMessage(messages[i]);
                }
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('Message sync error:', error);
        }
    }, 1500);
    
    console.log('Message sync started');
}

// State Management
let state = {
    roomId: null,
    username: null,
    videoUrl: null,
    subtitleUrl: null,
    hls: null,
    isHost: false,
    syncInterval: null,
    viewers: 1
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
        await window.storage.set(key, JSON.stringify(value), true);
    } catch (error) {
        console.error('Storage save error:', error);
    }
}

async function getFromStorage(key) {
    try {
        const result = await window.storage.get(key, true);
        return result ? JSON.parse(result.value) : null;
    } catch (error) {
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
    
    // Video event listeners
    const video = document.getElementById('videoPlayer');
    video.addEventListener('play', handleVideoPlay);
    video.addEventListener('pause', handleVideoPause);
    video.addEventListener('seeked', handleVideoSeek);
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
    state.subtitleUrl = document.getElementById('subtitleInput').value.trim();
    state.isHost = true;
    
    // Save room data
    const roomData = {
        videoUrl: state.videoUrl,
        subtitleUrl: state.subtitleUrl,
        currentTime: 0,
        isPlaying: false,
        createdAt: Date.now(),
        viewers: []
    };
    
    await saveToStorage(`room:${state.roomId}`, roomData);
    
    initializeRoom();
}

// Join existing room
async function joinRoom() {
    const roomId = document.getElementById('joinRoomInput').value.trim().toUpperCase();
    
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    
    const roomData = await getFromStorage(`room:${roomId}`);
    
    if (!roomData) {
        alert('Room not found');
        return;
    }
    
    state.roomId = roomId;
    state.videoUrl = roomData.videoUrl;
    state.subtitleUrl = roomData.subtitleUrl;
    state.isHost = false;
    
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
    
    // Show subtitle button if subtitle URL exists
    if (state.subtitleUrl) {
        document.getElementById('subtitleToggle').classList.remove('hidden');
    }
    
    // Add system message
    addSystemMessage(`Welcome to room ${state.roomId}!`);
    addSystemMessage(`You joined as ${state.username}`);
    
    // Start syncing
    startSync();
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
            if (state.subtitleUrl) {
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
        if (state.subtitleUrl) {
            addSubtitles();
        }
    } else {
        alert('HLS is not supported in your browser');
    }
}

// Add subtitles
function addSubtitles() {
    const video = document.getElementById('videoPlayer');
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Subtitles';
    track.srclang = 'en';
    track.src = state.subtitleUrl;
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
    const roomData = await getFromStorage(`room:${state.roomId}`) || {};
    Object.assign(roomData, updates);
    await saveToStorage(`room:${state.roomId}`, roomData);
}

// Sync with room
async function syncWithRoom() {
    const roomData = await getFromStorage(`room:${state.roomId}`);
    
    if (!roomData) return;
    
    const video = document.getElementById('videoPlayer');
    
    // Sync time
    if (Math.abs(video.currentTime - roomData.currentTime) > 2) {
        video.currentTime = roomData.currentTime;
    }
    
    // Sync play state
    if (roomData.isPlaying && video.paused) {
        video.play().catch(e => console.log('Autoplay prevented'));
    } else if (!roomData.isPlaying && !video.paused) {
        video.pause();
    }
    
    addSystemMessage('Synced with room');
}

// Start periodic sync
function startSync() {
    // Sync every 3 seconds
    state.syncInterval = setInterval(async () => {
        if (!state.isHost) {
            const roomData = await getFromStorage(`room:${state.roomId}`);
            if (roomData) {
                const video = document.getElementById('videoPlayer');
                
                // Auto-sync if difference is more than 3 seconds
                if (Math.abs(video.currentTime - roomData.currentTime) > 3) {
                    video.currentTime = roomData.currentTime;
                }
                
                // Sync play state
                if (roomData.isPlaying && video.paused) {
                    video.play().catch(() => {});
                } else if (!roomData.isPlaying && !video.paused) {
                    video.pause();
                }
            }
        } else {
            // Host updates current time
            const video = document.getElementById('videoPlayer');
            await updateRoomState({ 
                currentTime: video.currentTime,
                isPlaying: !video.paused 
            });
        }
    }, 3000);
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
    
    // Save to storage
    const messagesKey = `messages:${state.roomId}`;
    const messages = await getFromStorage(messagesKey) || [];
    messages.push(chatMessage);
    
    // Keep only last 100 messages
    if (messages.length > 100) {
        messages.shift();
    }
    
    await saveToStorage(messagesKey, messages);
    
    // Display message
    displayMessage(chatMessage);
    
    input.value = '';
    
    // Scroll to bottom
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
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
setInterval(async () => {
    if (!state.roomId) return;
    
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
}, 2000);

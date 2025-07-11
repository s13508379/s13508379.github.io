
function addAudioTracks(files) {
    for (let file of files) {
        const trackId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const audioElement = new Audio();
        audioElement.src = URL.createObjectURL(file);
        audioElement.loop = false;
        audioElement.volume = 0.8;

        const track = {
            id: trackId,
            name: file.name,
            audio: audioElement,
            isPlaying: false,
            loop: false,
            startTime: 0,
            endTime: null,
            timelineMode: false,
            originalDuration: null,
            playOrder: audioTracks.length + 1,
            autoNext: false,
            isBackground: false
        };

        audioTracks.push(track);
        createAudioTrackUI(track);
    }
}

function createAudioTrackUI(track) {
    const tracksContainer = document.getElementById('audioTracks');
    const trackDiv = document.createElement('div');
    trackDiv.className = 'audio-track';
    trackDiv.id = track.id;
    trackDiv.innerHTML = `
    <div class="audio-track-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
                <input type="number" min="1" max="99" value="${track.playOrder}" readonly id="playOrder-${track.id}"
                    data-track="${track.id}" style="width:40px; padding:4px; background:#333; border:1px solid #555;
                color:#fff; border-radius:4px; text-align:center;" title="Play Order">
            <button onclick="moveTrackUp('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Up">↑</button>
            <button onclick="moveTrackDown('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Down">↓</button>
        </div>
        <div class="audio-track-name" style="flex: 1;">${track.name}</div>
        <div class="audio-controls-group">
            <button class="play-btn" onclick="toggleAudioTrack('${track.id}')" title="Play / Pause">▶</button>
            <button class="loop-toggle" onclick="toggleLoop('${track.id}')" title="Loop">🔁</button>
            <input type="range" class="volume-control" min="0" max="1" step="0.1" value="0.8" 
                   onchange="updateTrackVolume('${track.id}', this.value)" title="Volume">
            <div class="time-display">0:00</div>
            <button class="delete-track-btn" onclick="deleteAudioTrack('${track.id}')" title="Delete">✕</button>
        </div>
    </div>
    <div class="audio-timeline-controls" style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #ccc;">
        <label style="min-width: 60px;">Start Time:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimeSettings('${track.id}', 'start', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;">
        <span>sec</span>
        
        <label style="min-width: 60px; margin-left: 12px;">End Time:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimeSettings('${track.id}', 'end', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;">
        <span>sec</span>
                
        <label style="margin-left: 12px; font-size: 10px;">
            <input type="checkbox" onchange="updateAutoNext('${track.id}', this.checked)" style="margin-right: 4px;">
            Auto-play next after finished
        </label>
        
        <label style="margin-left: 12px; font-size: 10px;">
            <input type="checkbox" onchange="toggleBackgroundMusic('${track.id}', this.checked)" style="margin-right: 4px;">
            Set as background music
        </label>
    </div>
`;


    tracksContainer.appendChild(trackDiv);

    // Add event listeners for time updates
    track.audio.addEventListener('timeupdate', () => updateTimeDisplay(track.id));
    track.audio.addEventListener('ended', () => onTrackEnded(track.id));

    // Load duration when metadata is loaded
    track.audio.addEventListener('loadedmetadata', () => {
        const endInput = trackDiv.querySelector('input[onchange*="end"]');
        endInput.max = Math.floor(track.audio.duration);
        endInput.value = Math.floor(track.audio.duration);
        track.endTime = track.audio.duration;
    });

    reorderAudioDisplay();
}


function reorderAudioDisplay() {
    const tracksContainer = document.getElementById('audioTracks');

    const sortedTracks = audioTracks.sort((a, b) => a.playOrder - b.playOrder);

    sortedTracks.forEach(track => {
        const element = document.getElementById(track.id);

        if (element) {
            tracksContainer.appendChild(element);
        }
    });
}

//Change track to top     
function moveTrackUp(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track || track.playOrder <= 1) return;

    const prevTrack = audioTracks.find(t => t.playOrder === track.playOrder - 1);
    if (prevTrack) {
        prevTrack.playOrder++;
        track.playOrder--;
        updateOrderInputs();
        reorderAudioDisplay();
    }
}

//Change  track to down 
function moveTrackDown(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const maxOrder = Math.max(...audioTracks.map(t => t.playOrder));
    if (track.playOrder >= maxOrder) return;

    const nextTrack = audioTracks.find(t => t.playOrder === track.playOrder + 1);
    if (nextTrack) {
        nextTrack.playOrder--;
        track.playOrder++;
        updateOrderInputs();
        reorderAudioDisplay();
    }
}

function updateOrderInputs() {
    audioTracks.forEach(track => {
        const input = document.getElementById(`playOrder-${track.id}`);
        if (input) {
            input.value = track.playOrder;
        }
    });
}

function toggleAudioTrack(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .play-btn`);

    if (track.isPlaying) {
        track.audio.pause();
        track.isPlaying = false;
        button.textContent = '▶';
        button.classList.remove('playing');

        if (track.isBackground) {
            backgroundMusic.isPlaying = false;
        }
    } else {
        if (!track.isBackground && backgroundMusic.isPlaying) {
            fadeBackgroundMusic(true);
        }

        if (track.timelineMode && track.startTime > 0) {
            track.audio.currentTime = track.startTime;
        }

        track.audio.play();
        track.isPlaying = true;
        button.textContent = '⏸';
        button.classList.add('playing');

        if (track.isBackground) {
            backgroundMusic.isPlaying = true;
        }
    }
}

function toggleLoop(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .loop-toggle`);

    track.loop = !track.loop;

    if (track.loop) {
        button.classList.add('active');
        button.title = 'stop loop';
    } else {
        button.classList.remove('active');
        button.title = 'Loop';
    }
}

function updateTrackVolume(trackId, volume) {
    const track = audioTracks.find(t => t.id === trackId);
    track.audio.volume = parseFloat(volume);
}

function deleteAudioTrack(trackId) {
    const trackIndex = audioTracks.findIndex(t => t.id === trackId);
    if (trackIndex > -1) {
        const track = audioTracks[trackIndex];
        track.audio.pause();
        URL.revokeObjectURL(track.audio.src);
        audioTracks.splice(trackIndex, 1);

        const trackElement = document.getElementById(trackId);
        trackElement.remove();
    }
}

function updateTimeSettings(trackId, type, value) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const numValue = parseFloat(value);

    if (type === 'start') {
        track.startTime = numValue;
    } else if (type === 'end') {
        track.endTime = numValue > 0 ? numValue : track.audio.duration;
    }

    if (track.startTime >= track.endTime) {
        track.startTime = Math.max(0, track.endTime - 0.1);
        const startInput = document.querySelector(`#${trackId} input[onchange*="start"]`);
        if (startInput) startInput.value = track.startTime;
        track.timelineMode = !track.timelineMode;
    }
}

function updateAutoNext(trackId, enabled) {
    const track = audioTracks.find(t => t.id === trackId);
    if (track) {
        track.autoNext = enabled;
    }
}
function toggleBackgroundMusic(trackId, enabled) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    if (enabled) {
        audioTracks.forEach(t => {
            if (t.id !== trackId && t.isBackground) {
                t.isBackground = false;
                const checkbox = document.querySelector(`#${t.id} input[onchange*="toggleBackgroundMusic"]`);
                if (checkbox) checkbox.checked = false;

                const element = document.getElementById(t.id);
                if (element) {
                    element.style.backgroundColor = 'rgba(45, 45, 45, 0.8)';
                }
            }
        });

        track.isBackground = true;
        track.audio.loop = true;
        backgroundMusic.trackId = trackId;
        backgroundMusic.originalVolume = track.audio.volume;

        const element = document.getElementById(trackId);
        if (element) {
            element.style.backgroundColor = 'rgba(0, 102, 255, 0.2)';
            element.style.border = '2px solid #0066ff';
        }

        if (!track.isPlaying) {
            toggleAudioTrack(trackId);
        }
        backgroundMusic.isPlaying = true;

    } else {
        track.isBackground = false;
        track.audio.loop = false;
        backgroundMusic.trackId = null;
        backgroundMusic.isPlaying = false;

        const element = document.getElementById(trackId);
        if (element) {
            element.style.backgroundColor = 'rgba(45, 45, 45, 0.8)';
            element.style.border = '1px solid #404040';
        }
    }
}

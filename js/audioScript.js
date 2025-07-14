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
            autoNext: true,
            isBackground: false,
            playCount: 0,
            timelinePlayCount: 0
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
            <button class="loop-toggle" onclick="toggleLoop('${track.id}')" title="Add to Loop Group">🔁</button>
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
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;"
               title="Set start time for timeline mode">
        <span>sec</span>
        
        <label style="min-width: 60px; margin-left: 12px;">End Time:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimeSettings('${track.id}', 'end', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;"
               title="Set end time for timeline mode">
        <span>sec</span>

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
        track.originalDuration = track.audio.duration;

        console.log(`Track loaded: ${track.name}, Duration: ${track.audio.duration}s`);
    });

    reorderAudioDisplay();
}

function getLoopGroupTracks() {
    return audioTracks
        .filter(t => t.loop && !t.isBackground)
        .sort((a, b) => a.playOrder - b.playOrder);
}

function getNextInLoopGroup(currentOrder) {
    const loopTracks = getLoopGroupTracks();
    
    if (loopTracks.length === 0) {
        return null;
    }
    
    const currentIndex = loopTracks.findIndex(t => t.playOrder === currentOrder);
    
    if (currentIndex === -1) {
        return loopTracks[0];
    }
    
    const nextIndex = (currentIndex + 1) % loopTracks.length;
    return loopTracks[nextIndex];
}

function playNextTrack(currentOrder, skipNonLooping = false) {
    if (skipNonLooping) {
        const nextLoopTrack = getNextInLoopGroup(currentOrder);
        
        if (nextLoopTrack) {
            setTimeout(() => {
                console.log(`Playing next in loop group: ${nextLoopTrack.name} (Order: ${nextLoopTrack.playOrder})`);
                toggleAudioTrack(nextLoopTrack.id);
            }, 100);
            return true;
        } else {
            console.log('No loop group tracks available');
            return false;
        }
    } else {
        const nextTracks = audioTracks
            .filter(t => t.playOrder > currentOrder && !t.isBackground)
            .sort((a, b) => a.playOrder - b.playOrder);
        
        if (nextTracks.length === 0) {
            console.log('No more tracks to play');
            return false;
        }
        
        const targetTrack = nextTracks[0];
        
        setTimeout(() => {
            console.log(`Auto-playing next track: ${targetTrack.name} (Order: ${targetTrack.playOrder})`);
            toggleAudioTrack(targetTrack.id);
        }, 100);
        
        return true;
    }
}

function onTrackEnded(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .play-btn`);

    console.log(`Track ended: ${track.name} (playCount: ${track.playCount})`);

    if (track.isBackground) {
        return;
    }

    track.isPlaying = false;
    if (button) {
        button.textContent = '▶';
        button.classList.remove('playing');
    }

    if (track.timelineMode) {
        track.audio.currentTime = track.startTime;
    } else {
        track.audio.currentTime = 0;
    }

    const element = document.getElementById(trackId);
    if (element && !track.isBackground) {
        element.style.border = '1px solid #404040';
    }

    if (typeof sequentialPlayback === 'undefined' || !sequentialPlayback.isPlaying) {
        if (!track.playCount) {
            track.playCount = 0;
        }
        track.playCount++;

        console.log(`Auto-next logic: Track "${track.name}" play count: ${track.playCount}`);

        if (track.playCount === 1) {
            console.log('First time ending - playing immediate next track');
            playNextTrack(track.playOrder, false);
        } else if (track.playCount >= 2) {
            console.log('Second+ time ending - cycling through loop group');
            playNextTrack(track.playOrder, true);
        }
    }

    if (!track.isBackground && typeof backgroundMusic !== 'undefined' && backgroundMusic.isPlaying) {
        setTimeout(() => {
            fadeBackgroundMusic(false);
        }, 500);
    }
}

function updateTimeDisplay(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const timeDisplay = document.querySelector(`#${trackId} .time-display`);

    if (track && timeDisplay) {
        const currentTime = track.audio.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);

        if (track.timelineMode && track.endTime && currentTime >= track.endTime) {
            track.audio.pause();
            track.isPlaying = false;
            const button = document.querySelector(`#${trackId} .play-btn`);
            if (button) {
                button.textContent = '▶';
                button.classList.remove('playing');
            }

            track.audio.currentTime = track.startTime;

            const element = document.getElementById(trackId);
            if (element && !track.isBackground) {
                element.style.border = '1px solid #404040';
            }

            if (!track.isBackground) {
                if (!track.timelinePlayCount) {
                    track.timelinePlayCount = 0;
                }
                track.timelinePlayCount++;

                console.log(`Timeline ended: "${track.name}" timeline play count: ${track.timelinePlayCount}`);

                if (track.timelinePlayCount === 1) {
                    console.log('Timeline first time ending - playing immediate next track');
                    playNextTrack(track.playOrder, false);
                } else if (track.timelinePlayCount >= 2) {
                    console.log('Timeline second+ time ending - cycling through loop group');
                    playNextTrack(track.playOrder, true);
                }
            }

            if (!track.isBackground && typeof backgroundMusic !== 'undefined' && backgroundMusic.isPlaying) {
                setTimeout(() => {
                    fadeBackgroundMusic(false);
                }, 500);
            }
        }

        timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (track.timelineMode) {
            const startMin = Math.floor(track.startTime / 60);
            const startSec = Math.floor(track.startTime % 60);
            const endMin = Math.floor((track.endTime || track.audio.duration) / 60);
            const endSec = Math.floor((track.endTime || track.audio.duration) % 60);
            const playCount = track.timelinePlayCount || 0;
            timeDisplay.title = `Timeline: ${startMin}:${startSec.toString().padStart(2, '0')} - ${endMin}:${endSec.toString().padStart(2, '0')} (Played: ${playCount}x)`;
        } else {
            const playCount = track.playCount || 0;
            timeDisplay.title = `Full track: ${minutes}:${seconds.toString().padStart(2, '0')} (Played: ${playCount}x)`;
        }
    }
}

function toggleLoop(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .loop-toggle`);

    track.loop = !track.loop;

    if (track.loop) {
        button.classList.add('active');
        button.title = 'Remove from Loop Group (已加入循環組)';
        button.style.backgroundColor = '#4CAF50';
    } else {
        button.classList.remove('active');
        button.title = 'Add to Loop Group (加入循環組)';
        button.style.backgroundColor = '#555';
    }
    
    const loopTracks = getLoopGroupTracks();
    console.log('Loop Group updated:', loopTracks.map(t => `${t.name} (Order: ${t.playOrder})`));
}

function showLoopGroup() {
    const loopTracks = getLoopGroupTracks();
    if (loopTracks.length === 0) {
        console.log('No tracks in loop group');
        return;
    }
    
    console.log('Current Loop Group (in play order):');
    loopTracks.forEach((track, index) => {
        console.log(`${index + 1}. ${track.name} (Order: ${track.playOrder})`);
    });
}

function fadeBackgroundMusic(fadeOut = true) {
    if (typeof backgroundMusic === 'undefined' || !backgroundMusic.trackId) return;

    const track = audioTracks.find(t => t.id === backgroundMusic.trackId);
    if (!track || !track.isPlaying) return;

    const targetVolume = fadeOut ? backgroundMusic.fadeVolume : backgroundMusic.originalVolume;
    const currentVolume = track.audio.volume;
    const step = (targetVolume - currentVolume) / 20;

    let count = 0;
    const fadeInterval = setInterval(() => {
        if (count >= 20) {
            clearInterval(fadeInterval);
            track.audio.volume = targetVolume;
            return;
        }

        track.audio.volume = Math.max(0, Math.min(1, currentVolume + (step * count)));
        count++;
    }, 50);
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

function moveTrackUp(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track || track.playOrder <= 1) return;

    const prevTrack = audioTracks.find(t => t.playOrder === track.playOrder - 1);
    if (prevTrack) {
        prevTrack.playOrder++;
        track.playOrder--;
        updateOrderInputs();
        reorderAudioDisplay();
        
        if (track.loop || prevTrack.loop) {
            console.log('Loop group order changed');
            showLoopGroup();
        }
    }
}

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
        
        if (track.loop || nextTrack.loop) {
            console.log('Loop group order changed');
            showLoopGroup();
        }
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

        if (track.isBackground && typeof backgroundMusic !== 'undefined') {
            backgroundMusic.isPlaying = false;
        }
    } else {
        if (!track.isBackground && typeof backgroundMusic !== 'undefined' && backgroundMusic.isPlaying) {
            fadeBackgroundMusic(true);
        }

        if (track.timelineMode && track.startTime > 0) {
            track.audio.currentTime = track.startTime;
        }

        if (track.isBackground && typeof backgroundMusic !== 'undefined') {
            backgroundMusic.isPlaying = true;
        }

        track.audio.play();
        track.isPlaying = true;
        button.textContent = '⏸';
        button.classList.add('playing');

        const element = document.getElementById(trackId);
        if (element && !track.isBackground) {
            if (track.loop) {
                element.style.border = '2px solid #4CAF50';
            } else {
                element.style.border = '2px solid #00ff00';
            }
        }
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
        
        if (track.loop) {
            console.log('Removed track from loop group');
            showLoopGroup();
        }
    }
}

function updateTimeSettings(trackId, type, value) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const numValue = parseFloat(value);

    if (type === 'start') {
        track.startTime = Math.max(0, numValue);

        if (track.endTime && track.startTime >= track.endTime) {
            track.startTime = Math.max(0, track.endTime - 0.1);
            const startInput = document.querySelector(`#${trackId} input[onchange*="start"]`);
            if (startInput) startInput.value = track.startTime.toFixed(1);
        }
    } else if (type === 'end') {
        const maxDuration = track.audio.duration || 999;
        track.endTime = numValue > 0 ? Math.min(numValue, maxDuration) : maxDuration;

        if (track.endTime <= track.startTime) {
            track.endTime = track.startTime + 0.1;
            const endInput = document.querySelector(`#${trackId} input[onchange*="end"]`);
            if (endInput) endInput.value = track.endTime.toFixed(1);
        }
    }

    const totalDuration = track.audio.duration || 0;
    track.timelineMode = track.startTime > 0 || (track.endTime && track.endTime < totalDuration);

    console.log(`Timeline mode ${track.timelineMode ? 'enabled' : 'disabled'} for ${track.name}`);
    console.log(`Start: ${track.startTime}s, End: ${track.endTime}s, Duration: ${totalDuration}s`);
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
        
        if (typeof backgroundMusic !== 'undefined') {
            backgroundMusic.trackId = trackId;
            backgroundMusic.originalVolume = track.audio.volume;
        }

        const element = document.getElementById(trackId);
        if (element) {
            element.style.backgroundColor = 'rgba(0, 102, 255, 0.2)';
            element.style.border = '2px solid #0066ff';
        }

        if (!track.isPlaying) {
            toggleAudioTrack(trackId);
        }
        
        if (typeof backgroundMusic !== 'undefined') {
            backgroundMusic.isPlaying = true;
        }

    } else {
        track.isBackground = false;
        track.audio.loop = false;
        
        if (typeof backgroundMusic !== 'undefined') {
            backgroundMusic.trackId = null;
            backgroundMusic.isPlaying = false;
        }

        const element = document.getElementById(trackId);
        if (element) {
            element.style.backgroundColor = 'rgba(45, 45, 45, 0.8)';
            element.style.border = '1px solid #404040';
        }
    }
}

function playAllAudio() {
    const regularTracks = audioTracks
        .filter(track => !track.isBackground)
        .sort((a, b) => a.playOrder - b.playOrder);

    if (regularTracks.length === 0) {
        console.log('No tracks to play');
        return;
    }

    regularTracks.forEach(track => {
        if (!track.isPlaying) {
                            console.log(track.id)
            toggleAudioTrack(track.id);
        }
    });

    console.log(`Playing ${regularTracks.length} tracks simultaneously`);
}

function playAllInSequence() {
    const regularTracks = audioTracks
        .filter(track => !track.isBackground)
        .sort((a, b) => a.playOrder - b.playOrder);

    if (regularTracks.length === 0) {
        console.log('No tracks to play');
        return;
    }

    stopAllAudio();

    const firstTrack = regularTracks[0];
    toggleAudioTrack(firstTrack.id);

    console.log(`Starting sequential playback of ${regularTracks.length} tracks`);
    showLoopGroup();
}

function pauseAllAudio() {
    audioTracks.forEach(track => {
        if (track.isPlaying) {
            toggleAudioTrack(track.id);
        }
    });
}

function stopAllAudio() {
    audioTracks.forEach(track => {
        track.audio.pause();

        if (track.timelineMode) {
            track.audio.currentTime = track.startTime;
        } else {
            track.audio.currentTime = 0;
        }

        track.isPlaying = false;
        const button = document.querySelector(`#${track.id} .play-btn`);
        if (button) {
            button.textContent = '▶';
            button.classList.remove('playing');
        }

        const element = document.getElementById(track.id);
        if (element && !track.isBackground) {
            element.style.border = '1px solid #404040';
        }
    });

    console.log('All audio stopped and reset');
}
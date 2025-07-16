let controlsHeightChanged = false;
let globalTimeline = {
    isPlaying: false,
    startTime: 0,
    currentTime: 0,
    duration: 0,
    loop: true,
    animationId: null
};

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
            startTime: 0,  // When in timeline this track starts playing
            endTime: null, // When in timeline this track stops playing
            duration: null,
            timelineActive: false,
            playOrder: audioTracks.length + 1,
            isBackground: false
        };

        audioTracks.push(track);
        createAudioTrackUI(track);
    }
    updateTimelineDuration();
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
                color:#fff; border-radius:4px; text-align:center;" title="Track Order">
            <button onclick="moveTrackUp('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Up">↑</button>
            <button onclick="moveTrackDown('${track.id}')" 
                    style="width: 24px; height: 24px; background: #555; border: none; color: #fff; border-radius: 4px; cursor: pointer; font-size: 12px;"
                    title="Move Down">↓</button>
        </div>
        <div class="audio-track-name" style="flex: 1;">${track.name}</div>
        <div class="audio-controls-group">
            <button class="play-btn" onclick="toggleIndividualTrack('${track.id}')" title="Play Individual Track">▶</button>
            <input type="range" class="volume-control" min="0" max="1" step="0.1" value="0.8" 
                   onchange="updateTrackVolume('${track.id}', this.value)" title="Volume">
            <div class="time-display" id="time-${track.id}">0:00</div>
            <button class="delete-track-btn" onclick="deleteAudioTrack('${track.id}')" title="Delete">✕</button>
        </div>
    </div>
    <div class="audio-timeline-controls" style="display: flex; gap: 8px; align-items: center; font-size: 11px; color: #ccc;">
        <label style="min-width: 80px;">Timeline Start:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimelineSettings('${track.id}', 'start', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;"
               title="When this track starts in the timeline">
        <span>sec</span>
        
        <label style="min-width: 80px; margin-left: 12px;">Timeline End:</label>
        <input type="number" min="0" max="999" step="0.1" value="0" 
               onchange="updateTimelineSettings('${track.id}', 'end', this.value)"
               style="width: 60px; padding: 4px; background: #333; border: 1px solid #555; color: #fff; border-radius: 4px;"
               title="When this track ends in the timeline">
        <span>sec</span>

        <div class="timeline-status" style="margin-left: 12px; padding: 2px 6px; background: #555; border-radius: 3px; font-size: 10px;">
            Inactive
        </div>
    </div>
`;

    tracksContainer.appendChild(trackDiv);

    // Change controls max-height to 70% only if it hasn't been changed already
    if (!controlsHeightChanged) {
        const controlsElement = document.getElementById('controls');
        if (controlsElement) {
            controlsElement.style.maxHeight = '70%';
            controlsHeightChanged = true;
        }
    }

    // Load duration when metadata is loaded
    track.audio.addEventListener('loadedmetadata', () => {
        track.duration = track.audio.duration;
        const endInput = trackDiv.querySelector('input[onchange*="end"]');
        if (track.endTime === null) {
            track.endTime = track.startTime + track.duration;
            endInput.value = track.endTime.toFixed(1);
        }
        updateTimelineDuration();
        console.log(`Track loaded: ${track.name}, Duration: ${track.duration}s`);
    });

    track.audio.addEventListener('ended', () => {
        // Reset individual track playback
        track.isPlaying = false;
        const button = document.querySelector(`#${track.id} .play-btn`);
        if (button) {
            button.textContent = '▶';
            button.classList.remove('playing');
        }
        track.audio.currentTime = 0;
    });

    updateTimelineDuration();
}

function updateTimelineSettings(trackId, type, value) {
    const track = audioTracks.find(t => t.id === trackId);
    if (!track) return;

    const numValue = parseFloat(value);

    if (type === 'start') {
        track.startTime = Math.max(0, numValue);
        
        // Auto-adjust end time if not manually set
        if (track.duration && track.endTime <= track.startTime) {
            track.endTime = track.startTime + track.duration;
            const endInput = document.querySelector(`#${trackId} input[onchange*="end"]`);
            if (endInput) endInput.value = track.endTime.toFixed(1);
        }
    } else if (type === 'end') {
        track.endTime = Math.max(track.startTime + 0.1, numValue);
        
        // Update input if value was adjusted
        const endInput = document.querySelector(`#${trackId} input[onchange*="end"]`);
        if (endInput && endInput.value !== track.endTime.toString()) {
            endInput.value = track.endTime.toFixed(1);
        }
    }

    updateTimelineDuration();
    updateTimelineStatus(trackId);
    
    console.log(`Timeline updated for ${track.name}: Start=${track.startTime}s, End=${track.endTime}s`);
}

function updateTimelineDuration() {
    // Calculate total timeline duration
    let maxEndTime = 0;
    audioTracks.forEach(track => {
        if (track.endTime && track.endTime > maxEndTime) {
            maxEndTime = track.endTime;
        }
    });
    globalTimeline.duration = maxEndTime;
    
    // Update timeline display
    updateTimelineDisplay();
}

function updateTimelineStatus(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const statusElement = document.querySelector(`#${trackId} .timeline-status`);
    
    if (track && statusElement) {
        const isActive = track.startTime !== undefined && track.endTime !== undefined;
        statusElement.textContent = isActive ? `Active (${(track.endTime - track.startTime).toFixed(1)}s)` : 'Inactive';
        statusElement.style.background = isActive ? '#4CAF50' : '#555';
    }
}

function updateTimelineDisplay() {
    const timelineInfo = document.getElementById('timeline-info');
    if (!timelineInfo) {
        // Create timeline info display
        const audioControls = document.getElementById('audioControls');
        const infoDiv = document.createElement('div');
        infoDiv.id = 'timeline-info';
        infoDiv.style.cssText = `
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 8px 0; 
            border-bottom: 1px solid #404040; 
            margin-bottom: 8px;
            font-size: 12px;
            color: #ccc;
        `;
        infoDiv.innerHTML = `
            <div>
                <span>Timeline: </span>
                <span id="timeline-current">0:00</span>
                <span> / </span>
                <span id="timeline-duration">0:00</span>
            </div>
            <div>
                <button onclick="playTimeline()" id="timeline-play-btn" style="
                    background: #4CAF50; 
                    border: none; 
                    color: white; 
                    padding: 6px 12px; 
                    border-radius: 4px; 
                    cursor: pointer; 
                    margin-right: 8px;
                ">Play Timeline</button>
                <label style="font-size: 11px;">
                    <input type="checkbox" id="timeline-loop" checked onchange="globalTimeline.loop = this.checked">
                    Loop Timeline
                </label>
            </div>
        `;
        audioControls.insertBefore(infoDiv, audioControls.firstChild);
    }
    
    // Update duration display
    const durationSpan = document.getElementById('timeline-duration');
    if (durationSpan) {
        const minutes = Math.floor(globalTimeline.duration / 60);
        const seconds = Math.floor(globalTimeline.duration % 60);
        durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

function playTimeline() {
    if (globalTimeline.isPlaying) {
        stopTimeline();
        return;
    }
    
    globalTimeline.isPlaying = true;
    globalTimeline.startTime = Date.now();
    globalTimeline.currentTime = 0;
    
    const playBtn = document.getElementById('timeline-play-btn');
    if (playBtn) {
        playBtn.textContent = 'Stop Timeline';
        playBtn.style.background = '#ff4444';
    }
    
    console.log(`Starting timeline playback (Duration: ${globalTimeline.duration}s, Loop: ${globalTimeline.loop})`);
    
    // Start timeline loop
    updateTimeline();
}

function stopTimeline() {
    globalTimeline.isPlaying = false;
    globalTimeline.currentTime = 0;
    
    if (globalTimeline.animationId) {
        cancelAnimationFrame(globalTimeline.animationId);
        globalTimeline.animationId = null;
    }
    
    const playBtn = document.getElementById('timeline-play-btn');
    if (playBtn) {
        playBtn.textContent = 'Play Timeline';
        playBtn.style.background = '#4CAF50';
    }
    
    // Stop all tracks
    audioTracks.forEach(track => {
        track.audio.pause();
        track.audio.currentTime = 0;
        track.timelineActive = false;
        
        const timeDisplay = document.getElementById(`time-${track.id}`);
        if (timeDisplay) {
            timeDisplay.textContent = '0:00';
        }
    });
    
    // Reset timeline display
    const currentSpan = document.getElementById('timeline-current');
    if (currentSpan) {
        currentSpan.textContent = '0:00';
    }
    
    console.log('Timeline stopped and reset');
}

function updateTimeline() {
    if (!globalTimeline.isPlaying) return;
    
    // Calculate current timeline position
    const elapsed = (Date.now() - globalTimeline.startTime) / 1000;
    globalTimeline.currentTime = elapsed;
    
    // Update timeline display
    const currentSpan = document.getElementById('timeline-current');
    if (currentSpan) {
        const minutes = Math.floor(elapsed / 60);
        const seconds = Math.floor(elapsed % 60);
        currentSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Check if timeline is complete
    if (elapsed >= globalTimeline.duration) {
        if (globalTimeline.loop) {
            // Restart timeline
            console.log('Timeline loop - restarting');
            globalTimeline.startTime = Date.now();
            globalTimeline.currentTime = 0;
            
            // Reset all tracks
            audioTracks.forEach(track => {
                track.audio.pause();
                track.audio.currentTime = 0;
                track.timelineActive = false;
            });
        } else {
            // Stop timeline
            stopTimeline();
            return;
        }
    }
    
    // Update each track based on timeline position
    audioTracks.forEach(track => {
        const shouldPlay = elapsed >= track.startTime && elapsed < track.endTime;
        
        if (shouldPlay && !track.timelineActive) {
            // Start playing this track
            track.timelineActive = true;
            track.audio.currentTime = 0;
            track.audio.play().catch(e => console.log('Audio play failed:', e));
            
            console.log(`Timeline: Starting ${track.name} at ${elapsed.toFixed(1)}s`);
            
        } else if (!shouldPlay && track.timelineActive) {
            // Stop playing this track
            track.timelineActive = false;
            track.audio.pause();
            track.audio.currentTime = 0;
            
            console.log(`Timeline: Stopping ${track.name} at ${elapsed.toFixed(1)}s`);
        }
        
        // Update individual track time display
        const timeDisplay = document.getElementById(`time-${track.id}`);
        if (timeDisplay && track.timelineActive) {
            const trackTime = track.audio.currentTime;
            const minutes = Math.floor(trackTime / 60);
            const seconds = Math.floor(trackTime % 60);
            timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    });
    
    // Continue timeline
    globalTimeline.animationId = requestAnimationFrame(updateTimeline);
}

function toggleIndividualTrack(trackId) {
    const track = audioTracks.find(t => t.id === trackId);
    const button = document.querySelector(`#${trackId} .play-btn`);
    
    if (track.isPlaying) {
        track.audio.pause();
        track.isPlaying = false;
        button.textContent = '▶';
        button.classList.remove('playing');
    } else {
        track.audio.currentTime = 0;
        track.audio.play().catch(e => console.log('Audio play failed:', e));
        track.isPlaying = true;
        button.textContent = '⏸';
        button.classList.add('playing');
    }
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

function updateTrackVolume(trackId, volume) {
    const track = audioTracks.find(t => t.id === trackId);
    if (track) {
        track.audio.volume = parseFloat(volume);
    }
}

function deleteAudioTrack(trackId) {
    const trackIndex = audioTracks.findIndex(t => t.id === trackId);
    if (trackIndex > -1) {
        const track = audioTracks[trackIndex];
        track.audio.pause();
        URL.revokeObjectURL(track.audio.src);
        audioTracks.splice(trackIndex, 1);

        const trackElement = document.getElementById(trackId);
        if (trackElement) {
            trackElement.remove();
        }

        updateTimelineDuration();
        console.log(`Track ${track.name} deleted`);
    }
}

// Updated master controls to work with timeline
function playAllAudio() {
    playTimeline();
}

function playAllInSequence() {
    // For timeline mode, this just plays the timeline
    playTimeline();
}

function pauseAllAudio() {
    if (globalTimeline.isPlaying) {
        stopTimeline();
    }
    
    // Also pause any individual tracks
    audioTracks.forEach(track => {
        if (track.isPlaying) {
            toggleIndividualTrack(track.id);
        }
    });
}

function stopAllAudio() {
    stopTimeline();
    
    // Also stop any individual tracks
    audioTracks.forEach(track => {
        if (track.isPlaying) {
            toggleIndividualTrack(track.id);
        }
    });
}

// Keep existing functions for compatibility
async function getAudioBlobFromElement(audioElement) {
    return new Promise((resolve, reject) => {
        try {
            if (audioElement.src.startsWith('blob:')) {
                fetch(audioElement.src)
                    .then(response => response.blob())
                    .then(blob => resolve(blob))
                    .catch(reject);
            } else {
                fetch(audioElement.src)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.blob();
                    })
                    .then(blob => resolve(blob))
                    .catch(reject);
            }
        } catch (error) {
            reject(error);
        }
    });
}
let narrationToken = 0;
let narrationBusy = false;
let narrationHold = false;

function invalidateNarration() {
    narrationToken += 1;
    narrationBusy = false;
    narrationHold = false;
}

function releaseNarration(token) {
    if (token !== narrationToken) return;
    const holding = narrationHold;
    narrationBusy = false;
    narrationHold = false;
    if (!isPlaying || audioSettings.muted) return;
    const story = activeStory();
    if (!story) return;
    if (!(audioSettings.advanceOnSpeechEnd || holding)) return;
    if (playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
    else if (holding) { stopPlayback(); renderApp(); }
}

function setPlayerIndex(index, resume = isPlaying) {
    const story = activeStory();
    if (!story?.steps.length) return;
    const next = clamp(Number(index), 0, story.steps.length - 1);
    invalidateNarration();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const device = $('#playerDevice');
    if (device) device.classList.add('fade-out');
    if (playerTimer) cancelAnimationFrame(playerTimer);
    setTimeout(() => {
        playerIndex = next;
        renderApp();
        if (resume) startStepTimer();
    }, 120);
}

function startStepTimer() {
    const story = activeStory();
    const step = story?.steps[playerIndex];
    if (!isPlaying || !step) return;
    if (playerTimer) cancelAnimationFrame(playerTimer);
    playerStartedAt = performance.now();
    speakStep(step);
    const duration = Math.max(500, Number(step.dwellSeconds || 3.5) * 1000 / Number(story.settings.defaultSpeed || 1));
    const tick = now => {
        if (!isPlaying) return;
        const progress = clamp(((now - playerStartedAt) / duration) * 100, 0, 100);
        const active = $('.timeline-step.active');
        if (active) active.style.setProperty('--progress', `${progress}%`);
        if (progress >= 100) {
            if (narrationBusy) {
                narrationHold = true;
                if (active) active.style.setProperty('--progress', '100%');
                return;
            }
            if (playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
            else { stopPlayback(); renderApp(); }
            return;
        }
        playerTimer = requestAnimationFrame(tick);
    };
    playerTimer = requestAnimationFrame(tick);
}

function toggleNarrationMute(button) {
    audioSettings.muted = !audioSettings.muted;
    saveJson(APP.audioKey, audioSettings);
    if ('speechSynthesis' in window) {
        if (audioSettings.muted) {
            const holding = narrationHold;
            invalidateNarration();
            window.speechSynthesis.cancel();
            if (holding && isPlaying) {
                const story = activeStory();
                if (story && playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
                else { stopPlayback(); renderApp(); }
            }
        }
        else if (isPlaying && currentView === 'player') {
            const step = activeStory()?.steps[playerIndex];
            if (step) speakStep(step);
        }
    }
    if (!button) return;
    const muted = !!audioSettings.muted;
    button.classList.toggle('is-muted', muted);
    button.setAttribute('aria-pressed', String(muted));
    button.setAttribute('aria-label', muted ? 'Unmute narration' : 'Mute narration');
    button.innerHTML = narrationMuteIcon(muted);
}

function speakStep(step) {
    const token = ++narrationToken;
    narrationBusy = false;
    narrationHold = false;
    if (!audioSettings.enabled || audioSettings.muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const parts = [];
    if (audioSettings.readTitle && step.title) parts.push(step.title);
    if (audioSettings.readUserAction && step.userAction) parts.push(step.userAction);
    if (audioSettings.readScreenContent && step.screenContent) parts.push(step.screenContent);
    if (audioSettings.readNextAction && step.nextAction) parts.push(step.nextAction);
    if (!parts.length) return;
    const utterance = new SpeechSynthesisUtterance(parts.join('. '));
    utterance.rate = Number(audioSettings.rate);
    utterance.pitch = Number(audioSettings.pitch);
    utterance.volume = Number(audioSettings.volume);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.voiceURI === audioSettings.voiceURI) || voices.find(voice => /Google US English/i.test(voice.name)) || voices.find(voice => /^en-US/i.test(voice.lang)) || null;
    utterance.onend = () => releaseNarration(token);
    utterance.onerror = () => releaseNarration(token);
    narrationBusy = true;
    window.speechSynthesis.speak(utterance);
}

function renderAudioSettings() {
    const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('en')) : [];
    const voiceOptions = [`<option value="">Automatic English voice</option>`, ...voices.map(voice => `<option value="${esc(voice.voiceURI)}" ${voice.voiceURI === audioSettings.voiceURI ? 'selected':''}>${esc(voice.name)} (${esc(voice.lang)})</option>`)].join('');
    $('#audioSettingsBody').innerHTML = `<div class="toggle-row"><span>Enable spoken narration</span><button class="switch ${audioSettings.enabled ? 'on':''}" data-action="audio-toggle" data-key="enabled" aria-label="Toggle narration"></button></div><label class="field" style="margin-top:12px"><span class="field-label">VOICE</span><select class="select" data-audio-field="voiceURI">${voiceOptions}</select></label><div style="margin-top:16px"><label class="range-row"><span>Rate</span><input type="range" data-audio-field="rate" min=".5" max="2" step=".1" value="${audioSettings.rate}"><span>${Number(audioSettings.rate).toFixed(1)}×</span></label><label class="range-row"><span>Pitch</span><input type="range" data-audio-field="pitch" min=".5" max="1.5" step=".1" value="${audioSettings.pitch}"><span>${Number(audioSettings.pitch).toFixed(1)}</span></label><label class="range-row"><span>Volume</span><input type="range" data-audio-field="volume" min="0" max="1" step=".1" value="${audioSettings.volume}"><span>${Math.round(audioSettings.volume*100)}%</span></label></div><div style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">${[['readTitle','Read step title'],['readUserAction','Read user action'],['readScreenContent','Read visible state'],['readNextAction','Read next action'],['advanceOnSpeechEnd','Advance when speech ends']].map(([key,label]) => `<div class="toggle-row"><span>${label}</span><button class="switch ${audioSettings[key] ? 'on':''}" data-action="audio-toggle" data-key="${key}" aria-label="Toggle ${label}"></button></div>`).join('')}</div>`;
}

function openAudioDialog() {
    renderAudioSettings();
    $('#audioDialog').showModal();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => { if ($('#audioDialog').open) renderAudioSettings(); };
}


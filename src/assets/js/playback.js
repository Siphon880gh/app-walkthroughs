let narrationToken = 0;
let narrationBusy = false;
let narrationHold = false;
let narrationStartedAt = 0;
let narrationEstimateMs = 0;
let activeUtterance = null;
let speechCancelGeneration = 0;

function cancelSpeech() {
    if (!('speechSynthesis' in window)) return;
    const generation = ++speechCancelGeneration;
    if (activeUtterance) {
        activeUtterance.onend = null;
        activeUtterance.onerror = null;
        activeUtterance.volume = 0;
        activeUtterance = null;
    }
    const synth = window.speechSynthesis;
    const silence = () => {
        if (generation !== speechCancelGeneration) return;
        synth.pause();
        synth.cancel();
    };
    silence();
    requestAnimationFrame(silence);
}

function estimateSpeechMs(text) {
    const rate = Math.max(0.5, Number(audioSettings.rate) || 1);
    const charsPerSecond = 13 * rate;
    return Math.max(600, (String(text).length / charsPerSecond) * 1000);
}

function syncSpeechCountdown(active, now) {
    if (!active) return;
    const badge = active.querySelector('.speech-countdown');
    if (!narrationHold) {
        badge?.remove();
        return;
    }
    const node = badge || active.appendChild(Object.assign(document.createElement('span'), {className: 'speech-countdown'}));
    const remaining = Math.max(0, narrationEstimateMs - (now - narrationStartedAt));
    node.textContent = `${Math.ceil(remaining / 1000)}s`;
}

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

const MOTION_INVERSE = {
    'slide-left': 'slide-right',
    'slide-right': 'slide-left',
    'slide-up': 'slide-down',
    'slide-down': 'slide-up',
    'scroll-down': 'scroll-up',
    'scroll-up': 'scroll-down',
    'modal-pop': 'modal-dismiss',
    'tap-zoom': 'tap-zoom-out'
};

let stepTransition = 0;
let activeMotion = [];
let motionTimer = 0;

function cancelMotion() {
    activeMotion.forEach(animation => animation.cancel());
    activeMotion = [];
    clearTimeout(motionTimer);
    motionTimer = 0;
}

function cancelStepTransition() {
    stepTransition += 1;
    cancelMotion();
}

function motionEasing(name) {
    if (name === 'spring') return 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    if (name === 'linear' || name === 'ease' || name === 'ease-in-out') return name;
    return 'ease-in-out';
}

function motionPlan(motion) {
    const slide = (axis, sign) => {
        const negative = sign < 0;
        const travel = axis === 'x'
            ? `translateX(calc(${negative ? '-100% - 16px' : '100% + 16px'}))`
            : `translateY(calc(${negative ? '-100% - 16px' : '100% + 16px'}))`;
        const edge = axis === 'x'
            ? `left:${negative ? 'calc(100% + 16px)' : 'calc(-100% - 16px)'};top:0`
            : `top:${negative ? 'calc(100% + 16px)' : 'calc(-100% - 16px)'};left:0`;
        return {cls: `motion-${motion}`, track: [{transform: 'translate(0,0)'}, {transform: travel}], outStyle: 'left:0;top:0', inStyle: edge};
    };
    switch (motion) {
        case 'slide-left': return slide('x', -1);
        case 'slide-right': return slide('x', 1);
        case 'slide-up': return slide('y', -1);
        case 'slide-down': return slide('y', 1);
        case 'scroll-down': return {cls: 'motion-scroll-down', track: [{transform: 'translateY(0)'}, {transform: 'translateY(-100%)'}], outStyle: 'left:0;top:0', inStyle: 'left:0;top:100%'};
        case 'scroll-up': return {cls: 'motion-scroll-up', track: [{transform: 'translateY(0)'}, {transform: 'translateY(100%)'}], outStyle: 'left:0;top:0', inStyle: 'left:0;top:-100%'};
        case 'fade': return {cls: 'motion-fade', outStyle: 'inset:0', inStyle: 'inset:0;opacity:0;z-index:2', out: [{opacity: 1}, {opacity: 0}], inn: [{opacity: 0}, {opacity: 1}]};
        case 'tap-zoom': return {cls: 'motion-tap-zoom', outStyle: 'inset:0', inStyle: 'inset:0;opacity:0;transform:scale(.86);z-index:2', out: [{transform: 'scale(1)', opacity: 1}, {transform: 'scale(1.18)', opacity: 0}], inn: [{transform: 'scale(.86)', opacity: 0}, {transform: 'scale(1)', opacity: 1}]};
        case 'tap-zoom-out': return {cls: 'motion-tap-zoom', outStyle: 'inset:0;z-index:2', inStyle: 'inset:0;opacity:0;transform:scale(1.18)', out: [{transform: 'scale(1)', opacity: 1}, {transform: 'scale(.86)', opacity: 0}], inn: [{transform: 'scale(1.18)', opacity: 0}, {transform: 'scale(1)', opacity: 1}]};
        case 'modal-pop': return {cls: 'motion-modal-pop', outStyle: 'inset:0', inStyle: 'inset:0;opacity:0;transform:translateY(18%) scale(.82);z-index:2', out: [{transform: 'scale(1)', opacity: 1}, {transform: 'scale(.93)', opacity: .4}], inn: [{transform: 'translateY(18%) scale(.82)', opacity: 0}, {transform: 'translateY(0) scale(1)', opacity: 1}]};
        case 'modal-dismiss': return {cls: 'motion-modal-dismiss', outStyle: 'inset:0;z-index:2', inStyle: 'inset:0;opacity:.4;transform:scale(.93)', out: [{transform: 'translateY(0) scale(1)', opacity: 1}, {transform: 'translateY(18%) scale(.82)', opacity: 0}], inn: [{transform: 'scale(.93)', opacity: .4}, {transform: 'scale(1)', opacity: 1}]};
        default: return null;
    }
}

function syncPlayerChrome() {
    const story = activeStory();
    const step = story?.steps[playerIndex];
    const root = $('.narrative');
    if (!story || !step || !root) return;
    const label = $('.narrative-step', root);
    if (label) label.textContent = `Step ${playerIndex + 1} of ${story.steps.length}`;
    const title = $('h2', root);
    if (title) title.textContent = step.title;
    syncNarrativeBlocks(root, step);
    const tags = $$('.tag', root);
    if (tags[0]) tags[0].textContent = step.transition?.type || 'none';
    if (tags[1]) tags[1].textContent = `${Number(step.transition?.duration || 0).toFixed(1)}s ${step.transition?.easing || ''}`.trim();
    $$('.timeline-step').forEach((button, index) => {
        button.classList.toggle('done', index < playerIndex);
        button.classList.toggle('active', index === playerIndex);
        if (index === playerIndex) button.style.setProperty('--progress', '0%');
    });
    const prev = $('[data-action="player-prev"]');
    const nextBtn = $('[data-action="player-next"]');
    if (prev) prev.disabled = playerIndex === 0;
    if (nextBtn) nextBtn.disabled = playerIndex === story.steps.length - 1;
    const elapsed = $('#playerElapsed');
    if (elapsed) elapsed.textContent = String(playerIndex + 1).padStart(2, '0');
}

function startMotion(wrap, fromStep, toStep, motion, ms, easing) {
    const plan = motionPlan(motion);
    const fromScreen = screenById(fromStep?.screenId);
    const toScreen = screenById(toStep?.screenId);
    const host = toScreen || fromScreen;
    if (!plan || !host || !wrap) return [];
    const outHtml = fromScreen ? screenInnerMarkup(fromScreen, fromStep, false) : '';
    const inHtml = toScreen ? screenInnerMarkup(toScreen, toStep, false) : '';
    const panes = `<div class="motion-pane pane-out" style="${plan.outStyle}">${outHtml}</div><div class="motion-pane pane-in" style="${plan.inStyle}">${inHtml}</div>`;
    const stage = plan.track
        ? `<div class="motion-track">${panes}</div>`
        : panes;
    wrap.classList.add('is-transitioning');
    wrap.innerHTML = `<div class="device ${esc(deviceFrameName(host))}"><div class="device-screen motion-viewport ${plan.cls}">${stage}</div></div>`;
    const opts = {duration: ms, easing, fill: 'forwards'};
    const animate = (el, frames) => {
        try { return el.animate(frames, opts); }
        catch { return el.animate(frames, {...opts, easing: 'ease-in-out'}); }
    };
    if (plan.track) return [animate($('.motion-track', wrap), plan.track)];
    return [animate($('.pane-out', wrap), plan.out), animate($('.pane-in', wrap), plan.inn)];
}

function setPlayerIndex(index, resume = isPlaying) {
    const story = activeStory();
    if (!story?.steps.length) return;
    const next = clamp(Number(index), 0, story.steps.length - 1);
    if (next === playerIndex) {
        if (!activeMotion.length && resume && isPlaying && currentView === 'player') startStepTimer();
        return;
    }
    const token = ++stepTransition;
    const from = playerIndex;
    const fromStep = story.steps[from];
    const toStep = story.steps[next];
    playerIndex = next;
    invalidateNarration();
    cancelSpeech();
    if (playerTimer) cancelAnimationFrame(playerTimer);
    cancelMotion();

    let settled = false;
    const commit = () => {
        if (settled || token !== stepTransition) return;
        settled = true;
        clearTimeout(motionTimer);
        activeMotion = [];
        renderApp();
        if (resume && isPlaying && currentView === 'player') startStepTimer();
    };

    const spec = (next > from ? toStep : fromStep)?.transition || {};
    const motion = next > from ? (spec.type || 'none') : (MOTION_INVERSE[spec.type] || spec.type || 'none');
    const speed = Math.max(0.25, Number(story.settings?.defaultSpeed) || 1);
    const duration = Number(spec.duration);
    const ms = (Number.isFinite(duration) && duration > 0 ? duration : 0.6) * 1000 / speed;
    const wrap = currentView === 'player' ? $('#playerDevice') : null;
    if (!wrap || motion === 'none' || ms < 40 || !motionPlan(motion)) {
        commit();
        return;
    }

    syncPlayerChrome();
    try {
        activeMotion = startMotion(wrap, fromStep, toStep, motion, ms, motionEasing(spec.easing));
        if (!activeMotion.length) { commit(); return; }
        motionTimer = setTimeout(commit, ms + 80);
        Promise.all(activeMotion.map(animation => animation.finished.then(() => true, () => false))).then(results => {
            if (results.every(Boolean)) commit();
        });
    } catch (error) {
        console.error(error);
        commit();
    }
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
                syncSpeechCountdown(active, now);
                playerTimer = requestAnimationFrame(tick);
                return;
            }
            syncSpeechCountdown(active, now);
            if (playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
            else { stopPlayback(); renderApp(); }
            return;
        }
        syncSpeechCountdown(active, now);
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
            cancelSpeech();
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

function spokenSlipName(value) {
    return String(value)
        .replace(/\.(?:png|jpe?g|webp|gif|svg)$/i, '')
        .replace(/[_‐‑‒–—―−\-./\\|+#~*]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function spokenStepTitle(step) {
    const title = spokenSlipName(step?.title || '');
    if (!title) return '';
    const fileName = spokenSlipName(screenById(step?.screenId)?.name || '');
    return fileName && title.toLowerCase() === fileName.toLowerCase() ? '' : title;
}

function speakStep(step) {
    const token = ++narrationToken;
    speechCancelGeneration += 1;
    narrationBusy = false;
    narrationHold = false;
    if (!audioSettings.enabled || audioSettings.muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const parts = [];
    if (audioSettings.readTitle && step.title) {
        const title = spokenStepTitle(step);
        if (title) parts.push(title);
    }
    const speak = (enabled, key) => {
        if (!enabled) return;
        const text = narrativeValue(step, key);
        if (text) parts.push(text);
    };
    speak(audioSettings.readNarrateBefore, 'narrateBefore');
    speak(audioSettings.readUserAction, 'userAction');
    speak(audioSettings.readScreenContent, 'screenContent');
    speak(audioSettings.readNextAction, 'nextAction');
    speak(audioSettings.readNarrateAfter, 'narrateAfter');
    if (!parts.length) return;
    const script = parts.join('. ');
    narrationEstimateMs = estimateSpeechMs(script);
    narrationStartedAt = performance.now();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = Number(audioSettings.rate);
    utterance.pitch = Number(audioSettings.pitch);
    utterance.volume = Number(audioSettings.volume);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.voiceURI === audioSettings.voiceURI) || voices.find(voice => /Google US English/i.test(voice.name)) || voices.find(voice => /^en-US/i.test(voice.lang)) || null;
    utterance.onend = () => releaseNarration(token);
    utterance.onerror = () => releaseNarration(token);
    activeUtterance = utterance;
    narrationBusy = true;
    window.speechSynthesis.speak(utterance);
}

function renderAudioSettings() {
    const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('en')) : [];
    const voiceOptions = [`<option value="">Automatic English voice</option>`, ...voices.map(voice => `<option value="${esc(voice.voiceURI)}" ${voice.voiceURI === audioSettings.voiceURI ? 'selected':''}>${esc(voice.name)} (${esc(voice.lang)})</option>`)].join('');
    $('#audioSettingsBody').innerHTML = `<div class="toggle-row"><span>Enable spoken narration</span><button class="switch ${audioSettings.enabled ? 'on':''}" data-action="audio-toggle" data-key="enabled" aria-label="Toggle narration"></button></div><label class="field" style="margin-top:12px"><span class="field-label">VOICE</span><select class="select" data-audio-field="voiceURI">${voiceOptions}</select></label><div style="margin-top:16px"><label class="range-row"><span>Rate</span><input type="range" data-audio-field="rate" min=".5" max="2" step=".1" value="${audioSettings.rate}"><span>${Number(audioSettings.rate).toFixed(1)}×</span></label><label class="range-row"><span>Pitch</span><input type="range" data-audio-field="pitch" min=".5" max="1.5" step=".1" value="${audioSettings.pitch}"><span>${Number(audioSettings.pitch).toFixed(1)}</span></label><label class="range-row"><span>Volume</span><input type="range" data-audio-field="volume" min="0" max="1" step=".1" value="${audioSettings.volume}"><span>${Math.round(audioSettings.volume*100)}%</span></label></div><div style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">${[['readTitle','Read step title'],['readNarrateBefore','Read narrate before'],['readUserAction','Read user action'],['readScreenContent','Read visible state'],['readNextAction','Read next action'],['readNarrateAfter','Read narrate after'],['advanceOnSpeechEnd','Advance when speech ends']].map(([key,label]) => `<div class="toggle-row"><span>${label}</span><button class="switch ${audioSettings[key] ? 'on':''}" data-action="audio-toggle" data-key="${key}" aria-label="Toggle ${label}"></button></div>`).join('')}</div>`;
}

function openAudioDialog() {
    renderAudioSettings();
    $('#audioDialog').showModal();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => { if ($('#audioDialog').open) renderAudioSettings(); };
}

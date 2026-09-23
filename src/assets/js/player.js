function narrationMuteIcon(muted) {
    const waves = muted
        ? '<path fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" d="M10.4 6.2 13.7 9.8M13.7 6.2 10.4 9.8"/>'
        : '<path fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" d="M10.15 6.05a2.6 2.6 0 0 1 0 3.9M12 4.3a4.8 4.8 0 0 1 0 7.4"/>';
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 6.15h2.15L7.7 3.2v9.6L4.15 9.85H2V6.15z"/>${waves}</svg>`;
}

function narrationSettingsIcon() {
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" d="M1.7 4.15h12.6M1.7 8h12.6M1.7 11.85h12.6"/><circle cx="5.15" cy="4.15" r="1.55" fill="currentColor"/><circle cx="10.85" cy="8" r="1.55" fill="currentColor"/><circle cx="6.35" cy="11.85" r="1.55" fill="currentColor"/></svg>`;
}

function muteButtonMarkup() {
    const muted = !!audioSettings.muted;
    return `<button class="button icon-only${muted ? ' is-muted' : ''}" data-action="toggle-mute" aria-pressed="${muted}" aria-label="${muted ? 'Unmute narration' : 'Mute narration'}">${narrationMuteIcon(muted)}</button>`;
}

function renderPlayer() {
    const project = activeProject();
    const story = activeStory();
    if (!story?.steps.length) return `<section class="main-pane">${renderEmpty('Nothing to play yet','Add at least one screenshot to a walkthrough.','screenshots','Open library')}</section>`;
    playerIndex = clamp(playerIndex, 0, story.steps.length - 1);
    const step = story.steps[playerIndex];
    const screen = screenById(step.screenId);
    const progress = isPlaying ? 0 : 0;
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    const timeline = story.steps.map((item,index) => `<button class="timeline-step ${index < playerIndex ? 'done':''} ${index === playerIndex ? 'active':''}" data-action="player-jump" data-index="${index}" aria-label="Go to step ${index+1}: ${esc(item.title)}" style="--progress:${index === playerIndex ? progress : 0}%"></button>`).join('');
    return `<section class="player-view"><header class="player-top"><div><div class="player-title">${esc(story.name)}</div><div class="player-caption">${esc(project.name)} · INTERACTIVE WALKTHROUGH</div></div><div class="cluster" style="gap:7px"><span class="status-dot"></span><span class="eyebrow">Local preview</span></div><div class="view-actions"><select class="select" style="width:170px" data-action="change-story">${storyOptions}</select>${muteButtonMarkup()}<button class="button icon-only" data-action="open-audio" aria-label="Narration settings">${narrationSettingsIcon()}</button><button class="button icon-only" data-action="fullscreen" aria-label="Enter fullscreen">⛶</button></div></header><div class="player-main"><div class="player-stage"><div class="player-device-wrap" id="playerDevice">${deviceMarkup(screen, step, true)}</div></div><aside class="narrative"><div class="narrative-step">Step ${playerIndex+1} of ${story.steps.length}</div><h2>${esc(step.title)}</h2><div class="narrative-block"><div class="narrative-label">What the user is doing</div><p class="narrative-copy">${esc(step.userAction || 'No action documented.')}</p></div><div class="narrative-block"><div class="narrative-label">What is visible</div><p class="narrative-copy">${esc(step.screenContent || 'No visible state documented.')}</p></div><div class="narrative-block"><div class="narrative-label">What happens next</div><p class="narrative-copy">${esc(step.nextAction || 'End of documented flow.')}</p></div><div class="narrative-block"><span class="tag">${esc(step.transition.type)}</span><span class="tag" style="margin-left:5px">${Number(step.transition.duration).toFixed(1)}s ${esc(step.transition.easing)}</span></div></aside></div><footer class="player-bottom"><div class="transport"><button class="button icon-only" data-action="player-prev" ${playerIndex === 0 ? 'disabled':''} aria-label="Previous step">←</button><button class="play-button" data-action="toggle-play" aria-label="${isPlaying ? 'Pause':'Play'}">${isPlaying ? 'Ⅱ':'▶'}</button><button class="button icon-only" data-action="player-next" ${playerIndex === story.steps.length-1 ? 'disabled':''} aria-label="Next step">→</button></div><div class="timeline" style="--steps:${story.steps.length}" id="timeline">${timeline}</div><div class="player-time"><span id="playerElapsed">${(playerIndex+1).toString().padStart(2,'0')}</span> / ${story.steps.length.toString().padStart(2,'0')} · ${Number(story.settings.defaultSpeed || 1).toFixed(1)}×</div></footer></section>`;
}


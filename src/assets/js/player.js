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

const NARRATIVE_FIELDS = [
    ['narrateBefore', 'Narrate before'],
    ['userAction', 'What the user is doing'],
    ['screenContent', 'What is visible'],
    ['nextAction', 'What happens next'],
    ['narrateAfter', 'Narrate after'],
    ['comment', 'Comment']
];

function narrativeValue(step, key) {
    return String(step?.[key] || '').trim();
}

function narrativeBlocks(step) {
    return NARRATIVE_FIELDS.map(([key, label]) => {
        const text = narrativeValue(step, key);
        const empty = !text;
        return `<div class="narrative-block${empty ? ' is-unavailable' : ''}" data-narrative="${key}"${empty ? ' aria-disabled="true"' : ''}><div class="narrative-label">${label}</div><p class="narrative-copy">${empty ? 'Not available' : esc(text)}</p></div>`;
    }).join('');
}

function syncNarrativeBlocks(root, step) {
    NARRATIVE_FIELDS.forEach(([key]) => {
        const block = $(`[data-narrative="${key}"]`, root);
        if (!block) return;
        const text = narrativeValue(step, key);
        const copy = $('.narrative-copy', block);
        const empty = !text;
        block.classList.toggle('is-unavailable', empty);
        if (empty) block.setAttribute('aria-disabled', 'true');
        else block.removeAttribute('aria-disabled');
        if (copy) copy.textContent = empty ? 'Not available' : text;
    });
}

function playerStoryControls(project, story) {
    const visibleStories = storiesForCategory(project.stories, playerStoryCategoryFilter);
    const storyOptions = visibleStories.length
        ? visibleStories.map(item => `<option value="${esc(item.id)}" ${item.id === story?.id ? 'selected':''}>${esc(item.name)}</option>`).join('')
        : '<option value="">No matching walkthroughs</option>';
    return `<div class="player-story-controls"><select class="select player-category-filter" data-action="filter-player-stories" aria-label="Filter walkthroughs by category">${storyCategoryOptions(playerStoryCategoryFilter, true, project.stories)}</select><select class="select player-story-select" data-action="change-story" aria-label="Choose walkthrough" ${visibleStories.length ? '' : 'disabled'}>${storyOptions}</select></div>`;
}

function playerHeader(project, story) {
    return `<header class="player-top"><div><div class="player-title">${esc(story?.name || 'No matching walkthrough')}</div><div class="player-caption">${esc(project.name)} · INTERACTIVE WALKTHROUGH</div></div><div class="cluster" style="gap:7px"><span class="status-dot"></span><span class="eyebrow">Local preview</span></div><div class="view-actions">${playerStoryControls(project, story)}${muteButtonMarkup()}<button class="button icon-only" data-action="open-audio" aria-label="Narration settings">${narrationSettingsIcon()}</button><button class="button icon-only" data-action="fullscreen" aria-label="Enter fullscreen">⛶</button></div></header>`;
}

function renderPlayer() {
    const project = activeProject();
    const visibleStories = storiesForCategory(project.stories, playerStoryCategoryFilter);
    const currentStory = activeStory();
    const story = visibleStories.find(item => item.id === currentStory?.id) || visibleStories[0] || null;
    if (!story) return `<section class="player-view player-view-empty">${playerHeader(project, null)}<div class="player-empty">${renderEmpty('No walkthroughs in this category','Choose another category or show every walkthrough.','clear-player-story-filter','Show all categories')}</div></section>`;
    if (!story.steps.length) return `<section class="player-view player-view-empty">${playerHeader(project, story)}<div class="player-empty">${renderEmpty('Nothing to play yet','Add at least one screenshot to this walkthrough.','screenshots','Open library')}</div></section>`;
    playerIndex = clamp(playerIndex, 0, story.steps.length - 1);
    const step = story.steps[playerIndex];
    const screen = screenById(step.screenId);
    const progress = isPlaying ? 0 : 0;
    const timeline = story.steps.map((item,index) => `<button class="timeline-step ${index < playerIndex ? 'done':''} ${index === playerIndex ? 'active':''}" data-action="player-jump" data-index="${index}" aria-label="Go to step ${index+1}: ${esc(item.title)}" style="--progress:${index === playerIndex ? progress : 0}%"></button>`).join('');
    return `<section class="player-view">${playerHeader(project, story)}<div class="player-main"><div class="player-stage"><div class="player-device-wrap" id="playerDevice">${deviceMarkup(screen, step, true)}</div></div><aside class="narrative"><div class="narrative-step">Step ${playerIndex+1} of ${story.steps.length}</div><h2>${esc(step.title)}</h2>${narrativeBlocks(step)}<div class="narrative-block"><span class="tag">${esc(step.transition.type)}</span><span class="tag" style="margin-left:5px">${Number(step.transition.duration).toFixed(1)}s ${esc(step.transition.easing)}</span></div></aside></div><footer class="player-bottom"><div class="transport"><button class="button icon-only" data-action="player-prev" ${playerIndex === 0 ? 'disabled':''} aria-label="Previous step">←</button><button class="play-button" data-action="toggle-play" aria-label="${isPlaying ? 'Pause':'Play'}">${isPlaying ? 'Ⅱ':'▶'}</button><button class="button icon-only" data-action="player-next" ${playerIndex === story.steps.length-1 ? 'disabled':''} aria-label="Next step">→</button></div><div class="timeline" style="--steps:${story.steps.length}" id="timeline">${timeline}</div><div class="player-time"><span id="playerElapsed">${(playerIndex+1).toString().padStart(2,'0')}</span> / ${story.steps.length.toString().padStart(2,'0')} · ${Number(story.settings.defaultSpeed || 1).toFixed(1)}×</div></footer></section>`;
}

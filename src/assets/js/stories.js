function stepTitleControl(step) {
    const disabled = step.title ? '' : 'disabled';
    return `<div class="field"><div class="field-label"><span class="title-with-info"><span id="stepTitleLabel">STEP TITLE</span><button type="button" class="info-dot" data-action="toggle-info" data-info="stepTitleInfo" aria-expanded="false" aria-controls="stepTitleInfo" aria-label="About step title"><span aria-hidden="true">i</span></button><div class="info-popover" id="stepTitleInfo" role="note" hidden>When narration is enabled, this title is announced in the Player when the slide loads. Leave it blank if you don’t want the Player to announce a name for this screenshot. A title that only repeats the file name is skipped.</div></span></div><div class="step-title-control"><input class="input" data-step-field="title" value="${esc(step.title)}" aria-labelledby="stepTitleLabel"><button type="button" class="step-title-clear" data-action="clear-step-title" aria-label="Clear step title" ${disabled}>×</button></div></div>`;
}

function storyLayoutToggle() {
    const filesRight = storyPanelLayout === 'files-right';
    return `<div class="story-layout-toggle" role="group" aria-label="Files panel position"><span class="story-layout-toggle-label">FILES</span><button type="button" data-action="story-panel-layout" data-layout="files-left" aria-label="Files on the left, step inspector on the right" aria-pressed="${filesRight ? 'false' : 'true'}">Left</button><button type="button" data-action="story-panel-layout" data-layout="files-right" aria-label="Files and step inspector on the right" aria-pressed="${filesRight ? 'true' : 'false'}">Right</button></div>`;
}

function renderStories() {
    const project = activeProject();
    const story = activeStory();
    if (!story) return `<section class="main-pane">${renderEmpty('No walkthrough yet','Create a story from any screenshot in the library.','screenshots','Open library')}</section>`;
    const step = activeStep();
    const availableStepIds = new Set(story.steps.map(item => item.id));
    [...selectedStoryStepIds].forEach(id => { if (!availableStepIds.has(id)) selectedStoryStepIds.delete(id); });
    const stepItems = story.steps.map((item,index) => {
        const screen = screenById(item.screenId);
        const selected = selectedStoryStepIds.has(item.id);
        return `<div class="step-item${step?.id === item.id ? ' active':''}${selected ? ' selected':''}" data-id="${esc(item.id)}" draggable="true"><span class="step-grip" aria-hidden="true">⠿</span><button type="button" class="step-pick" data-action="toggle-story-step-selection" data-id="${esc(item.id)}" aria-label="${selected ? 'Deselect' : 'Select'} step ${index + 1}" aria-pressed="${selected}">${selected ? '✓' : ''}</button><button type="button" class="step-open" data-action="select-step" data-id="${esc(item.id)}" aria-label="Step ${index + 1}: ${esc(item.title)}. Drag to reorder."><span class="step-index">${index+1}</span><span class="step-thumb">${screen ? `<img src="${safeImage(screen.dataUrl)}" alt="" draggable="false">`:''}</span><span class="step-copy"><span class="step-title">${esc(item.title)}</span><span class="step-meta">${Number(item.transition?.duration || 0).toFixed(1)}s · ${esc(item.transition?.type || 'none')}</span></span></button></div>`;
    }).join('');
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    if (!step) return `<section class="main-pane"><div class="story-layout ${storyPanelLayout}"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough</h2></div>${storyChooser(storyOptions, story)}</aside><div class="story-stage-empty">${renderEmpty('This walkthrough has no steps','Add a photo from the library to start the sequence.','open-photo-picker','Add a photo')}</div><aside class="inspector"></aside></div></section>`;
    const screen = screenById(step.screenId);
    const index = story.steps.findIndex(item => item.id === step.id);
    const storyScreenCount = new Set(story.steps.map(item => item.screenId).filter(id => screenById(id))).size;
    return `<section class="main-pane"><div class="story-layout ${storyPanelLayout}"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough steps</h2><div class="story-rail-tools"><button class="button ghost small photo-download" data-action="download-story-photos" title="Download this walkthrough’s photos as a ZIP file" ${storyScreenCount ? '' : 'disabled'}>↓ Photos</button><span class="eyebrow">${story.steps.length}</span></div></div>${storyChooser(storyOptions, story)}<div class="step-list" aria-label="Reorderable walkthrough steps">${stepItems}</div></aside><div class="flow-stage"><div class="stage-toolbar story-stage-toolbar"><div class="story-step-heading"><strong style="font-size:11px">${esc(step.title)}</strong><span style="color:var(--dim);font:9px/1 var(--mono);margin-left:8px">STEP ${index+1} / ${story.steps.length}</span></div><div class="tool-group story-preview-tools"><span class="tag">${esc(screen?.deviceFrame || 'none')}</span><button class="button small" data-action="preview-story">▶ Preview</button></div>${storyLayoutToggle()}</div><div class="step-canvas"><div class="device-mini">${deviceMarkup(screen, step, false)}</div></div><div class="story-bottom"><div class="step-reorder"><button class="button small" data-action="move-step" data-direction="-1" ${index === 0 ? 'disabled':''}>← Earlier</button><button class="button small" data-action="move-step" data-direction="1" ${index === story.steps.length-1 ? 'disabled':''}>Later →</button></div><div class="cluster" style="gap:6px"><button class="button small" data-action="duplicate-step">⧉ Duplicate</button><button class="button small danger" data-action="delete-step" aria-label="Delete slide ${index + 1}">Delete slide</button></div></div></div><aside class="inspector"><div class="panel-head"><h2>Step inspector</h2><span class="tag">${index+1}/${story.steps.length}</span></div><div class="panel-scroll" style="padding:0">${copyFromPreviousSection(step, index)}<div class="section"><label class="field"><span class="field-label">FILE NAME</span><input class="input" data-screen-name="${esc(screen?.id || '')}" value="${esc(screen?.name || '')}" maxlength="120" ${screen ? '' : 'disabled'}></label>${stepTitleControl(step)}<label class="field"><span class="field-label"><span class="title-with-info">DWELL TIME<button type="button" class="info-dot" data-action="toggle-info" data-info="dwellInfo" aria-expanded="false" aria-controls="dwellInfo" aria-label="About dwell time"><span aria-hidden="true">i</span></button><div class="info-popover" id="dwellInfo" role="note" hidden>How long this step stays up during playback before the walkthrough moves on.</div></span><span data-dwell-readout>${Number(step.dwellSeconds).toFixed(1)}s</span></span><input type="range" data-step-field="dwellSeconds" min="1" max="10" step=".5" value="${Number(step.dwellSeconds)}" aria-label="Dwell time" style="width:100%"></label></div>${transitionInspector(step, index)}<div class="section"><div class="section-title"><span>INTERACTION HOTSPOT</span><button class="switch ${step.interaction.enabled ? 'on':''}" data-action="toggle-hotspot" aria-label="Toggle hotspot"></button></div>${step.interaction.enabled ? `${hotspotGestureControls(step)}<label class="field"><span class="field-label">LABEL</span><input class="input" data-interaction-field="label" value="${esc(step.interaction.label || '')}"></label><div class="field-grid"><label class="field"><span class="field-label">X POSITION</span><input class="input" type="number" data-interaction-field="xPercent" min="0" max="100" value="${Number(step.interaction.xPercent)}"></label><label class="field"><span class="field-label">Y POSITION</span><input class="input" type="number" data-interaction-field="yPercent" min="0" max="100" value="${Number(step.interaction.yPercent)}"></label></div><p style="color:var(--dim);font-size:10px;line-height:1.5">Drag the marker on the screen to place it.</p>` : '<p style="color:var(--dim);font-size:10px;line-height:1.5">Enable a hotspot to let viewers advance by clicking the target.</p>'}</div>${narrativeInspector(step)}</div></aside></div></section>`;
}

const COPY_PREVIOUS_GROUPS = [
    {title:'TRANSITION', options:[
        {scope:'transition', key:'type', label:'Type'},
        {scope:'transition', key:'duration', label:'Duration'},
        {scope:'transition', key:'easing', label:'Easing'}
    ]},
    {title:'DWELL', options:[
        {scope:'step', key:'dwellSeconds', label:'Dwell time'}
    ]},
    {title:'HOTSPOT', options:[
        {scope:'interaction', key:'enabled', label:'On or off'},
        {scope:'interaction', key:'type', label:'Gesture'},
        {scope:'interaction', key:'direction', label:'Direction'},
        {scope:'interaction', key:'label', label:'Label'},
        {scope:'interaction', key:'xPercent', label:'X position'},
        {scope:'interaction', key:'yPercent', label:'Y position'}
    ]},
    {title:'TEXT', options:[
        {scope:'step', key:'title', label:'Step title'},
        {scope:'step', key:'userAction', label:'User action'},
        {scope:'step', key:'screenContent', label:'Visible state'},
        {scope:'step', key:'nextAction', label:'Next action'},
        {scope:'step', key:'narrateBefore', label:'Narrate before'},
        {scope:'step', key:'narrateAfter', label:'Narrate after'},
        {scope:'step', key:'comment', label:'Comment'}
    ]}
];
const NUMERIC_SLIDE_OPTIONS = new Set(['dwellSeconds', 'duration', 'xPercent', 'yPercent']);
const RECENT_SLIDE_COPY_LIMIT = 4;

function slideCopyOptions() {
    return COPY_PREVIOUS_GROUPS.flatMap(group => group.options);
}

function recentSlideCopyId(item) {
    return `${item?.scope}:${item?.key}`;
}

function normalizeRecentSlideCopies(items) {
    const allowed = new Set(slideCopyOptions().map(recentSlideCopyId));
    const seen = new Set();
    const next = [];
    (Array.isArray(items) ? items : []).forEach(item => {
        const id = recentSlideCopyId(item);
        if (!allowed.has(id) || seen.has(id)) return;
        seen.add(id);
        next.push({scope: item.scope, key: item.key});
    });
    return next.slice(0, RECENT_SLIDE_COPY_LIMIT);
}

let recentSlideCopies = normalizeRecentSlideCopies(loadJson(APP.recentSlideCopyKey, []));

function rememberRecentSlideCopy(spec) {
    recentSlideCopies = normalizeRecentSlideCopies([{scope: spec.scope, key: spec.key}, ...recentSlideCopies]);
    saveJson(APP.recentSlideCopyKey, recentSlideCopies);
}

function removeRecentSlideCopy(scope, key) {
    const next = recentSlideCopies.filter(item => item.scope !== scope || item.key !== key);
    if (next.length === recentSlideCopies.length) return;
    recentSlideCopies = next;
    saveJson(APP.recentSlideCopyKey, recentSlideCopies);
    const focus = next.length
        ? `[data-action="remove-recent-copy"][data-copy-scope="${next[0].scope}"][data-copy-key="${next[0].key}"]`
        : '[data-action="toggle-copy-previous"]';
    withStoryScroll(() => renderApp(), focus);
}

function readSlideOption(step, spec) {
    const source = spec.scope === 'step' ? step : step?.[spec.scope];
    const value = source?.[spec.key];
    if (spec.scope === 'interaction' && spec.key === 'enabled') return Boolean(value);
    if (NUMERIC_SLIDE_OPTIONS.has(spec.key)) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }
    return value == null ? '' : String(value);
}

function writeSlideOption(step, spec, value) {
    if (spec.scope === 'step') {
        step[spec.key] = value;
        return;
    }
    if (!step[spec.scope] || typeof step[spec.scope] !== 'object') step[spec.scope] = {};
    step[spec.scope][spec.key] = value;
}

function slideOptionsMatch(current, prior) {
    if (typeof current === 'boolean' || typeof prior === 'boolean') return Boolean(current) === Boolean(prior);
    if (typeof current === 'number' || typeof prior === 'number') return Number(current) === Number(prior);
    return String(current ?? '') === String(prior ?? '');
}

function formatSlideOption(spec, value) {
    if (spec.key === 'enabled') return value ? 'On' : 'Off';
    if (spec.key === 'duration' || spec.key === 'dwellSeconds') return `${Number(value).toFixed(1)}s`;
    if (spec.key === 'xPercent' || spec.key === 'yPercent') return `${Number(value)}%`;
    if (spec.scope === 'interaction' && spec.key === 'type') return hotspotGesture(value).name;
    if (spec.scope === 'interaction' && spec.key === 'direction') return hotspotDirection(value).name;
    if (spec.key === 'type') return String(value || 'none').replaceAll('-', ' ');
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text || 'Empty';
}

function withStoryScroll(render, focusSelector) {
    const inspector = $('.story-layout .inspector .panel-scroll');
    const list = $('.step-list');
    const inspectorTop = inspector?.scrollTop || 0;
    const listTop = list?.scrollTop || 0;
    render();
    const nextInspector = $('.story-layout .inspector .panel-scroll');
    const nextList = $('.step-list');
    if (nextInspector) nextInspector.scrollTop = inspectorTop;
    if (nextList) nextList.scrollTop = listTop;
    if (focusSelector) document.querySelector(focusSelector)?.focus();
}

function copyPrevRow(spec, step, previous) {
    const prior = readSlideOption(previous, spec);
    const matches = slideOptionsMatch(readSlideOption(step, spec), prior);
    const preview = formatSlideOption(spec, prior);
    const title = matches
        ? `${spec.label} already matches the previous slide`
        : `Copy ${spec.label.toLowerCase()} from the previous slide: ${preview}`;
    return {matches, markup: `<button type="button" class="copy-prev-row${matches ? ' is-same' : ''}" data-action="copy-prev-option" data-copy-scope="${spec.scope}" data-copy-key="${spec.key}" title="${esc(title)}" aria-label="${esc(title)}"><span class="copy-prev-name">${esc(spec.label)}</span><span class="copy-prev-value">${esc(preview)}</span><span class="copy-prev-apply">${matches ? 'Same' : 'Copy'}</span></button>`};
}

function recentCopiedMarkup(step, previous) {
    const rows = recentSlideCopies.map(item => {
        const spec = slideCopyOptions().find(option => option.scope === item.scope && option.key === item.key);
        if (!spec) return '';
        return `<div class="copy-prev-recent">${copyPrevRow(spec, step, previous).markup}<button type="button" class="copy-prev-recent-remove" data-action="remove-recent-copy" data-copy-scope="${spec.scope}" data-copy-key="${spec.key}" aria-label="Remove ${esc(spec.label)} from recently copied" title="Remove from recently copied">×</button></div>`;
    }).join('');
    return rows ? `<div class="copy-prev-group">Recently copied</div>${rows}` : '';
}

function copyFromPreviousSection(step, index) {
    if (index < 1) return '';
    const previous = activeStory()?.steps[index - 1];
    if (!previous) return '';
    let different = 0;
    const rows = COPY_PREVIOUS_GROUPS.map(group => {
        const items = group.options.map(spec => {
            const row = copyPrevRow(spec, step, previous);
            if (!row.matches) different += 1;
            return row.markup;
        }).join('');
        return `<div class="copy-prev-group">${group.title}</div>${items}`;
    }).join('');
    const sourceTitle = previous.title ? `, ${previous.title}` : '';
    const count = different ? `<span class="count-pill">${different}</span>` : '';
    const summary = different
        ? `${different} setting${different === 1 ? '' : 's'} differ from the previous slide`
        : 'Every listed setting matches the previous slide';
    return `<div class="section copy-from-previous"><button type="button" class="copy-prev-toggle" data-action="toggle-copy-previous" aria-expanded="${copyPreviousOpen ? 'true' : 'false'}" title="${esc(summary)}"><span class="copy-prev-toggle-label">Copy from previous slide${count}</span><span class="copy-prev-chevron" aria-hidden="true">▾</span></button><div class="copy-prev-list" ${copyPreviousOpen ? '' : 'hidden'}>${recentCopiedMarkup(step, previous)}<p class="copy-prev-source">From step ${index}${esc(sourceTitle)}</p>${rows}</div></div>`;
}

function narrativeField(step, label, key, placeholder = '') {
    const hint = placeholder ? ` placeholder="${esc(placeholder)}"` : '';
    return `<label class="field"><span class="field-label">${label}</span><textarea class="textarea" data-step-field="${key}"${hint}>${esc(step[key] || '')}</textarea></label>`;
}

function narrationOpen(step, key) {
    return Boolean(String(step[key] || '').trim()) || expandedNarration.has(`${step.id}:${key}`);
}

function optionalNarrative(step, label, key, placeholder) {
    if (!narrationOpen(step, key)) return `<button type="button" class="narration-toggle" data-action="toggle-narration" data-field="${key}" aria-expanded="false"><span class="narration-plus" aria-hidden="true">+</span>${label}</button>`;
    const hide = String(step[key] || '').trim() ? '' : `<button type="button" class="button ghost small" data-action="toggle-narration" data-field="${key}" aria-expanded="true">Hide</button>`;
    return `<div class="field"><span class="field-label"><span>${label}</span>${hide}</span><textarea class="textarea" data-step-field="${key}" placeholder="${esc(placeholder)}">${esc(step[key] || '')}</textarea></div>`;
}

function narrativeInspector(step) {
    return `<div class="section"><div class="section-title">BEHAVIORAL TRIAD</div>${narrativeField(step, 'USER ACTION', 'userAction')}${narrativeField(step, 'VISIBLE STATE', 'screenContent')}${narrativeField(step, 'NEXT ACTION', 'nextAction')}</div><div class="section"><div class="section-title">MISC</div>${optionalNarrative(step, 'NARRATE BEFORE', 'narrateBefore', 'Spoken before the behavioral triad')}${optionalNarrative(step, 'NARRATE AFTER', 'narrateAfter', 'Spoken after the behavioral triad')}${narrativeField(step, 'COMMENT', 'comment', 'Shown in the player. Not read aloud.')}</div>`;
}

function transitionInspector(step, index) {
    const transitionOptions = ['none','fade','slide-left','slide-right','slide-up','slide-down','scroll-down','scroll-up','tap-zoom','modal-pop'];
    const easingOptions = ['linear','ease','ease-in-out','spring'];
    const typeOptions = transitionOptions.map(value => `<option value="${value}" ${step.transition.type === value ? 'selected':''}>${value.replaceAll('-',' ')}</option>`).join('');
    const easeOptions = easingOptions.map(value => `<option value="${value}" ${step.transition.easing === value ? 'selected':''}>${value}</option>`).join('');
    const locked = index === 0 ? 'disabled' : '';
    return `<div class="section"><div class="section-title"><span class="title-with-info">TRANSITION<button type="button" class="info-dot" data-action="toggle-info" data-info="transitionInfo" aria-expanded="false" aria-controls="transitionInfo" aria-label="About transitions"><span aria-hidden="true">i</span></button><div class="info-popover" id="transitionInfo" role="note" hidden>This is the transition into the current slide.</div></span></div><fieldset class="transition-fields" ${locked}><label class="field"><span class="field-label">TYPE</span><select class="select" data-transition-field="type">${typeOptions}</select></label><div class="field-grid"><label class="field"><span class="field-label">DURATION</span><input class="input" type="number" data-transition-field="duration" min=".1" max="4" step=".1" value="${Number(step.transition.duration)}"></label><label class="field"><span class="field-label">EASING</span><select class="select" data-transition-field="easing">${easeOptions}</select></label></div></fieldset></div>`;
}

function setInfoNote(id, open) {
    const popover = document.getElementById(id);
    const button = document.querySelector(`[aria-controls="${id}"]`);
    if (!popover || !button) return;
    popover.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('active', open);
}

function closeInfoNotes() {
    ['stepTitleInfo', 'transitionInfo', 'dwellInfo'].forEach(id => setInfoNote(id, false));
}

function storyStageOptions(selected, includeAll = false, stories = null) {
    const current = includeAll ? normalizeStoryStageFilter(selected) : normalizeStoryStage(selected);
    const count = stage => Array.isArray(stories) ? ` (${storiesForStage(stories, stage).length})` : '';
    const options = includeAll
        ? [`<option value="all" ${current === 'all' ? 'selected' : ''}>All stages${count('all')}</option>`]
        : [];
    STORY_STAGES.forEach(stage => {
        if (stage === 'Treat as Collection') options.push('<option disabled aria-hidden="true">──────────</option>');
        options.push(`<option value="${esc(stage)}" ${current === stage ? 'selected' : ''}>${esc(stage)}${count(stage)}</option>`);
    });
    return options.join('');
}

function storyStageBadge(story) {
    const stage = normalizeStoryStage(story?.stage);
    return `<span class="story-category-badge ${storyStageTone(story)}">${esc(stage)}</span>`;
}

function storyMenuIcon(name) {
    const icons = {
        select: '<path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
        reverse: '<path d="M3 4h9m0 0-2.5-2.5M12 4 9.5 6.5M13 12H4m0 0 2.5-2.5M4 12l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
        copy: '<rect x="5.5" y="4.5" width="7" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 4V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1H5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
        rename: '<path d="m3 11.8.6-2.5L10.5 2.4a1.4 1.4 0 0 1 2 2l-6.9 6.9-2.6.5Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="m9.5 3.4 2 2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
        delete: '<path d="M3.5 4.5h9M6 4.5V3h4v1.5m-5 0 .6 8h4.8l.6-8M7 7v3.5m2-3.5v3.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
    };
    return `<svg class="story-menu-icon" viewBox="0 0 16 16" aria-hidden="true">${icons[name] || ''}</svg>`;
}

function storyChooser(storyOptions, story) {
    const selectedCount = story.steps.filter(step => selectedStoryStepIds.has(step.id)).length;
    const allSelected = story.steps.length > 0 && selectedCount === story.steps.length;
    const selectAllLabel = allSelected ? 'Clear selection' : 'Select all';
    return `<div class="story-chooser"><label class="story-select-field primary"><span>WALKTHROUGH</span><select class="select" data-action="change-story">${storyOptions}</select></label><label class="story-select-field secondary"><span>SET STAGE</span><select class="select story-category-select ${storyStageTone(story)}" data-action="change-story-stage">${storyStageOptions(story.stage)}</select></label><div class="story-chooser-actions"><button class="button" data-action="new-story" title="New walkthrough">＋ New</button><button class="button" data-action="open-photo-picker">＋ Add photos</button><div class="story-more-menu"><button type="button" class="button story-more-button${storyMenuOpen ? ' active' : ''}" id="storyMenuButton" data-action="toggle-story-menu" aria-haspopup="menu" aria-expanded="${storyMenuOpen ? 'true' : 'false'}" aria-controls="storyMenu" aria-label="More walkthrough options">⋯</button><div class="sync-menu-panel story-more-panel" id="storyMenu" role="menu" ${storyMenuOpen ? '' : 'hidden'}><button type="button" class="sync-option" role="menuitem" data-action="select-all-story-steps" ${story.steps.length ? '' : 'disabled'}>${storyMenuIcon('select')}<span>${selectAllLabel}</span></button><button type="button" class="sync-option" role="menuitem" data-action="reverse-selected-story-steps" ${selectedCount > 1 ? '' : 'disabled'}>${storyMenuIcon('reverse')}<span>Reverse selected order${selectedCount ? ` (${selectedCount})` : ''}</span></button><span class="story-more-divider" aria-hidden="true"></span><button type="button" class="sync-option" role="menuitem" data-action="copy-story-photo-urls">${storyMenuIcon('copy')}<span>Copy photo URLs</span></button><span class="story-more-divider" aria-hidden="true"></span><button type="button" class="sync-option" role="menuitem" data-action="rename-story">${storyMenuIcon('rename')}<span>Rename walkthrough</span></button><button type="button" class="sync-option danger" role="menuitem" data-action="delete-story">${storyMenuIcon('delete')}<span>Delete walkthrough</span></button></div></div></div></div>`;
}

function photoTimestamp(screen) {
    const value = Number(screen?.capturedAt || screen?.uploadedAt || screen?.importedAt);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function photoTimeZone() {
    const configured = STORYFLOW_CONFIG?.photo_time_zone || {};
    return {
        label:configured.label || 'Pacific Standard Time',
        utcOffset:configured.utc_offset || '-0800',
        offsetMinutes:Number.isFinite(Number(configured.offset_minutes)) ? Number(configured.offset_minutes) : -480
    };
}

function photoDateParts(screen) {
    const zone = photoTimeZone();
    const date = new Date(photoTimestamp(screen) + zone.offsetMinutes * 60000);
    const valid = !Number.isNaN(date.getTime());
    const format = options => valid ? new Intl.DateTimeFormat('en-US', {...options,timeZone:'UTC'}).format(date) : 'Date unknown';
    return {
        dateKey:valid ? date.toISOString().slice(0, 10) : 'unknown',
        hourKey:valid ? `${date.toISOString().slice(0, 13)}:00` : 'unknown',
        dateLabel:format({weekday:'short',month:'short',day:'numeric',year:'numeric'}),
        hourLabel:format({hour:'numeric',minute:undefined}),
        timeLabel:format({hour:'numeric',minute:'2-digit'})
    };
}

function sortedPickerScreens(includeAnnotated = pickerShowAnnotated) {
    const screens = (activeProject()?.screenshots || []).filter(screen => includeAnnotated || !screen.annotated);
    if (photoPickerSort === 'library') return screens;
    const direction = photoPickerSort === 'oldest' ? 1 : -1;
    return [...screens].sort((a, b) => direction * (photoTimestamp(a) - photoTimestamp(b)));
}

function pickerTagGroups(screens) {
    const groups = new Map();
    screens.forEach(screen => {
        const tags = customScreenTags(screen);
        (tags.length ? tags : ['']).forEach(tag => {
            if (!groups.has(tag)) groups.set(tag, []);
            groups.get(tag).push(screen);
        });
    });
    return [...groups].sort(([a], [b]) => {
        if (!a) return 1;
        if (!b) return -1;
        return a.localeCompare(b);
    });
}

function selectedPickerIdsInDisplayOrder() {
    const screens = sortedPickerScreens(true);
    const ordered = photoPickerGroup === 'tag'
        ? pickerTagGroups(screens).flatMap(([, items]) => items)
        : screens;
    const seen = new Set();
    return ordered.filter(screen => {
        if (!selectedPickerScreenIds.has(screen.id) || seen.has(screen.id)) return false;
        seen.add(screen.id);
        return true;
    }).map(screen => screen.id);
}

function pickerUploadMarkup(project) {
    if (!pickerUploadOpen) return '';
    const folders = project?.folders || [];
    const creating = pickerUploadFolder === '__new__' || !folders.length;
    const options = folders.map(folder => `<option value="${esc(folder.fullPath)}" ${pickerUploadFolder === folder.fullPath ? 'selected' : ''}>${esc(folder.fullPath)}</option>`).join('');
    const nameField = creating ? '<label><span>NEW FOLDER</span><input class="input" id="pickerUploadName" maxlength="40" placeholder="Android or Web" autocomplete="off"></label>' : '';
    return `<div class="picker-upload-panel${creating ? ' is-new' : ''}"><label><span>LIBRARY FOLDER</span><select class="select" data-action="picker-upload-folder" ${pickerUploadBusy ? 'disabled' : ''}>${options}<option value="__new__" ${creating ? 'selected' : ''}>New folder…</option></select></label>${nameField}<button type="button" class="button primary" data-action="choose-picker-upload" ${pickerUploadBusy ? 'disabled' : ''}>${pickerUploadBusy ? 'Uploading…' : 'Choose photos'}</button></div>`;
}

function renderPhotoPicker() {
    const project = activeProject();
    const annotated = (project?.screenshots || []).filter(screen => screen.annotated);
    const screens = sortedPickerScreens();
    const card = screen => {
        const notes = screen.annotations?.length ? `<span class="annotation-layer">${annotationMarkup(screen.annotations)}</span>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform || 'screen')}</span>`;
        const picked = selectedPickerScreenIds.has(screen.id);
        const parts = photoDateParts(screen);
        return `<button type="button" class="photo-pick${picked ? ' picked' : ''}" data-action="pick-photo" data-id="${esc(screen.id)}" aria-pressed="${picked}"><span class="photo-pick-check" aria-hidden="true">${picked ? '✓' : ''}</span><span class="photo-pick-frame"><img src="${safeImage(screen.dataUrl)}" alt="">${notes}</span><span class="photo-pick-copy"><span class="photo-pick-name">${esc(screen.name)}</span>${kind}</span><span class="photo-pick-time">${esc(parts.dateLabel)} · ${esc(parts.timeLabel)}</span></button>`;
    };
    let cards = '';
    if (photoPickerGroup === 'none') {
        cards = `<div class="photo-picker-grid">${screens.map(card).join('')}</div>`;
    } else if (photoPickerGroup === 'tag') {
        cards = pickerTagGroups(screens).map(([tag, items]) =>
            `<section class="photo-date-group"><h3>${tag ? `#${esc(tag)}` : 'Untagged'} <span>${items.length}</span></h3><div class="photo-picker-grid">${items.map(card).join('')}</div></section>`
        ).join('');
    } else {
        const groups = new Map();
        screens.forEach(screen => {
            const parts = photoDateParts(screen);
            const key = photoPickerGroup === 'hour' ? parts.hourKey : parts.dateKey;
            if (!groups.has(key)) groups.set(key, {parts,screens:[]});
            groups.get(key).screens.push(screen);
        });
        cards = [...groups.values()].map(group => {
            const heading = photoPickerGroup === 'hour' ? `${group.parts.dateLabel} · ${group.parts.hourLabel}` : group.parts.dateLabel;
            return `<section class="photo-date-group"><h3>${esc(heading)} <span>${group.screens.length}</span></h3><div class="photo-picker-grid">${group.screens.map(card).join('')}</div></section>`;
        }).join('');
    }
    const body = $('#photoPickerBody');
    if (!body) return;
    const pickerScroll = body.scrollTop;
    const availableIds = new Set((project?.screenshots || []).map(screen => screen.id));
    [...selectedPickerScreenIds].forEach(id => { if (!availableIds.has(id)) selectedPickerScreenIds.delete(id); });
    const selectedCount = selectedPickerScreenIds.size;
    const allVisiblePicked = screens.length > 0 && screens.every(screen => selectedPickerScreenIds.has(screen.id));
    const zone = photoTimeZone();
    body.innerHTML = `<div class="photo-picker-controls"><div class="photo-picker-fields"><label><span>SORT</span><select class="select" data-action="photo-picker-sort"><option value="recent" ${photoPickerSort === 'recent' ? 'selected' : ''}>Most recent</option><option value="oldest" ${photoPickerSort === 'oldest' ? 'selected' : ''}>Oldest first</option><option value="library" ${photoPickerSort === 'library' ? 'selected' : ''}>Library order</option></select></label><label><span>GROUP</span><select class="select" data-action="photo-picker-group"><option value="date" ${photoPickerGroup === 'date' ? 'selected' : ''}>Date</option><option value="hour" ${photoPickerGroup === 'hour' ? 'selected' : ''}>Date and hour</option><option value="tag" ${photoPickerGroup === 'tag' ? 'selected' : ''}>Tag</option><option value="none" ${photoPickerGroup === 'none' ? 'selected' : ''}>No groups</option></select></label></div><div class="photo-picker-actions"><button type="button" class="button ${pickerUploadOpen ? 'active' : ''}" data-action="toggle-picker-upload" aria-expanded="${pickerUploadOpen ? 'true' : 'false'}">↑ Upload</button><button type="button" class="button primary" data-action="add-all-recent-photos" ${project?.screenshots?.length ? '' : 'disabled'}>＋ Add all recent</button></div></div>${pickerUploadMarkup(project)}<div class="photo-picker-zone">Times shown in ${esc(zone.label)} (UTC${esc(zone.utcOffset.slice(0, 3))}:${esc(zone.utcOffset.slice(3))}).</div><div class="photo-picker-bar"><span>${screens.length} photo${screens.length === 1 ? '' : 's'} · added in displayed order</span><span class="photo-picker-tools"><button type="button" class="button ghost small" data-action="toggle-all-picker-photos" data-ids="${esc(screens.map(screen => screen.id).join(' '))}">${allVisiblePicked ? 'Clear visible' : 'Select visible'}</button><button type="button" class="button small ${pickerShowAnnotated ? 'active' : ''}" data-action="toggle-picker-annotated" aria-pressed="${pickerShowAnnotated ? 'true' : 'false'}" title="Show or hide annotated pictures">Annotated <span class="count-pill">${annotated.length}</span></button></span></div>${cards || '<p class="photo-picker-empty">No photos match this filter.</p>'}`;
    const count = $('#photoPickerSelection');
    const add = $('#addSelectedPhotos');
    body.scrollTop = pickerScroll;
    if (count) count.textContent = selectedCount ? `${selectedCount} selected` : 'Choose one or more photos';
    if (add) {
        add.disabled = selectedCount === 0;
        add.textContent = selectedCount ? `Add ${selectedCount} photo${selectedCount === 1 ? '' : 's'}` : 'Add photos';
    }
    renderPickerContext();
}

function closePickerContext() {
    pickerMenu = null;
    pickerAssocId = null;
    renderPickerContext();
}

function placePickerLayer(node, x, y) {
    const rect = node.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
}

let pickerScrollHold = 0;

function holdPickerScroll() {
    pickerScrollHold = 0;
    const dialog = $('#photoDialog');
    if (!dialog?.classList.contains('picker-scroll-locked')) return;
    const body = $('#photoPickerBody');
    if (body && body.scrollTop !== pickerScrollTop) body.scrollTop = pickerScrollTop;
    pickerScrollHold = requestAnimationFrame(holdPickerScroll);
}

function syncPickerScrollLock() {
    const dialog = $('#photoDialog');
    const body = $('#photoPickerBody');
    const lock = !!dialog?.open && !!(pickerMenu || pickerAssocId);
    if (lock && body && !dialog.classList.contains('picker-scroll-locked')) pickerScrollTop = body.scrollTop;
    dialog?.classList.toggle('picker-scroll-locked', lock);
    if (lock && !pickerScrollHold) pickerScrollHold = requestAnimationFrame(holdPickerScroll);
    if (!lock && pickerScrollHold) {
        cancelAnimationFrame(pickerScrollHold);
        pickerScrollHold = 0;
    }
}

function renderPickerContext() {
    const host = $('#pickerContextHost');
    if (!host) {
        syncPickerScrollLock();
        return;
    }
    $$('#photoDialog .photo-pick.is-context').forEach(node => node.classList.remove('is-context'));
    const screenId = pickerAssocId || pickerMenu?.id || '';
    const screen = screenId ? screenById(screenId) : null;
    if (!screen || !$('#photoDialog')?.open) {
        pickerMenu = null;
        pickerAssocId = null;
        host.innerHTML = '';
        syncPickerScrollLock();
        return;
    }
    $(`#photoDialog .photo-pick[data-id="${CSS.escape(screen.id)}"]`)?.classList.add('is-context');
    const project = activeProject();
    const connections = assocConnectionsMarkup(project, screen);
    const menu = pickerMenu ? `<div class="picker-menu sync-menu-panel" role="menu" style="left:${pickerMenu.x}px;top:${pickerMenu.y}px"><button type="button" class="sync-option" role="menuitem" data-action="picker-open-photo" data-id="${esc(screen.id)}">Open zoomed in new tab</button>${connections ? `<button type="button" class="sync-option" role="menuitem" data-action="picker-show-assoc" data-id="${esc(screen.id)}">Associations</button>` : ''}<button type="button" class="sync-option danger" role="menuitem" data-action="picker-delete-photo" data-id="${esc(screen.id)}">Delete from library</button></div>` : '';
    const drawer = pickerAssocId && connections ? `<div class="picker-assoc-drawer" role="region" aria-label="Walkthrough connections for ${esc(screen.name)}"><div class="assoc-drawer-title">Connections</div>${connections}</div>` : '';
    host.innerHTML = menu + drawer;
    const menuNode = $('.picker-menu', host);
    if (menuNode && pickerMenu) placePickerLayer(menuNode, pickerMenu.x, pickerMenu.y);
    const drawerNode = $('.picker-assoc-drawer', host);
    if (drawerNode) {
        const card = $(`#photoDialog .photo-pick[data-id="${CSS.escape(screen.id)}"]`);
        const cardRect = card?.getBoundingClientRect();
        const width = drawerNode.offsetWidth || 248;
        const openLeft = cardRect && cardRect.right + width + 16 > window.innerWidth;
        const x = cardRect ? (openLeft ? cardRect.left - width - 8 : cardRect.right + 8) : (pickerMenu?.x || 24);
        const y = cardRect ? cardRect.top : (pickerMenu?.y || 24);
        placePickerLayer(drawerNode, x, y);
    }
    if (menuNode && !drawerNode) $('.sync-option', menuNode)?.focus();
    else $('.assoc-step', drawerNode)?.focus();
    syncPickerScrollLock();
}

function openZoomedPhoto(screen) {
    const source = String(screen?.dataUrl || '');
    const src = STORED_IMAGE.test(source) ? screenUrl(source) : (DATA_IMAGE.test(source) ? source : '');
    if (!src) { toast('That photo cannot be opened.', 'warn'); return; }
    const page = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(screen.name)}</title><style>html,body{margin:0;height:100%;background:#050913}body{display:grid;place-items:center}img{max-width:100vw;max-height:100vh;object-fit:contain}</style></head><body><img src="${esc(src)}" alt="${esc(screen.name)}"></body></html>`;
    const url = URL.createObjectURL(new Blob([page], {type:'text/html'}));
    const tab = window.open(url, '_blank', 'noopener');
    if (!tab) {
        URL.revokeObjectURL(url);
        toast('Allow pop-ups to open the photo.', 'warn');
        return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function deviceFrameName(screen) {
    const story = activeStory();
    if (story?.settings?.showDeviceMockup === false) return 'none';
    return story?.settings?.deviceType || screen?.deviceFrame || 'none';
}

const HOTSPOT_GESTURES = [
    {id:'tap', name:'Circle', hint:'Tap', arrow:false},
    {id:'chevron-chase', name:'Chasing chevrons', hint:'Slow swipe', arrow:true},
    {id:'chevron', name:'Chevron', hint:'Quick swipe', arrow:true},
    {id:'arrow', name:'Animated arrow', hint:'Scrolling', arrow:true}
];
const HOTSPOT_DIRECTIONS = [
    {id:'up', name:'Up', angle:'-90deg'},
    {id:'right', name:'Right', angle:'0deg'},
    {id:'down', name:'Down', angle:'90deg'},
    {id:'left', name:'Left', angle:'180deg'}
];

function hotspotGesture(type) {
    return HOTSPOT_GESTURES.find(item => item.id === type) || HOTSPOT_GESTURES[0];
}

function hotspotDirection(value) {
    return HOTSPOT_DIRECTIONS.find(item => item.id === value) || HOTSPOT_DIRECTIONS[1];
}

function rememberedHotspotDirection() {
    return hotspotDirection(localStorage.getItem(APP.hotspotDirectionKey)).id;
}

function rememberHotspotDirection(direction) {
    const next = hotspotDirection(direction).id;
    localStorage.setItem(APP.hotspotDirectionKey, next);
    return next;
}

function hotspotChevronSvg() {
    return `<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5 11.5 8 5 13.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function hotspotChoiceIcon(id) {
    if (id === 'tap') return '<span class="hotspot-choice-tap" aria-hidden="true"></span>';
    if (id === 'chevron-chase') return `<span class="hotspot-choice-mark is-chase" aria-hidden="true">${hotspotChevronSvg()}${hotspotChevronSvg()}${hotspotChevronSvg()}</span>`;
    if (id === 'arrow') return '<span class="hotspot-choice-mark is-arrow" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M1.5 8h10M8.5 4.5 12.5 8l-4 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    return `<span class="hotspot-choice-mark" aria-hidden="true">${hotspotChevronSvg()}</span>`;
}

function hotspotGestureControls(step) {
    const current = hotspotGesture(step.interaction.type);
    const choices = HOTSPOT_GESTURES.map(item => {
        const pressed = current.id === item.id;
        return `<button type="button" class="hotspot-choice${pressed ? ' is-selected' : ''}" data-action="hotspot-gesture" data-gesture="${item.id}" aria-pressed="${pressed}" aria-label="${esc(item.name)}, ${esc(item.hint)}">${hotspotChoiceIcon(item.id)}<span class="hotspot-choice-pop" role="tooltip"><strong>${esc(item.name)}</strong><span>${esc(item.hint)}</span></span></button>`;
    }).join('');
    const direction = hotspotDirection(step.interaction.direction);
    const directions = current.arrow ? `<div class="field-label">DIRECTION</div><div class="hotspot-direction" role="group" aria-label="Arrow direction">${HOTSPOT_DIRECTIONS.map(item => {
        const pressed = direction.id === item.id;
        return `<button type="button" class="hotspot-choice hotspot-direction-choice${pressed ? ' is-selected' : ''}" data-action="hotspot-direction" data-direction="${item.id}" aria-pressed="${pressed}" aria-label="${esc(item.name)}" style="--dir:${item.angle}"><span class="hotspot-choice-mark" aria-hidden="true">${hotspotChevronSvg()}</span><span class="hotspot-choice-pop" role="tooltip"><strong>${esc(item.name)}</strong></span></button>`;
    }).join('')}</div>` : '';
    return `<div class="hotspot-gesture-grid" role="group" aria-label="Hotspot gesture">${choices}</div>${directions}`;
}

function hotspotGlyph(step) {
    const gesture = hotspotGesture(step.interaction.type);
    if (!gesture.arrow) return '';
    const angle = hotspotDirection(step.interaction.direction).angle;
    if (gesture.id === 'chevron-chase') return `<span class="hotspot-glyph" style="--dir:${angle}"><span class="hotspot-chase">${hotspotChevronSvg()}${hotspotChevronSvg()}${hotspotChevronSvg()}</span></span>`;
    if (gesture.id === 'arrow') return `<span class="hotspot-glyph" style="--dir:${angle}"><span class="hotspot-arrow"><span class="hotspot-arrow-shaft"></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8h9.5M7.5 4.5 11.5 8 7.5 11.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></span>`;
    return `<span class="hotspot-glyph" style="--dir:${angle}"><span class="hotspot-chevron">${hotspotChevronSvg()}</span></span>`;
}

function hotspotMarkup(step, player = false) {
    if (!step?.interaction?.enabled) return '';
    const gesture = hotspotGesture(step.interaction.type);
    const direction = gesture.arrow ? ` data-direction="${hotspotDirection(step.interaction.direction).id}"` : '';
    const style = `--x:${Number(step.interaction.xPercent)}%;--y:${Number(step.interaction.yPercent)}%`;
    const label = esc(step.interaction.label || (player ? 'Tap' : 'Hotspot'));
    const glyph = hotspotGlyph(step);
    if (player) return `<button class="hotspot" data-gesture="${gesture.id}"${direction} data-action="hotspot-next" style="${style}" aria-label="${esc(step.interaction.label || 'Advance to next step')}">${glyph}<span class="hotspot-label">${label}</span></button>`;
    return `<button type="button" class="hotspot hotspot-edit" data-gesture="${gesture.id}"${direction} style="${style}" aria-label="Drag to place the hotspot">${glyph}<span class="hotspot-label">${label}</span></button>`;
}

function screenInnerMarkup(screen, step, player = false) {
    const annotations = screen?.annotated
        ? (screen.annotations || [])
        : (step?.annotations?.length ? step.annotations : (screen?.annotations || []));
    return `<img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)}"><div class="annotation-layer">${annotationMarkup(annotations)}</div>${hotspotMarkup(step, player)}`;
}

function deviceMarkup(screen, step, player = false) {
    if (!screen) return '<div class="empty"><p>Source screenshot unavailable.</p></div>';
    return `<div class="device ${esc(deviceFrameName(screen))}"><div class="device-screen">${screenInnerMarkup(screen, step, player)}</div></div>`;
}

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
    const stepItems = story.steps.map((item,index) => {
        const screen = screenById(item.screenId);
        return `<button class="step-item ${step?.id === item.id ? 'active':''}" data-action="select-step" data-id="${esc(item.id)}" draggable="true" aria-label="Step ${index + 1}: ${esc(item.title)}. Drag to reorder."><span class="step-grip" aria-hidden="true">⠿</span><span class="step-index">${index+1}</span><span class="step-thumb">${screen ? `<img src="${safeImage(screen.dataUrl)}" alt="" draggable="false">`:''}</span><span class="step-copy"><span class="step-title">${esc(item.title)}</span><span class="step-meta">${Number(item.transition?.duration || 0).toFixed(1)}s · ${esc(item.transition?.type || 'none')}</span></span></button>`;
    }).join('');
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    if (!step) return `<section class="main-pane"><div class="story-layout ${storyPanelLayout}"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough</h2></div>${storyChooser(storyOptions, story)}</aside><div class="story-stage-empty">${renderEmpty('This walkthrough has no steps','Add a photo from the library to start the sequence.','open-photo-picker','Add a photo')}</div><aside class="inspector"></aside></div></section>`;
    const screen = screenById(step.screenId);
    const index = story.steps.findIndex(item => item.id === step.id);
    const storyScreenCount = new Set(story.steps.map(item => item.screenId).filter(id => screenById(id))).size;
    return `<section class="main-pane"><div class="story-layout ${storyPanelLayout}"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough steps</h2><div class="story-rail-tools"><button class="button ghost small photo-download" data-action="download-story-photos" title="Download this walkthrough’s photos as a ZIP file" ${storyScreenCount ? '' : 'disabled'}>↓ Photos</button><span class="eyebrow">${story.steps.length}</span></div></div>${storyChooser(storyOptions, story)}<div class="step-list" aria-label="Reorderable walkthrough steps">${stepItems}</div></aside><div class="flow-stage"><div class="stage-toolbar story-stage-toolbar"><div class="story-step-heading"><strong style="font-size:11px">${esc(step.title)}</strong><span style="color:var(--dim);font:9px/1 var(--mono);margin-left:8px">STEP ${index+1} / ${story.steps.length}</span></div><div class="tool-group story-preview-tools"><span class="tag">${esc(screen?.deviceFrame || 'none')}</span><button class="button small" data-action="preview-story">▶ Preview</button></div>${storyLayoutToggle()}</div><div class="step-canvas"><div class="device-mini">${deviceMarkup(screen, step, false)}</div></div><div class="story-bottom"><div class="step-reorder"><button class="button small" data-action="move-step" data-direction="-1" ${index === 0 ? 'disabled':''}>← Earlier</button><button class="button small" data-action="move-step" data-direction="1" ${index === story.steps.length-1 ? 'disabled':''}>Later →</button></div><div class="cluster" style="gap:6px"><button class="button small" data-action="duplicate-step">⧉ Duplicate</button><button class="button small danger" data-action="delete-step" aria-label="Delete slide ${index + 1}">Delete slide</button></div></div></div><aside class="inspector"><div class="panel-head"><h2>Step inspector</h2><span class="tag">${index+1}/${story.steps.length}</span></div><div class="panel-scroll" style="padding:0"><div class="section"><label class="field"><span class="field-label">FILE NAME</span><input class="input" data-screen-name="${esc(screen?.id || '')}" value="${esc(screen?.name || '')}" maxlength="120" ${screen ? '' : 'disabled'}></label>${stepTitleControl(step)}<label class="field"><span class="field-label"><span class="title-with-info">DWELL TIME<button type="button" class="info-dot" data-action="toggle-info" data-info="dwellInfo" aria-expanded="false" aria-controls="dwellInfo" aria-label="About dwell time"><span aria-hidden="true">i</span></button><div class="info-popover" id="dwellInfo" role="note" hidden>How long this step stays up during playback before the walkthrough moves on.</div></span><span data-dwell-readout>${Number(step.dwellSeconds).toFixed(1)}s</span></span><input type="range" data-step-field="dwellSeconds" min="1" max="10" step=".5" value="${Number(step.dwellSeconds)}" aria-label="Dwell time" style="width:100%"></label></div>${transitionInspector(step, index)}<div class="section"><div class="section-title"><span>INTERACTION HOTSPOT</span><button class="switch ${step.interaction.enabled ? 'on':''}" data-action="toggle-hotspot" aria-label="Toggle hotspot"></button></div>${step.interaction.enabled ? `<label class="field"><span class="field-label">LABEL</span><input class="input" data-interaction-field="label" value="${esc(step.interaction.label || '')}"></label><div class="field-grid"><label class="field"><span class="field-label">X POSITION</span><input class="input" type="number" data-interaction-field="xPercent" min="0" max="100" value="${Number(step.interaction.xPercent)}"></label><label class="field"><span class="field-label">Y POSITION</span><input class="input" type="number" data-interaction-field="yPercent" min="0" max="100" value="${Number(step.interaction.yPercent)}"></label></div><p style="color:var(--dim);font-size:10px;line-height:1.5">Drag the marker on the screen to place it.</p>` : '<p style="color:var(--dim);font-size:10px;line-height:1.5">Enable a hotspot to let viewers advance by clicking the target.</p>'}</div>${narrativeInspector(step)}</div></aside></div></section>`;
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

function storyCategoryOptions(selected, includeAll = false, stories = null) {
    const current = includeAll ? normalizeStoryCategoryFilter(selected) : normalizeStoryCategory(selected);
    const count = category => Array.isArray(stories) ? ` (${storiesForCategory(stories, category).length})` : '';
    const options = includeAll
        ? [`<option value="all" ${current === 'all' ? 'selected' : ''}>All categories${count('all')}</option>`]
        : [];
    STORY_CATEGORIES.forEach(category => {
        options.push(`<option value="${esc(category)}" ${current === category ? 'selected' : ''}>${esc(category)}${count(category)}</option>`);
    });
    return options.join('');
}

function storyCategoryBadge(story) {
    const category = normalizeStoryCategory(story?.category);
    return `<span class="story-category-badge ${storyCategoryTone(story)}">${esc(category)}</span>`;
}

function storyChooser(storyOptions, story) {
    return `<div class="story-chooser"><label class="story-select-field primary"><span>WALKTHROUGH</span><select class="select" data-action="change-story">${storyOptions}</select></label><label class="story-select-field secondary"><span>CATEGORY</span><select class="select story-category-select ${storyCategoryTone(story)}" data-action="change-story-category">${storyCategoryOptions(story.category)}</select></label><div class="story-chooser-actions"><button class="button" data-action="new-story" title="New walkthrough">＋ New</button><button class="button" data-action="open-photo-picker">＋ Add photo</button><div class="story-more-menu"><button type="button" class="button story-more-button${storyMenuOpen ? ' active' : ''}" id="storyMenuButton" data-action="toggle-story-menu" aria-haspopup="menu" aria-expanded="${storyMenuOpen ? 'true' : 'false'}" aria-controls="storyMenu" aria-label="More walkthrough options">⋯</button><div class="sync-menu-panel story-more-panel" id="storyMenu" role="menu" ${storyMenuOpen ? '' : 'hidden'}><button type="button" class="sync-option" role="menuitem" data-action="rename-story">Rename walkthrough</button><button type="button" class="sync-option" role="menuitem" data-action="copy-story-photo-urls">Copy photo URLs</button><span class="story-more-divider" aria-hidden="true"></span><button type="button" class="sync-option danger" role="menuitem" data-action="delete-story">Delete walkthrough</button></div></div></div></div>`;
}

function renderPhotoPicker() {
    const project = activeProject();
    const annotated = (project?.screenshots || []).filter(screen => screen.annotated);
    const screens = (project?.screenshots || []).filter(screen => pickerShowAnnotated || !screen.annotated);
    const cards = screens.map(screen => {
        const notes = screen.annotations?.length ? `<span class="annotation-layer">${annotationMarkup(screen.annotations)}</span>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform || 'screen')}</span>`;
        const picked = selectedPickerScreenIds.has(screen.id);
        return `<button type="button" class="photo-pick${picked ? ' picked' : ''}" data-action="pick-photo" data-id="${esc(screen.id)}" aria-pressed="${picked}"><span class="photo-pick-check" aria-hidden="true">${picked ? '✓' : ''}</span><span class="photo-pick-frame"><img src="${safeImage(screen.dataUrl)}" alt="">${notes}</span><span class="photo-pick-copy"><span class="photo-pick-name">${esc(screen.name)}</span>${kind}</span></button>`;
    }).join('');
    const body = $('#photoPickerBody');
    if (!body) return;
    const availableIds = new Set((project?.screenshots || []).map(screen => screen.id));
    [...selectedPickerScreenIds].forEach(id => { if (!availableIds.has(id)) selectedPickerScreenIds.delete(id); });
    const selectedCount = selectedPickerScreenIds.size;
    const allVisiblePicked = screens.length > 0 && screens.every(screen => selectedPickerScreenIds.has(screen.id));
    body.innerHTML = `<div class="photo-picker-bar"><span>${screens.length} photo${screens.length === 1 ? '' : 's'} · added in library order</span><span class="photo-picker-tools"><button type="button" class="button ghost small" data-action="toggle-all-picker-photos" data-ids="${esc(screens.map(screen => screen.id).join(' '))}">${allVisiblePicked ? 'Clear visible' : 'Select visible'}</button><button type="button" class="button small ${pickerShowAnnotated ? 'active' : ''}" data-action="toggle-picker-annotated" aria-pressed="${pickerShowAnnotated ? 'true' : 'false'}" title="Show or hide annotated pictures">Annotated <span class="count-pill">${annotated.length}</span></button></span></div>${cards ? `<div class="photo-picker-grid">${cards}</div>` : '<p class="photo-picker-empty">No photos match this filter.</p>'}`;
    const count = $('#photoPickerSelection');
    const add = $('#addSelectedPhotos');
    if (count) count.textContent = selectedCount ? `${selectedCount} selected` : 'Choose one or more photos';
    if (add) {
        add.disabled = selectedCount === 0;
        add.textContent = selectedCount ? `Add ${selectedCount} photo${selectedCount === 1 ? '' : 's'}` : 'Add photos';
    }
}

function deviceFrameName(screen) {
    const story = activeStory();
    if (story?.settings?.showDeviceMockup === false) return 'none';
    return story?.settings?.deviceType || screen?.deviceFrame || 'none';
}

function hotspotMarkup(step, player = false) {
    if (!step?.interaction?.enabled) return '';
    const style = `--x:${Number(step.interaction.xPercent)}%;--y:${Number(step.interaction.yPercent)}%`;
    const label = esc(step.interaction.label || (player ? 'Tap' : 'Hotspot'));
    if (player) return `<button class="hotspot" data-action="hotspot-next" style="${style}" aria-label="${esc(step.interaction.label || 'Advance to next step')}"><span class="hotspot-label">${label}</span></button>`;
    return `<button type="button" class="hotspot hotspot-edit" style="${style}" aria-label="Drag to place the hotspot"><span class="hotspot-label">${label}</span></button>`;
}

function screenInnerMarkup(screen, step, player = false) {
    const annotations = step?.annotations?.length ? step.annotations : (screen?.annotations || []);
    return `<img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)}"><div class="annotation-layer">${annotationMarkup(annotations)}</div>${hotspotMarkup(step, player)}`;
}

function deviceMarkup(screen, step, player = false) {
    if (!screen) return '<div class="empty"><p>Source screenshot unavailable.</p></div>';
    return `<div class="device ${esc(deviceFrameName(screen))}"><div class="device-screen">${screenInnerMarkup(screen, step, player)}</div></div>`;
}

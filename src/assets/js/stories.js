function renderStories() {
    const project = activeProject();
    const story = activeStory();
    if (!story) return `<section class="main-pane">${renderEmpty('No walkthrough yet','Create a story from any screenshot in the library.','screenshots','Open library')}</section>`;
    const step = activeStep();
    const stepItems = story.steps.map((item,index) => {
        const screen = screenById(item.screenId);
        return `<button class="step-item ${step?.id === item.id ? 'active':''}" data-action="select-step" data-id="${esc(item.id)}"><span class="step-index">${index+1}</span><span class="step-thumb">${screen ? `<img src="${safeImage(screen.dataUrl)}" alt="">`:''}</span><span class="step-copy"><span class="step-title">${esc(item.title)}</span><span class="step-meta">${Number(item.transition?.duration || 0).toFixed(1)}s · ${esc(item.transition?.type || 'none')}</span></span></button>`;
    }).join('');
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    if (!step) return `<section class="main-pane"><div class="story-layout"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough</h2></div>${storyChooser(storyOptions)}</aside><div>${renderEmpty('This walkthrough has no steps','Add a photo from the library to start the sequence.','open-photo-picker','Add a photo')}</div><aside class="inspector"></aside></div></section>`;
    const screen = screenById(step.screenId);
    const index = story.steps.findIndex(item => item.id === step.id);
    const transitionOptions = ['none','fade','slide-left','slide-right','slide-up','slide-down','scroll-down','scroll-up','tap-zoom','modal-pop'];
    const easingOptions = ['linear','ease','ease-in-out','spring'];
    return `<section class="main-pane"><div class="story-layout"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough steps</h2><span class="eyebrow">${story.steps.length}</span></div>${storyChooser(storyOptions)}<div class="step-list">${stepItems}</div></aside><div class="flow-stage"><div class="stage-toolbar"><div><strong style="font-size:11px">${esc(step.title)}</strong><span style="color:var(--dim);font:9px/1 var(--mono);margin-left:8px">STEP ${index+1} / ${story.steps.length}</span></div><div class="tool-group"><span class="tag">${esc(screen?.deviceFrame || 'none')}</span><button class="button small" data-action="preview-story">▶ Preview</button></div></div><div class="step-canvas"><div class="device-mini">${deviceMarkup(screen, step, false)}</div></div><div class="story-bottom"><div class="step-reorder"><button class="button small" data-action="move-step" data-direction="-1" ${index === 0 ? 'disabled':''}>← Earlier</button><button class="button small" data-action="move-step" data-direction="1" ${index === story.steps.length-1 ? 'disabled':''}>Later →</button></div><div class="cluster" style="gap:6px"><button class="button small" data-action="duplicate-step">⧉ Duplicate</button><button class="button small danger" data-action="delete-step" ${story.steps.length <= 1 ? 'disabled':''}>Delete</button></div></div></div><aside class="inspector"><div class="panel-head"><h2>Step inspector</h2><span class="tag">${index+1}/${story.steps.length}</span></div><div class="panel-scroll" style="padding:0"><div class="section"><label class="field"><span class="field-label">STEP TITLE</span><input class="input" data-step-field="title" value="${esc(step.title)}"></label><label class="field"><span class="field-label">DWELL TIME <span>${Number(step.dwellSeconds).toFixed(1)}s</span></span><input type="range" data-step-field="dwellSeconds" min="1" max="10" step=".5" value="${Number(step.dwellSeconds)}" style="width:100%"></label></div><div class="section"><div class="section-title">TRANSITION</div><label class="field"><span class="field-label">TYPE</span><select class="select" data-transition-field="type">${transitionOptions.map(value => `<option value="${value}" ${step.transition.type === value ? 'selected':''}>${value.replaceAll('-',' ')}</option>`).join('')}</select></label><div class="field-grid"><label class="field"><span class="field-label">DURATION</span><input class="input" type="number" data-transition-field="duration" min=".1" max="4" step=".1" value="${Number(step.transition.duration)}"></label><label class="field"><span class="field-label">EASING</span><select class="select" data-transition-field="easing">${easingOptions.map(value => `<option value="${value}" ${step.transition.easing === value ? 'selected':''}>${value}</option>`).join('')}</select></label></div></div><div class="section"><div class="section-title"><span>INTERACTION HOTSPOT</span><button class="switch ${step.interaction.enabled ? 'on':''}" data-action="toggle-hotspot" aria-label="Toggle hotspot"></button></div>${step.interaction.enabled ? `<label class="field"><span class="field-label">LABEL</span><input class="input" data-interaction-field="label" value="${esc(step.interaction.label || '')}"></label><div class="field-grid"><label class="field"><span class="field-label">X POSITION</span><input class="input" type="number" data-interaction-field="xPercent" min="0" max="100" value="${Number(step.interaction.xPercent)}"></label><label class="field"><span class="field-label">Y POSITION</span><input class="input" type="number" data-interaction-field="yPercent" min="0" max="100" value="${Number(step.interaction.yPercent)}"></label></div><p style="color:var(--dim);font-size:10px;line-height:1.5">Drag the marker on the screen to place it.</p>` : '<p style="color:var(--dim);font-size:10px;line-height:1.5">Enable a hotspot to let viewers advance by clicking the target.</p>'}</div><div class="section"><div class="section-title">BEHAVIORAL TRIAD</div><label class="field"><span class="field-label">USER ACTION</span><textarea class="textarea" data-step-field="userAction">${esc(step.userAction)}</textarea></label><label class="field"><span class="field-label">VISIBLE STATE</span><textarea class="textarea" data-step-field="screenContent">${esc(step.screenContent)}</textarea></label><label class="field"><span class="field-label">NEXT ACTION</span><textarea class="textarea" data-step-field="nextAction">${esc(step.nextAction)}</textarea></label></div></div></aside></div></section>`;
}

function storyChooser(storyOptions) {
    return `<div class="story-chooser"><select class="select" data-action="change-story">${storyOptions}</select><button class="button" data-action="new-story" style="width:100%;margin-top:7px">＋ New walkthrough</button><button class="button" data-action="open-photo-picker" style="width:100%;margin-top:7px">＋ Add photo</button></div>`;
}

function renderPhotoPicker() {
    const project = activeProject();
    const annotated = (project?.screenshots || []).filter(screen => screen.annotated);
    const screens = (project?.screenshots || []).filter(screen => pickerShowAnnotated || !screen.annotated);
    const cards = screens.map(screen => {
        const notes = screen.annotations?.length ? `<span class="annotation-layer">${annotationMarkup(screen.annotations)}</span>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform || 'screen')}</span>`;
        return `<button type="button" class="photo-pick" data-action="pick-photo" data-id="${esc(screen.id)}"><span class="photo-pick-frame"><img src="${safeImage(screen.dataUrl)}" alt="">${notes}</span><span class="photo-pick-copy"><span class="photo-pick-name">${esc(screen.name)}</span>${kind}</span></button>`;
    }).join('');
    const body = $('#photoPickerBody');
    if (!body) return;
    body.innerHTML = `<div class="photo-picker-bar"><span>${screens.length} photo${screens.length === 1 ? '' : 's'}</span><button type="button" class="button ${pickerShowAnnotated ? 'active' : ''}" data-action="toggle-picker-annotated" aria-pressed="${pickerShowAnnotated ? 'true' : 'false'}" title="Show or hide annotated pictures">Annotated <span class="count-pill">${annotated.length}</span></button></div>${cards ? `<div class="photo-picker-grid">${cards}</div>` : '<p class="photo-picker-empty">No photos match this filter.</p>'}`;
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


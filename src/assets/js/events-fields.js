let noteHistoryOpen = false;

function armNoteHistory(screen) {
    if (noteHistoryOpen || !screen) return;
    rememberAnnotations(screen);
    noteHistoryOpen = true;
}

function applyNoteField(ann, field, raw) {
    if (field === 'label') ann.label = raw;
    else if (field === 'opacity') ann.opacity = clamp(Number(raw) / 100, .15, 1);
    else if (field === 'fontSize') ann.fontSize = clamp(Number(raw), 10, 32);
    else if (field === 'fontWeight') ann.fontWeight = noteFontWeight({fontWeight: raw});
    else if (field === 'width') ann.width = clamp(Number(raw), 8, 92);
    else if (field === 'height') ann.height = clamp(Number(raw), 4, 70);
    else if (field === 'glow') ann.glow = clamp(Number(raw), 0, 28);
}

function applyMarkField(ann, field, raw) {
    if (field === 'strokeWidth') ann.strokeWidth = clamp(Number(raw), 1, 12);
    else if (field === 'size') ann.size = clamp(Number(raw), 16, 48);
    else if (field === 'width') ann.width = clamp(Number(raw), 1, 100);
    else if (field === 'height') ann.height = clamp(Number(raw), 1, 100);
}

function noteReadout(field, ann) {
    if (field === 'opacity') return String(noteOpacityPercent(ann));
    if (field === 'fontSize') return String(Math.round(ann.fontSize));
    if (field === 'fontWeight') return String(noteFontWeight(ann));
    if (field === 'width') return String(Math.round(ann.width));
    if (field === 'height') return String(Math.round(ann.height));
    if (field === 'glow') return String(Math.round(ann.glow));
    if (field === 'strokeWidth') return String(Math.round(ann.strokeWidth));
    if (field === 'size') return String(Math.round(ann.size));
    return '';
}

document.addEventListener('pointerup', () => { noteHistoryOpen = false; });
document.addEventListener('focusout', event => {
    if (event.target?.dataset?.noteField) noteHistoryOpen = false;
});

document.addEventListener('input', event => {
    const target = event.target;
    if (target.dataset.noteField) {
        const screen = activeScreen();
        const ann = selectedTextAnnotation(screen);
        if (!ann) return;
        armNoteHistory(screen);
        applyNoteField(ann, target.dataset.noteField, target.value);
        paintTextNote(ann);
        const readout = target.closest('.range-row')?.querySelector('.range-value');
        if (readout) readout.textContent = noteReadout(target.dataset.noteField, ann);
        if (target.dataset.noteField === 'label') {
            const pick = $(`.annotation-pick[data-id="${CSS.escape(ann.id)}"]`);
            if (pick) {
                const prefix = pick.textContent.match(/^\d+\. /)?.[0] || '';
                pick.textContent = `${prefix}${ann.label || 'Interface note'}`;
            }
        }
        persist();
        return;
    }
    if (target.dataset.markField) {
        const screen = activeScreen();
        const ann = selectedAnnotation(screen);
        if (!ann || ann.type === 'text-box') return;
        armNoteHistory(screen);
        applyMarkField(ann, target.dataset.markField, target.value);
        paintMark(ann);
        const readout = target.closest('.range-row')?.querySelector('.range-value');
        if (readout) readout.textContent = noteReadout(target.dataset.markField, ann);
        persist();
        return;
    }
    if (target.id === 'screenSearch') {
        searchTerm = target.value;
        renderApp();
        const search = $('#screenSearch'); search?.focus(); search?.setSelectionRange(search.value.length,search.value.length);
        return;
    }
    const screen = activeScreen();
    const step = activeStep();
    if (target.dataset.analysisField && screen) { screen.analysis ||= {}; screen.analysis[target.dataset.analysisField] = target.value; persist(); }
    else if (target.dataset.screenField && screen) { screen[target.dataset.screenField] = target.value; persist(); }
    else if (target.dataset.stepField && step) { step[target.dataset.stepField] = target.type === 'range' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.transitionField && step) { step.transition[target.dataset.transitionField] = target.type === 'number' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.interactionField && step) { step.interaction[target.dataset.interactionField] = target.type === 'number' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.audioField) { audioSettings[target.dataset.audioField] = target.type === 'range' ? Number(target.value) : target.value; saveJson(APP.audioKey,audioSettings); if (target.type === 'range') renderAudioSettings(); }
});

document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'projectSelect') {
        activeProjectId = target.value; selectedFolder = null; playerIndex = 0; persist(true);
    } else if (target.id === 'fileInput') {
        handleFiles([...target.files]); target.value = '';
    } else if (target.id === 'jsonInput') {
        if (target.files[0]) importProjectData(target.files[0]); target.value = '';
    } else if (target.dataset.action === 'change-story') {
        activeProject().activeStoryId = target.value; playerIndex = 0; persist(true);
    } else if (target.dataset.transitionField) {
        const step = activeStep(); step.transition[target.dataset.transitionField] = target.type === 'number' ? Number(target.value) : target.value; persist(true);
    } else if (target.dataset.audioField) {
        audioSettings[target.dataset.audioField] = target.type === 'range' ? Number(target.value) : target.value; saveJson(APP.audioKey,audioSettings);
    }
});


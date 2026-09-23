document.addEventListener('input', event => {
    const target = event.target;
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


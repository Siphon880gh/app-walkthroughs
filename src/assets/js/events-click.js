function setSyncMenu(open) {
    syncMenuOpen = open;
    const panel = $('#syncMenu');
    const button = $('#syncMenuButton');
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('active', open);
}

document.addEventListener('click', event => {
    const target = event.target.closest('[data-action], [data-view]');
    if (syncMenuOpen && !event.target.closest('.sync-menu')) setSyncMenu(false);
    if (!event.target.closest('.title-with-info')) setTransitionInfo(false);
    if (storyPickerOpen && !event.target.closest('.scope-switcher')) {
        storyPickerOpen = false;
        if (!target) { renderApp(); return; }
    }
    if (!target) return;
    if (target.dataset.view) { setView(target.dataset.view); return; }
    const action = target.dataset.action;
    const project = activeProject();

    if (['screenshots','editor','stories','player','export'].includes(action)) { setView(action); return; }

    if (action === 'new-project') $('#projectDialog').showModal();
    else if (action === 'close-project-dialog') $('#projectDialog').close();
    else if (action === 'open-audio') openAudioDialog();
    else if (action === 'close-audio') $('#audioDialog').close();
    else if (action === 'upload') $('#fileInput').click();
    else if (action === 'select-folder') { selectedFolder = target.dataset.folder || null; renderApp(); }
    else if (action === 'add-folder') {
        const platform = prompt('Platform folder name (for example, Android or Web):');
        if (!platform?.trim()) return;
        const fullPath = `${project.name.split('—')[0].trim()} / ${platform.trim()}`;
        if (project.folders.some(folder => folder.fullPath === fullPath)) { toast('That folder already exists.', 'warn'); return; }
        project.folders.push({id:uid('folder'),app:project.name.split('—')[0].trim(),platform:platform.trim(),fullPath});
        selectedFolder = fullPath;
        persist(true);
    }
    else if (action === 'edit-screen') { project.activeScreenshotId = target.dataset.id; persist(); setView('editor'); }
    else if (action === 'select-screen') { selectedAnnotationId = null; project.activeScreenshotId = target.dataset.id; persist(true); }
    else if (action === 'duplicate-screen') {
        const original = screenById(target.dataset.id);
        if (!original) return;
        const copy = structuredClone(original); copy.id = uid('screen'); copy.name = original.name.replace(/(\.[^.]+)$/, ' copy$1'); copy.uploadedAt = Date.now();
        project.screenshots.push(copy); project.activeScreenshotId = copy.id; persist(true); toast('Screen duplicated.');
    }
    else if (action === 'delete-screen') {
        const screen = screenById(target.dataset.id);
        if (!screen || !confirm(`Delete “${screen.name}”? Linked walkthrough steps will also be removed.`)) return;
        project.screenshots = project.screenshots.filter(item => item.id !== screen.id);
        project.stories.forEach(story => {
            story.steps = story.steps.filter(step => step.screenId !== screen.id);
            if (!story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0]?.id || '';
        });
        project.activeScreenshotId = project.screenshots[0]?.id || '';
        forgetAnnotationHistory(screen.id);
        persist(true);
        toast('Screen and linked steps deleted.');
    }
    else if (action === 'add-to-story') { addScreenToStory(target.dataset.id); setView('stories'); }
    else if (action === 'open-photo-picker') { pickerShowAnnotated = true; renderPhotoPicker(); $('#photoDialog').showModal(); }
    else if (action === 'close-photo-picker') $('#photoDialog').close();
    else if (action === 'toggle-picker-annotated') { pickerShowAnnotated = !pickerShowAnnotated; renderPhotoPicker(); }
    else if (action === 'pick-photo') {
        addScreenToStory(target.dataset.id);
        $('#photoDialog').close();
        renderApp();
    }
    else if (action === 'select-tool') { selectedTool = target.dataset.tool; renderApp(); }
    else if (action === 'select-annotation') {
        selectedAnnotationId = target.dataset.id;
        renderApp();
        if (target.dataset.focus === 'note') focusNoteLabel();
    }
    else if (action === 'select-color') {
        selectedColor = target.dataset.color;
        const screen = activeScreen();
        const ann = target.closest('.note-editor, .mark-editor') ? selectedAnnotation(screen) : null;
        if (ann) {
            rememberAnnotations(screen);
            ann.color = selectedColor;
            persist(true);
            return;
        }
        renderApp();
    }
    else if (action === 'inspector-tab') { inspectorTab = target.dataset.tab; renderApp(); }
    else if (action === 'undo-annotation') undoAnnotations();
    else if (action === 'redo-annotation') redoAnnotations();
    else if (action === 'toggle-remove-handles') { showRemoveHandles = !showRemoveHandles; renderApp(); }
    else if (action === 'delete-annotation') removeAnnotation(target.dataset.id);
    else if (action === 'clear-annotations') {
        const screen = activeScreen();
        if (!screen?.annotations?.length) return;
        rememberAnnotations(screen);
        screen.annotations = [];
        selectedAnnotationId = null;
        persist(true);
    }
    else if (action === 'toggle-annotated') { showAnnotatedScreens = !showAnnotatedScreens; renderApp(); }
    else if (action === 'save-snapshot') saveAnnotatedScreen();
    else if (action === 'new-story') {
        const name = prompt('Walkthrough name:');
        if (!name?.trim()) return;
        const story = newStory(name.trim()); project.stories.push(story); project.activeStoryId = story.id; persist(true);
    }
    else if (action === 'select-step') { const story = activeStory(); story.activeStepId = target.dataset.id; persist(true); }
    else if (action === 'move-step') moveStep(target.dataset.direction);
    else if (action === 'duplicate-step') {
        const story = activeStory(), step = activeStep(), index = story.steps.findIndex(item => item.id === step.id);
        const copy = structuredClone(step); copy.id = uid('step'); copy.title += ' copy'; story.steps.splice(index+1,0,copy); story.activeStepId = copy.id; persist(true);
    }
    else if (action === 'delete-step') {
        const story = activeStory();
        if (story.steps.length <= 1) { toast('A walkthrough must contain at least one step.', 'warn'); return; }
        const step = activeStep(), index = story.steps.findIndex(item => item.id === step.id); story.steps.splice(index,1); story.activeStepId = story.steps[Math.max(0,index-1)].id; persist(true);
    }
    else if (action === 'toggle-transition-info') setTransitionInfo($('#transitionInfo')?.hidden !== false);
    else if (action === 'toggle-hotspot') { const step = activeStep(); step.interaction.enabled = !step.interaction.enabled; persist(true); }
    else if (action === 'preview-story') setView('player');
    else if (action === 'player-prev') setPlayerIndex(playerIndex-1, false);
    else if (action === 'player-next' || action === 'hotspot-next') setPlayerIndex(playerIndex+1, isPlaying);
    else if (action === 'player-jump') setPlayerIndex(Number(target.dataset.index), isPlaying);
    else if (action === 'toggle-play') {
        if (isPlaying) { stopPlayback(); renderApp(); }
        else { isPlaying = true; renderApp(); startStepTimer(); }
    }
    else if (action === 'toggle-mute') toggleNarrationMute(target);
    else if (action === 'fullscreen') { const element = $('.player-view'); if (element?.requestFullscreen) element.requestFullscreen(); }
    else if (action === 'export-scope') { exportScope = target.dataset.scope; storyPickerOpen = false; renderApp(); }
    else if (action === 'toggle-story-picker') { storyPickerOpen = !storyPickerOpen; renderApp(); }
    else if (action === 'pick-export-story') {
        const chosen = project.stories.find(item => item.id === target.dataset.id);
        if (!chosen) return;
        stopPlayback();
        project.activeStoryId = chosen.id;
        exportScope = 'story';
        storyPickerOpen = false;
        persist(true);
    }
    else if (action === 'copy-share') {
        const hashKey = exportScope === 'project' ? 'player':'flow';
        const url = `${location.origin}${location.pathname}#${hashKey}=${encodePayload(projectPayload())}`;
        copyText(url,'Share link copied.');
    }
    else if (action === 'copy-markdown') copyText(generateMarkdown(),'Markdown copied.');
    else if (action === 'download-markdown') download(generateMarkdown(),`${slug(project.name)}-spec.md`,'text/markdown;charset=utf-8');
    else if (action === 'download-json') download(JSON.stringify(projectPayload('project'),null,2),`${slug(project.name)}-backup.json`,'application/json;charset=utf-8');
    else if (action === 'download-html') download(standaloneHtml(),`${slug(project.name)}-walkthrough.html`,'text/html;charset=utf-8');
    else if (action === 'toggle-sync-menu') setSyncMenu(!syncMenuOpen);
    else if (action === 'sync-demo') {
        setSyncMenu(false);
        const input = $('#syncDemoPassword');
        const error = $('#syncDemoError');
        if (input) input.value = '';
        if (error) { error.hidden = true; error.textContent = ''; }
        $('#syncDemoDialog').showModal();
        input?.focus();
    }
    else if (action === 'close-sync-demo') $('#syncDemoDialog').close();
    else if (action === 'reset-profile') { setSyncMenu(false); $('#resetProfileDialog').showModal(); }
    else if (action === 'close-reset-profile') $('#resetProfileDialog').close();
    else if (action === 'import-json') $('#jsonInput').click();
    else if (action === 'audio-toggle') { audioSettings[target.dataset.key] = !audioSettings[target.dataset.key]; saveJson(APP.audioKey,audioSettings); renderAudioSettings(); }
});


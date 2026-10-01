function setSyncMenu(open) {
    syncMenuOpen = open;
    const panel = $('#syncMenu');
    const button = $('#syncMenuButton');
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('active', open);
}

function setUploadMenu(open) {
    uploadMenuOpen = open;
    const panel = $('#uploadMenu');
    const button = $('#uploadMenuButton');
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('active', open);
}

function refreshLibraryView() {
    const scroll = $('.library-scroll')?.scrollTop || 0;
    const trayScroll = $('.upload-tray-list')?.scrollTop || 0;
    renderApp();
    const next = $('.library-scroll');
    if (next) next.scrollTop = scroll;
    const nextTray = $('.upload-tray-list');
    if (nextTray) nextTray.scrollTop = trayScroll;
}

function photoIdsInSelectionRange(box) {
    const boxes = $$('.library-scroll [data-action="toggle-photo-select"]');
    const end = boxes.indexOf(box);
    if (end < 0) return [box.dataset.id];
    let start = librarySelectAnchor ? boxes.findIndex(item => item.dataset.id === librarySelectAnchor) : end;
    if (start < 0) start = end;
    const [from, to] = start < end ? [start, end] : [end, start];
    return [...new Set(boxes.slice(from, to + 1).map(item => item.dataset.id))];
}

function applyLibraryPhotoSelection(ids, checked, anchorId) {
    ids.filter(Boolean).forEach(id => { if (checked) selectedPhotoIds.add(id); else selectedPhotoIds.delete(id); });
    if (anchorId) librarySelectAnchor = anchorId;
    refreshLibraryView();
}

function setStoryMenu(open) {
    storyMenuOpen = open;
    const panel = $('#storyMenu');
    const button = $('#storyMenuButton');
    if (!panel || !button) return;
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.classList.toggle('active', open);
}

document.addEventListener('click', event => {
    const target = event.target.closest('[data-action], [data-view]');
    if (syncMenuOpen && !event.target.closest('.sync-menu')) setSyncMenu(false);
    if (uploadMenuOpen && !event.target.closest('.upload-menu')) setUploadMenu(false);
    if (transferMenu && !event.target.closest('.transfer-menu')) setTransferMenu(null);
    if (folderMenuPath !== null && !event.target.closest('.folder-menu')) setFolderMenu(null);
    if (storyMenuOpen && !event.target.closest('.story-more-menu')) setStoryMenu(false);
    if ((pickerMenu || pickerAssocId) && !event.target.closest('.picker-menu, .picker-assoc-drawer')) closePickerContext();
    if ((libraryMenu || libraryAssocId) && !event.target.closest('.library-menu, .library-assoc-drawer') && !libraryThumbClickContinues(event)) closeLibraryContext();
    if (assocDrawerId && !event.target.closest('.assoc-anchor')) {
        assocDrawerId = null;
        $$('.assoc-anchor.is-open').forEach(node => {
            node.classList.remove('is-open');
            $('.assoc-chip', node)?.setAttribute('aria-expanded', 'false');
        });
    }
    if (!event.target.closest('.title-with-info')) closeInfoNotes();
    if (storyPickerOpen && !event.target.closest('.scope-switcher')) {
        storyPickerOpen = false;
        if (!target) { renderApp(); return; }
    }
    if (handleLibraryThumbClick(event)) return;
    const photoRow = event.target.closest('.photo-row');
    if (photoRow && !event.target.closest('button, input, textarea, a, label, .screen-tag, .assoc-anchor')) {
        if (event.detail > 1) return;
        const box = $('[data-action="toggle-photo-select"]', photoRow);
        if (box) {
            if (event.shiftKey) event.preventDefault();
            const checked = !selectedPhotoIds.has(box.dataset.id);
            const ids = event.shiftKey ? photoIdsInSelectionRange(box) : [box.dataset.id];
            applyLibraryPhotoSelection(ids, checked, event.shiftKey ? '' : box.dataset.id);
        }
        return;
    }
    if (!target) return;
    if (target.dataset.view) {
        if (target.dataset.view === 'editor') beginAnnotatingScreen(activeScreen()?.id);
        else setView(target.dataset.view);
        return;
    }
    const action = target.dataset.action;
    const project = activeProject();

    if (['screenshots','editor','stories','player','export'].includes(action)) {
        if (action === 'editor') beginAnnotatingScreen(activeScreen()?.id);
        else setView(action);
        return;
    }

    if (action === 'new-project') $('#projectDialog').showModal();
    else if (action === 'close-project-dialog') $('#projectDialog').close();
    else if (action === 'open-audio') openAudioDialog();
    else if (action === 'close-audio') $('#audioDialog').close();
    else if (action === 'upload') $('#fileInput').click();
    else if (action === 'close-upload-dialog') closeUploadDialog();
    else if (action === 'choose-upload-tag') {
        const input = $('#uploadTagInput');
        if (!input) return;
        const tags = String(input.value || '').split(',').map(tag => tag.trim()).filter(Boolean);
        if (!tags.includes(target.dataset.tag)) tags.push(target.dataset.tag);
        input.value = tags.join(', ');
        input.focus();
    }
    else if (action === 'toggle-upload-menu') setUploadMenu(!uploadMenuOpen);
    else if (action === 'enter-url') { setUploadMenu(false); openUrlDialog(); }
    else if (action === 'toggle-assoc') {
        const id = target.dataset.id;
        if (!screenById(id)) return;
        assocDrawerId = assocDrawerId === id ? null : id;
        refreshLibraryView();
        document.querySelector(`[data-action="toggle-assoc"][data-id="${CSS.escape(id)}"]`)?.focus();
    }
    else if (action === 'open-assoc-story') {
        const story = project.stories.find(item => item.id === target.dataset.storyId);
        if (!story) return;
        project.activeStoryId = story.id;
        if (story.steps.some(step => step.id === target.dataset.stepId)) story.activeStepId = target.dataset.stepId;
        assocDrawerId = null;
        pickerMenu = null;
        pickerAssocId = null;
        libraryMenu = null;
        libraryAssocId = null;
        if ($('#photoDialog')?.open) $('#photoDialog').close();
        persist(true);
        setView('stories');
    }
    else if (action === 'set-library-view') {
        const view = target.dataset.libraryView;
        if (!['grid', 'list', 'urls'].includes(view) || view === libraryView) return;
        libraryView = view;
        localStorage.setItem(APP.libraryViewKey, libraryView);
        refreshLibraryView();
    }
    else if (action === 'paste-url') pasteClipboardUrls();
    else if (action === 'toggle-upload-tray') {
        sessionUploadOpen = !sessionUploadOpen;
        renderSessionTray();
        (sessionUploadOpen ? $('.upload-tray-collapse') : $('.upload-tray-icon'))?.focus();
    }
    else if (action === 'copy-screen-url') { if (target.dataset.url) copyText(target.dataset.url, 'Image URL copied.'); }
    else if (['toggle-photo-select','toggle-url-select','select-all-photos','select-all-urls'].includes(action)) {
        const selectsMany = action === 'select-all-photos' || action === 'select-all-urls';
        const range = !selectsMany && action === 'toggle-photo-select' && event.shiftKey;
        const ids = selectsMany
            ? (target.dataset.ids || '').split(' ').filter(Boolean)
            : range ? photoIdsInSelectionRange(target) : [target.dataset.id];
        applyLibraryPhotoSelection(ids, target.checked, !selectsMany && !range ? target.dataset.id : '');
    }
    else if (action === 'copy-selected-urls') {
        const urls = target.dataset.scope === 'tray'
            ? sessionUploads.filter(item => item.url && selectedPhotoIds.has(item.id)).map(item => item.url)
            : activeProject().screenshots.filter(screen => selectedPhotoIds.has(screen.id)).map(screen => screenUrl(screen.dataUrl)).filter(Boolean);
        if (urls.length) copyText(urls.join('\n'), `${urls.length} image URL${urls.length === 1 ? '' : 's'} copied.`);
    }
    else if (action === 'download-library-photos') {
        const screens = project.screenshots.filter(screen => selectedPhotoIds.has(screen.id));
        downloadPhotoArchive(screens, `${slug(project.name)}-photos.zip`, target);
    }
    else if (action === 'tag-selected-photos') {
        addTagToPhotos((target.dataset.ids || '').split(' ').filter(Boolean));
    }
    else if (action === 'tag-photo') addTagToPhotos([target.dataset.id]);
    else if (action === 'close-tag-dialog') closePhotoTagDialog();
    else if (action === 'choose-photo-tag') {
        const input = $('#tagInput');
        if (!input) return;
        input.value = target.dataset.tag || '';
        $('#tagError').hidden = true;
        input.focus();
    }
    else if (action === 'remove-photo-tag') removeTagFromPhoto(target.dataset.id, target.dataset.tag);
    else if (action === 'open-transfer') {
        const mode = target.dataset.mode;
        const fromChooser = transferMenu === 'mode' && mode !== 'mode';
        setTransferMenu(transferMenu === mode && !fromChooser ? null : mode);
        $('#transferMenu .sync-option:not([disabled])')?.focus();
    }
    else if (action === 'delete-library-photos') {
        const screens = project.screenshots.filter(screen => selectedPhotoIds.has(screen.id));
        if (!screens.length) return;
        const screenIds = new Set(screens.map(screen => screen.id));
        const stepCount = project.stories.reduce((sum, story) => sum + story.steps.filter(step => screenIds.has(step.screenId)).length, 0);
        const detail = stepCount ? ` and ${stepCount} linked walkthrough step${stepCount === 1 ? '' : 's'}` : '';
        if (!confirm(`Delete ${screens.length} photo${screens.length === 1 ? '' : 's'}${detail}?`)) return;
        project.screenshots = project.screenshots.filter(screen => !screenIds.has(screen.id));
        project.stories.forEach(story => {
            story.steps = story.steps.filter(step => !screenIds.has(step.screenId));
            if (!story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0]?.id || '';
        });
        screenIds.forEach(id => { forgetAnnotationHistory(id); selectedPhotoIds.delete(id); selectedPickerScreenIds.delete(id); });
        if (!project.screenshots.some(screen => screen.id === project.activeScreenshotId)) project.activeScreenshotId = project.screenshots[0]?.id || '';
        persist(true);
        toast(`Deleted ${screens.length} photo${screens.length === 1 ? '' : 's'}${detail}.`);
    }
    else if (action === 'transfer-photos') transferPhotos(target.dataset.mode, target.dataset.folder || '');
    else if (action === 'close-url-dialog') $('#urlDialog').close();
    else if (action === 'select-folder') {
        selectedFolder = target.dataset.folder || null;
        libraryStoryFilter = 'all';
        libraryTagFilter = 'all';
        selectedPhotoIds.clear();
        renderApp();
    }
    else if (action === 'add-folder') {
        const platform = prompt('Platform folder name (for example, Android or Web):');
        if (!platform?.trim()) return;
        const fullPath = `${project.name.split('—')[0].trim()} / ${platform.trim()}`;
        if (project.folders.some(folder => folder.fullPath === fullPath)) { toast('That folder already exists.', 'warn'); return; }
        project.folders.push({id:uid('folder'),app:project.name.split('—')[0].trim(),platform:platform.trim(),fullPath});
        selectedFolder = fullPath;
        persist(true);
    }
    else if (action === 'toggle-folder-menu') {
        const fullPath = target.dataset.folder || '';
        setFolderMenu(folderMenuPath === fullPath ? null : fullPath);
        if (folderMenuPath !== null) $('.sync-option', target.closest('.folder-menu'))?.focus();
    }
    else if (action === 'delete-folder') {
        setFolderMenu(null);
        const fullPath = target.dataset.folder || '';
        const folder = project.folders.find(item => item.fullPath === fullPath);
        if (!folder) return;
        const screens = project.screenshots.filter(screen => screen.folder === fullPath);
        const detail = screens.length ? ` and its ${screens.length} screen${screens.length === 1 ? '' : 's'}` : '';
        if (!confirm(`Delete “${fullPath}”${detail}? Linked walkthrough steps will also be removed.`)) return;
        const screenIds = new Set(screens.map(screen => screen.id));
        project.folders = project.folders.filter(item => item.fullPath !== fullPath);
        project.screenshots = project.screenshots.filter(screen => screen.folder !== fullPath);
        project.stories.forEach(story => {
            story.steps = story.steps.filter(step => !screenIds.has(step.screenId));
            if (!story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0]?.id || '';
        });
        screenIds.forEach(id => forgetAnnotationHistory(id));
        screenIds.forEach(id => selectedPhotoIds.delete(id));
        if (selectedFolder === fullPath) selectedFolder = null;
        if (!project.screenshots.some(screen => screen.id === project.activeScreenshotId)) project.activeScreenshotId = project.screenshots[0]?.id || '';
        persist(true);
        toast(`Folder “${fullPath}” deleted.`);
    }
    else if (action === 'rename-folder') {
        setFolderMenu(null);
        const oldPath = target.dataset.folder || '';
        const folder = project.folders.find(item => item.fullPath === oldPath);
        if (!folder) return;
        const input = prompt('Rename folder as App / Platform:', folder.fullPath);
        if (input === null) return;
        const [appPart, ...platformParts] = input.split('/').map(part => part.trim());
        const app = platformParts.length ? appPart : folder.app;
        const platform = platformParts.length ? platformParts.join(' / ') : appPart;
        if (!app || !platform) { toast('Enter both an app and a platform, like “Orbit Pay / iOS”.', 'warn'); return; }
        const fullPath = `${app} / ${platform}`;
        if (fullPath === oldPath) return;
        if (project.folders.some(item => item !== folder && item.fullPath === fullPath)) { toast('That folder already exists.', 'warn'); return; }
        const renameTag = tag => tag === slug(folder.app) ? slug(app) : tag === slug(folder.platform) ? slug(platform) : tag;
        project.screenshots.forEach(screen => {
            if (screen.folder !== oldPath) return;
            screen.folder = fullPath;
            screen.app = app;
            screen.platform = platform;
            if (Array.isArray(screen.tags)) screen.tags = screen.tags.map(renameTag);
        });
        project.stories.forEach(story => { if (story.folder === oldPath) story.folder = fullPath; });
        Object.assign(folder, {app, platform, fullPath});
        if (selectedFolder === oldPath) selectedFolder = fullPath;
        persist(true);
        toast(`Folder renamed to “${fullPath}”.`);
    }
    else if (action === 'delete-project') {
        if (!confirm(`Delete “${project.name}”? This removes its screens and walkthroughs from this browser.`)) return;
        stopPlayback();
        if (project.id === SHARED_DEMO_ID) localStorage.setItem('storyflow_dismissed_demo_at', String(project.syncedAt || Date.now()));
        const index = projects.findIndex(item => item.id === project.id);
        if (index < 0) return;
        const name = project.name;
        projects.splice(index, 1);
        const restored = projects.length === 0;
        if (restored) projects = seedProjects();
        activeProjectId = projects[Math.min(index, projects.length - 1)].id;
        selectedFolder = null;
        libraryStoryFilter = 'all';
        libraryTagFilter = 'all';
        playerStoryStageFilter = 'all';
        exportStoryStageFilter = 'all';
        selectedPhotoIds.clear();
        selectedPickerScreenIds.clear();
        selectedStoryStepIds.clear();
        persist();
        setView('screenshots');
        toast(restored ? `Project “${name}” deleted. The sample project is back because it was the last one.` : `Project “${name}” deleted.`);
    }
    else if (action === 'edit-screen') beginAnnotatingScreen(target.dataset.id);
    else if (action === 'select-screen') beginAnnotatingScreen(target.dataset.id);
    else if (action === 'close-annotation-story') closeAnnotationStoryDialog();
    else if (action === 'choose-annotation-story') openAnnotatedVersion(pendingAnnotationScreenId, target.dataset.storyId);
    else if (action === 'duplicate-screen') {
        const original = screenById(target.dataset.id);
        if (!original) return;
        const copy = structuredClone(original); copy.id = uid('screen'); copy.name = original.name.replace(/(\.[^.]+)$/, ' copy$1'); copy.uploadedAt = Date.now();
        project.screenshots.push(copy); project.activeScreenshotId = copy.id; persist(true); toast('Screen duplicated.');
    }
    else if (action === 'delete-screen') deleteLibraryScreen(screenById(target.dataset.id));
    else if (action === 'add-to-story') { addScreenToStory(target.dataset.id); setView('stories'); }
    else if (action === 'open-photo-picker') {
        pickerShowAnnotated = true;
        pickerUploadOpen = false;
        pickerUploadBusy = false;
        pendingPickerUpload = null;
        pickerMenu = null;
        pickerAssocId = null;
        selectedPickerScreenIds.clear();
        renderPhotoPicker();
        $('#photoDialog').showModal();
    }
    else if (action === 'close-photo-picker') { selectedPickerScreenIds.clear(); pickerUploadOpen = false; closePickerContext(); $('#photoDialog').close(); }
    else if (action === 'toggle-picker-upload') {
        pickerUploadOpen = !pickerUploadOpen;
        if (pickerUploadOpen) {
            const folders = project.folders || [];
            const current = folders.some(folder => folder.fullPath === pickerUploadFolder) ? pickerUploadFolder : (selectedFolder && folders.some(folder => folder.fullPath === selectedFolder) ? selectedFolder : (folders[0]?.fullPath || '__new__'));
            pickerUploadFolder = current;
        }
        renderPhotoPicker();
        (pickerUploadOpen ? $('[data-action="picker-upload-folder"]') : $('[data-action="toggle-picker-upload"]'))?.focus();
    }
    else if (action === 'choose-picker-upload') choosePickerUpload();
    else if (action === 'picker-open-photo') {
        openZoomedPhoto(screenById(target.dataset.id));
        closePickerContext();
    }
    else if (action === 'picker-show-assoc') {
        const screen = screenById(target.dataset.id);
        if (!screen || !assocConnectionsMarkup(project, screen)) return;
        pickerAssocId = screen.id;
        pickerMenu = null;
        renderPickerContext();
    }
    else if (action === 'picker-delete-photo') {
        const screen = screenById(target.dataset.id);
        closePickerContext();
        if (!deleteLibraryScreen(screen)) return;
        renderPhotoPicker();
    }
    else if (action === 'library-open-photo') {
        openZoomedPhoto(screenById(target.dataset.id));
        closeLibraryContext();
    }
    else if (action === 'library-show-assoc') {
        const screen = screenById(target.dataset.id);
        if (!screen || !assocConnectionsMarkup(project, screen)) return;
        libraryAssocId = screen.id;
        libraryMenu = null;
        renderLibraryContext();
    }
    else if (action === 'library-fit-photo') {
        const id = target.dataset.id;
        closeLibraryContext();
        openLibraryFit(id);
    }
    else if (action === 'library-delete-photo') {
        const screen = screenById(target.dataset.id);
        closeLibraryContext();
        deleteLibraryScreen(screen);
    }
    else if (action === 'close-library-fit') closeLibraryFit();
    else if (action === 'toggle-picker-annotated') { pickerShowAnnotated = !pickerShowAnnotated; renderPhotoPicker(); }
    else if (action === 'pick-photo') {
        const id = target.dataset.id;
        if (selectedPickerScreenIds.has(id)) selectedPickerScreenIds.delete(id);
        else selectedPickerScreenIds.add(id);
        renderPhotoPicker();
        $$('[data-action="pick-photo"]').find(button => button.dataset.id === id)?.focus();
    }
    else if (action === 'toggle-all-picker-photos') {
        const ids = (target.dataset.ids || '').split(' ').filter(Boolean);
        const allPicked = ids.length > 0 && ids.every(id => selectedPickerScreenIds.has(id));
        ids.forEach(id => { if (allPicked) selectedPickerScreenIds.delete(id); else selectedPickerScreenIds.add(id); });
        renderPhotoPicker();
        $('[data-action="toggle-all-picker-photos"]')?.focus();
    }
    else if (action === 'add-all-recent-photos') {
        const ids = [...(project.screenshots || [])]
            .sort((a, b) => photoTimestamp(b) - photoTimestamp(a))
            .map(screen => screen.id);
        const added = addScreensToStory(ids);
        if (!added) return;
        selectedPickerScreenIds.clear();
        $('#photoDialog').close();
        renderApp();
    }
    else if (action === 'add-selected-photos') {
        const added = addScreensToStory(selectedPickerIdsInDisplayOrder());
        if (!added) return;
        selectedPickerScreenIds.clear();
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
    else if (action === 'toggle-canvas-fit') { canvasFitOpen = !canvasFitOpen; renderApp(); }
    else if (action === 'canvas-fit') { canvasFit = canvasFit === target.dataset.fit ? 'auto' : target.dataset.fit; canvasFitOpen = false; renderApp(); }
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
    else if (action === 'save-snapshot-as') saveAnnotatedScreenAs();
    else if (action === 'new-story') {
        const name = prompt('Walkthrough name:');
        if (!name?.trim()) return;
        const story = newStory(name.trim()); project.stories.push(story); project.activeStoryId = story.id; selectedStoryStepIds.clear(); persist(true);
    }
    else if (action === 'toggle-story-menu') setStoryMenu(!storyMenuOpen);
    else if (action === 'select-all-story-steps') {
        const story = activeStory();
        if (!story?.steps.length) return;
        const scrollTop = $('.step-list')?.scrollTop || 0;
        const allSelected = story.steps.every(step => selectedStoryStepIds.has(step.id));
        if (allSelected) selectedStoryStepIds.clear();
        else story.steps.forEach(step => selectedStoryStepIds.add(step.id));
        setStoryMenu(false);
        renderApp();
        const list = $('.step-list');
        if (list) list.scrollTop = scrollTop;
        $('#storyMenuButton')?.focus();
    }
    else if (action === 'reverse-selected-story-steps') {
        setStoryMenu(false);
        const count = reverseSelectedStorySteps();
        if (count) toast(`Reversed ${count} selected photos.`);
    }
    else if (action === 'rename-story') {
        const story = activeStory();
        if (!story) return;
        setStoryMenu(false);
        const name = prompt('Walkthrough name:', story.name);
        if (name === null || name.trim() === story.name) return;
        if (!name.trim()) { toast('Walkthrough name cannot be empty.', 'warn'); return; }
        story.name = name.trim();
        story.updatedAt = Date.now();
        persist(true);
        toast(`Walkthrough renamed to “${story.name}”.`);
    }
    else if (action === 'copy-story-photo-urls') {
        const story = activeStory();
        if (!story) return;
        setStoryMenu(false);
        const seen = new Set();
        const urls = story.steps.flatMap(step => {
            if (seen.has(step.screenId)) return [];
            seen.add(step.screenId);
            const url = screenUrl(screenById(step.screenId)?.dataUrl);
            return url ? [url] : [];
        });
        if (!urls.length) { toast('This walkthrough has no copyable photo URLs.', 'warn'); return; }
        copyText(urls.join('\n'), `${urls.length} photo URL${urls.length === 1 ? '' : 's'} copied.`);
    }
    else if (action === 'delete-story') {
        const story = activeStory();
        if (!story) return;
        setStoryMenu(false);
        const slideCount = story.steps.length;
        const detail = slideCount ? ` and its ${slideCount} slide${slideCount === 1 ? '' : 's'}` : '';
        if (!confirm(`Delete walkthrough “${story.name}”${detail}?`)) return;
        const index = project.stories.findIndex(item => item.id === story.id);
        if (index < 0) return;
        project.stories.splice(index, 1);
        project.activeStoryId = project.stories[Math.min(index, project.stories.length - 1)]?.id || '';
        selectedStoryStepIds.clear();
        story.steps.forEach(step => {
            [...expandedNarration].forEach(key => { if (key.startsWith(`${step.id}:`)) expandedNarration.delete(key); });
        });
        playerIndex = 0;
        persist(true);
        toast(`Walkthrough “${story.name}” deleted.`);
    }
    else if (action === 'toggle-story-step-selection') {
        const id = target.dataset.id;
        if (!activeStory()?.steps.some(step => step.id === id)) return;
        if (selectedStoryStepIds.has(id)) selectedStoryStepIds.delete(id);
        else selectedStoryStepIds.add(id);
        renderApp();
        $$('.step-pick').find(button => button.dataset.id === id)?.focus();
    }
    else if (action === 'select-step') { const story = activeStory(); story.activeStepId = target.dataset.id; persist(true); }
    else if (action === 'move-step') moveStep(target.dataset.direction);
    else if (action === 'duplicate-step') {
        const story = activeStory(), step = activeStep(), index = story.steps.findIndex(item => item.id === step.id);
        const copy = structuredClone(step); copy.id = uid('step'); copy.title += ' copy'; story.steps.splice(index+1,0,copy); story.activeStepId = copy.id; persist(true);
    }
    else if (action === 'delete-step') {
        const story = activeStory(), step = activeStep();
        if (!story || !step) return;
        const index = story.steps.findIndex(item => item.id === step.id);
        if (index < 0) return;
        story.steps.splice(index, 1);
        selectedStoryStepIds.delete(step.id);
        story.activeStepId = (story.steps[index] || story.steps[index - 1])?.id || '';
        [...expandedNarration].forEach(key => { if (key.startsWith(`${step.id}:`)) expandedNarration.delete(key); });
        persist(true);
        toast(`Slide “${step.title}” deleted.`);
    }
    else if (action === 'toggle-copy-previous') {
        if ((activeStory()?.steps.findIndex(item => item.id === activeStep()?.id) ?? -1) < 1) return;
        copyPreviousOpen = !copyPreviousOpen;
        withStoryScroll(() => renderApp(), '[data-action="toggle-copy-previous"]');
    }
    else if (action === 'copy-prev-option') copyPreviousSlideOption(target.dataset.copyScope, target.dataset.copyKey);
    else if (action === 'remove-recent-copy') removeRecentSlideCopy(target.dataset.copyScope, target.dataset.copyKey);
    else if (action === 'clear-step-title') {
        const step = activeStep();
        if (!step || !step.title) return;
        step.title = '';
        persist(true);
        $('[data-step-field="title"]')?.focus();
    }
    else if (action === 'toggle-info') {
        const id = target.dataset.info;
        if (!id) return;
        const opening = document.getElementById(id)?.hidden !== false;
        closeInfoNotes();
        if (opening) setInfoNote(id, true);
    }
    else if (action === 'toggle-narration') {
        const step = activeStep();
        const key = target.dataset.field;
        if (!step || (key !== 'narrateBefore' && key !== 'narrateAfter')) return;
        const id = `${step.id}:${key}`;
        const scroller = $('.story-layout .panel-scroll');
        const top = scroller?.scrollTop || 0;
        if (expandedNarration.has(id)) expandedNarration.delete(id);
        else expandedNarration.add(id);
        renderApp();
        const next = $('.story-layout .panel-scroll');
        if (next) next.scrollTop = top;
        if (expandedNarration.has(id)) document.querySelector(`[data-step-field="${key}"]`)?.focus();
    }
    else if (action === 'toggle-hotspot') { const step = activeStep(); step.interaction.enabled = !step.interaction.enabled; persist(true); }
    else if (action === 'hotspot-gesture') {
        const step = activeStep();
        const gesture = HOTSPOT_GESTURES.find(item => item.id === target.dataset.gesture);
        if (!step?.interaction || !gesture || step.interaction.type === gesture.id) return;
        step.interaction.type = gesture.id;
        if (gesture.arrow) step.interaction.direction = rememberedHotspotDirection();
        withStoryScroll(() => persist(true), `[data-action="hotspot-gesture"][data-gesture="${gesture.id}"]`);
    }
    else if (action === 'hotspot-direction') {
        const step = activeStep();
        const direction = HOTSPOT_DIRECTIONS.find(item => item.id === target.dataset.direction);
        if (!step?.interaction || !direction || !hotspotGesture(step.interaction.type).arrow) return;
        step.interaction.direction = rememberHotspotDirection(direction.id);
        withStoryScroll(() => persist(true), `[data-action="hotspot-direction"][data-direction="${direction.id}"]`);
    }
    else if (action === 'preview-story') setView('player');
    else if (action === 'story-panel-layout') {
        const layout = target.dataset.layout === 'files-right' ? 'files-right' : 'files-left';
        if (layout === storyPanelLayout) return;
        storyPanelLayout = layout;
        localStorage.setItem(APP.storyLayoutKey, storyPanelLayout);
        renderApp();
    }
    else if (action === 'download-story-photos') {
        const seen = new Set();
        const screens = activeStory().steps.flatMap(item => {
            if (seen.has(item.screenId)) return [];
            seen.add(item.screenId);
            const screen = screenById(item.screenId);
            return screen ? [screen] : [];
        });
        downloadPhotoArchive(screens, `${slug(activeStory().name)}-photos.zip`, target);
    }
    else if (action === 'player-prev') setPlayerIndex(playerIndex-1, false);
    else if (action === 'player-next' || action === 'hotspot-next') setPlayerIndex(playerIndex+1, isPlaying);
    else if (action === 'player-jump') setPlayerIndex(Number(target.dataset.index), isPlaying);
    else if (action === 'clear-player-story-filter') { playerStoryStageFilter = 'all'; renderApp(); }
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

document.addEventListener('contextmenu', event => {
    const dialog = $('#photoDialog');
    if (!dialog?.open) return;
    if (event.target.closest('.picker-menu, .picker-assoc-drawer')) {
        event.preventDefault();
        return;
    }
    const card = event.target.closest('.photo-pick');
    if (!card || !dialog.contains(card)) return;
    event.preventDefault();
    const screen = screenById(card.dataset.id);
    if (!screen) return;
    pickerAssocId = null;
    pickerMenu = {id:screen.id, x:event.clientX, y:event.clientY};
    renderPickerContext();
});

$('#photoDialog')?.addEventListener('cancel', event => {
    if (!pickerMenu && !pickerAssocId) return;
    event.preventDefault();
    if (pickerAssocId) pickerAssocId = null;
    else pickerMenu = null;
    renderPickerContext();
});

$('#photoDialog')?.addEventListener('close', () => {
    pickerMenu = null;
    pickerAssocId = null;
    $('#photoDialog')?.classList.remove('picker-scroll-locked');
    const host = $('#pickerContextHost');
    if (host) host.innerHTML = '';
});

function blockPickerScroll(event) {
    if (!(pickerMenu || pickerAssocId)) return;
    if (event.target.closest('.picker-assoc-drawer')) return;
    event.preventDefault();
}

document.addEventListener('wheel', blockPickerScroll, {capture: true, passive: false});
document.addEventListener('touchmove', blockPickerScroll, {capture: true, passive: false});

document.addEventListener('scroll', event => {
    if (!$('#photoDialog')?.classList.contains('picker-scroll-locked')) return;
    const body = event.target?.id === 'photoPickerBody' ? event.target : null;
    if (!body || body.scrollTop === pickerScrollTop) return;
    body.scrollTop = pickerScrollTop;
}, true);

function libraryThumbTarget(target) {
    return target?.closest?.('[data-library-thumb]') || null;
}

function openLibraryThumbMenu(thumb, x, y) {
    const screen = screenById(thumb?.dataset.libraryThumb || '');
    if (!screen || currentView !== 'screenshots') return;
    libraryAssocId = null;
    libraryMenu = {id: screen.id, x, y};
    renderLibraryContext();
}

const LIBRARY_THUMB_GESTURE_MS = 400;
let libraryThumbGesture = null;

function libraryThumbWithinGesture(id, x, y, now) {
    const gesture = libraryThumbGesture;
    if (!gesture || gesture.done || gesture.id !== id) return false;
    if (now - gesture.at > LIBRARY_THUMB_GESTURE_MS) return false;
    return Math.hypot(x - gesture.x, y - gesture.y) <= 30;
}

function libraryThumbClickContinues(event) {
    const thumb = libraryThumbTarget(event.target);
    if (!thumb || event.target.closest('button, input, textarea, a, label, .screen-tag, .assoc-anchor')) return false;
    return libraryThumbWithinGesture(thumb.dataset.libraryThumb, event.clientX, event.clientY, performance.now());
}

function checkLibraryThumb(gesture) {
    const box = $(`.library-scroll [data-action="toggle-photo-select"][data-id="${CSS.escape(gesture.id)}"]`);
    const ids = gesture.shiftKey && box ? photoIdsInSelectionRange(box) : [gesture.id];
    applyLibraryPhotoSelection(ids, !gesture.wasChecked, gesture.shiftKey ? '' : gesture.id);
}

function finishLibraryThumbGesture(gesture) {
    gesture.timer = null;
    if (gesture.done || libraryThumbGesture !== gesture || currentView !== 'screenshots') return;
    gesture.done = true;
    if (gesture.sidebarOpen && gesture.count === 2) checkLibraryThumb(gesture);
}

function openLibraryThumbGestureMenu(gesture) {
    openLibraryThumbMenu({dataset: {libraryThumb: gesture.id}}, gesture.x, gesture.y);
    gesture.timer = setTimeout(() => {
        gesture.timer = null;
        if (libraryThumbGesture === gesture) gesture.done = true;
    }, LIBRARY_THUMB_GESTURE_MS);
}

function handleLibraryThumbClick(event) {
    if (currentView !== 'screenshots' || $('#photoDialog')?.open) return false;
    const thumb = libraryThumbTarget(event.target);
    if (!thumb || event.target.closest('button, input, textarea, a, label, .screen-tag, .assoc-anchor, .library-fit-panel')) return false;
    const id = thumb.dataset.libraryThumb;
    if (!id || !screenById(id)) return false;
    const now = performance.now();
    const x = event.clientX;
    const y = event.clientY;
    const previous = libraryThumbGesture;
    const same = libraryThumbWithinGesture(id, x, y, now);
    if (previous?.timer) {
        clearTimeout(previous.timer);
        previous.timer = null;
    }
    if (!same && previous?.sidebarOpen && previous.count === 2 && !previous.done) {
        previous.done = true;
        checkLibraryThumb(previous);
    }
    const gesture = same ? previous : {
        id, x, y, at: now, count: 0,
        shiftKey: false,
        sidebarOpen: Boolean(libraryFitId),
        wasChecked: selectedPhotoIds.has(id),
        done: false,
        timer: null
    };
    gesture.count += 1;
    gesture.x = x;
    gesture.y = y;
    gesture.at = now;
    gesture.shiftKey = event.shiftKey;
    libraryThumbGesture = gesture;
    if (gesture.count > 1) event.preventDefault();
    if (gesture.sidebarOpen) {
        if (gesture.count === 1) {
            if (id !== libraryFitId) openLibraryFit(id);
        } else if (gesture.count === 2) {
            gesture.timer = setTimeout(() => finishLibraryThumbGesture(gesture), LIBRARY_THUMB_GESTURE_MS);
        } else if (gesture.count === 3) openLibraryThumbGestureMenu(gesture);
        return true;
    }
    if (gesture.count === 1) {
        checkLibraryThumb(gesture);
        gesture.timer = setTimeout(() => {
            gesture.timer = null;
            if (libraryThumbGesture === gesture) gesture.done = true;
        }, LIBRARY_THUMB_GESTURE_MS);
    } else if (gesture.count === 2) openLibraryThumbGestureMenu(gesture);
    return true;
}

document.addEventListener('contextmenu', event => {
    if (currentView !== 'screenshots' || $('#photoDialog')?.open) return;
    if (event.target.closest('.library-menu, .library-assoc-drawer')) {
        event.preventDefault();
        return;
    }
    const thumb = libraryThumbTarget(event.target);
    if (!thumb || event.target.closest('input, textarea')) return;
    event.preventDefault();
    openLibraryThumbMenu(thumb, event.clientX, event.clientY);
});

document.addEventListener('scroll', event => {
    if (!(libraryMenu || libraryAssocId)) return;
    if (event.target?.closest?.('.library-assoc-drawer')) return;
    closeLibraryContext();
}, true);

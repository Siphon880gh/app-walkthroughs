function folderSidebar() {
    const project = activeProject();
    const folders = project.folders || [];
    const rows = folders.map(folder => {
        const count = project.screenshots.filter(screen => screen.folder === folder.fullPath).length;
        const active = selectedFolder === folder.fullPath;
        const menuOpen = folderMenuPath === folder.fullPath;
        return `<div class="folder-item ${active ? 'active' : ''}${menuOpen ? ' menu-open' : ''}"><button class="folder-row ${active ? 'active':''}" data-action="select-folder" data-folder="${esc(folder.fullPath)}"><span aria-hidden="true">⌑</span><span>${esc(folder.fullPath)}</span><span class="count">${count}</span></button><div class="folder-menu"><button type="button" class="folder-more ${menuOpen ? 'active' : ''}" data-action="toggle-folder-menu" data-folder="${esc(folder.fullPath)}" aria-haspopup="menu" aria-expanded="${menuOpen ? 'true' : 'false'}" aria-label="Actions for ${esc(folder.fullPath)}" title="Folder actions">⋯</button><div class="sync-menu-panel folder-menu-panel" role="menu" ${menuOpen ? '' : 'hidden'}><button type="button" class="sync-option" role="menuitem" data-action="rename-folder" data-folder="${esc(folder.fullPath)}">Rename…</button><button type="button" class="sync-option danger" role="menuitem" data-action="delete-folder" data-folder="${esc(folder.fullPath)}">Delete…</button></div></div></div>`;
    }).join('');
    return `<aside class="sidebar"><div class="sidebar-head"><div><div class="eyebrow">Project explorer</div><div class="sidebar-title">Folders</div></div><button class="button ghost icon-only" data-action="add-folder" aria-label="Add folder">＋</button></div><div class="sidebar-scroll"><button class="folder-row ${selectedFolder === null ? 'active':''}" data-action="select-folder" data-folder=""><span>▦</span><span>All screens</span><span class="count">${project.screenshots.length}</span></button><div class="tree-label">App / platform</div>${rows || '<p style="color:var(--dim);font-size:10px;padding:8px">No folders yet.</p>'}</div><div class="local-note"><strong><span class="status-dot"></span>Server screenshots</strong>Uploaded images are saved on this server. Project notes stay in this browser.</div></aside>`;
}

function setFolderMenu(fullPath) {
    folderMenuPath = fullPath;
    $$('.folder-menu').forEach(menu => {
        const button = $('.folder-more', menu);
        const open = fullPath !== null && button.dataset.folder === fullPath;
        $('.folder-menu-panel', menu).hidden = !open;
        button.classList.toggle('active', open);
        button.setAttribute('aria-expanded', String(open));
        menu.closest('.folder-item')?.classList.toggle('menu-open', open);
    });
}

function annotatedInScope(project) {
    return project.screenshots.filter(screen => screen.annotated && (!selectedFolder || screen.folder === selectedFolder));
}

function storyReferencesForScreen(project, screenId) {
    return project.stories.flatMap(story => {
        const steps = story.steps.filter(step => step.screenId === screenId);
        return steps.length ? [{story, steps}] : [];
    });
}

function annotatedVersionName(project, name) {
    const extension = String(name).match(/(\.[^.]+)$/)?.[1] || '';
    const stem = extension ? String(name).slice(0, -extension.length) : String(name);
    const base = stem.replace(/ annotated(?: \d+)?$/i, '');
    let candidate = `${base} annotated${extension}`;
    let number = 2;
    const names = new Set(project.screenshots.map(screen => screen.name.toLowerCase()));
    while (names.has(candidate.toLowerCase())) candidate = `${base} annotated ${number++}${extension}`;
    return candidate;
}

function closeAnnotationStoryDialog() {
    pendingAnnotationScreenId = null;
    const dialog = $('#annotationStoryDialog');
    if (dialog?.open) dialog.close();
}

function renderAnnotationStoryChoices(screenId) {
    const project = activeProject();
    const screen = screenById(screenId);
    const body = $('#annotationStoryChoices');
    if (!screen || !body) return;
    const references = storyReferencesForScreen(project, screenId);
    body.innerHTML = references.map(({story, steps}) => `<button type="button" class="annotation-story-choice" data-action="choose-annotation-story" data-story-id="${esc(story.id)}"><span><strong>${esc(story.name)}</strong><small>${steps.length} linked step${steps.length === 1 ? '' : 's'}</small></span><span aria-hidden="true">→</span></button>`).join('');
}

function openAnnotatedVersion(screenId, storyId = '') {
    const project = activeProject();
    const source = screenById(screenId);
    if (!source) return;
    const references = storyReferencesForScreen(project, screenId);
    const selectedReference = storyId ? references.find(item => item.story.id === storyId) : null;
    if (storyId && !selectedReference) return;

    const canEditExisting = source.annotated && (
        !storyId ||
        (references.length === 1 && (!source.annotationStoryId || source.annotationStoryId === storyId))
    );
    let target = source;
    if (!canEditExisting) {
        target = structuredClone(source);
        target.id = uid('screen');
        target.name = annotatedVersionName(project, source.name);
        target.annotated = true;
        target.sourceScreenId = source.sourceScreenId || source.id;
        target.annotationStoryId = storyId || '';
        target.uploadedAt = Date.now();
        target.annotations = structuredClone(source.annotations || []);
        const index = project.screenshots.findIndex(screen => screen.id === source.id);
        project.screenshots.splice(Math.max(index, 0) + 1, 0, target);
        if (selectedReference) {
            selectedReference.steps.forEach(step => {
                step.screenId = target.id;
                step.annotations = [];
            });
            project.activeStoryId = selectedReference.story.id;
        }
    }

    closeAnnotationStoryDialog();
    selectedAnnotationId = null;
    project.activeScreenshotId = target.id;
    showAnnotatedScreens = true;
    persist();
    setView('editor');
    if (target !== source) toast(storyId ? `Created an annotated version for “${selectedReference.story.name}”.` : 'Created an annotated version.');
}

function beginAnnotatingScreen(screenId) {
    const project = activeProject();
    const screen = screenById(screenId);
    if (!screen) return;
    const references = storyReferencesForScreen(project, screenId);
    if (references.length > 1) {
        pendingAnnotationScreenId = screenId;
        renderAnnotationStoryChoices(screenId);
        $('#annotationStoryDialog').showModal();
        return;
    }
    openAnnotatedVersion(screenId, references[0]?.story.id || '');
}

function saveAnnotatedScreen() {
    const screen = activeScreen();
    if (!screen) return;
    screen.annotated = true;
    showAnnotatedScreens = true;
    persist(true);
    toast('Annotated version saved.');
}

function saveAnnotatedScreenAs() {
    const project = activeProject();
    const screen = activeScreen();
    if (!screen) return;
    const name = prompt('Name this annotated screen', screen.name);
    if (name == null) return;
    const copy = structuredClone(screen);
    copy.id = uid('screen');
    copy.name = name.trim() || screen.name;
    copy.annotated = true;
    copy.sourceScreenId = screen.sourceScreenId || screen.id;
    copy.uploadedAt = Date.now();
    const index = project.screenshots.findIndex(item => item.id === screen.id);
    project.screenshots.splice(Math.max(index, 0) + 1, 0, copy);
    showAnnotatedScreens = true;
    persist(true);
    toast('Annotated screen saved in this folder.');
}

function customScreenTags(screen) {
    const reserved = new Set([screen.app, screen.platform].filter(Boolean).map(slug));
    return [...new Set((screen.tags || []).filter(tag => tag && !reserved.has(tag)))];
}

function screenTagMarkup(screen) {
    const tags = customScreenTags(screen);
    if (!tags.length) return '';
    return `<div class="screen-tags" aria-label="Tags">${tags.map(tag => `<button type="button" class="screen-tag" data-action="remove-photo-tag" data-id="${esc(screen.id)}" data-tag="${esc(tag)}" aria-label="Remove tag ${esc(tag)} from ${esc(screen.name)}" title="Remove tag">#${esc(tag)}<span aria-hidden="true">×</span></button>`).join('')}</div>`;
}

function addTagToPhotos(screenIds) {
    const project = activeProject();
    const screens = project.screenshots.filter(screen => screenIds.includes(screen.id));
    if (!screens.length) return;
    pendingTagPhotoIds = screens.map(screen => screen.id);
    const dialog = $('#tagDialog');
    const input = $('#tagInput');
    const error = $('#tagError');
    const description = $('#tagDialogDescription');
    const suggestions = $('#tagSuggestions');
    if (!dialog || !input) return;
    input.value = '';
    if (error) {
        error.hidden = true;
        error.textContent = '';
    }
    if (description) {
        description.textContent = screens.length === 1
            ? `Add a searchable tag to “${screens[0].name}”.`
            : `Apply one searchable tag to ${screens.length} selected photos.`;
    }
    if (suggestions) {
        const tags = projectCustomTags(project);
        suggestions.innerHTML = tags.length
            ? tags.map(tag => `<button type="button" class="tag-suggestion" data-action="choose-photo-tag" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')
            : '<span class="tag-suggestions-empty">Existing tags will appear here.</span>';
    }
    dialog.showModal();
    requestAnimationFrame(() => input.focus());
}

function closePhotoTagDialog() {
    pendingTagPhotoIds = [];
    const dialog = $('#tagDialog');
    if (dialog?.open) dialog.close();
}

function savePhotoTag(input) {
    const project = activeProject();
    const screens = project.screenshots.filter(screen => pendingTagPhotoIds.includes(screen.id));
    const error = $('#tagError');
    if (!screens.length) {
        closePhotoTagDialog();
        return;
    }
    if (!input.trim()) {
        if (error) {
            error.textContent = 'Enter a tag name.';
            error.hidden = false;
        }
        $('#tagInput')?.focus();
        return;
    }
    const tag = slug(input.slice(0, 40));
    let changed = 0;
    screens.forEach(screen => {
        screen.tags = Array.isArray(screen.tags) ? screen.tags : [];
        if (screen.tags.includes(tag)) return;
        screen.tags.push(tag);
        changed++;
    });
    if (!changed) {
        if (error) {
            error.textContent = `The selected photo${screens.length === 1 ? ' already has' : 's already have'} #${tag}.`;
            error.hidden = false;
        }
        $('#tagInput')?.select();
        return;
    }
    closePhotoTagDialog();
    persist(true);
    toast(`Added #${tag} to ${changed} photo${changed === 1 ? '' : 's'}.`);
}

function removeTagFromPhoto(screenId, tag) {
    const screen = screenById(screenId);
    if (!screen || !customScreenTags(screen).includes(tag)) return;
    screen.tags = (screen.tags || []).filter(item => item !== tag);
    persist(true);
    toast(`Removed #${tag} from “${screen.name}”.`);
}

function libraryViewSwitch() {
    const option = (view, label, title) => `<button type="button" class="library-view-option ${libraryView === view ? 'active' : ''}" data-action="set-library-view" data-library-view="${view}" aria-pressed="${libraryView === view ? 'true' : 'false'}" title="${title}">${label}</button>`;
    return `<div class="library-view-switch" role="group" aria-label="Library view">${option('grid', 'Grid', 'Large thumbnail grid')}${option('list', 'List', 'Compact list with small thumbnails')}${option('urls', 'URLs', 'Show image URLs')}</div>`;
}

function renderPhotoList(screens, project) {
    return `<div class="photo-list">${screens.map(screen => {
        const picked = selectedPhotoIds.has(screen.id);
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform)}</span>`;
        return `<div class="photo-row ${project.activeScreenshotId === screen.id ? 'selected' : ''}${picked ? ' picked' : ''}" data-screen-id="${esc(screen.id)}"><label class="photo-row-check" title="Select for bulk actions. Shift-click to select a range."><input class="url-check" type="checkbox" data-action="toggle-photo-select" data-id="${esc(screen.id)}" aria-label="Select ${esc(screen.name)} for bulk actions" ${picked ? 'checked' : ''}></label><img class="photo-thumb${libraryFitId === screen.id ? ' is-library-fit' : ''}" data-library-thumb="${esc(screen.id)}" src="${safeImage(screen.dataUrl)}" alt=""><div class="photo-row-copy"><input class="photo-row-name" data-screen-name="${esc(screen.id)}" value="${esc(screen.name)}" maxlength="120" aria-label="Rename file ${esc(screen.name)}"><div class="photo-row-sub">${kind}<span>${screen.width}×${screen.height}</span></div>${screenTagMarkup(screen)}${screenAssocControl(project, screen, 'list')}</div><div class="photo-row-actions"><button type="button" class="card-action" data-action="tag-photo" data-id="${esc(screen.id)}" aria-label="Tag screen" data-tooltip="Tag">#</button><button type="button" class="card-action" data-action="edit-screen" data-id="${esc(screen.id)}" aria-label="Annotate screen" data-tooltip="Annotate">⌖</button><button type="button" class="card-action" data-action="add-to-story" data-id="${esc(screen.id)}" aria-label="Add to story" data-tooltip="Add to story">＋</button><button type="button" class="card-action" data-action="duplicate-screen" data-id="${esc(screen.id)}" aria-label="Duplicate screen" data-tooltip="Duplicate">⧉</button><button type="button" class="card-action" data-action="delete-screen" data-id="${esc(screen.id)}" aria-label="Delete screen" data-tooltip="Delete">×</button></div></div>`;
    }).join('')}</div>`;
}

function renderUrlList(screens, project) {
    return `<div class="url-list">${screens.map(screen => {
        const url = screenUrl(screen.dataUrl);
        const picked = selectedPhotoIds.has(screen.id);
        return `<div class="url-row ${project.activeScreenshotId === screen.id ? 'selected' : ''}${picked ? ' picked' : ''}"><img class="url-thumb${libraryFitId === screen.id ? ' is-library-fit' : ''}" data-library-thumb="${esc(screen.id)}" src="${safeImage(screen.dataUrl)}" alt=""><div class="url-copy"><input class="url-name" data-screen-name="${esc(screen.id)}" value="${esc(screen.name)}" maxlength="120" aria-label="Rename file ${esc(screen.name)}"><div class="url-value">${url ? esc(url) : 'Stored in this project'}</div>${screenTagMarkup(screen)}${screenAssocControl(project, screen, 'list')}</div><div class="url-actions"><button type="button" class="button small" data-action="tag-photo" data-id="${esc(screen.id)}">Tag</button><button type="button" class="button small" data-action="copy-screen-url" data-url="${esc(url)}" ${url ? '' : 'disabled'}>Copy URL</button><span class="url-actions-sep" aria-hidden="true"></span><input class="url-check" type="checkbox" data-action="toggle-photo-select" data-id="${esc(screen.id)}" aria-label="Select ${esc(screen.name)} for bulk actions" ${picked ? 'checked' : ''}></div></div>`;
    }).join('')}</div>`;
}

function transferMenuItems(project) {
    if (transferMenu === 'mode') return `<button type="button" class="sync-option" role="menuitem" data-action="open-transfer" data-mode="move">Move to…</button><button type="button" class="sync-option" role="menuitem" data-action="open-transfer" data-mode="copy">Copy to…</button>`;
    if (transferMenu !== 'move' && transferMenu !== 'copy') return '';
    const picked = project.screenshots.filter(screen => selectedPhotoIds.has(screen.id));
    const verb = transferMenu === 'move' ? 'Move' : 'Copy';
    const head = `<div class="transfer-menu-head">${verb} ${picked.length} photo${picked.length === 1 ? '' : 's'} to</div>`;
    const folders = project.folders || [];
    if (!folders.length) return `${head}<p class="sync-warning">Add an app / platform folder first.</p>`;
    return head + folders.map(folder => {
        const alreadyThere = transferMenu === 'move' && picked.every(screen => screen.folder === folder.fullPath);
        return `<button type="button" class="sync-option" role="menuitem" data-action="transfer-photos" data-mode="${transferMenu}" data-folder="${esc(folder.fullPath)}" ${alreadyThere ? 'disabled title="The selected photos are already here"' : ''}>${esc(folder.fullPath)}</button>`;
    }).join('');
}

function setTransferMenu(mode) {
    transferMenu = mode;
    const panel = $('#transferMenu');
    if (!panel) return;
    panel.innerHTML = transferMenuItems(activeProject());
    panel.hidden = !mode;
    [['#transferMoveButton', mode === 'move'], ['#transferModeButton', mode === 'mode']].forEach(([selector, open]) => {
        const button = $(selector);
        if (!button) return;
        button.classList.toggle('active', open);
        button.setAttribute('aria-expanded', String(open));
    });
}

function transferPhotos(mode, fullPath) {
    const project = activeProject();
    const folder = project.folders.find(item => item.fullPath === fullPath);
    if (!folder) return;
    const picked = project.screenshots.filter(screen => selectedPhotoIds.has(screen.id));
    const tagsFor = screen => [slug(folder.app), slug(folder.platform), ...(screen.tags || []).filter(tag => tag !== slug(screen.app || '') && tag !== slug(screen.platform || ''))];
    const place = screen => Object.assign(screen, {folder:folder.fullPath, app:folder.app, platform:folder.platform, tags:tagsFor(screen)});
    let count = 0;
    if (mode === 'copy') {
        picked.forEach(screen => {
            const copy = place(structuredClone(screen));
            copy.id = uid('screen');
            copy.uploadedAt = Date.now();
            project.screenshots.push(copy);
            count++;
        });
    } else {
        picked.forEach(screen => {
            if (screen.folder === folder.fullPath) return;
            place(screen);
            count++;
        });
    }
    transferMenu = null;
    selectedPhotoIds.clear();
    persist(true);
    toast(`${mode === 'copy' ? 'Copied' : 'Moved'} ${count} photo${count === 1 ? '' : 's'} to ${folder.fullPath}.`);
}

function storiesContainingScreen(project, screenId) {
    return project.stories.filter(story => story.steps.some(step => step.screenId === screenId));
}

function assocConnectionsMarkup(project, screen) {
    return storyReferencesForScreen(project, screen.id).map(({story, steps}) => {
        const links = steps.map(step => {
            const number = story.steps.findIndex(item => item.id === step.id) + 1;
            const title = String(step.title || '').trim();
            const text = title ? `Step ${number} · ${title}` : `Step ${number}`;
            return `<button type="button" class="assoc-step" data-action="open-assoc-story" data-story-id="${esc(story.id)}" data-step-id="${esc(step.id)}">${esc(text)}</button>`;
        }).join('');
        return `<div class="assoc-story"><div class="assoc-story-head"><span class="assoc-story-name">${esc(story.name)}</span>${storyStageBadge(story)}</div><div class="assoc-steps">${links}</div></div>`;
    }).join('');
}

function screenAssocControl(project, screen, placement) {
    const items = assocConnectionsMarkup(project, screen);
    if (!items) return '';
    const open = assocDrawerId === screen.id;
    const panelClass = placement === 'card' ? 'assoc-drawer' : 'assoc-panel';
    return `<div class="assoc-anchor assoc-${placement}${open ? ' is-open' : ''}"><button type="button" class="assoc-chip" data-action="toggle-assoc" data-id="${esc(screen.id)}" aria-expanded="${open ? 'true' : 'false'}" aria-controls="assoc-${esc(screen.id)}" title="Walkthrough connections">ASSOC</button><div class="${panelClass}" id="assoc-${esc(screen.id)}" role="region" aria-label="Walkthrough connections for ${esc(screen.name)}"><div class="assoc-drawer-title">Connections</div>${items}</div></div>`;
}

function deleteLibraryScreen(screen) {
    if (!screen || !confirm(`Delete “${screen.name}” from the library? Linked walkthrough steps will also be removed.`)) return false;
    const project = activeProject();
    project.screenshots = project.screenshots.filter(item => item.id !== screen.id);
    project.stories.forEach(story => {
        story.steps = story.steps.filter(step => step.screenId !== screen.id);
        if (!story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0]?.id || '';
    });
    if (project.activeScreenshotId === screen.id) project.activeScreenshotId = project.screenshots[0]?.id || '';
    if (libraryFitId === screen.id) libraryFitId = null;
    if (libraryMenu?.id === screen.id) libraryMenu = null;
    if (libraryAssocId === screen.id) libraryAssocId = null;
    selectedPhotoIds.delete(screen.id);
    selectedPickerScreenIds.delete(screen.id);
    forgetAnnotationHistory(screen.id);
    persist(true);
    toast('Removed from the library.');
    return true;
}

function placeAssocDrawer(anchor) {
    const drawer = $('.assoc-drawer', anchor);
    const chip = $('.assoc-chip', anchor);
    if (!drawer || !chip) return;
    drawer.classList.remove('flip');
    const rect = chip.getBoundingClientRect();
    const bounds = $('.library-scroll')?.getBoundingClientRect();
    const limit = (bounds?.right ?? window.innerWidth) - 12;
    if (rect.right + 250 > limit) drawer.classList.add('flip');
}

function bindAssocDrawers() {
    $$('.assoc-card').forEach(anchor => {
        placeAssocDrawer(anchor);
        anchor.addEventListener('mouseenter', () => placeAssocDrawer(anchor));
        anchor.addEventListener('focusin', () => placeAssocDrawer(anchor));
    });
}

function libraryStoryFilterOptions(project) {
    const storyOptions = project.stories.map(story =>
        `<option value="story:${esc(story.id)}" ${libraryStoryFilter === `story:${story.id}` ? 'selected' : ''}>${esc(story.name)}</option>`
    ).join('');
    const stageOptions = STORY_STAGES.map(stage =>
        `<option value="stage:${esc(stage)}" ${libraryStoryFilter === `stage:${stage}` ? 'selected' : ''}>${esc(stage)}</option>`
    ).join('');
    return `<option value="all" ${libraryStoryFilter === 'all' ? 'selected' : ''}>All</option><option value="assigned" ${libraryStoryFilter === 'assigned' ? 'selected' : ''}>Any story or collection</option>${storyOptions ? `<optgroup label="Stories and collections">${storyOptions}</optgroup>` : ''}<optgroup label="Stages">${stageOptions}</optgroup><option value="unassigned" ${libraryStoryFilter === 'unassigned' ? 'selected' : ''}>Not in stories or collections</option>`;
}

function screenMatchesLibraryStoryFilter(project, screen) {
    if (libraryStoryFilter === 'all') return true;
    const stories = storiesContainingScreen(project, screen.id);
    if (libraryStoryFilter === 'assigned') return stories.length > 0;
    if (libraryStoryFilter === 'unassigned') return stories.length === 0;
    if (libraryStoryFilter.startsWith('story:')) {
        const storyId = libraryStoryFilter.slice(6);
        return stories.some(story => story.id === storyId);
    }
    if (libraryStoryFilter.startsWith('stage:')) {
        const stage = libraryStoryFilter.slice(6);
        return stories.some(story => normalizeStoryStage(story.stage) === stage);
    }
    return true;
}

function projectCustomTags(project) {
    return [...new Set(project.screenshots.flatMap(customScreenTags))].sort((a, b) => a.localeCompare(b));
}

function libraryTagFilterOptions(tags) {
    const options = tags.map(tag => `<option value="tag:${esc(tag)}" ${libraryTagFilter === `tag:${tag}` ? 'selected' : ''}>#${esc(tag)}</option>`).join('');
    return `<option value="all" ${libraryTagFilter === 'all' ? 'selected' : ''}>All tags</option>${options}<option value="untagged" ${libraryTagFilter === 'untagged' ? 'selected' : ''}>Untagged</option>`;
}

function screenMatchesLibraryTagFilter(screen) {
    const tags = customScreenTags(screen);
    if (libraryTagFilter === 'all') return true;
    if (libraryTagFilter === 'untagged') return tags.length === 0;
    return libraryTagFilter.startsWith('tag:') && tags.includes(libraryTagFilter.slice(4));
}

function screenFitStyle(screen) {
    const width = Math.max(Number(screen?.width) || 1, 1);
    const height = Math.max(Number(screen?.height) || 1, 1);
    return `--screen-w:${width};--screen-h:${height}`;
}

function libraryFitMarkup() {
    const screen = libraryFitId ? screenById(libraryFitId) : null;
    if (!screen) return '';
    const notes = screen.annotations?.length ? `<div class="annotation-layer">${annotationMarkup(screen.annotations)}</div>` : '';
    return `<aside class="library-fit-panel" id="libraryFitPanel" aria-label="Fitted thumbnail"><header class="library-fit-head"><div class="library-fit-copy"><div class="eyebrow">Fitted view</div><strong class="library-fit-title">${esc(screen.name)}</strong></div><button type="button" class="button ghost icon-only" data-action="close-library-fit" aria-label="Close fitted view">×</button></header><div class="library-fit-stage"><div class="library-fit-frame" style="${screenFitStyle(screen)}"><img class="library-fit-image" src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)}">${notes}</div></div></aside>`;
}

function paintLibraryFit(screen) {
    const panel = $('#libraryFitPanel');
    const frame = panel ? $('.library-fit-frame', panel) : null;
    if (!panel || !frame || !screen) return false;
    const title = $('.library-fit-title', panel);
    if (title) title.textContent = screen.name;
    const notes = screen.annotations?.length ? `<div class="annotation-layer">${annotationMarkup(screen.annotations)}</div>` : '';
    frame.setAttribute('style', screenFitStyle(screen));
    frame.innerHTML = `<img class="library-fit-image" src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)}">${notes}`;
    $$('[data-library-thumb].is-library-fit').forEach(node => node.classList.remove('is-library-fit'));
    $$(`[data-library-thumb="${CSS.escape(screen.id)}"]`).forEach(node => node.classList.add('is-library-fit'));
    return true;
}

function openLibraryFit(screenId) {
    const screen = screenById(screenId);
    if (!screen) return;
    libraryFitId = screen.id;
    if (!paintLibraryFit(screen)) refreshLibraryView();
}

function closeLibraryFit() {
    if (!libraryFitId) return;
    libraryFitId = null;
    refreshLibraryView();
}

function closeLibraryContext() {
    libraryMenu = null;
    libraryAssocId = null;
    renderLibraryContext();
}

function renderLibraryContext() {
    const host = $('#libraryContextHost');
    if (!host) return;
    $$('[data-library-thumb].is-context').forEach(node => node.classList.remove('is-context'));
    const screenId = libraryAssocId || libraryMenu?.id || '';
    const screen = screenId && currentView === 'screenshots' ? screenById(screenId) : null;
    if (!screen) {
        libraryMenu = null;
        libraryAssocId = null;
        host.innerHTML = '';
        return;
    }
    $$(`[data-library-thumb="${CSS.escape(screen.id)}"]`).forEach(node => node.classList.add('is-context'));
    const connections = assocConnectionsMarkup(activeProject(), screen);
    const menu = libraryMenu ? `<div class="library-menu sync-menu-panel" role="menu" style="left:${libraryMenu.x}px;top:${libraryMenu.y}px"><button type="button" class="sync-option" role="menuitem" data-action="library-open-photo" data-id="${esc(screen.id)}">Open zoomed in new tab</button>${connections ? `<button type="button" class="sync-option" role="menuitem" data-action="library-show-assoc" data-id="${esc(screen.id)}">Associations</button>` : ''}<button type="button" class="sync-option" role="menuitem" data-action="library-fit-photo" data-id="${esc(screen.id)}">View fitted at side panel</button><button type="button" class="sync-option danger" role="menuitem" data-action="library-delete-photo" data-id="${esc(screen.id)}">Delete from library</button></div>` : '';
    const drawer = libraryAssocId && connections ? `<div class="library-assoc-drawer" role="region" aria-label="Walkthrough connections for ${esc(screen.name)}"><div class="assoc-drawer-title">Connections</div>${connections}</div>` : '';
    host.innerHTML = menu + drawer;
    const menuNode = $('.library-menu', host);
    if (menuNode && libraryMenu) placePickerLayer(menuNode, libraryMenu.x, libraryMenu.y);
    const drawerNode = $('.library-assoc-drawer', host);
    if (drawerNode) {
        const card = $(`[data-library-thumb="${CSS.escape(screen.id)}"]`);
        const cardRect = card?.getBoundingClientRect();
        const width = drawerNode.offsetWidth || 248;
        const openLeft = cardRect && cardRect.right + width + 16 > window.innerWidth;
        const x = cardRect ? (openLeft ? cardRect.left - width - 8 : cardRect.right + 8) : (libraryMenu?.x || 24);
        const y = cardRect ? cardRect.top : (libraryMenu?.y || 24);
        placePickerLayer(drawerNode, x, y);
    }
    if (menuNode && !drawerNode) $('.sync-option', menuNode)?.focus();
    else $('.assoc-step', drawerNode)?.focus();
}

function renderLibrary() {
    const project = activeProject();
    if (libraryFitId && !screenById(libraryFitId)) libraryFitId = null;
    if (!selectedFolder) libraryStoryFilter = 'all';
    else if (libraryStoryFilter.startsWith('story:') && !project.stories.some(story => story.id === libraryStoryFilter.slice(6))) libraryStoryFilter = 'all';
    else if (libraryStoryFilter.startsWith('stage:') && !STORY_STAGES.includes(libraryStoryFilter.slice(6))) libraryStoryFilter = 'all';
    const availableTags = projectCustomTags(project);
    if (libraryTagFilter.startsWith('tag:') && !availableTags.includes(libraryTagFilter.slice(4))) libraryTagFilter = 'all';
    const annotatedCount = annotatedInScope(project).length;
    const screens = project.screenshots.filter(screen => (showAnnotatedScreens || !screen.annotated) && (!selectedFolder || screen.folder === selectedFolder) && screenMatchesLibraryStoryFilter(project, screen) && screenMatchesLibraryTagFilter(screen) && (!searchTerm || `${screen.name} ${screen.folder} ${(screen.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())));
    const selectedPhotos = screens.filter(screen => selectedPhotoIds.has(screen.id));
    const selectedUrls = selectedPhotos.filter(screen => screenUrl(screen.dataUrl));
    const allPicked = screens.length > 0 && selectedPhotos.length === screens.length;
    const selectAll = screens.length ? `<label class="select-all"><input class="url-check" type="checkbox" data-action="select-all-photos" data-ids="${esc(screens.map(screen => screen.id).join(' '))}" ${allPicked ? 'checked' : ''}>Select all</label>` : '';
    const copySelected = libraryView === 'urls' && selectedUrls.length ? `<button type="button" class="button ghost small" data-action="copy-selected-urls">Copy URLs <span class="count-pill">${selectedUrls.length}</span></button>` : '';
    const downloadSelected = selectedPhotos.length ? `<button type="button" class="button ghost small photo-download" data-action="download-library-photos" title="Download selected photos as a ZIP file">↓ ZIP <span class="count-pill">${selectedPhotos.length}</span></button>` : '';
    const tagSelected = selectedPhotos.length ? `<button type="button" class="button ghost small" data-action="tag-selected-photos" data-ids="${esc(selectedPhotos.map(screen => screen.id).join(' '))}" title="Add the same tag to selected photos"># Tag <span class="count-pill">${selectedPhotos.length}</span></button>` : '';
    const transferSelected = selectedPhotos.length ? `<div class="transfer-menu"><button type="button" class="button ghost small transfer-main ${transferMenu === 'move' ? 'active' : ''}" id="transferMoveButton" data-action="open-transfer" data-mode="move" aria-haspopup="menu" aria-expanded="${transferMenu === 'move' ? 'true' : 'false'}" aria-controls="transferMenu" title="Move selected photos to another app / platform">Move to</button><button type="button" class="button ghost small transfer-toggle ${transferMenu === 'mode' ? 'active' : ''}" id="transferModeButton" data-action="open-transfer" data-mode="mode" aria-haspopup="menu" aria-expanded="${transferMenu === 'mode' ? 'true' : 'false'}" aria-controls="transferMenu" aria-label="Choose Move to or Copy to"><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="sync-menu-panel transfer-menu-panel" id="transferMenu" role="menu" ${transferMenu ? '' : 'hidden'}>${transferMenuItems(project)}</div></div>` : '';
    const deleteSelected = selectedPhotos.length ? `<button type="button" class="button ghost small photo-delete" data-action="delete-library-photos" title="Delete selected photos and their walkthrough steps">Delete <span class="count-pill">${selectedPhotos.length}</span></button>` : '';
    const bulkTools = `${tagSelected}${downloadSelected}${transferSelected}${deleteSelected}${copySelected}${selectAll}`;
    const cardItems = screens.map(screen => {
        const notes = screen.annotations?.length ? `<div class="annotation-layer">${annotationMarkup(screen.annotations)}</div>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform)}</span>`;
        const picked = selectedPhotoIds.has(screen.id);
        const fitting = libraryFitId === screen.id ? ' is-library-fit' : '';
        return `<article class="screen-card ${project.activeScreenshotId === screen.id ? 'selected':''}${screen.annotated ? ' is-annotated' : ''}${picked ? ' picked' : ''}" data-screen-id="${esc(screen.id)}"><label class="screen-select" title="Select for bulk actions"><input class="url-check" type="checkbox" data-action="toggle-photo-select" data-id="${esc(screen.id)}" aria-label="Select ${esc(screen.name)} for bulk actions" ${picked ? 'checked' : ''}><span aria-hidden="true">${picked ? '✓' : ''}</span></label><div class="screen-preview${fitting}" data-library-thumb="${esc(screen.id)}"><div class="screen-preview-frame"><div class="screen-preview-fit" style="${screenFitStyle(screen)}"><img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)} preview">${notes}</div></div>${screenAssocControl(project, screen, 'card')}</div><div class="card-actions"><button class="card-action" data-action="tag-photo" data-id="${esc(screen.id)}" aria-label="Tag screen" data-tooltip="Tag">#</button><button class="card-action" data-action="edit-screen" data-id="${esc(screen.id)}" aria-label="Annotate screen" data-tooltip="Annotate">⌖</button><button class="card-action" data-action="add-to-story" data-id="${esc(screen.id)}" aria-label="Add to story" data-tooltip="Add to story">＋</button><button class="card-action" data-action="duplicate-screen" data-id="${esc(screen.id)}" aria-label="Duplicate screen" data-tooltip="Duplicate">⧉</button><button class="card-action" data-action="delete-screen" data-id="${esc(screen.id)}" aria-label="Delete screen" data-tooltip="Delete">×</button></div><div class="screen-card-meta"><input class="screen-card-title" data-screen-name="${esc(screen.id)}" value="${esc(screen.name)}" maxlength="120" aria-label="Rename file ${esc(screen.name)}"><div class="screen-card-sub">${kind}<span>${screen.width}×${screen.height}</span></div>${screenTagMarkup(screen)}</div></article>`;
    });
    const cardById = new Map(screens.map((screen, index) => [screen.id, cardItems[index]]));
    const renderScreenSet = items => libraryView === 'urls'
        ? renderUrlList(items, project)
        : libraryView === 'list'
            ? renderPhotoList(items, project)
            : `<div class="screen-grid">${items.map(screen => cardById.get(screen.id) || '').join('')}</div>`;
    let libraryContent = renderScreenSet(screens);
    if (libraryPhotoGroup === 'tag') {
        const groups = new Map();
        screens.forEach(screen => {
            const tags = libraryTagFilter.startsWith('tag:')
                ? [libraryTagFilter.slice(4)]
                : customScreenTags(screen);
            (tags.length ? tags : ['']).forEach(tag => {
                if (!groups.has(tag)) groups.set(tag, []);
                groups.get(tag).push(screen);
            });
        });
        const orderedGroups = [...groups].sort(([a], [b]) => {
            if (!a) return 1;
            if (!b) return -1;
            return a.localeCompare(b);
        });
        libraryContent = orderedGroups.map(([tag, items]) =>
            `<section class="library-date-group"><h2>${tag ? `#${esc(tag)}` : 'Untagged'} <span>${items.length}</span></h2>${renderScreenSet(items)}</section>`
        ).join('');
    } else if (libraryPhotoGroup !== 'none') {
        const groups = new Map();
        [...screens].sort((a, b) => photoTimestamp(b) - photoTimestamp(a)).forEach(screen => {
            const parts = photoDateParts(screen);
            const key = libraryPhotoGroup === 'hour' ? parts.hourKey : parts.dateKey;
            if (!groups.has(key)) groups.set(key, {parts,screens:[]});
            groups.get(key).screens.push(screen);
        });
        libraryContent = [...groups.values()].map(group => {
            const heading = libraryPhotoGroup === 'hour' ? `${group.parts.dateLabel} · ${group.parts.hourLabel}` : group.parts.dateLabel;
            return `<section class="library-date-group"><h2>${esc(heading)} <span>${group.screens.length}</span></h2>${renderScreenSet(group.screens)}</section>`;
        }).join('');
    }
    const relationshipFilter = selectedFolder ? `<label class="library-story-filter"><span>SHOW</span><select class="select" data-action="filter-library-stories" aria-label="Filter folder by story or collection">${libraryStoryFilterOptions(project)}</select></label>` : '';
    const tagFilter = `<label class="library-story-filter"><span>TAG</span><select class="select" data-action="filter-library-tags" aria-label="Filter library photos by tag">${libraryTagFilterOptions(availableTags)}</select></label>`;
    const groupingControl = `<label class="library-story-filter"><span>GROUP</span><select class="select" data-action="group-library-photos" aria-label="Group library photos"><option value="none" ${libraryPhotoGroup === 'none' ? 'selected' : ''}>No groups</option><option value="date" ${libraryPhotoGroup === 'date' ? 'selected' : ''}>Date</option><option value="hour" ${libraryPhotoGroup === 'hour' ? 'selected' : ''}>Date and hour</option><option value="tag" ${libraryPhotoGroup === 'tag' ? 'selected' : ''}>Tag</option></select></label>`;
    return `<div class="workspace-grid${libraryFitId ? ' has-library-fit' : ''}">${folderSidebar()}<section class="main-pane"><header class="view-head library-head"><div><h1 class="view-title">Screenshot library</h1><p class="view-subtitle">Ingest, organize, and prepare product states for walkthroughs.</p></div><div class="view-actions"><input class="search" id="screenSearch" value="${esc(searchTerm)}" placeholder="Search screens or tags">${libraryViewSwitch()}${libraryView === 'urls' ? '<button class="button" data-action="paste-url" title="Paste an image URL from the clipboard">Paste</button>' : ''}<button class="button ${showAnnotatedScreens ? 'active' : ''}" data-action="toggle-annotated" aria-pressed="${showAnnotatedScreens ? 'true' : 'false'}" title="Show or hide annotated screens">Annotated <span class="count-pill">${annotatedCount}</span></button><div class="split-button upload-menu"><button class="button primary split-main" data-action="upload"><span>↑</span> Upload screens</button><span class="split-separator" aria-hidden="true"></span><button type="button" class="button primary split-toggle ${uploadMenuOpen ? 'active' : ''}" id="uploadMenuButton" data-action="toggle-upload-menu" aria-haspopup="menu" aria-expanded="${uploadMenuOpen ? 'true' : 'false'}" aria-controls="uploadMenu" aria-label="More upload options"><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="sync-menu-panel upload-menu-panel" id="uploadMenu" role="menu" ${uploadMenuOpen ? '' : 'hidden'}><label class="upload-date-option"><input type="checkbox" data-action="use-photo-metadata-dates" ${usePhotoMetadataDates ? 'checked' : ''}><span><strong>Use photo date</strong><small>EXIF created → file modified → upload time</small></span></label><button type="button" class="sync-option" role="menuitem" data-action="enter-url">Enter URL</button></div></div></div></header><div class="library-scroll"><div class="library-meta"><span>${screens.length} OF ${project.screenshots.length} SCREENS</span><span class="library-meta-side">${relationshipFilter}${tagFilter}${groupingControl}${bulkTools}<span>${esc(selectedFolder || 'ALL FOLDERS')}</span></span></div><div class="drop-strip" id="dropZone"><span aria-hidden="true">⇣</span><span>Drop screenshots here, or paste an image or URL</span><span class="kbd">⌘ V</span></div>${screens.length ? libraryContent : renderEmpty('No screens in this view','Upload an image, paste from the clipboard, or clear the current filter.','upload','Upload screens')}</div></section>${libraryFitMarkup()}</div>`;
}

function renderEmpty(title, copy, action, label) {
    return `<div class="empty"><div><div class="empty-mark">⌁</div><h2>${esc(title)}</h2><p>${esc(copy)}</p><button class="button primary" data-action="${esc(action)}">${esc(label)}</button></div></div>`;
}

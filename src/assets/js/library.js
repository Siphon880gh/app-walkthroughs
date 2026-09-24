function folderSidebar() {
    const project = activeProject();
    const folders = project.folders || [];
    const rows = folders.map(folder => {
        const count = project.screenshots.filter(screen => screen.folder === folder.fullPath).length;
        const active = selectedFolder === folder.fullPath;
        return `<div class="folder-item ${active ? 'active' : ''}"><button class="folder-row ${active ? 'active':''}" data-action="select-folder" data-folder="${esc(folder.fullPath)}"><span aria-hidden="true">⌑</span><span>${esc(folder.fullPath)}</span><span class="count">${count}</span></button><button type="button" class="folder-delete" data-action="delete-folder" data-folder="${esc(folder.fullPath)}" aria-label="Delete ${esc(folder.fullPath)}">×</button></div>`;
    }).join('');
    return `<aside class="sidebar"><div class="sidebar-head"><div><div class="eyebrow">Project explorer</div><div class="sidebar-title">Folders</div></div><button class="button ghost icon-only" data-action="add-folder" aria-label="Add folder">＋</button></div><div class="sidebar-scroll"><button class="folder-row ${selectedFolder === null ? 'active':''}" data-action="select-folder" data-folder=""><span>▦</span><span>All screens</span><span class="count">${project.screenshots.length}</span></button><div class="tree-label">App / platform</div>${rows || '<p style="color:var(--dim);font-size:10px;padding:8px">No folders yet.</p>'}</div><div class="local-note"><strong><span class="status-dot"></span>Server screenshots</strong>Uploaded images are saved on this server. Project notes stay in this browser.</div></aside>`;
}

function annotatedInScope(project) {
    return project.screenshots.filter(screen => screen.annotated && (!selectedFolder || screen.folder === selectedFolder));
}

function saveAnnotatedScreen() {
    const screen = activeScreen();
    if (!screen) return;
    screen.annotated = true;
    showAnnotatedScreens = true;
    persist(true);
    toast('Snapshot saved. This screen is marked Annotated.');
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

function renderUrlList(screens, project) {
    return `<div class="url-list">${screens.map(screen => {
        const url = screenUrl(screen.dataUrl);
        const picked = selectedPhotoIds.has(screen.id);
        return `<div class="url-row ${project.activeScreenshotId === screen.id ? 'selected' : ''}${picked ? ' picked' : ''}"><img class="url-thumb" src="${safeImage(screen.dataUrl)}" alt=""><div class="url-copy"><input class="url-name" data-screen-name="${esc(screen.id)}" value="${esc(screen.name)}" maxlength="120" aria-label="Rename file ${esc(screen.name)}"><div class="url-value">${url ? esc(url) : 'Stored in this project'}</div></div><div class="url-actions"><button type="button" class="button small" data-action="copy-screen-url" data-url="${esc(url)}" ${url ? '' : 'disabled'}>Copy URL</button><span class="url-actions-sep" aria-hidden="true"></span><input class="url-check" type="checkbox" data-action="toggle-photo-select" data-id="${esc(screen.id)}" aria-label="Select ${esc(screen.name)} for bulk actions" ${picked ? 'checked' : ''}></div></div>`;
    }).join('')}</div>`;
}

function renderLibrary() {
    const project = activeProject();
    const annotatedCount = annotatedInScope(project).length;
    const screens = project.screenshots.filter(screen => (showAnnotatedScreens || !screen.annotated) && (!selectedFolder || screen.folder === selectedFolder) && (!searchTerm || `${screen.name} ${screen.folder} ${(screen.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())));
    const selectedPhotos = screens.filter(screen => selectedPhotoIds.has(screen.id));
    const selectedUrls = selectedPhotos.filter(screen => screenUrl(screen.dataUrl));
    const allPicked = screens.length > 0 && selectedPhotos.length === screens.length;
    const selectAll = screens.length ? `<label class="select-all"><input class="url-check" type="checkbox" data-action="select-all-photos" data-ids="${esc(screens.map(screen => screen.id).join(' '))}" ${allPicked ? 'checked' : ''}>Select all</label>` : '';
    const copySelected = libraryListMode && selectedUrls.length ? `<button type="button" class="button ghost small" data-action="copy-selected-urls">Copy URLs <span class="count-pill">${selectedUrls.length}</span></button>` : '';
    const downloadSelected = selectedPhotos.length ? `<button type="button" class="button ghost small photo-download" data-action="download-library-photos" title="Download selected photos as a ZIP file">↓ ZIP <span class="count-pill">${selectedPhotos.length}</span></button>` : '';
    const bulkTools = `${downloadSelected}${copySelected}${selectAll}`;
    const cards = screens.map(screen => {
        const notes = screen.annotations?.length ? `<div class="annotation-layer">${annotationMarkup(screen.annotations)}</div>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform)}</span>`;
        const picked = selectedPhotoIds.has(screen.id);
        return `<article class="screen-card ${project.activeScreenshotId === screen.id ? 'selected':''}${screen.annotated ? ' is-annotated' : ''}${picked ? ' picked' : ''}" data-screen-id="${esc(screen.id)}"><label class="screen-select" title="Select for bulk actions"><input class="url-check" type="checkbox" data-action="toggle-photo-select" data-id="${esc(screen.id)}" aria-label="Select ${esc(screen.name)} for bulk actions" ${picked ? 'checked' : ''}><span aria-hidden="true">${picked ? '✓' : ''}</span></label><div class="screen-preview"><div class="screen-preview-frame"><img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)} preview">${notes}</div></div><div class="card-actions"><button class="card-action" data-action="edit-screen" data-id="${esc(screen.id)}" aria-label="Annotate screen">⌖</button><button class="card-action" data-action="add-to-story" data-id="${esc(screen.id)}" aria-label="Add to story">＋</button><button class="card-action" data-action="duplicate-screen" data-id="${esc(screen.id)}" aria-label="Duplicate screen">⧉</button><button class="card-action" data-action="delete-screen" data-id="${esc(screen.id)}" aria-label="Delete screen">×</button></div><div class="screen-card-meta"><input class="screen-card-title" data-screen-name="${esc(screen.id)}" value="${esc(screen.name)}" maxlength="120" aria-label="Rename file ${esc(screen.name)}"><div class="screen-card-sub">${kind}<span>${screen.width}×${screen.height}</span></div></div></article>`;
    }).join('');
    return `<div class="workspace-grid">${folderSidebar()}<section class="main-pane"><header class="view-head"><div><h1 class="view-title">Screenshot library</h1><p class="view-subtitle">Ingest, organize, and prepare product states for walkthroughs.</p></div><div class="view-actions"><input class="search" id="screenSearch" value="${esc(searchTerm)}" placeholder="Search screens or tags"><button class="button ${libraryListMode ? 'active' : ''}" data-action="toggle-url-list" aria-pressed="${libraryListMode ? 'true' : 'false'}" title="Switch between thumbnails and image URLs">URLs</button>${libraryListMode ? '<button class="button" data-action="paste-url" title="Paste an image URL from the clipboard">Paste</button>' : ''}<button class="button ${showAnnotatedScreens ? 'active' : ''}" data-action="toggle-annotated" aria-pressed="${showAnnotatedScreens ? 'true' : 'false'}" title="Show or hide annotated screens">Annotated <span class="count-pill">${annotatedCount}</span></button><div class="split-button upload-menu"><button class="button primary split-main" data-action="upload"><span>↑</span> Upload screens</button><span class="split-separator" aria-hidden="true"></span><button type="button" class="button primary split-toggle ${uploadMenuOpen ? 'active' : ''}" id="uploadMenuButton" data-action="toggle-upload-menu" aria-haspopup="menu" aria-expanded="${uploadMenuOpen ? 'true' : 'false'}" aria-controls="uploadMenu" aria-label="More upload options"><svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="sync-menu-panel upload-menu-panel" id="uploadMenu" role="menu" ${uploadMenuOpen ? '' : 'hidden'}><button type="button" class="sync-option" role="menuitem" data-action="enter-url">Enter URL</button></div></div></div></header><div class="library-scroll"><div class="library-meta"><span>${screens.length} OF ${project.screenshots.length} SCREENS</span><span class="library-meta-side">${bulkTools}<span>${esc(selectedFolder || 'ALL FOLDERS')}</span></span></div><div class="drop-strip" id="dropZone"><span aria-hidden="true">⇣</span><span>Drop screenshots here, or paste an image or URL</span><span class="kbd">⌘ V</span></div>${screens.length ? (libraryListMode ? renderUrlList(screens, project) : `<div class="screen-grid">${cards}</div>`) : renderEmpty('No screens in this view','Upload an image, paste from the clipboard, or clear the current filter.','upload','Upload screens')}</div></section></div>`;
}

function renderEmpty(title, copy, action, label) {
    return `<div class="empty"><div><div class="empty-mark">⌁</div><h2>${esc(title)}</h2><p>${esc(copy)}</p><button class="button primary" data-action="${esc(action)}">${esc(label)}</button></div></div>`;
}

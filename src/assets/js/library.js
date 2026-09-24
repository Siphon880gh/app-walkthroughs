function folderSidebar() {
    const project = activeProject();
    const folders = project.folders || [];
    const rows = folders.map(folder => {
        const count = project.screenshots.filter(screen => screen.folder === folder.fullPath).length;
        return `<button class="folder-row ${selectedFolder === folder.fullPath ? 'active':''}" data-action="select-folder" data-folder="${esc(folder.fullPath)}"><span aria-hidden="true">⌑</span><span>${esc(folder.fullPath)}</span><span class="count">${count}</span></button>`;
    }).join('');
    return `<aside class="sidebar"><div class="sidebar-head"><div><div class="eyebrow">Project explorer</div><div class="sidebar-title">Folders</div></div><button class="button ghost icon-only" data-action="add-folder" aria-label="Add folder">＋</button></div><div class="sidebar-scroll"><button class="folder-row ${selectedFolder === null ? 'active':''}" data-action="select-folder" data-folder=""><span>▦</span><span>All screens</span><span class="count">${project.screenshots.length}</span></button><div class="tree-label">App / platform</div>${rows || '<p style="color:var(--dim);font-size:10px;padding:8px">No folders yet.</p>'}</div><div class="local-note"><strong><span class="status-dot"></span>Local workspace</strong>Images and project data stay in this browser.</div></aside>`;
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

function renderLibrary() {
    const project = activeProject();
    const annotatedCount = annotatedInScope(project).length;
    const screens = project.screenshots.filter(screen => (showAnnotatedScreens || !screen.annotated) && (!selectedFolder || screen.folder === selectedFolder) && (!searchTerm || `${screen.name} ${screen.folder} ${(screen.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())));
    const cards = screens.map(screen => {
        const notes = screen.annotations?.length ? `<div class="annotation-layer">${annotationMarkup(screen.annotations)}</div>` : '';
        const kind = screen.annotated ? '<span class="tag">Annotated</span>' : `<span class="tag">${esc(screen.platform)}</span>`;
        return `<article class="screen-card ${project.activeScreenshotId === screen.id ? 'selected':''}${screen.annotated ? ' is-annotated' : ''}" data-screen-id="${esc(screen.id)}"><div class="screen-preview"><div class="screen-preview-frame"><img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)} preview">${notes}</div></div><div class="card-actions"><button class="card-action" data-action="edit-screen" data-id="${esc(screen.id)}" aria-label="Annotate screen">⌖</button><button class="card-action" data-action="add-to-story" data-id="${esc(screen.id)}" aria-label="Add to story">＋</button><button class="card-action" data-action="duplicate-screen" data-id="${esc(screen.id)}" aria-label="Duplicate screen">⧉</button><button class="card-action" data-action="delete-screen" data-id="${esc(screen.id)}" aria-label="Delete screen">×</button></div><div class="screen-card-meta"><div class="screen-card-title">${esc(screen.name)}</div><div class="screen-card-sub">${kind}<span>${screen.width}×${screen.height}</span></div></div></article>`;
    }).join('');
    return `<div class="workspace-grid">${folderSidebar()}<section class="main-pane"><header class="view-head"><div><h1 class="view-title">Screenshot library</h1><p class="view-subtitle">Ingest, organize, and prepare product states for walkthroughs.</p></div><div class="view-actions"><input class="search" id="screenSearch" value="${esc(searchTerm)}" placeholder="Search screens or tags"><button class="button ${showAnnotatedScreens ? 'active' : ''}" data-action="toggle-annotated" aria-pressed="${showAnnotatedScreens ? 'true' : 'false'}" title="Show or hide annotated screens">Annotated <span class="count-pill">${annotatedCount}</span></button><button class="button primary" data-action="upload"><span>↑</span> Upload screens</button></div></header><div class="library-scroll"><div class="library-meta"><span>${screens.length} OF ${project.screenshots.length} SCREENS</span><span>${esc(selectedFolder || 'ALL FOLDERS')}</span></div><div class="drop-strip" id="dropZone"><span aria-hidden="true">⇣</span><span>Drop screenshots here or paste from clipboard</span><span class="kbd">⌘ V</span></div>${cards ? `<div class="screen-grid">${cards}</div>` : renderEmpty('No screens in this view','Upload an image, paste from the clipboard, or clear the current filter.','upload','Upload screens')}</div></section></div>`;
}

function renderEmpty(title, copy, action, label) {
    return `<div class="empty"><div><div class="empty-mark">⌁</div><h2>${esc(title)}</h2><p>${esc(copy)}</p><button class="button primary" data-action="${esc(action)}">${esc(label)}</button></div></div>`;
}


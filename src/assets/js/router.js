const VIEW_SLUG = {
    screenshots: 'library',
    editor: 'annotate',
    stories: 'stories',
    player: 'player',
    export: 'export',
};

function viewFromHash() {
    const slug = location.hash.replace(/^#/, '');
    if (!slug || slug.includes('=')) return '';
    return Object.keys(VIEW_SLUG).find(key => VIEW_SLUG[key] === slug) || '';
}

function viewUrl(view) {
    return `${location.pathname}${location.search}#${VIEW_SLUG[view] || 'library'}`;
}

function rememberViewUrl(replace) {
    const next = viewUrl(currentView);
    const here = `${location.pathname}${location.search}${location.hash}`;
    if (here === next) {
        if (history.state?.view !== currentView) history.replaceState({view: currentView}, '', next);
        return;
    }
    history[replace ? 'replaceState' : 'pushState']({view: currentView}, '', next);
}

window.addEventListener('popstate', () => {
    setView(viewFromHash() || 'screenshots', 'none');
});

function renderApp() {
    const project = activeProject();
    if (!project) return;
    $('#projectSelect').innerHTML = projects.map(p => `<option value="${esc(p.id)}" ${p.id === activeProjectId ? 'selected':''}>${esc(p.name)}</option>`).join('');
    $$('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
    const workspace = $('#workspace');
    workspace.innerHTML = currentView === 'screenshots' ? renderLibrary() : currentView === 'editor' ? renderEditor() : currentView === 'stories' ? renderStories() : currentView === 'player' ? renderPlayer() : renderExport();
    bindDynamicUI();
}


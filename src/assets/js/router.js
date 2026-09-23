function renderApp() {
    const project = activeProject();
    if (!project) return;
    $('#projectSelect').innerHTML = projects.map(p => `<option value="${esc(p.id)}" ${p.id === activeProjectId ? 'selected':''}>${esc(p.name)}</option>`).join('');
    $$('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
    const workspace = $('#workspace');
    workspace.innerHTML = currentView === 'screenshots' ? renderLibrary() : currentView === 'editor' ? renderEditor() : currentView === 'stories' ? renderStories() : currentView === 'player' ? renderPlayer() : renderExport();
    bindDynamicUI();
}


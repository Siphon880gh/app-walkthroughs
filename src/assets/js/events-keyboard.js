document.addEventListener('keydown', event => {
    if (event.target?.dataset?.screenName && (event.key === 'Enter' || event.key === 'Escape')) {
        event.preventDefault();
        if (event.key === 'Escape') {
            const screen = screenById(event.target.dataset.screenName);
            if (screen) event.target.value = screen.name;
        }
        event.target.blur();
        return;
    }
    if (event.key === 'Escape' && uploadMenuOpen) {
        setUploadMenu(false);
        $('#uploadMenuButton')?.focus();
        return;
    }
    if (event.key === 'Escape' && transferMenu) {
        const opener = transferMenu === 'move' ? '#transferMoveButton' : '#transferModeButton';
        setTransferMenu(null);
        $(opener)?.focus();
        return;
    }
    if (event.key === 'Escape' && storyMenuOpen) {
        setStoryMenu(false);
        $('#storyMenuButton')?.focus();
        return;
    }
    if (event.key === 'Escape' && (['stepTitleInfo', 'transitionInfo', 'dwellInfo'].some(id => { const note = document.getElementById(id); return note && !note.hidden; }))) {
        closeInfoNotes();
        return;
    }
    const typing = ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName);
    const undoKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z';
    const redoKey = (event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === 'y' || (event.shiftKey && event.key.toLowerCase() === 'z'));
    if (currentView === 'editor' && !typing && (undoKey || redoKey)) {
        event.preventDefault();
        if (event.shiftKey || event.key.toLowerCase() === 'y') redoAnnotations();
        else undoAnnotations();
        return;
    }
    if (currentView === 'editor' && !typing && event.key === 'Escape' && selectedAnnotationId) {
        selectedAnnotationId = null;
        renderApp();
        return;
    }
    if (currentView === 'editor' && !typing && (event.key === 'Delete' || event.key === 'Backspace') && selectedAnnotationId) {
        event.preventDefault();
        if (!selectedAnnotation()) return;
        if (!confirm('Are you sure you want to delete this annotation?')) return;
        removeAnnotation(selectedAnnotationId);
        return;
    }
    if (currentView !== 'player' || typing) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setPlayerIndex(playerIndex+1,isPlaying); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); setPlayerIndex(playerIndex-1,isPlaying); }
    else if (event.code === 'Space') { event.preventDefault(); $('[data-action="toggle-play"]')?.click(); }
});

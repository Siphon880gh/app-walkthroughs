document.addEventListener('keydown', event => {
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
    if (currentView !== 'player' || typing) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setPlayerIndex(playerIndex+1,isPlaying); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); setPlayerIndex(playerIndex-1,isPlaying); }
    else if (event.code === 'Space') { event.preventDefault(); $('[data-action="toggle-play"]')?.click(); }
});

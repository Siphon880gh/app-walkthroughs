document.addEventListener('keydown', event => {
    if (currentView !== 'player' || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setPlayerIndex(playerIndex+1,isPlaying); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); setPlayerIndex(playerIndex-1,isPlaying); }
    else if (event.code === 'Space') { event.preventDefault(); $('[data-action="toggle-play"]')?.click(); }
});

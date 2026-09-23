document.addEventListener('paste', event => {
    if (currentView !== 'screenshots' || ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const files = [...(event.clipboardData?.files || [])].filter(file => file.type.startsWith('image/'));
    if (files.length) { event.preventDefault(); handleFiles(files); }
});

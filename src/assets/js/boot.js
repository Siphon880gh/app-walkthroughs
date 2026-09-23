if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
const sharedWalkthrough = ingestSharedHash();
watchSharedDemo();
setView(sharedWalkthrough ? 'player' : (viewFromHash() || 'screenshots'), 'replace');

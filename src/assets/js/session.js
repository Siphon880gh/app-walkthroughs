let projects = loadProjects();
let activeProjectId = localStorage.getItem(APP.activeKey) || projects[0].id;

function upgradeSeedProjects(projectList) {
    const target = projectList.find(project => project.id === 'proj-orbit-pay');
    if (!target || Number(target.demoSeedVersion || 1) >= 2) return projectList;
    const template = seedProjects()[0];
    const screenIds = new Set(target.screenshots.map(screen => screen.id));
    const storyIds = new Set(target.stories.map(story => story.id));
    template.screenshots.forEach(screen => { if (!screenIds.has(screen.id)) target.screenshots.push(screen); });
    template.stories.forEach(story => { if (!storyIds.has(story.id)) target.stories.push(story); });
    target.demoSeedVersion = 2;
    target.updatedAt = Date.now();
    saveJson(APP.storageKey, projectList);
    return projectList;
}

function loadProjects() {
    const saved = loadJson(APP.storageKey, []);
    if (Array.isArray(saved)) {
        const valid = saved.filter(isValidProject);
        if (valid.length) return upgradeSeedProjects(valid);
    }
    const seeded = seedProjects();
    saveJson(APP.storageKey, seeded);
    return seeded;
}

function activeProject() {
    return projects.find(project => project.id === activeProjectId) || projects[0];
}

function activeStory() {
    const project = activeProject();
    return project.stories.find(story => story.id === project.activeStoryId) || project.stories[0] || null;
}

function activeScreen() {
    const project = activeProject();
    return project.screenshots.find(screen => screen.id === project.activeScreenshotId) || project.screenshots[0] || null;
}

function screenById(id) {
    return activeProject().screenshots.find(screen => screen.id === id) || null;
}

function activeStep() {
    const story = activeStory();
    if (!story?.steps.length) return null;
    if (!story.activeStepId || !story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0].id;
    return story.steps.find(step => step.id === story.activeStepId) || story.steps[0];
}

function persist(render = false) {
    const project = activeProject();
    if (project) project.updatedAt = Date.now();
    saveJson(APP.storageKey, projects);
    localStorage.setItem(APP.activeKey, activeProjectId);
    if (render) renderApp();
}

function toast(message, type = 'good') {
    const region = $('#toastRegion');
    if (!region) return;
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3200);
}

function stopPlayback() {
    isPlaying = false;
    if (playerTimer) cancelAnimationFrame(playerTimer);
    playerTimer = null;
    if (typeof invalidateNarration === 'function') invalidateNarration();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function setView(view) {
    stopPlayback();
    if (view !== 'export') storyPickerOpen = false;
    currentView = view;
    if (view !== 'player') playerIndex = 0;
    renderApp();
}


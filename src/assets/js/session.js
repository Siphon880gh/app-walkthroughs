let projects = loadProjects();
let activeProjectId = localStorage.getItem(APP.activeKey) || projects[0].id;

function upgradeSeedProjects(projectList) {
    const target = projectList.find(project => project.id === 'proj-orbit-pay');
    if (!target || Number(target.demoSeedVersion || 1) >= 3) return false;
    const version = Number(target.demoSeedVersion || 1);
    const template = seedProjects()[0];
    if (version < 2) {
        const screenIds = new Set(target.screenshots.map(screen => screen.id));
        const storyIds = new Set(target.stories.map(story => story.id));
        template.screenshots.forEach(screen => { if (!screenIds.has(screen.id)) target.screenshots.push(screen); });
        template.stories.forEach(story => { if (!storyIds.has(story.id)) target.stories.push(story); });
    }
    template.stories.forEach(templateStory => {
        const story = target.stories.find(item => item.id === templateStory.id);
        if (story && !STORY_CATEGORIES.includes(story.category)) story.category = templateStory.category;
    });
    target.demoSeedVersion = 3;
    target.updatedAt = Date.now();
    return true;
}

function normalizeProjectStoryCategories(project) {
    let changed = false;
    project.stories.forEach(story => {
        const category = normalizeStoryCategory(story.category);
        if (story.category === category) return;
        story.category = category;
        changed = true;
    });
    return changed;
}

function prepareProjects(projectList) {
    let changed = upgradeSeedProjects(projectList);
    projectList.forEach(project => { changed = normalizeProjectStoryCategories(project) || changed; });
    if (changed) saveJson(APP.storageKey, projectList);
    return projectList;
}

function loadProjects() {
    const saved = loadJson(APP.storageKey, []);
    if (Array.isArray(saved)) {
        const valid = saved.filter(isValidProject);
        if (valid.length) return prepareProjects(valid);
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
    if (typeof cancelStepTransition === 'function') cancelStepTransition();
    if (typeof invalidateNarration === 'function') invalidateNarration();
    if (typeof cancelSpeech === 'function') cancelSpeech();
    else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function setView(view, historyMode = 'push') {
    if (!VIEW_SLUG[view]) view = 'screenshots';
    stopPlayback();
    if (view !== 'stories') storyMenuOpen = false;
    if (view !== 'export') storyPickerOpen = false;
    if (view === 'player') {
        const story = activeStory();
        if (playerStoryCategoryFilter !== 'all' && normalizeStoryCategory(story?.category) !== playerStoryCategoryFilter) playerStoryCategoryFilter = 'all';
    }
    currentView = view;
    if (view !== 'player') playerIndex = 0;
    if (historyMode !== 'none') rememberViewUrl(historyMode === 'replace');
    renderApp();
}

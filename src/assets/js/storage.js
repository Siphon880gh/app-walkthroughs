
function loadJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : structuredClone(fallback);
    } catch (error) {
        console.warn(`Unable to load ${key}`, error);
        return structuredClone(fallback);
    }
}

function saveJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Unable to save ${key}`, error);
        toast('Browser storage is full. Export a backup before adding more images.', 'warn');
        return false;
    }
}

function isValidProject(project) {
    return Boolean(
        project && typeof project.id === 'string' && typeof project.name === 'string' &&
        Array.isArray(project.screenshots) && Array.isArray(project.stories) &&
        project.screenshots.every(screen => typeof screen?.id === 'string' && /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i.test(String(screen.dataUrl || ''))) &&
        project.stories.every(story => typeof story?.id === 'string' && Array.isArray(story.steps))
    );
}


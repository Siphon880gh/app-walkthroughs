function generateMarkdown() {
    const project = activeProject();
    const story = activeStory();
    const lines = [`# ${project.name}`, '', project.description || '', '', '## Walkthrough inventory', '', `- Screens: ${project.screenshots.length}`, `- Walkthroughs: ${project.stories.length}`, `- Exported: ${new Date().toLocaleString()}`, ''];
    const stories = exportScope === 'story' && story ? [story] : project.stories;
    stories.forEach(flow => {
        lines.push(`## ${flow.name}`, '', flow.description || '', '', `**Device:** ${flow.settings.deviceType} · **Default speed:** ${flow.settings.defaultSpeed}x`, '');
        flow.steps.forEach((step,index) => {
            const screen = project.screenshots.find(item => item.id === step.screenId);
            lines.push(`### ${index+1}. ${step.title}`, '', `- **Source:** ${screen?.name || 'Missing source'}`, `- **User action:** ${step.userAction || 'Not documented'}`, `- **Visible state:** ${step.screenContent || 'Not documented'}`, `- **Next action:** ${step.nextAction || 'Not documented'}`, `- **Transition:** ${step.transition.type}, ${step.transition.duration}s, ${step.transition.easing}`, `- **Dwell:** ${step.dwellSeconds}s`, `- **Hotspot:** ${step.interaction.enabled ? `${step.interaction.label || step.interaction.type} at (${step.interaction.xPercent}%, ${step.interaction.yPercent}%)` : 'None'}`, '');
        });
    });
    return lines.join('\n');
}

function projectPayload(scope = exportScope) {
    const project = structuredClone(activeProject());
    if (scope === 'story') {
        const story = activeStory();
        const screenIds = new Set(story?.steps.map(step => step.screenId) || []);
        project.stories = story ? [story] : [];
        project.screenshots = project.screenshots.filter(screen => screenIds.has(screen.id));
        project.activeStoryId = story?.id || '';
    }
    return {version:2, app:APP.name, sharedAt:Date.now(), project};
}

function storyPickThumb(flow) {
    const screen = screenById(flow.steps[0]?.screenId);
    return screen ? `<img src="${safeImage(screen.dataUrl)}" alt="">` : '<span class="story-pick-empty">No photo</span>';
}

function currentWalkthroughControl(project, story) {
    const cards = project.stories.map(item => `<button type="button" class="story-pick${item.id === story?.id ? ' selected' : ''}" data-action="pick-export-story" data-id="${esc(item.id)}" aria-pressed="${item.id === story?.id ? 'true' : 'false'}"><span class="story-pick-thumb">${storyPickThumb(item)}</span><span class="story-pick-name">${esc(item.name)}</span></button>`).join('');
    return `<div class="scope-switcher${storyPickerOpen ? ' open' : ''}"><button class="scope-option ${exportScope === 'story' ? 'active':''}" data-action="export-scope" data-scope="story"><strong>Current walkthrough</strong>${esc(story?.name || 'No story')}</button><button type="button" class="scope-chevron" data-action="toggle-story-picker" aria-expanded="${storyPickerOpen ? 'true' : 'false'}" aria-label="Choose a walkthrough">⌄</button>${storyPickerOpen ? `<div class="story-picker">${cards}</div>` : ''}</div>`;
}

function renderExport() {
    const project = activeProject();
    const story = activeStory();
    const markdown = generateMarkdown();
    const bytes = new Blob([JSON.stringify(projectPayload())]).size;
    return `<section class="main-pane"><header class="view-head"><div><h1 class="view-title">Export & share</h1><p class="view-subtitle">Package the walkthrough for stakeholders, engineers, or safekeeping.</p></div><div class="view-actions"><span class="tag">No server upload</span></div></header><div class="export-scroll"><div class="export-grid"><div><section class="export-section"><h2>Shareable walkthrough link</h2><p>Encode the selected scope into this page’s URL. Anyone with the link can open an independent, local copy.</p><div class="scope-row"><button class="scope-option ${exportScope === 'project' ? 'active':''}" data-action="export-scope" data-scope="project"><strong>All walkthroughs</strong>${project.stories.length} flows · ${project.screenshots.length} screens</button>${currentWalkthroughControl(project, story)}</div><div class="export-actions"><button class="button primary" data-action="copy-share">⌁ Copy share link</button><button class="button" data-action="preview-story">▶ Open player</button></div></section><section class="export-section"><h2>Portable files</h2><p>Download an offline presentation, a developer-ready specification, or a complete editable backup.</p><div class="export-actions"><button class="button primary" data-action="download-html">↓ Standalone HTML</button><button class="button" data-action="download-markdown">↓ Markdown spec</button><button class="button" data-action="download-json">↓ Project JSON</button><button class="button" data-action="import-json">↑ Restore JSON</button></div></section><section class="export-section" style="border:0"><h2>Specification preview</h2><p>The exported Markdown uses the canonical behavioral triad for every step.</p><div class="markdown-preview" style="margin-top:14px">${esc(markdown)}</div><div class="export-actions"><button class="button" data-action="copy-markdown">Copy Markdown</button></div></section></div><aside><div class="export-stats"><h2>Package telemetry</h2><div class="stat-table"><div class="stat-row"><span>Selected scope</span><strong>${exportScope === 'project' ? 'PROJECT':'STORY'}</strong></div><div class="stat-row"><span>Walkthroughs</span><strong>${exportScope === 'project' ? project.stories.length : (story ? 1 : 0)}</strong></div><div class="stat-row"><span>Screenshots</span><strong>${exportScope === 'project' ? project.screenshots.length : new Set(story?.steps.map(step=>step.screenId)||[]).size}</strong></div><div class="stat-row"><span>Story steps</span><strong>${exportScope === 'project' ? project.stories.reduce((n,item)=>n+item.steps.length,0) : (story?.steps.length || 0)}</strong></div><div class="stat-row"><span>Payload size</span><strong>${formatBytes(bytes)}</strong></div></div><div class="privacy-seal"><strong><span class="status-dot"></span>Private by architecture</strong>No asset is sent to StoryFlow servers. Downloads and share payloads are generated in your browser.</div></div></aside></div></div></section>`;
}


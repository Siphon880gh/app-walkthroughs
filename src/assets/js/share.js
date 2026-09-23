function encodePayload(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

function decodePayload(value) {
    const normalized = value.replaceAll('-','+').replaceAll('_','/');
    const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}

async function copyText(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        toast(message);
    } catch {
        const input = document.createElement('textarea');
        input.value = text;
        document.body.append(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        toast(message);
    }
}

function download(content, filename, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], {type}));
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function standaloneHtml() {
    const payload = projectPayload();
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(activeProject().name)} — StoryFlow</title><style>*{box-sizing:border-box}body{margin:0;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif}header{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#0b1220;border-bottom:1px solid #1e293b}main{min-height:calc(100vh - 126px);display:grid;grid-template-columns:1fr 330px}.stage{display:grid;place-items:center;padding:24px;background:radial-gradient(circle,#172033,#020617 60%)}.frame{height:min(72vh,680px);aspect-ratio:390/844;border:8px solid #1e293b;border-radius:40px;overflow:hidden;background:#05070c}.frame img{width:100%;height:100%;object-fit:contain}.notes{padding:26px 20px;border-left:1px solid #1e293b;background:#0b1220}.notes small{color:#60a5fa}.notes h1{font-size:21px}.notes h3{margin:22px 0 6px;color:#64748b;font:700 10px monospace;text-transform:uppercase}.notes p{color:#cbd5e1;font-size:13px;line-height:1.6}.notes p.empty{color:#64748b;font-style:italic;opacity:.7}.controls{height:68px;display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #1e293b;background:#0b1220}button{border:1px solid #334155;border-radius:6px;background:#172033;color:#e2e8f0;padding:9px 14px;cursor:pointer}button.primary{background:#2563eb;border-color:#3b82f6}@media(max-width:760px){main{grid-template-columns:1fr}.stage{min-height:70vh}.notes{border-left:0;border-top:1px solid #1e293b}.frame{height:min(62vh,620px)}}</style></head><body><header><strong id="project"></strong><span id="flow"></span></header><main><div class="stage"><div class="frame"><img id="screen" alt=""></div></div><aside class="notes"><small id="count"></small><h1 id="title"></h1><h3>Narrate before</h3><p id="before"></p><h3>What the user is doing</h3><p id="action"></p><h3>What is visible</h3><p id="visible"></p><h3>What happens next</h3><p id="next"></p><h3>Narrate after</h3><p id="after"></p><h3>Comment</h3><p id="comment"></p></aside></main><div class="controls"><button id="prev">Previous</button><button class="primary" id="nextBtn">Next step</button></div><script>const DATA=${json};const P=DATA.project,S=P.stories[0];let i=0;const q=s=>document.querySelector(s);function show(){const x=S.steps[i],img=P.screenshots.find(v=>v.id===x.screenId);q('#project').textContent=P.name;q('#flow').textContent=S.name;q('#screen').src=img?img.dataUrl:'';q('#screen').alt=img?img.name:'';q('#count').textContent='STEP '+(i+1)+' OF '+S.steps.length;q('#title').textContent=x.title;[['#before',x.narrateBefore],['#action',x.userAction],['#visible',x.screenContent],['#next',x.nextAction],['#after',x.narrateAfter],['#comment',x.comment]].forEach(([id,value])=>{const el=q(id);const text=String(value||'').trim();el.textContent=text||'Not available';el.className=text?'':'empty'});q('#prev').disabled=i===0;q('#nextBtn').textContent=i===S.steps.length-1?'Restart':'Next step'}q('#prev').onclick=()=>{i=Math.max(0,i-1);show()};q('#nextBtn').onclick=()=>{i=i===S.steps.length-1?0:i+1;show()};show();<\/script></body></html>`;
}

function importProjectData(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const project = parsed.project || parsed;
            if (!isValidProject(project)) throw new Error('Unsupported project shape');
            project.id = uid('proj-import');
            project.name = `${project.name} (Imported)`;
            projects.unshift(project);
            activeProjectId = project.id;
            selectedFolder = null;
            persist(true);
            toast('Project restored from JSON.');
        } catch (error) {
            console.error(error);
            toast('That file is not a valid StoryFlow project.', 'warn');
        }
    };
    reader.readAsText(file);
}

function ingestSharedHash() {
    const match = location.hash.match(/^#(?:player|flow)=([^&]+)/);
    if (!match) return false;
    try {
        if (match[1].length > 7000000) throw new Error('Payload exceeds safe browser limits');
        const parsed = decodePayload(match[1]);
        const project = parsed.project;
        if (!isValidProject(project)) throw new Error('Invalid payload');
        project.id = uid('shared-proj');
        project.name = `${project.name} (Shared)`;
        projects.unshift(project);
        activeProjectId = project.id;
        currentView = 'player';
        persist();
        toast('Shared walkthrough loaded locally.');
        return true;
    } catch (error) {
        console.warn('Invalid shared payload', error);
        toast('This share link is damaged or incomplete.', 'warn');
        return false;
    }
}

const SHARED_DEMO_ID = 'proj-shared-demo';

function refreshProjectSelect() {
    const select = $('#projectSelect');
    if (!select) return;
    select.innerHTML = projects.map(project => `<option value="${esc(project.id)}" ${project.id === activeProjectId ? 'selected':''}>${esc(project.name)}</option>`).join('');
}

function applySharedDemo(payload) {
    const source = payload?.project;
    if (!isValidProject(source)) return false;
    const incoming = structuredClone(source);
    incoming.id = SHARED_DEMO_ID;
    incoming.syncedAt = Number(payload.syncedAt || incoming.syncedAt || 0);
    if (!incoming.name.endsWith(' (Demo)')) incoming.name = `${incoming.name} (Demo)`;
    const index = projects.findIndex(project => project.id === SHARED_DEMO_ID);
    if (index >= 0 && Number(projects[index].syncedAt || 0) >= incoming.syncedAt) return false;
    const viewing = activeProjectId === SHARED_DEMO_ID;
    if (viewing) stopPlayback();
    if (index >= 0) projects[index] = incoming;
    else projects.unshift(incoming);
    saveJson(APP.storageKey, projects);
    if (viewing) renderApp();
    else refreshProjectSelect();
    return true;
}

async function pullSharedDemo() {
    try {
        const response = await fetch('?action=sync-demo', {cache: 'no-store'});
        if (response.status === 204 || !response.ok) return false;
        return applySharedDemo(await response.json());
    } catch (error) {
        console.warn('Unable to load the shared demo', error);
        return false;
    }
}

function watchSharedDemo() {
    pullSharedDemo();
    setInterval(() => {
        if (document.visibilityState === 'visible') pullSharedDemo();
    }, 5000);
}

function projectSyncIssue(project) {
    if (!project || typeof project.name !== 'string' || !project.name.trim()) return 'The project needs a name before it can be synced.';
    if (project.name.length > 120) return 'The project name is longer than 120 characters.';
    if (!Array.isArray(project.screenshots)) return 'The project is missing its screens.';
    if (!Array.isArray(project.stories)) return 'The project is missing its walkthroughs.';
    const screen = project.screenshots.find(item => typeof item?.id !== 'string' || !/^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i.test(String(item.dataUrl || '')));
    if (screen) return `“${screen.name || 'A screen'}” does not have an image that can be synced.`;
    const story = project.stories.find(item => typeof item?.id !== 'string' || !Array.isArray(item.steps));
    if (story) return `“${story.name || 'A walkthrough'}” is missing its steps.`;
    return '';
}

function reportSyncFailure(message, detail = {}) {
    console.error('Sync to Demo failed:', message, detail);
    const error = $('#syncDemoError');
    if (error) {
        error.hidden = false;
        error.textContent = message;
    }
    toast(message, 'warn');
}

async function confirmSyncDemo() {
    const dialog = $('#syncDemoDialog');
    const button = $('#syncDemoForm button[type="submit"]');
    const input = $('#syncDemoPassword');
    const error = $('#syncDemoError');
    const password = input?.value || '';
    if (error) { error.hidden = true; error.textContent = ''; }
    if (!password) {
        reportSyncFailure('Enter the sync password.');
        input?.focus();
        return;
    }
    if (button) button.disabled = true;
    let bytes = 0;
    try {
        const project = structuredClone(activeProject());
        const issue = projectSyncIssue(project);
        if (issue) throw new Error(issue);
        const body = JSON.stringify({version: 2, password, project});
        bytes = body.length;
        const response = await fetch('?action=sync-demo', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            if (response.status === 401) input?.select();
            const failure = new Error(result.error || `Could not sync to Demo (HTTP ${response.status}).`);
            failure.status = response.status;
            throw failure;
        }
        if (input) input.value = '';
        project.syncedAt = result.syncedAt;
        applySharedDemo({syncedAt: result.syncedAt, project});
        dialog?.close();
        toast('Synced to Demo. Current users can see this project.');
    } catch (error) {
        reportSyncFailure(error.message || 'Could not sync to Demo.', {status: error.status || 0, bytes});
    } finally {
        if (button) button.disabled = false;
    }
}

async function confirmResetProfile() {
    const dialog = $('#resetProfileDialog');
    const button = $('#resetProfileForm button[type="submit"]');
    if (button) button.disabled = true;
    try {
        const response = await fetch('?action=sync-demo', {cache: 'no-store'});
        if (response.status === 204 || !response.ok) throw new Error('The Demo is not available, so nothing was reset.');
        const payload = await response.json();
        const source = payload?.project;
        if (!isValidProject(source)) throw new Error('The Demo is not available, so nothing was reset.');
        const demo = structuredClone(source);
        demo.id = SHARED_DEMO_ID;
        demo.syncedAt = Number(payload.syncedAt || demo.syncedAt || 0);
        if (!demo.name.endsWith(' (Demo)')) demo.name = `${demo.name} (Demo)`;
        stopPlayback();
        localStorage.removeItem(APP.storageKey);
        localStorage.removeItem(APP.activeKey);
        localStorage.removeItem(APP.audioKey);
        projects = [demo];
        activeProjectId = demo.id;
        audioSettings = structuredClone(defaultAudio);
        selectedFolder = null;
        searchTerm = '';
        selectedTool = 'callout-pin';
        selectedColor = PALETTE[0];
        inspectorTab = 'analysis';
        exportScope = 'project';
        playerIndex = 0;
        draftAnnotation = null;
        showRemoveHandles = false;
        selectedAnnotationId = null;
        showAnnotatedScreens = true;
        pickerShowAnnotated = true;
        storyPickerOpen = false;
        saveJson(APP.storageKey, projects);
        localStorage.setItem(APP.activeKey, activeProjectId);
        dialog?.close();
        setView('screenshots', 'replace');
        toast('Profile reset. You are back on the Demo.');
    } catch (error) {
        toast(error.message || 'Could not reset the profile.', 'warn');
    } finally {
        if (button) button.disabled = false;
    }
}

$('#syncDemoForm').addEventListener('submit', event => {
    event.preventDefault();
    confirmSyncDemo();
});
$('#resetProfileForm').addEventListener('submit', event => {
    event.preventDefault();
    confirmResetProfile();
});
$('#syncDemoDialog').addEventListener('close', () => {
    const input = $('#syncDemoPassword');
    if (input) input.value = '';
});


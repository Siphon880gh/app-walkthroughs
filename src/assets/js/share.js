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

function sharedProjectName(name, sharedAt) {
    const timestamp = Number(sharedAt);
    const date = new Date(Number.isFinite(timestamp) && timestamp > 0 ? timestamp : Date.now());
    const pad = value => String(value).padStart(2, '0');
    const version = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} T${pad(date.getHours())}${pad(date.getMinutes())}`;
    const base = String(name || 'Shared walkthrough').replace(/(?:\s+\(Shared(?:\s+\d{4}\.\d{2}\.\d{2}\s+T\d{4})?\))+$/, '');
    return `${base} (Shared ${version})`;
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

const ZIP_CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let value = n;
        for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
        table[n] = value >>> 0;
    }
    return table;
})();

function zipCrc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = ZIP_CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function zipNumber(value, width) {
    const bytes = new Uint8Array(width);
    let number = Number(value) >>> 0;
    for (let index = 0; index < width; index++) {
        bytes[index] = number & 0xff;
        number >>>= 8;
    }
    return bytes;
}

function joinBytes(parts) {
    const joined = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
    let offset = 0;
    parts.forEach(part => { joined.set(part, offset); offset += part.byteLength; });
    return joined;
}

function zipTimestamp(value) {
    const candidate = new Date(value || Date.now());
    const date = Number.isNaN(candidate.getTime()) ? new Date() : candidate;
    const year = clamp(date.getFullYear(), 1980, 2107);
    return {
        time:(date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
        date:((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()
    };
}

function photoArchiveExtension(screen, blob) {
    const fromName = String(screen.name || '').match(/\.(png|jpe?g|webp|gif|svg)$/i)?.[1]?.toLowerCase();
    if (fromName) return fromName === 'jpeg' ? 'jpg' : fromName;
    return ({'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'})[blob.type.split(';')[0].toLowerCase()]
        || String(screen.dataUrl || '').match(/\.(png|jpe?g|webp|gif|svg)$/i)?.[1]?.toLowerCase()
        || 'png';
}

function uniquePhotoFilename(screen, blob, usedNames) {
    const extension = photoArchiveExtension(screen, blob);
    const raw = String(screen.name || 'photo').split(/[\\/]/).pop().replace(/[\u0000-\u001f<>:"|?*]/g, '-').trim();
    const base = (raw.replace(/\.(png|jpe?g|webp|gif|svg)$/i, '') || 'photo').slice(0, 120);
    let name = `${base}.${extension}`;
    let copy = 2;
    while (usedNames.has(name.toLowerCase())) name = `${base}-${copy++}.${extension}`;
    usedNames.add(name.toLowerCase());
    return name;
}

function buildPhotoZip(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    entries.forEach(entry => {
        const name = encoder.encode(entry.name);
        const crc = zipCrc32(entry.bytes);
        const stamp = zipTimestamp(entry.timestamp);
        const localHeader = joinBytes([
            zipNumber(0x04034b50, 4), zipNumber(20, 2), zipNumber(0x0800, 2), zipNumber(0, 2),
            zipNumber(stamp.time, 2), zipNumber(stamp.date, 2), zipNumber(crc, 4),
            zipNumber(entry.bytes.byteLength, 4), zipNumber(entry.bytes.byteLength, 4),
            zipNumber(name.byteLength, 2), zipNumber(0, 2), name
        ]);
        localParts.push(localHeader, entry.bytes);
        centralParts.push(joinBytes([
            zipNumber(0x02014b50, 4), zipNumber(20, 2), zipNumber(20, 2), zipNumber(0x0800, 2), zipNumber(0, 2),
            zipNumber(stamp.time, 2), zipNumber(stamp.date, 2), zipNumber(crc, 4),
            zipNumber(entry.bytes.byteLength, 4), zipNumber(entry.bytes.byteLength, 4),
            zipNumber(name.byteLength, 2), zipNumber(0, 2), zipNumber(0, 2), zipNumber(0, 2),
            zipNumber(0, 2), zipNumber(0, 4), zipNumber(offset, 4), name
        ]));
        offset += localHeader.byteLength + entry.bytes.byteLength;
    });
    const central = joinBytes(centralParts);
    const end = joinBytes([
        zipNumber(0x06054b50, 4), zipNumber(0, 2), zipNumber(0, 2),
        zipNumber(entries.length, 2), zipNumber(entries.length, 2),
        zipNumber(central.byteLength, 4), zipNumber(offset, 4), zipNumber(0, 2)
    ]);
    return new Blob([...localParts, central, end], {type:'application/zip'});
}

async function downloadPhotoArchive(screens, filename, button) {
    const uniqueScreens = [...new Map(screens.filter(screen => screen && isProjectImage(screen.dataUrl)).map(screen => [screen.id, screen])).values()];
    if (!uniqueScreens.length) { toast('Select at least one photo to download.', 'warn'); return; }
    const original = button?.innerHTML;
    if (button) { button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = 'Preparing…'; }
    toast(`Preparing ${uniqueScreens.length} photo${uniqueScreens.length === 1 ? '' : 's'}…`);
    try {
        const settled = await Promise.allSettled(uniqueScreens.map(async screen => {
            const response = await fetch(screen.dataUrl);
            if (!response.ok) throw new Error(`Could not load ${screen.name}.`);
            const blob = await response.blob();
            return {
                screen,
                blob,
                bytes:new Uint8Array(await blob.arrayBuffer()),
                timestamp:screen.uploadedAt
            };
        }));
        const usedNames = new Set();
        const entries = settled.flatMap(result => result.status === 'fulfilled'
            ? [Object.assign(result.value, {name:uniquePhotoFilename(result.value.screen, result.value.blob, usedNames)})]
            : []);
        const failed = settled.length - entries.length;
        if (!entries.length) throw new Error('The selected photos could not be loaded.');
        download(buildPhotoZip(entries), filename, 'application/zip');
        toast(failed
            ? `Downloaded ${entries.length} photo${entries.length === 1 ? '' : 's'}; ${failed} could not be loaded.`
            : `Downloaded ${entries.length} photo${entries.length === 1 ? '' : 's'} as one ZIP.`, failed ? 'warn' : 'good');
    } catch (error) {
        toast(error.message || 'The photo archive could not be created.', 'warn');
    } finally {
        if (button?.isConnected) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.innerHTML = original;
        }
    }
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
            normalizeProjectStoryCategories(project);
            project.id = uid('proj-import');
            project.name = `${project.name} (Imported)`;
            projects.unshift(project);
            activeProjectId = project.id;
            selectedFolder = null;
            playerStoryCategoryFilter = 'all';
            exportStoryCategoryFilter = 'all';
            selectedPhotoIds.clear();
            selectedPickerScreenIds.clear();
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
        normalizeProjectStoryCategories(project);
        project.id = uid('shared-proj');
        project.name = sharedProjectName(project.name, parsed.sharedAt);
        projects.unshift(project);
        activeProjectId = project.id;
        playerStoryCategoryFilter = 'all';
        exportStoryCategoryFilter = 'all';
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

function isSharedDemoProject(project) {
    return Boolean(project && (
        project.id === SHARED_DEMO_ID ||
        String(project.id || '').startsWith(`${SHARED_DEMO_ID}-`) ||
        typeof project.demoSourceId === 'string'
    ));
}

function sharedDemoIdentity(project) {
    return String(project?.demoSourceId || project?.id || '');
}

function demoProjectsFromPayload(payload, respectDismissed = true) {
    const sources = Array.isArray(payload?.projects) ? payload.projects : (payload?.project ? [payload.project] : []);
    const syncedAt = Number(payload?.syncedAt || 0);
    if (respectDismissed && syncedAt && syncedAt <= Number(localStorage.getItem('storyflow_dismissed_demo_at') || 0)) return [];
    return sources.flatMap((source, index) => {
        if (!isValidProject(source)) return [];
        const incoming = structuredClone(source);
        normalizeProjectStoryCategories(incoming);
        const alreadyShared = isSharedDemoProject(incoming);
        incoming.demoSourceId = String(incoming.demoSourceId || incoming.id);
        if (sources.length > 1 && !alreadyShared) incoming.id = `${SHARED_DEMO_ID}-${index + 1}`;
        else if (sources.length === 1 && !alreadyShared) incoming.id = SHARED_DEMO_ID;
        incoming.syncedAt = Number(syncedAt || incoming.syncedAt || 0);
        if (!incoming.name.endsWith(' (Demo)')) incoming.name = `${incoming.name} (Demo)`;
        return [incoming];
    });
}

function projectsForDemoSync() {
    const localIds = new Set(projects.filter(project => !isSharedDemoProject(project)).map(project => project.id));
    return projects
        .filter(project => !isSharedDemoProject(project) || !localIds.has(sharedDemoIdentity(project)))
        .map(project => structuredClone(project));
}

function refreshProjectSelect() {
    const select = $('#projectSelect');
    if (!select) return;
    select.innerHTML = projects.map(project => `<option value="${esc(project.id)}" ${project.id === activeProjectId ? 'selected':''}>${esc(project.name)}</option>`).join('');
}

function applySharedDemo(payload) {
    const incoming = demoProjectsFromPayload(payload);
    if (!incoming.length) return false;
    const newestIncoming = Math.max(...incoming.map(project => Number(project.syncedAt || 0)));
    const existing = projects.filter(isSharedDemoProject);
    const newestExisting = Math.max(0, ...existing.map(project => Number(project.syncedAt || 0)));
    if (existing.length && newestExisting >= newestIncoming) return false;
    const activeDemo = projects.find(project => project.id === activeProjectId && isSharedDemoProject(project));
    const activeIdentity = sharedDemoIdentity(activeDemo);
    if (activeDemo) stopPlayback();
    projects = [...incoming, ...projects.filter(project => !isSharedDemoProject(project))];
    if (activeDemo) activeProjectId = incoming.find(project => sharedDemoIdentity(project) === activeIdentity)?.id || incoming[0].id;
    saveJson(APP.storageKey, projects);
    if (activeDemo) renderApp();
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
    const screen = project.screenshots.find(item => typeof item?.id !== 'string' || !isProjectImage(item.dataUrl || ''));
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
        const syncedProjects = projectsForDemoSync();
        if (!syncedProjects.length) throw new Error('There are no projects to sync.');
        syncedProjects.forEach((project, index) => {
            const issue = projectSyncIssue(project);
            if (issue) throw new Error(`${project.name || `Project ${index + 1}`}: ${issue}`);
        });
        const body = JSON.stringify({version: 3, password, projects: syncedProjects});
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
        await pullSharedDemo();
        dialog?.close();
        const count = Number(result.projectCount || syncedProjects.length);
        toast(`Synced ${count} project${count === 1 ? '' : 's'} to Demo. Current users can see them.`);
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
        const demoProjects = demoProjectsFromPayload(payload, false);
        if (!demoProjects.length) throw new Error('The Demo is not available, so nothing was reset.');
        stopPlayback();
        localStorage.removeItem(APP.storageKey);
        localStorage.removeItem(APP.activeKey);
        localStorage.removeItem(APP.audioKey);
        localStorage.removeItem('storyflow_dismissed_demo_at');
        projects = demoProjects;
        activeProjectId = demoProjects[0].id;
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
        canvasFit = 'auto';
        canvasFitOpen = false;
        selectedAnnotationId = null;
        showAnnotatedScreens = true;
        pickerShowAnnotated = true;
        playerStoryCategoryFilter = 'all';
        exportStoryCategoryFilter = 'all';
        selectedPhotoIds.clear();
        selectedPickerScreenIds.clear();
        storyPickerOpen = false;
        saveJson(APP.storageKey, projects);
        localStorage.setItem(APP.activeKey, activeProjectId);
        dialog?.close();
        setView('screenshots', 'replace');
        toast(`Profile reset. ${demoProjects.length} Demo project${demoProjects.length === 1 ? '' : 's'} restored.`);
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

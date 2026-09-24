async function imageDimensions(src) {
    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({width:image.naturalWidth || 1280,height:image.naturalHeight || 720});
        image.onerror = () => resolve({width:1280,height:720});
        image.src = src;
    });
}

function screenRecord(name, dataUrl, folder, dimensions) {
    const [app, platform = 'Web'] = folder.split(' / ');
    return {
        id:uid('screen'), name, dataUrl, folder, app, platform,
        width:dimensions.width, height:dimensions.height, deviceFrame:dimensions.width <= 520 ? 'iphone':'desktop',
        tags:[slug(app),slug(platform)], uploadedAt:Date.now(), analysis:{userAction:'',screenContent:'',nextAction:''}, annotations:[]
    };
}

async function uploadScreenshot(file) {
    const body = new FormData();
    body.append('file', file, file.name || 'screen');
    const response = await fetch('?action=upload-screenshot', {method:'POST', body});
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !STORED_IMAGE.test(String(result.path || ''))) {
        throw new Error(result.error || `Could not upload that image (HTTP ${response.status}).`);
    }
    return result.path;
}

async function fileToScreen(file, folder) {
    const path = await uploadScreenshot(file);
    return screenRecord(file.name || `Pasted screen ${new Date().toLocaleTimeString()}`, path, folder, await imageDimensions(path));
}

async function handleFiles(files) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return; }
    const project = activeProject();
    const folder = selectedFolder || project.folders?.[0]?.fullPath || `${project.name} / Web`;
    toast(`Uploading ${images.length} screen${images.length === 1 ? '':'s'}…`);
    const settled = await Promise.all(images.map(async file => {
        try { return await fileToScreen(file, folder); }
        catch (error) { toast(error.message || `Could not upload ${file.name || 'that image'}.`, 'warn'); return null; }
    }));
    const added = settled.filter(Boolean);
    if (!added.length) return;
    project.screenshots.push(...added);
    project.activeScreenshotId = added[0].id;
    persist(true);
    toast(`${added.length} screen${added.length === 1 ? '':'s'} added to ${folder}.`);
}

const URL_IMAGE_TYPES = ['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'];

async function urlToScreen(url, folder) {
    const fallbackName = decodeURIComponent(url.pathname.split('/').pop() || '') || 'Linked screen';
    try {
        const response = await fetch(url.href, {mode:'cors', credentials:'omit', referrerPolicy:'no-referrer'});
        const blob = response.ok ? await response.blob() : null;
        const type = blob?.type.split(';')[0].trim().toLowerCase();
        if (blob && URL_IMAGE_TYPES.includes(type)) return fileToScreen(new File([blob], fallbackName, {type}), folder);
    } catch {}
    const response = await fetch('?action=fetch-image', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:url.href})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok || !STORED_IMAGE.test(String(result.path || ''))) {
        throw new Error(result.error || `Could not load that URL (HTTP ${response.status}).`);
    }
    return screenRecord(result.name || fallbackName, result.path, folder, await imageDimensions(result.path));
}

function openUrlDialog() {
    const input = $('#urlInput');
    const error = $('#urlError');
    if (input) input.value = '';
    if (error) { error.hidden = true; error.textContent = ''; }
    $('#urlDialog').showModal();
    input?.focus();
}

async function confirmUrlUpload() {
    const input = $('#urlInput');
    const error = $('#urlError');
    const button = $('#urlForm button[type="submit"]');
    const fail = message => { if (error) { error.textContent = message; error.hidden = false; } input?.focus(); };
    if (error) { error.hidden = true; error.textContent = ''; }
    let url;
    try { url = new URL((input?.value || '').trim()); } catch { fail('Enter a full address, such as https://example.com/screen.png.'); return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') { fail('Only http and https addresses are supported.'); return; }
    if (button) button.disabled = true;
    try {
        const project = activeProject();
        const folder = selectedFolder || project.folders?.[0]?.fullPath || `${project.name} / Web`;
        const screen = await urlToScreen(url, folder);
        $('#urlDialog').close();
        project.screenshots.push(screen);
        project.activeScreenshotId = screen.id;
        persist(true);
        toast(`1 screen added to ${folder}.`);
    } catch (problem) {
        fail(problem.message || 'Could not load that URL.');
    } finally {
        if (button) button.disabled = false;
    }
}

$('#urlForm').addEventListener('submit', event => {
    event.preventDefault();
    confirmUrlUpload();
});

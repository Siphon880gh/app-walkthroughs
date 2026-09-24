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

function uploadFolder() {
    const project = activeProject();
    return selectedFolder || project.folders?.[0]?.fullPath || `${project.name} / Web`;
}

function commitScreens(screens) {
    if (!screens.length) return;
    const project = activeProject();
    project.screenshots.push(...screens);
    project.activeScreenshotId = screens[0].id;
    screens.forEach(screen => sessionUploads.unshift({id:screen.id, name:screen.name, url:screenUrl(screen.dataUrl)}));
    sessionUploadOpen = true;
    persist(true);
}

function renderSessionTray() {
    const tray = $('#uploadTray');
    if (!tray) return;
    if (!sessionUploads.length) {
        tray.hidden = true;
        tray.innerHTML = '';
        document.body.classList.remove('has-upload-tray', 'has-upload-icon');
        return;
    }
    tray.hidden = false;
    document.body.classList.toggle('has-upload-tray', sessionUploadOpen);
    document.body.classList.toggle('has-upload-icon', !sessionUploadOpen);
    const count = sessionUploads.length;
    const files = `${count} file${count === 1 ? '' : 's'}`;
    if (!sessionUploadOpen) {
        tray.className = 'upload-tray is-collapsed';
        tray.innerHTML = `<button type="button" class="upload-tray-icon" data-action="toggle-upload-tray" aria-expanded="false" aria-label="Show ${files} uploaded this session"><span aria-hidden="true">↑</span><span class="count-pill">${count}</span></button>`;
        return;
    }
    tray.className = 'upload-tray';
    const picked = sessionUploads.filter(item => item.url && selectedPhotoIds.has(item.id));
    const hostedIds = sessionUploads.filter(item => item.url).map(item => item.id);
    const allPicked = hostedIds.length > 0 && picked.length === hostedIds.length;
    const selectAll = hostedIds.length ? `<label class="select-all"><input class="url-check" type="checkbox" data-action="select-all-urls" data-ids="${esc(hostedIds.join(' '))}" ${allPicked ? 'checked' : ''}>Select all</label>` : '';
    const copySelected = (picked.length ? `<button type="button" class="button small" data-action="copy-selected-urls" data-scope="tray">Copy selected <span class="count-pill">${picked.length}</span></button>` : '') + selectAll;
    const rows = sessionUploads.map(item => {
        const checked = selectedPhotoIds.has(item.id);
        const actions = item.url ? `<div class="url-actions"><button type="button" class="button small" data-action="copy-screen-url" data-url="${esc(item.url)}">Copy</button><span class="url-actions-sep" aria-hidden="true"></span><input class="url-check" type="checkbox" data-action="toggle-url-select" data-id="${esc(item.id)}" aria-label="Select ${esc(item.name)}" ${checked ? 'checked' : ''}></div>` : '';
        return `<li class="upload-tray-row${checked ? ' picked' : ''}"><span class="upload-tray-name">${esc(item.name)}</span>${actions}</li>`;
    }).join('');
    tray.innerHTML = `<section class="upload-tray-panel" aria-label="Files uploaded this session"><header class="upload-tray-head"><strong>Last uploaded</strong><span class="count-pill">${count}</span>${copySelected}<button type="button" class="button ghost icon-only upload-tray-collapse" data-action="toggle-upload-tray" aria-expanded="true" aria-label="Collapse uploaded files">⌄</button></header><ul class="upload-tray-list">${rows}</ul></section>`;
}

async function handleFiles(files) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return; }
    const folder = uploadFolder();
    toast(`Uploading ${images.length} screen${images.length === 1 ? '':'s'}…`);
    const settled = await Promise.all(images.map(async file => {
        try { return await fileToScreen(file, folder); }
        catch (error) { toast(error.message || `Could not upload ${file.name || 'that image'}.`, 'warn'); return null; }
    }));
    const added = settled.filter(Boolean);
    if (!added.length) return;
    commitScreens(added);
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

function urlsFromClipboard(text) {
    return String(text || '').split(/\s+/).flatMap(part => {
        try {
            const url = new URL(part);
            return url.protocol === 'http:' || url.protocol === 'https:' ? [url] : [];
        } catch { return []; }
    });
}

async function handlePastedUrls(urls) {
    if (!urls.length) { toast('Paste an http or https image address.', 'warn'); return; }
    const folder = uploadFolder();
    toast(`Uploading ${urls.length} screen${urls.length === 1 ? '':'s'}…`);
    const settled = await Promise.all(urls.map(async url => {
        try { return await urlToScreen(url, folder); }
        catch (error) { toast(error.message || 'Could not upload that URL.', 'warn'); return null; }
    }));
    const added = settled.filter(Boolean);
    if (!added.length) return;
    commitScreens(added);
    toast(`${added.length} screen${added.length === 1 ? '':'s'} added to ${folder}.`);
}

async function pasteClipboardUrls() {
    let text = '';
    try { text = await navigator.clipboard.readText(); }
    catch { toast('Allow clipboard access to paste a URL.', 'warn'); return; }
    const urls = urlsFromClipboard(text);
    if (!urls.length) { toast('The clipboard does not contain an image URL.', 'warn'); return; }
    handlePastedUrls(urls);
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
        const folder = uploadFolder();
        const screen = await urlToScreen(url, folder);
        $('#urlDialog').close();
        commitScreens([screen]);
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

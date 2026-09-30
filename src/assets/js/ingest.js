async function imageDimensions(src) {
    return new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({width:image.naturalWidth || 1280,height:image.naturalHeight || 720});
        image.onerror = () => resolve({width:1280,height:720});
        image.src = src;
    });
}

function metadataDateTimestamp(value, offsetValue = '') {
    const match = String(value || '').trim().match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (!match) return 0;
    let offsetMinutes = photoTimeZone().offsetMinutes;
    const offset = String(offsetValue || '').trim().match(/^([+-])(\d{2}):?(\d{2})$/);
    if (offset) offsetMinutes = (offset[1] === '-' ? -1 : 1) * (Number(offset[2]) * 60 + Number(offset[3]));
    const parts = match.slice(1).map(Number);
    const timestamp = Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]) - offsetMinutes * 60000;
    return Number.isFinite(timestamp) ? timestamp : 0;
}

async function jpegExifDate(file) {
    if (!/image\/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name || '')) return 0;
    const view = new DataView(await file.slice(0, 512 * 1024).arrayBuffer());
    if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return 0;
    let markerOffset = 2;
    while (markerOffset + 10 < view.byteLength) {
        if (view.getUint8(markerOffset) !== 0xff) { markerOffset++; continue; }
        const marker = view.getUint8(markerOffset + 1);
        if (marker === 0xda || marker === 0xd9) break;
        const size = view.getUint16(markerOffset + 2);
        if (size < 2 || markerOffset + 2 + size > view.byteLength) break;
        const payload = markerOffset + 4;
        const isExif = marker === 0xe1 && view.getUint32(payload) === 0x45786966 && view.getUint16(payload + 4) === 0;
        if (isExif) {
            const tiff = payload + 6;
            if (tiff + 8 > view.byteLength) return 0;
            const little = view.getUint16(tiff) === 0x4949;
            if ((!little && view.getUint16(tiff) !== 0x4d4d) || view.getUint16(tiff + 2, little) !== 42) return 0;
            const readIfd = relativeOffset => {
                const start = tiff + relativeOffset;
                if (start < tiff || start + 2 > view.byteLength) return new Map();
                const count = view.getUint16(start, little);
                const values = new Map();
                for (let index = 0; index < count; index++) {
                    const entry = start + 2 + index * 12;
                    if (entry + 12 > view.byteLength) break;
                    const tag = view.getUint16(entry, little);
                    const type = view.getUint16(entry + 2, little);
                    const length = view.getUint32(entry + 4, little);
                    if (type === 2 && length > 0 && length < 128) {
                        const position = length <= 4 ? entry + 8 : tiff + view.getUint32(entry + 8, little);
                        if (position >= 0 && position + length <= view.byteLength) {
                            let text = '';
                            for (let byte = 0; byte < length - 1; byte++) text += String.fromCharCode(view.getUint8(position + byte));
                            values.set(tag, text.trim());
                        }
                    } else if (type === 4 && length === 1) {
                        values.set(tag, view.getUint32(entry + 8, little));
                    }
                }
                return values;
            };
            const root = readIfd(view.getUint32(tiff + 4, little));
            const exif = Number.isFinite(root.get(0x8769)) ? readIfd(root.get(0x8769)) : new Map();
            return metadataDateTimestamp(exif.get(0x9003) || exif.get(0x9004) || root.get(0x0132), exif.get(0x9011) || exif.get(0x9012));
        }
        markerOffset += size + 2;
    }
    return 0;
}

async function photoCaptureDate(file) {
    if (!usePhotoMetadataDates) return {timestamp:Date.now(),source:'import'};
    try {
        const exifTimestamp = await jpegExifDate(file);
        if (exifTimestamp) return {timestamp:exifTimestamp,source:'exif'};
    } catch (error) {
        console.warn(`Unable to read photo metadata for ${file.name || 'image'}`, error);
    }
    if (Number(file.lastModified) > 0) return {timestamp:Number(file.lastModified),source:'file-modified'};
    return {timestamp:Date.now(),source:'import'};
}

function screenRecord(name, dataUrl, folder, dimensions, capturedAt = Date.now(), captureSource = 'import') {
    const [app, platform = 'Web'] = folder.split(' / ');
    const importedAt = Date.now();
    return {
        id:uid('screen'), name, dataUrl, folder, app, platform,
        width:dimensions.width, height:dimensions.height, deviceFrame:dimensions.width <= 520 ? 'iphone':'desktop',
        tags:[slug(app),slug(platform)], capturedAt, captureSource, importedAt, uploadedAt:importedAt,
        analysis:{userAction:'',screenContent:'',nextAction:''}, annotations:[]
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
    const [path, capture] = await Promise.all([uploadScreenshot(file), photoCaptureDate(file)]);
    return screenRecord(file.name || `Pasted screen ${new Date().toLocaleTimeString()}`, path, folder, await imageDimensions(path), capture.timestamp, capture.source);
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

function uploadTagsFromInput(value) {
    return [...new Set(String(value || '').split(',').map(tag => tag.trim()).filter(Boolean).map(tag => slug(tag.slice(0, 40))))];
}

function stageFilesForUpload(files) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return; }
    pendingUploadFiles = images;
    const dialog = $('#uploadDialog');
    const description = $('#uploadDialogDescription');
    const list = $('#uploadDialogFiles');
    const input = $('#uploadTagInput');
    const suggestions = $('#uploadTagSuggestions');
    const error = $('#uploadDialogError');
    const button = $('#confirmUploadButton');
    if (!dialog || !list || !input) return;
    description.textContent = `${images.length} photo${images.length === 1 ? '' : 's'} selected. Optional tags will be applied to the entire batch.`;
    list.innerHTML = images.map(file => `<div class="upload-dialog-file"><span aria-hidden="true">▧</span><strong title="${esc(file.name)}">${esc(file.name || 'Untitled image')}</strong><small>${formatBytes(file.size)}</small></div>`).join('');
    input.value = '';
    const tags = projectCustomTags(activeProject());
    suggestions.innerHTML = tags.length
        ? tags.map(tag => `<button type="button" class="tag-suggestion" data-action="choose-upload-tag" data-tag="${esc(tag)}">#${esc(tag)}</button>`).join('')
        : '<span class="tag-suggestions-empty">Existing tags will appear here.</span>';
    if (error) {
        error.hidden = true;
        error.textContent = '';
    }
    if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = `Upload ${images.length} photo${images.length === 1 ? '' : 's'}`;
    }
    dialog.showModal();
    requestAnimationFrame(() => input.focus());
}

function closeUploadDialog() {
    const dialog = $('#uploadDialog');
    if (dialog?.open) dialog.close();
    else pendingUploadFiles = [];
}

async function confirmFileUpload() {
    const files = [...pendingUploadFiles];
    if (!files.length) {
        closeUploadDialog();
        return;
    }
    const button = $('#confirmUploadButton');
    if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = `Uploading ${files.length}…`;
    }
    const added = await handleFiles(files, uploadTagsFromInput($('#uploadTagInput')?.value));
    if (added.length) closeUploadDialog();
    else if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = `Try uploading ${files.length} again`;
    }
}

async function handleFiles(files, uploadTags = []) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return []; }
    const folder = uploadFolder();
    toast(`Uploading ${images.length} screen${images.length === 1 ? '':'s'}…`);
    const settled = await Promise.all(images.map(async file => {
        try { return await fileToScreen(file, folder); }
        catch (error) { toast(error.message || `Could not upload ${file.name || 'that image'}.`, 'warn'); return null; }
    }));
    const added = settled.filter(Boolean);
    if (!added.length) return [];
    if (uploadTags.length) {
        added.forEach(screen => {
            screen.tags = [...new Set([...(screen.tags || []), ...uploadTags])];
        });
    }
    commitScreens(added);
    const tagDetail = uploadTags.length ? ` with ${uploadTags.length} tag${uploadTags.length === 1 ? '' : 's'}` : '';
    toast(`${added.length} screen${added.length === 1 ? '':'s'} added to ${folder}${tagDetail}.`);
    return added;
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

$('#uploadForm').addEventListener('submit', event => {
    event.preventDefault();
    confirmFileUpload();
});

$('#uploadDialog').addEventListener('close', () => {
    pendingUploadFiles = [];
    $('#uploadForm').reset();
    const error = $('#uploadDialogError');
    if (error) {
        error.hidden = true;
        error.textContent = '';
    }
});

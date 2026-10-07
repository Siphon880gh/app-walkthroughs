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
    const screen = screenRecord(file.name || `Pasted screen ${new Date().toLocaleTimeString()}`, path, folder, await imageDimensions(path), capture.timestamp, capture.source);
    if (file.storyflowFrame === 'iphone' || file.storyflowFrame === 'desktop') screen.deviceFrame = file.storyflowFrame;
    return screen;
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

const SLICE_VIEWPORTS = [
    {id:'iphone-se', family:'Phone', name:'iPhone SE', width:375, height:667, dprs:[1, 2]},
    {id:'iphone-14', family:'Phone', name:'iPhone 14 / 16e', width:390, height:844, dprs:[1, 2, 3]},
    {id:'iphone-16', family:'Phone', name:'iPhone 15 / 16', width:393, height:852, dprs:[1, 2, 3]},
    {id:'iphone-17', family:'Phone', name:'iPhone 17 / 16 Pro', width:402, height:874, dprs:[1, 2, 3]},
    {id:'iphone-16-plus', family:'Phone', name:'iPhone 16 Plus', width:430, height:932, dprs:[1, 2, 3]},
    {id:'iphone-16-pro-max', family:'Phone', name:'iPhone 16 / 17 Pro Max', width:440, height:956, dprs:[1, 2, 3]},
    {id:'galaxy-s24', family:'Phone', name:'Galaxy S24', width:360, height:780, dprs:[1, 2, 3]},
    {id:'pixel-8', family:'Phone', name:'Pixel 8', width:412, height:915, dprs:[1, 2, 2.625, 3]},
    {id:'pixel-9', family:'Phone', name:'Pixel 9', width:412, height:924, dprs:[1, 2, 2.625, 3]},
    {id:'pixel-9-pro-xl', family:'Phone', name:'Pixel 9 Pro XL', width:448, height:997, dprs:[1, 2, 3]},
    {id:'desktop-1280-720', family:'Desktop', name:'Desktop 1280 × 720', width:1280, height:720, dprs:[1, 1.5, 2]},
    {id:'desktop-1280-800', family:'Desktop', name:'Desktop 1280 × 800', width:1280, height:800, dprs:[1, 1.5, 2]},
    {id:'desktop-1366', family:'Desktop', name:'Desktop 1366 × 768', width:1366, height:768, dprs:[1, 1.5, 2]},
    {id:'desktop-1440', family:'Desktop', name:'Desktop 1440 × 900', width:1440, height:900, dprs:[1, 2]},
    {id:'desktop-1512', family:'Desktop', name:'Desktop 1512 × 900', width:1512, height:900, dprs:[1, 2]},
    {id:'desktop-1536', family:'Desktop', name:'Desktop 1536 × 864', width:1536, height:864, dprs:[1, 2]},
    {id:'desktop-1920', family:'Desktop', name:'Desktop 1920 × 1080', width:1920, height:1080, dprs:[1, 2]}
];
const SLICE_LONG_RATIO = 1.2;

function fileImageSize(file) {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            const size = {width:image.naturalWidth || 0, height:image.naturalHeight || 0};
            URL.revokeObjectURL(url);
            resolve(size.width > 0 && size.height > 0 ? size : null);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        image.src = url;
    });
}

function slicePixelHeight(imageWidth, viewport) {
    return Math.max(1, Math.round(imageWidth * viewport.height / viewport.width));
}

function sliceCount(imageHeight, sliceHeight) {
    return Math.max(1, Math.ceil(imageHeight / Math.max(1, sliceHeight)));
}

function viewportFit(imageWidth, viewport) {
    return viewport.dprs.reduce((best, dpr) => {
        const error = Math.abs(viewport.width * dpr - imageWidth) / Math.max(imageWidth, 1);
        return error < best ? error : best;
    }, Infinity);
}

function rankSliceViewports(width, height) {
    const scored = SLICE_VIEWPORTS.map(viewport => {
        const sliceHeight = slicePixelHeight(width, viewport);
        const remainder = height % sliceHeight;
        const tail = Math.min(remainder, Math.abs(sliceHeight - remainder));
        return {...viewport, error:viewportFit(width, viewport), sliceHeight, screens:sliceCount(height, sliceHeight), tail:tail / sliceHeight};
    }).sort((a, b) => a.error - b.error || a.tail - b.tail || a.name.localeCompare(b.name));
    const best = scored[0];
    const options = ['Phone', 'Desktop'].flatMap(family => scored.filter(viewport => viewport.family === family).slice(0, family === 'Phone' ? 4 : 3));
    return {long:height > best.sliceHeight * SLICE_LONG_RATIO, bestId:best.id, viewportId:best.id, options};
}

async function measureSliceChoice(file) {
    const size = await fileImageSize(file);
    if (!size) return null;
    return {width:size.width, height:size.height, ...rankSliceViewports(size.width, size.height)};
}

function plannedPieceCount(choice) {
    if (!choice?.long || choice.viewportId === 'keep') return 1;
    return choice.options.find(option => option.id === choice.viewportId)?.screens || 1;
}

function plannedUploadCount() {
    return pendingUploadFiles.reduce((sum, file, index) => sum + plannedPieceCount(pendingSliceChoices[index]), 0);
}

function sliceChoiceButton(index, option, selectedId, bestId) {
    const selected = option.id === selectedId;
    const badge = option.id === bestId ? '<span class="slice-badge">Recommended</span>' : '';
    const screens = `${option.screens} screen${option.screens === 1 ? '' : 's'}`;
    return `<button type="button" class="slice-choice${selected ? ' selected' : ''}" data-action="choose-slice" data-index="${index}" data-viewport="${esc(option.id)}" role="radio" aria-checked="${selected ? 'true' : 'false'}"><span><strong>${esc(option.name)}</strong><small>${option.sliceHeight.toLocaleString('en-US')}px tall · ${screens}</small></span>${badge}</button>`;
}

function renderSliceOffer() {
    const offer = $('#sliceOffer');
    const dialog = $('#uploadDialog');
    if (!offer || !dialog) return;
    const longs = pendingSliceChoices.flatMap((choice, index) => choice?.long ? [{choice, index}] : []);
    dialog.classList.toggle('slicing', longs.length > 0);
    if (!longs.length) {
        offer.hidden = true;
        offer.innerHTML = '';
    } else {
        offer.hidden = false;
        offer.innerHTML = longs.map(({choice, index}) => {
            const file = pendingUploadFiles[index];
            const groups = ['Phone', 'Desktop'].flatMap(family => {
                const items = choice.options.filter(option => option.family === family);
                if (!items.length) return [];
                return [`<div class="slice-family">${family.toUpperCase()}</div>`, ...items.map(option => sliceChoiceButton(index, option, choice.viewportId, choice.bestId))];
            }).join('');
            const keepSelected = choice.viewportId === 'keep';
            const keep = `<div class="slice-family">ONE IMAGE</div><button type="button" class="slice-choice${keepSelected ? ' selected' : ''}" data-action="choose-slice" data-index="${index}" data-viewport="keep" role="radio" aria-checked="${keepSelected ? 'true' : 'false'}"><span><strong>Keep as one image</strong><small>${choice.width.toLocaleString('en-US')} × ${choice.height.toLocaleString('en-US')}</small></span></button>`;
            const heading = longs.length > 1 ? `<div class="slice-file">${esc(file?.name || 'Screenshot')}</div>` : '';
            return `<section class="slice-group"><div class="field-label">CUT INTO SCREENS</div>${heading}<p class="slice-note">This capture is taller than one viewport. Slice height follows its width, and the closest device is selected.</p><div class="slice-choices" role="radiogroup" aria-label="Viewport for ${esc(file?.name || 'screenshot')}">${groups}${keep}</div></section>`;
        }).join('');
    }
    const description = $('#uploadDialogDescription');
    const button = $('#confirmUploadButton');
    if (description && longs.length) {
        description.textContent = longs.length === 1
            ? 'Choose a device viewport for the long screenshot, or keep it as one image.'
            : `${longs.length} long screenshots can be cut into viewport-sized screens.`;
    }
    if (button && !button.hasAttribute('aria-busy')) {
        const count = plannedUploadCount();
        const noun = longs.length ? 'screen' : 'photo';
        button.textContent = `Upload ${count} ${noun}${count === 1 ? '' : 's'}`;
    }
}

function chooseSliceViewport(index, viewportId) {
    const choice = pendingSliceChoices[index];
    if (!choice?.long || !viewportId) return;
    if (viewportId !== 'keep' && !choice.options.some(option => option.id === viewportId)) return;
    choice.viewportId = viewportId;
    renderSliceOffer();
    $(`#sliceOffer [data-action="choose-slice"][data-index="${index}"][data-viewport="${CSS.escape(viewportId)}"]`)?.focus();
}

function presentUploadDialog(images, choices, destination) {
    pendingUploadFiles = images;
    pendingSliceChoices = choices;
    pendingUploadDestination = destination;
    const dialog = $('#uploadDialog');
    const description = $('#uploadDialogDescription');
    const list = $('#uploadDialogFiles');
    const input = $('#uploadTagInput');
    const suggestions = $('#uploadTagSuggestions');
    const error = $('#uploadDialogError');
    const button = $('#confirmUploadButton');
    if (!dialog || !list || !input) return;
    description.textContent = `${images.length} photo${images.length === 1 ? '' : 's'} selected. Optional tags will be applied to the entire batch.`;
    list.innerHTML = images.map((file, index) => {
        const choice = choices[index];
        const detail = choice ? `${choice.width.toLocaleString('en-US')} × ${choice.height.toLocaleString('en-US')}` : formatBytes(file.size);
        return `<div class="upload-dialog-file"><span aria-hidden="true">▧</span><strong title="${esc(file.name)}">${esc(file.name || 'Untitled image')}</strong><small>${detail}</small></div>`;
    }).join('');
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
    }
    renderSliceOffer();
    if (!dialog.open) dialog.showModal();
    requestAnimationFrame(() => ($('.slice-choice.selected', dialog) || input).focus());
}

async function stageFilesForUpload(files) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return; }
    presentUploadDialog(images, await Promise.all(images.map(measureSliceChoice)), null);
}

function closeUploadDialog() {
    const dialog = $('#uploadDialog');
    if (dialog?.open) dialog.close();
    else {
        pendingUploadFiles = [];
        pendingSliceChoices = [];
        pendingUploadDestination = null;
    }
}

function sliceOutputType(file) {
    if (/image\/jpe?g/i.test(file.type) || /\.jpe?g$/i.test(file.name || '')) return {mime:'image/jpeg', ext:'jpg'};
    if (/image\/webp/i.test(file.type) || /\.webp$/i.test(file.name || '')) return {mime:'image/webp', ext:'webp'};
    return {mime:'image/png', ext:'png'};
}

async function canvasBlob(canvas, mime) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, 0.92));
    if (blob || mime === 'image/png') return blob;
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

async function sliceScreenshot(file, sliceHeight, frame) {
    const url = URL.createObjectURL(file);
    try {
        const image = await new Promise((resolve, reject) => {
            const element = new Image();
            element.onload = () => resolve(element);
            element.onerror = () => reject(new Error(`Could not read ${file.name || 'that image'}.`));
            element.src = url;
        });
        const output = sliceOutputType(file);
        const base = (file.name || 'screen').replace(/\.[^.]+$/, '') || 'screen';
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const parts = [];
        for (let y = 0, part = 1; y < height; y += sliceHeight, part += 1) {
            const band = Math.min(sliceHeight, height - y);
            if (band < 1) break;
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = band;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not cut that screenshot.');
            context.drawImage(image, 0, y, width, band, 0, 0, width, band);
            const blob = await canvasBlob(canvas, output.mime);
            if (!blob) throw new Error('Could not cut that screenshot.');
            const ext = blob.type === 'image/png' && output.mime !== 'image/png' ? 'png' : output.ext;
            const slice = new File([blob], `${base}-${part}.${ext}`, {type:blob.type || output.mime, lastModified:Number(file.lastModified) || Date.now()});
            slice.storyflowFrame = frame;
            parts.push(slice);
        }
        if (parts.length < 2) throw new Error('Could not cut that screenshot.');
        return parts;
    } finally {
        URL.revokeObjectURL(url);
    }
}

async function expandUploadFiles(files, choices) {
    const prepared = [];
    for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const choice = choices[index];
        const option = choice?.long && choice.viewportId !== 'keep' ? choice.options.find(item => item.id === choice.viewportId) : null;
        if (!option || option.screens < 2 || option.sliceHeight >= choice.height) {
            prepared.push(file);
            continue;
        }
        const frame = option.family === 'Phone' ? 'iphone' : 'desktop';
        prepared.push(...await sliceScreenshot(file, option.sliceHeight, frame));
    }
    return prepared;
}

function ensureUploadFolder(destination) {
    if (!destination?.create) return;
    const project = activeProject();
    if (project.folders.some(folder => folder.fullPath === destination.fullPath)) return;
    project.folders.push({id:uid('folder'), app:destination.app, platform:destination.platform, fullPath:destination.fullPath});
}

async function confirmFileUpload() {
    const files = [...pendingUploadFiles];
    const choices = pendingSliceChoices.map(choice => choice ? {...choice, options:choice.options} : null);
    const destination = pendingUploadDestination;
    if (!files.length) {
        closeUploadDialog();
        return;
    }
    const button = $('#confirmUploadButton');
    const cutting = choices.some(choice => plannedPieceCount(choice) > 1);
    if (button) {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        button.textContent = cutting ? 'Cutting…' : `Uploading ${files.length}…`;
    }
    const error = $('#uploadDialogError');
    if (error) {
        error.hidden = true;
        error.textContent = '';
    }
    let prepared = files;
    try {
        prepared = await expandUploadFiles(files, choices);
    } catch (problem) {
        if (button) {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
        if (error) {
            error.hidden = false;
            error.textContent = problem.message || 'Could not cut that screenshot.';
        }
        renderSliceOffer();
        return;
    }
    ensureUploadFolder(destination);
    const added = await handleFiles(prepared, uploadTagsFromInput($('#uploadTagInput')?.value), destination?.fullPath || uploadFolder());
    if (added.length) {
        if (destination) added.forEach(screen => selectedPickerScreenIds.add(screen.id));
        closeUploadDialog();
        if (destination && $('#photoDialog')?.open) {
            renderPhotoPicker();
            $(`[data-action="pick-photo"][data-id="${CSS.escape(added[0].id)}"]`)?.focus();
        }
    } else if (button) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = `Try uploading ${prepared.length} again`;
    }
}

async function handleFiles(files, uploadTags = [], folder = uploadFolder()) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return []; }
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

function pickerUploadDestination() {
    const project = activeProject();
    const folders = project?.folders || [];
    if (pickerUploadFolder === '__new__' || !folders.length) {
        const name = ($('#pickerUploadName')?.value || '').trim();
        if (!name) return {error:'Name the new folder before choosing photos.'};
        const app = project.name.split('—')[0].trim();
        const fullPath = `${app} / ${name}`;
        return {fullPath, create:!folders.some(folder => folder.fullPath === fullPath), app, platform:name};
    }
    if (!folders.some(folder => folder.fullPath === pickerUploadFolder)) return {error:'Choose a library folder.'};
    return {fullPath:pickerUploadFolder, create:false};
}

function choosePickerUpload() {
    if (pickerUploadBusy) return;
    const destination = pickerUploadDestination();
    if (destination.error) { toast(destination.error, 'warn'); $('#pickerUploadName')?.focus(); return; }
    pendingPickerUpload = destination;
    $('#storyUploadInput')?.click();
}

async function uploadPickerFiles(files) {
    const destination = pendingPickerUpload;
    pendingPickerUpload = null;
    const images = [...files].filter(file => file.type.startsWith('image/'));
    if (!destination || !images.length) {
        if (destination && !images.length) toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn');
        return;
    }
    const choices = await Promise.all(images.map(measureSliceChoice));
    if (choices.some(choice => choice?.long)) {
        presentUploadDialog(images, choices, destination);
        return;
    }
    ensureUploadFolder(destination);
    pickerUploadBusy = true;
    pickerUploadFolder = destination.fullPath;
    renderPhotoPicker();
    const added = await handleFiles(images, [], destination.fullPath);
    pickerUploadBusy = false;
    if (!added.length) { renderPhotoPicker(); return; }
    added.forEach(screen => selectedPickerScreenIds.add(screen.id));
    renderPhotoPicker();
    $(`[data-action="pick-photo"][data-id="${CSS.escape(added[0].id)}"]`)?.focus();
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
    pendingSliceChoices = [];
    pendingUploadDestination = null;
    $('#uploadDialog')?.classList.remove('slicing');
    const offer = $('#sliceOffer');
    if (offer) {
        offer.hidden = true;
        offer.innerHTML = '';
    }
    $('#uploadForm').reset();
    const error = $('#uploadDialogError');
    if (error) {
        error.hidden = true;
        error.textContent = '';
    }
});

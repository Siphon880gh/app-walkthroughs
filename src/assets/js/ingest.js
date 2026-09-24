async function fileToScreen(file, folder) {
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
    const dimensions = await new Promise(resolve => {
        const image = new Image();
        image.onload = () => resolve({width:image.naturalWidth,height:image.naturalHeight});
        image.onerror = () => resolve({width:1280,height:720});
        image.src = dataUrl;
    });
    const [app, platform = 'Web'] = folder.split(' / ');
    return {
        id:uid('screen'), name:file.name || `Pasted screen ${new Date().toLocaleTimeString()}`, dataUrl, folder, app, platform,
        width:dimensions.width, height:dimensions.height, deviceFrame:dimensions.width <= 520 ? 'iphone':'desktop',
        tags:[slug(app),slug(platform)], uploadedAt:Date.now(), analysis:{userAction:'',screenContent:'',nextAction:''}, annotations:[]
    };
}

async function handleFiles(files) {
    const images = files.filter(file => file.type.startsWith('image/'));
    if (!images.length) { toast('Choose PNG, JPEG, WebP, GIF, or SVG images.', 'warn'); return; }
    const project = activeProject();
    const folder = selectedFolder || project.folders?.[0]?.fullPath || `${project.name} / Web`;
    toast(`Processing ${images.length} screen${images.length === 1 ? '':'s'}…`);
    const added = await Promise.all(images.map(file => fileToScreen(file, folder)));
    project.screenshots.push(...added);
    project.activeScreenshotId = added[0].id;
    persist(true);
    toast(`${added.length} screen${added.length === 1 ? '':'s'} added to ${folder}.`);
}

const URL_IMAGE_TYPES = ['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'];

async function urlToFile(url) {
    const fallbackName = decodeURIComponent(url.pathname.split('/').pop() || '') || 'Linked screen';
    try {
        const response = await fetch(url.href, {mode:'cors', credentials:'omit', referrerPolicy:'no-referrer'});
        const blob = response.ok ? await response.blob() : null;
        const type = blob?.type.split(';')[0].trim().toLowerCase();
        if (blob && URL_IMAGE_TYPES.includes(type)) return new File([blob], fallbackName, {type});
    } catch {}
    const response = await fetch('?action=fetch-image', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url:url.href})
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.error || `Could not load that URL (HTTP ${response.status}).`);
    const blob = await (await fetch(result.dataUrl)).blob();
    return new File([blob], result.name || fallbackName, {type:blob.type});
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
        const file = await urlToFile(url);
        $('#urlDialog').close();
        await handleFiles([file]);
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


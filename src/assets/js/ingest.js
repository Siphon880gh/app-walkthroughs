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


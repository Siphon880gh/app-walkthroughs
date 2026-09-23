function bindDynamicUI() {
    const dropZone = $('#dropZone');
    if (dropZone) {
        ['dragenter','dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('dragover'); }));
        ['dragleave','drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('dragover'); }));
        dropZone.addEventListener('drop', event => handleFiles([...event.dataTransfer.files]));
    }
    const canvas = $('#annotationCanvas');
    if (canvas) bindAnnotationCanvas(canvas);
}

function canvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
        y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100)
    };
}

function bindAnnotationCanvas(canvas) {
    let start = null;
    const screen = activeScreen();
    if (!screen) return;
    screen.annotations ||= [];

    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.ann-remove')) return;
        event.preventDefault();
        const point = canvasPoint(event, canvas);
        if (selectedTool === 'callout-pin' || selectedTool === 'text-box') {
            rememberAnnotations(screen);
            screen.annotations.push({
                id: uid('ann'), type:selectedTool, x:point.x, y:point.y, width:0, height:0,
                color:selectedColor, strokeWidth:3, numberBadge:screen.annotations.length+1,
                label:selectedTool === 'text-box' ? 'Interface note' : 'Callout'
            });
            persist();
            renderApp();
            return;
        }
        start = point;
        canvas.setPointerCapture(event.pointerId);
        draftAnnotation = {id:'draft',type:selectedTool,x:point.x,y:point.y,width:0,height:0,color:selectedColor,strokeWidth:3};
    });

    canvas.addEventListener('pointermove', event => {
        if (!start || !draftAnnotation) return;
        const point = canvasPoint(event, canvas);
        if (selectedTool === 'arrow') {
            draftAnnotation = {...draftAnnotation, width:point.x-start.x, height:point.y-start.y};
        } else {
            draftAnnotation = {...draftAnnotation, x:Math.min(start.x,point.x), y:Math.min(start.y,point.y), width:Math.abs(point.x-start.x), height:Math.abs(point.y-start.y)};
        }
        $('#annotationLayer').innerHTML = annotationMarkup(screen.annotations, true);
    });

    canvas.addEventListener('pointerup', event => {
        if (!start || !draftAnnotation) return;
        if (selectedTool === 'arrow' || Math.abs(draftAnnotation.width) > 1 || Math.abs(draftAnnotation.height) > 1) {
            rememberAnnotations(screen);
            screen.annotations.push({...draftAnnotation, id:uid('ann')});
            persist();
        }
        start = null;
        draftAnnotation = null;
        renderApp();
    });

    canvas.addEventListener('pointercancel', () => { start = null; draftAnnotation = null; renderApp(); });
}


function bindDynamicUI() {
    const dropZone = $('#dropZone');
    if (dropZone) {
        ['dragenter','dragover'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.add('dragover'); }));
        ['dragleave','drop'].forEach(type => dropZone.addEventListener(type, event => { event.preventDefault(); dropZone.classList.remove('dragover'); }));
        dropZone.addEventListener('drop', event => handleFiles([...event.dataTransfer.files]));
    }
    const canvas = $('#annotationCanvas');
    if (canvas) bindAnnotationCanvas(canvas);
    bindHotspotDrag();
}

function paintStoryHotspot(step) {
    const hotspot = $('.step-canvas .hotspot-edit');
    if (!hotspot || !step?.interaction) return;
    hotspot.style.setProperty('--x', `${Number(step.interaction.xPercent)}%`);
    hotspot.style.setProperty('--y', `${Number(step.interaction.yPercent)}%`);
    const label = $('.hotspot-label', hotspot);
    if (label) label.textContent = step.interaction.label || 'Hotspot';
}

function placeHotspot(event, screen, hotspot) {
    const step = activeStep();
    if (!step?.interaction) return;
    const rect = screen.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    step.interaction.xPercent = Math.round(clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100) * 10) / 10;
    step.interaction.yPercent = Math.round(clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100) * 10) / 10;
    paintStoryHotspot(step);
    const xInput = $('[data-interaction-field="xPercent"]');
    const yInput = $('[data-interaction-field="yPercent"]');
    if (xInput) xInput.value = step.interaction.xPercent;
    if (yInput) yInput.value = step.interaction.yPercent;
}

function bindHotspotDrag() {
    const hotspot = $('.step-canvas .hotspot-edit');
    const screen = hotspot?.closest('.device-screen');
    if (!hotspot || !screen) return;
    hotspot.addEventListener('click', event => event.stopPropagation());
    hotspot.addEventListener('pointerdown', event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        try { hotspot.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
        const move = ev => placeHotspot(ev, screen, hotspot);
        const up = ev => {
            hotspot.removeEventListener('pointermove', move);
            hotspot.removeEventListener('pointerup', up);
            placeHotspot(ev, screen, hotspot);
            persist();
        };
        hotspot.addEventListener('pointermove', move);
        hotspot.addEventListener('pointerup', up);
    });
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
    let gesture = null;
    const screen = activeScreen();
    if (!screen) return;
    screen.annotations ||= [];

    canvas.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target.closest('.ann-remove')) return;
        const resizeHandle = event.target.closest('[data-resize-note]');
        const noteEl = event.target.closest('.ann.text');
        if (resizeHandle || noteEl) {
            event.preventDefault();
            const id = resizeHandle?.dataset.resizeNote || noteEl.dataset.annId;
            const ann = screen.annotations.find(item => item.id === id && item.type === 'text-box');
            if (!ann) return;
            if (ann.id !== selectedAnnotationId) {
                if (measureNoteBox(ann)) persist();
                selectedAnnotationId = ann.id;
                renderApp();
                focusNoteLabel();
                return;
            }
            measureNoteBox(ann);
            gesture = {
                mode: resizeHandle ? 'resize' : 'move',
                id: ann.id,
                start: canvasPoint(event, canvas),
                origin: {x: Number(ann.x) || 0, y: Number(ann.y) || 0, width: Number(ann.width) || 8, height: Number(ann.height) || 4},
                moved: false
            };
            canvas.setPointerCapture(event.pointerId);
            return;
        }
        event.preventDefault();
        if (selectedTool === 'select') {
            const hit = event.target.closest('[data-ann-id]');
            const id = hit?.dataset.annId;
            const ann = id && id !== 'draft' ? screen.annotations.find(item => item.id === id) : null;
            selectedAnnotationId = ann?.id || null;
            renderApp();
            if (ann?.type === 'text-box') focusNoteLabel();
            return;
        }
        const point = canvasPoint(event, canvas);
        if (selectedTool === 'callout-pin' || selectedTool === 'text-box') {
            rememberAnnotations(screen);
            const isText = selectedTool === 'text-box';
            const width = isText ? 28 : 0;
            const height = isText ? 14 : 0;
            const id = uid('ann');
            screen.annotations.push({
                id, type: selectedTool,
                x: isText ? clamp(point.x, 0, 100 - width) : point.x,
                y: isText ? clamp(point.y, 0, 100 - height) : point.y,
                width, height,
                color: selectedColor, strokeWidth: 3, numberBadge: screen.annotations.length + 1,
                label: isText ? 'Interface note' : 'Callout',
                opacity: 1, glow: 0, fontSize: isText ? 13 : undefined, fontWeight: isText ? 700 : undefined
            });
            selectedAnnotationId = isText ? id : null;
            persist();
            renderApp();
            if (isText) focusNoteLabel();
            return;
        }
        selectedAnnotationId = null;
        start = point;
        canvas.setPointerCapture(event.pointerId);
        draftAnnotation = {id:'draft',type:selectedTool,x:point.x,y:point.y,width:0,height:0,color:selectedColor,strokeWidth:3};
    });

    canvas.addEventListener('pointermove', event => {
        if (gesture) {
            const ann = screen.annotations.find(item => item.id === gesture.id);
            if (!ann) return;
            const point = canvasPoint(event, canvas);
            const dx = point.x - gesture.start.x;
            const dy = point.y - gesture.start.y;
            if (!gesture.moved) {
                if (Math.abs(dx) + Math.abs(dy) < .5) return;
                rememberAnnotations(screen);
                gesture.moved = true;
            }
            if (gesture.mode === 'resize') {
                ann.width = clamp(gesture.origin.width + dx, 8, 96);
                ann.height = clamp(gesture.origin.height + dy, 4, 80);
            } else {
                ann.x = clamp(gesture.origin.x + dx, 0, Math.max(0, 100 - ann.width));
                ann.y = clamp(gesture.origin.y + dy, 0, Math.max(0, 100 - ann.height));
            }
            paintTextNote(ann);
            $(`.ann.text[data-ann-id="${CSS.escape(ann.id)}"]`)?.classList.add('moving');
            return;
        }
        if (!start || !draftAnnotation) return;
        const point = canvasPoint(event, canvas);
        if (selectedTool === 'arrow') {
            draftAnnotation = {...draftAnnotation, width:point.x-start.x, height:point.y-start.y};
        } else {
            draftAnnotation = {...draftAnnotation, x:Math.min(start.x,point.x), y:Math.min(start.y,point.y), width:Math.abs(point.x-start.x), height:Math.abs(point.y-start.y)};
        }
        $('#annotationLayer').innerHTML = annotationMarkup(screen.annotations, true);
    });

    canvas.addEventListener('pointerup', () => {
        if (gesture) {
            const changed = gesture.moved;
            gesture = null;
            if (changed) {
                persist();
                renderApp();
            }
            return;
        }
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

    canvas.addEventListener('pointercancel', () => {
        if (gesture) { gesture = null; renderApp(); return; }
        start = null;
        draftAnnotation = null;
        renderApp();
    });
}

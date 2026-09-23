function renderFilmstrip() {
    const project = activeProject();
    const items = project.screenshots.map((screen, index) => `<button class="film-item ${project.activeScreenshotId === screen.id ? 'active':''}" data-action="select-screen" data-id="${esc(screen.id)}"><div class="film-thumb"><img src="${safeImage(screen.dataUrl)}" alt=""></div><div class="film-name"><span style="font-family:var(--mono);color:var(--dim);margin-right:4px">${String(index+1).padStart(2,'0')}</span>${esc(screen.name)}${screen.annotated ? ' <span class="tag">Annotated</span>' : ''}</div></button>`).join('');
    return `<aside class="filmstrip"><div class="panel-head"><h2>Screen source</h2><span class="eyebrow">${project.screenshots.length}</span></div><div class="panel-scroll">${items}</div></aside>`;
}

const annotationHistories = new Map();
const ANNOTATION_HISTORY_LIMIT = 50;

function annotationHistory(screenId) {
    return annotationHistories.get(screenId) || {past: [], future: []};
}

function rememberAnnotations(screen) {
    if (!screen) return;
    const history = annotationHistories.get(screen.id) || {past: [], future: []};
    history.past.push(structuredClone(screen.annotations || []));
    if (history.past.length > ANNOTATION_HISTORY_LIMIT) history.past.shift();
    history.future = [];
    annotationHistories.set(screen.id, history);
}

function undoAnnotations() {
    const screen = activeScreen();
    const history = screen && annotationHistories.get(screen.id);
    if (!history?.past.length) return;
    history.future.push(structuredClone(screen.annotations || []));
    screen.annotations = history.past.pop();
    persist(true);
}

function redoAnnotations() {
    const screen = activeScreen();
    const history = screen && annotationHistories.get(screen.id);
    if (!history?.future.length) return;
    history.past.push(structuredClone(screen.annotations || []));
    screen.annotations = history.future.pop();
    persist(true);
}

function forgetAnnotationHistory(screenId) {
    annotationHistories.delete(screenId);
}

function removeHandlePoint(ann) {
    const x = Number(ann.x) || 0;
    const y = Number(ann.y) || 0;
    const width = Number(ann.width) || 0;
    const height = Number(ann.height) || 0;
    if (ann.type === 'arrow') return {x: x + width / 2, y: y + height / 2, kind: 'arrow'};
    if (ann.type === 'callout-pin') return {x, y, kind: 'pin'};
    if (ann.type === 'text-box') return {x: x + width, y, kind: width > 0 ? 'text-sized' : 'text'};
    return {x: x + width, y, kind: 'box'};
}

function selectedAnnotation(screen = activeScreen()) {
    if (!screen || !selectedAnnotationId) return null;
    return (screen.annotations || []).find(item => item.id === selectedAnnotationId) || null;
}

function selectedTextAnnotation(screen = activeScreen()) {
    const ann = selectedAnnotation(screen);
    return ann?.type === 'text-box' ? ann : null;
}

function markSelectedClass(ann, interactive) {
    return interactive && ann.id === selectedAnnotationId ? ' selected' : '';
}

function noteOpacityPercent(ann) {
    const value = ann?.opacity == null ? 1 : Number(ann.opacity);
    return Math.round(clamp(value, 0.15, 1) * 100);
}

function noteFontWeight(ann) {
    const value = Number(ann?.fontWeight || 700);
    return clamp(Math.round(value / 100) * 100, 400, 800);
}

function textNoteStyle(ann) {
    const width = Number(ann.width) || 0;
    const height = Number(ann.height) || 0;
    const glow = clamp(Number(ann.glow || 0), 0, 28);
    const font = clamp(Number(ann.fontSize || 13), 10, 32);
    const opacity = ann.opacity == null ? 1 : clamp(Number(ann.opacity), 0.15, 1);
    const parts = [
        `--ann-color:${esc(ann.color || selectedColor)}`,
        `--ann-opacity:${opacity}`,
        `--ann-glow:${glow}px`,
        `--ann-font:${font}px`,
        `--ann-weight:${noteFontWeight(ann)}`,
        `font-weight:${noteFontWeight(ann)}`,
        `left:${Number(ann.x) || 0}%`,
        `top:${Number(ann.y) || 0}%`
    ];
    if (width > 0) parts.push(`width:${Math.max(width, .01)}%`);
    if (height > 0) parts.push(`height:${Math.max(height, .01)}%`);
    return parts.join(';');
}

function paintNoteWeight(body, ann) {
    if (!body) return;
    const weight = String(noteFontWeight(ann));
    const current = $('.ann-text-weight', body);
    if (current && current.style.fontWeight === weight) {
        current.textContent = ann.label || 'Note';
        return;
    }
    const text = document.createElement('span');
    text.className = 'ann-text-weight';
    text.style.fontWeight = weight;
    text.textContent = ann.label || 'Note';
    body.replaceChildren(text);
}

function paintTextNote(ann) {
    const node = $(`.ann.text[data-ann-id="${CSS.escape(ann.id)}"]`);
    if (!node) return;
    node.setAttribute('style', textNoteStyle(ann));
    node.classList.toggle('has-glow', Number(ann.glow) > 0);
    paintNoteWeight($('.ann-text-body', node), ann);
    const remove = $(`.ann-remove[data-id="${CSS.escape(ann.id)}"]`);
    if (remove) {
        const point = removeHandlePoint(ann);
        remove.style.left = `${point.x}%`;
        remove.style.top = `${point.y}%`;
    }
}

function measureNoteBox(ann) {
    if (Number(ann.width) > 1 && Number(ann.height) > 1) return false;
    const node = $(`.ann.text[data-ann-id="${CSS.escape(ann.id)}"]`);
    const canvas = $('#annotationCanvas');
    if (!node || !canvas) return false;
    const canvasRect = canvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return false;
    const rect = node.getBoundingClientRect();
    ann.width = clamp((rect.width / canvasRect.width) * 100, 8, 92);
    ann.height = clamp((rect.height / canvasRect.height) * 100, 4, 70);
    return true;
}

function focusNoteLabel() {
    const field = $('#noteLabel');
    if (!field) return;
    field.focus();
    field.select();
}

function textNoteMarkup(ann, interactive) {
    const selected = interactive && ann.id === selectedAnnotationId;
    const glow = Number(ann.glow || 0) > 0;
    const handle = selected ? `<button type="button" class="ann-resize" data-resize-note="${esc(ann.id)}" aria-label="Resize note" title="Drag to resize"></button>` : '';
    return `<div class="ann text${selected ? ' selected' : ''}${glow ? ' has-glow' : ''}${ann.id === 'draft' ? ' draft-ann' : ''}" data-ann-id="${esc(ann.id)}" style="${textNoteStyle(ann)}"><div class="ann-text-body"><span class="ann-text-weight" style="font-weight:${noteFontWeight(ann)}">${esc(ann.label || 'Note')}</span></div>${handle}</div>`;
}

function paintMark(ann) {
    const node = $(`[data-ann-id="${CSS.escape(ann.id)}"]`);
    if (!node) return;
    node.style.setProperty('--ann-color', ann.color || selectedColor);
    if (ann.type === 'callout-pin') {
        node.style.setProperty('--ann-size', `${clamp(Number(ann.size || 28), 16, 48)}px`);
        return;
    }
    node.style.setProperty('--ann-stroke', `${clamp(Number(ann.strokeWidth || 3), 1, 12)}px`);
    if (ann.type !== 'arrow') {
        node.style.width = `${Math.max(Number(ann.width || 0), .01)}%`;
        node.style.height = `${Math.max(Number(ann.height || 0), .01)}%`;
    }
}

function renderMarkEditor(ann) {
    if (!ann || ann.type === 'text-box') return '';
    const stroke = Math.round(clamp(Number(ann.strokeWidth || 3), 1, 12));
    const colors = PALETTE.map(color => `<button type="button" class="tool-button" data-action="select-color" data-color="${color}" aria-label="Mark color ${color}"><span class="color-dot ${ann.color === color ? 'active' : ''}" style="background:${color}"></span></button>`).join('');
    let sizeRows = '';
    if (ann.type === 'callout-pin') {
        const size = Math.round(clamp(Number(ann.size || 28), 16, 48));
        sizeRows = `<label class="range-row"><span>SIZE</span><input type="range" min="16" max="48" step="1" data-mark-field="size" value="${size}" aria-label="Pin size"><span class="range-value">${size}</span></label>`;
    } else if (ann.type === 'arrow') {
        sizeRows = `<label class="range-row"><span>SIZE</span><input type="range" min="1" max="12" step="1" data-mark-field="strokeWidth" value="${stroke}" aria-label="Arrow size"><span class="range-value">${stroke}</span></label>`;
    } else {
        const width = Math.round(clamp(Number(ann.width) || 12, 1, 100));
        const height = Math.round(clamp(Number(ann.height) || 8, 1, 100));
        sizeRows = `<label class="range-row"><span>WIDTH</span><input type="range" min="1" max="100" step="1" data-mark-field="width" value="${width}" aria-label="Mark width"><span class="range-value">${width}</span></label><label class="range-row"><span>HEIGHT</span><input type="range" min="1" max="100" step="1" data-mark-field="height" value="${height}" aria-label="Mark height"><span class="range-value">${height}</span></label><label class="range-row"><span>SIZE</span><input type="range" min="1" max="12" step="1" data-mark-field="strokeWidth" value="${stroke}" aria-label="Stroke size"><span class="range-value">${stroke}</span></label>`;
    }
    const title = ann.type === 'callout-pin' ? 'PIN' : ann.type === 'highlight' ? 'HIGHLIGHT' : ann.type === 'spotlight' ? 'SPOTLIGHT' : ann.type === 'arrow' ? 'ARROW' : 'BOX';
    return `<div class="section mark-editor"><div class="section-title"><span>${title}</span><button type="button" class="button ghost small danger" data-action="delete-annotation" data-id="${esc(ann.id)}">Remove</button></div><div class="field"><span class="field-label">COLOR</span><div class="tool-group note-colors">${colors}</div></div>${sizeRows}<p class="note-hint">Select is the cursor. Click a mark to change its color or size.</p></div>`;
}

function renderNoteEditor(ann) {
    if (!ann) return '';
    const opacity = noteOpacityPercent(ann);
    const glow = Math.round(clamp(Number(ann.glow || 0), 0, 28));
    const font = Math.round(clamp(Number(ann.fontSize || 13), 10, 32));
    const weight = noteFontWeight(ann);
    const width = Math.round(clamp(Number(ann.width) || 28, 8, 92));
    const height = Math.round(clamp(Number(ann.height) || 14, 4, 70));
    const colors = PALETTE.map(color => `<button type="button" class="tool-button" data-action="select-color" data-color="${color}" aria-label="Note color ${color}"><span class="color-dot ${ann.color === color ? 'active' : ''}" style="background:${color}"></span></button>`).join('');
    return `<div class="section note-editor"><div class="section-title"><span>INTERFACE NOTE</span><button type="button" class="button ghost small danger" data-action="delete-annotation" data-id="${esc(ann.id)}">Remove</button></div><label class="field"><span class="field-label">NOTE</span><textarea class="textarea" id="noteLabel" data-note-field="label" rows="3">${esc(ann.label || '')}</textarea></label><label class="range-row"><span>TYPE</span><input type="range" min="10" max="32" step="1" data-note-field="fontSize" value="${font}" aria-label="Type size"><span class="range-value">${font}</span></label><label class="range-row"><span>WEIGHT</span><input type="range" min="400" max="800" step="100" data-note-field="fontWeight" value="${weight}" aria-label="Font weight"><span class="range-value">${weight}</span></label><label class="range-row"><span>WIDTH</span><input type="range" min="8" max="92" step="1" data-note-field="width" value="${width}" aria-label="Note width"><span class="range-value">${width}</span></label><label class="range-row"><span>HEIGHT</span><input type="range" min="4" max="70" step="1" data-note-field="height" value="${height}" aria-label="Note height"><span class="range-value">${height}</span></label><div class="field"><span class="field-label">COLOR</span><div class="tool-group note-colors">${colors}</div></div><label class="range-row"><span>OPACITY</span><input type="range" min="15" max="100" step="1" data-note-field="opacity" value="${opacity}" aria-label="Note opacity"><span class="range-value">${opacity}</span></label><label class="range-row"><span>GLOW</span><input type="range" min="0" max="28" step="1" data-note-field="glow" value="${glow}" aria-label="Note glow"><span class="range-value">${glow}</span></label><p class="note-hint">Drag the note to move it. Drag the corner to resize the box. Glow at 0 is off.</p></div>`;
}

function removeHandleMarkup(ann) {
    const point = removeHandlePoint(ann);
    const offsetClass = point.kind === 'box' || point.kind === 'arrow' ? '' : ` on-${point.kind}`;
    return `<button type="button" class="ann-remove${offsetClass}" style="left:${point.x}%;top:${point.y}%" data-action="delete-annotation" data-id="${esc(ann.id)}" aria-label="Remove annotation" title="Remove annotation">×</button>`;
}

function annotationMarkup(annotations = [], includeDraft = false) {
    const all = includeDraft && draftAnnotation ? [...annotations, {...draftAnnotation, id:'draft'}] : annotations;
    const marks = all.map((ann, index) => {
        const draftClass = ann.id === 'draft' ? ' draft-ann' : '';
        const selectedClass = markSelectedClass(ann, includeDraft);
        const idAttr = ` data-ann-id="${esc(ann.id)}"`;
        const style = `--ann-color:${esc(ann.color || selectedColor)};--ann-stroke:${Number(ann.strokeWidth || 3)}px;left:${Number(ann.x)}%;top:${Number(ann.y)}%;width:${Math.max(Number(ann.width || 0), .01)}%;height:${Math.max(Number(ann.height || 0), .01)}%`;
        if (ann.type === 'callout-pin') return `<div class="ann pin${draftClass}${selectedClass}"${idAttr} style="--ann-color:${esc(ann.color)};--ann-size:${clamp(Number(ann.size || 28), 16, 48)}px;left:${Number(ann.x)}%;top:${Number(ann.y)}%"><span>${Number(ann.numberBadge || index + 1)}</span></div>`;
        if (ann.type === 'text-box') return textNoteMarkup(ann, includeDraft);
        if (ann.type === 'arrow') {
            const dx = Number(ann.width || 0), dy = Number(ann.height || 0);
            const length = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return `<div class="ann-arrow${draftClass}${selectedClass}"${idAttr} style="--ann-color:${esc(ann.color)};--ann-stroke:${Number(ann.strokeWidth || 3)}px;left:${Number(ann.x)}%;top:${Number(ann.y)}%;width:${length}%;transform:rotate(${angle}deg)"></div>`;
        }
        const typeClass = ann.type === 'rectangle' ? 'rect' : ann.type;
        return `<div class="ann ${typeClass}${draftClass}${selectedClass}"${idAttr} style="${style}"></div>`;
    }).join('');
    const handles = includeDraft && showRemoveHandles ? all.filter(ann => ann.id !== 'draft').map(removeHandleMarkup).join('') : '';
    return marks + handles;
}

function renderEditor() {
    const project = activeProject();
    const screen = activeScreen();
    if (!screen) return `<section class="main-pane">${renderEmpty('Add a screenshot first','Annotation tools become available once the project contains a screen.','screenshots','Open library')}</section>`;
    const analysis = screen.analysis || {userAction:'',screenContent:'',nextAction:''};
    const annotations = screen.annotations || [];
    const tools = [['select','Select'],['callout-pin','Pin'],['highlight','Highlight'],['rectangle','Box'],['arrow','Arrow'],['text-box','Text'],['spotlight','Spotlight']];
    const toolIcon = value => value === 'select'
        ? `<svg class="tool-icon" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M3.15 1.2 2.85 12.7l3.2-3.2 2.25 4.85 1.9-.9-2.25-4.8h4.7z"/></svg>`
        : value === 'callout-pin' ? '●' : value === 'highlight' ? '▧' : value === 'rectangle' ? '□' : value === 'arrow' ? '↗' : value === 'text-box' ? 'T' : '◉';
    const toolButtons = tools.map(([value,label]) => `<button class="tool-button ${selectedTool === value ? 'active':''}" data-action="select-tool" data-tool="${value}" title="${label}" aria-label="${label} tool">${toolIcon(value)}<span>${label}</span></button>`).join('');
    const colors = PALETTE.map(color => `<button class="tool-button" data-action="select-color" data-color="${color}" aria-label="Use ${color}"><span class="color-dot ${selectedColor === color ? 'active':''}" style="background:${color}"></span></button>`).join('');
    const annotationRows = annotations.map((ann, index) => {
        const isText = ann.type === 'text-box';
        const name = isText ? (ann.label || 'Interface note') : ann.type.replace('-', ' ');
        const selected = ann.id === selectedAnnotationId ? ' selected' : '';
        const nameMarkup = `<button type="button" class="annotation-pick" data-action="select-annotation" data-id="${esc(ann.id)}"${isText ? ' data-focus="note"' : ''}>${index + 1}. ${esc(name)}</button>`;
        return `<div class="annotation-row${selected}"><span class="annotation-swatch" style="--swatch:${esc(ann.color)}"></span>${nameMarkup}<button class="button ghost icon-only small danger" data-action="delete-annotation" data-id="${esc(ann.id)}" aria-label="Delete annotation">×</button></div>`;
    }).join('');
    const history = annotationHistory(screen.id);
    const historyButtons = `<button class="tool-button" data-action="undo-annotation" title="Undo last annotation" aria-label="Undo last annotation" ${history.past.length ? '' : 'disabled'}>↩<span>Undo</span></button><button class="tool-button" data-action="redo-annotation" title="Redo annotation" aria-label="Redo annotation" ${history.future.length ? '' : 'disabled'}>↪<span>Redo</span></button><button class="tool-button ${showRemoveHandles ? 'active' : ''}" data-action="toggle-remove-handles" aria-pressed="${showRemoveHandles ? 'true' : 'false'}" title="Show a remove mark on every annotation">×<span>Show</span></button>`;
    return `<section class="main-pane"><div class="studio-layout">${renderFilmstrip()}<div class="stage-shell"><div class="stage-toolbar"><div class="tool-group draw-tools">${toolButtons}</div><div class="tool-group">${historyButtons}</div><div class="tool-group">${colors}</div></div><div class="stage"><div class="canvas-wrap ${screen.deviceFrame === 'desktop' ? 'desktop':'mobile'}${selectedTool === 'select' ? ' tool-select' : ''}" id="annotationCanvas" data-screen-id="${esc(screen.id)}"><img src="${safeImage(screen.dataUrl)}" alt="Annotating ${esc(screen.name)}" draggable="false"><div class="annotation-layer" id="annotationLayer">${annotationMarkup(annotations, true)}</div></div></div><div class="stage-status"><span>${screen.width} × ${screen.height} · COORDINATES NORMALIZED 0–100%</span><span>${annotations.length} ANNOTATION${annotations.length === 1 ? '':'S'}</span></div></div><aside class="inspector"><div class="panel-head"><h2>Snapshot inspector</h2><span class="tag">${esc(screen.platform)}</span></div><div class="inspector-tabs"><button class="inspector-tab ${inspectorTab === 'analysis' ? 'active':''}" data-action="inspector-tab" data-tab="analysis">Analysis</button><button class="inspector-tab ${inspectorTab === 'layers' ? 'active':''}" data-action="inspector-tab" data-tab="layers">Layers (${annotations.length})</button></div><div class="panel-scroll" style="padding:0">${renderNoteEditor(selectedTextAnnotation(screen))}${renderMarkEditor(selectedAnnotation(screen))}${inspectorTab === 'analysis' ? `<div class="section"><label class="field"><span class="field-label">SNAPSHOT NAME</span><input class="input" data-screen-field="name" value="${esc(screen.name)}"></label></div><div class="section"><div class="section-title"><span>BEHAVIORAL TRIAD</span><span class="tag">Required</span></div><label class="field"><span class="field-label"><span><span class="field-number">1</span>WHAT THE USER IS DOING</span></span><textarea class="textarea" data-analysis-field="userAction" placeholder="Describe the intent and action…">${esc(analysis.userAction)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">2</span>WHAT IS VISIBLE</span></span><textarea class="textarea" data-analysis-field="screenContent" placeholder="Describe the visible interface state…">${esc(analysis.screenContent)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">3</span>WHAT HAPPENS NEXT</span></span><textarea class="textarea" data-analysis-field="nextAction" placeholder="Describe the expected result…">${esc(analysis.nextAction)}</textarea></label></div><div class="section"><button class="button primary" style="width:100%" data-action="save-snapshot">Save snapshot</button><button class="button" style="width:100%;margin-top:7px" data-action="add-to-story" data-id="${esc(screen.id)}">Add to walkthrough</button></div>` : `<div class="section"><div class="section-title"><span>ANNOTATIONS</span><button class="button ghost small danger" data-action="clear-annotations" ${annotations.length ? '':'disabled'}>Clear all</button></div><div class="annotation-list">${annotationRows || '<p style="color:var(--dim);font-size:10px;line-height:1.5">Choose a tool and draw directly on the screen. Coordinates remain stable at any display size.</p>'}</div></div><div class="section"><div class="section-title">DRAWING HELP</div><p style="color:var(--dim);font-size:10px;line-height:1.6">Select is the cursor. Click a mark to change its color or size. Click a text note to edit its words. Drag a selected note to move it, and drag its corner to resize. Pins are placed with a click. Highlights, boxes, arrows, and spotlights are drawn by dragging.</p></div>`}</div></aside></div></section>`;
}


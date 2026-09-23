function renderFilmstrip() {
    const project = activeProject();
    const items = project.screenshots.map((screen, index) => `<button class="film-item ${project.activeScreenshotId === screen.id ? 'active':''}" data-action="select-screen" data-id="${esc(screen.id)}"><div class="film-thumb"><img src="${safeImage(screen.dataUrl)}" alt=""></div><div class="film-name"><span style="font-family:var(--mono);color:var(--dim);margin-right:4px">${String(index+1).padStart(2,'0')}</span>${esc(screen.name)}</div></button>`).join('');
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
    if (ann.type === 'text-box') return {x, y, kind: 'text'};
    return {x: x + width, y, kind: 'box'};
}

function removeHandleMarkup(ann) {
    const point = removeHandlePoint(ann);
    const offsetClass = point.kind === 'pin' || point.kind === 'text' ? ` on-${point.kind}` : '';
    return `<button type="button" class="ann-remove${offsetClass}" style="left:${point.x}%;top:${point.y}%" data-action="delete-annotation" data-id="${esc(ann.id)}" aria-label="Remove annotation" title="Remove annotation">×</button>`;
}

function annotationMarkup(annotations = [], includeDraft = false) {
    const all = includeDraft && draftAnnotation ? [...annotations, {...draftAnnotation, id:'draft'}] : annotations;
    const marks = all.map((ann, index) => {
        const draftClass = ann.id === 'draft' ? ' draft-ann' : '';
        const style = `--ann-color:${esc(ann.color || selectedColor)};--ann-stroke:${Number(ann.strokeWidth || 3)}px;left:${Number(ann.x)}%;top:${Number(ann.y)}%;width:${Math.max(Number(ann.width || 0), .01)}%;height:${Math.max(Number(ann.height || 0), .01)}%`;
        if (ann.type === 'callout-pin') return `<div class="ann pin${draftClass}" style="--ann-color:${esc(ann.color)};left:${Number(ann.x)}%;top:${Number(ann.y)}%"><span>${Number(ann.numberBadge || index + 1)}</span></div>`;
        if (ann.type === 'text-box') return `<div class="ann text${draftClass}" style="--ann-color:${esc(ann.color)};left:${Number(ann.x)}%;top:${Number(ann.y)}%">${esc(ann.label || 'Note')}</div>`;
        if (ann.type === 'arrow') {
            const dx = Number(ann.width || 0), dy = Number(ann.height || 0);
            const length = Math.sqrt(dx*dx + dy*dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            return `<div class="ann-arrow${draftClass}" style="--ann-color:${esc(ann.color)};--ann-stroke:${Number(ann.strokeWidth || 3)}px;left:${Number(ann.x)}%;top:${Number(ann.y)}%;width:${length}%;transform:rotate(${angle}deg)"></div>`;
        }
        const typeClass = ann.type === 'rectangle' ? 'rect' : ann.type;
        return `<div class="ann ${typeClass}${draftClass}" style="${style}"></div>`;
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
    const tools = [['callout-pin','Pin'],['highlight','Highlight'],['rectangle','Box'],['arrow','Arrow'],['text-box','Text'],['spotlight','Spotlight']];
    const toolButtons = tools.map(([value,label]) => `<button class="tool-button ${selectedTool === value ? 'active':''}" data-action="select-tool" data-tool="${value}" title="${label}">${value === 'callout-pin' ? '●' : value === 'highlight' ? '▧' : value === 'rectangle' ? '□' : value === 'arrow' ? '↗' : value === 'text-box' ? 'T' : '◉'}<span>${label}</span></button>`).join('');
    const colors = PALETTE.map(color => `<button class="tool-button" data-action="select-color" data-color="${color}" aria-label="Use ${color}"><span class="color-dot ${selectedColor === color ? 'active':''}" style="background:${color}"></span></button>`).join('');
    const annotationRows = annotations.map((ann,index) => `<div class="annotation-row"><span class="annotation-swatch" style="--swatch:${esc(ann.color)}"></span><span class="annotation-name">${index+1}. ${esc(ann.type.replace('-',' '))}</span><button class="button ghost icon-only small danger" data-action="delete-annotation" data-id="${esc(ann.id)}" aria-label="Delete annotation">×</button></div>`).join('');
    const history = annotationHistory(screen.id);
    const historyButtons = `<button class="tool-button" data-action="undo-annotation" title="Undo last annotation" aria-label="Undo last annotation" ${history.past.length ? '' : 'disabled'}>↩<span>Undo</span></button><button class="tool-button" data-action="redo-annotation" title="Redo annotation" aria-label="Redo annotation" ${history.future.length ? '' : 'disabled'}>↪<span>Redo</span></button><button class="tool-button ${showRemoveHandles ? 'active' : ''}" data-action="toggle-remove-handles" aria-pressed="${showRemoveHandles ? 'true' : 'false'}" title="Show a remove mark on every annotation">×<span>Show X</span></button>`;
    return `<section class="main-pane"><div class="studio-layout">${renderFilmstrip()}<div class="stage-shell"><div class="stage-toolbar"><div class="tool-group draw-tools">${toolButtons}</div><div class="tool-group">${historyButtons}</div><div class="tool-group">${colors}</div></div><div class="stage"><div class="canvas-wrap ${screen.deviceFrame === 'desktop' ? 'desktop':'mobile'}" id="annotationCanvas" data-screen-id="${esc(screen.id)}"><img src="${safeImage(screen.dataUrl)}" alt="Annotating ${esc(screen.name)}" draggable="false"><div class="annotation-layer" id="annotationLayer">${annotationMarkup(annotations, true)}</div></div></div><div class="stage-status"><span>${screen.width} × ${screen.height} · COORDINATES NORMALIZED 0–100%</span><span>${annotations.length} ANNOTATION${annotations.length === 1 ? '':'S'}</span></div></div><aside class="inspector"><div class="panel-head"><h2>Snapshot inspector</h2><span class="tag">${esc(screen.platform)}</span></div><div class="inspector-tabs"><button class="inspector-tab ${inspectorTab === 'analysis' ? 'active':''}" data-action="inspector-tab" data-tab="analysis">Analysis</button><button class="inspector-tab ${inspectorTab === 'layers' ? 'active':''}" data-action="inspector-tab" data-tab="layers">Layers (${annotations.length})</button></div><div class="panel-scroll" style="padding:0">${inspectorTab === 'analysis' ? `<div class="section"><label class="field"><span class="field-label">SNAPSHOT NAME</span><input class="input" data-screen-field="name" value="${esc(screen.name)}"></label></div><div class="section"><div class="section-title"><span>BEHAVIORAL TRIAD</span><span class="tag">Required</span></div><label class="field"><span class="field-label"><span><span class="field-number">1</span>WHAT THE USER IS DOING</span></span><textarea class="textarea" data-analysis-field="userAction" placeholder="Describe the intent and action…">${esc(analysis.userAction)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">2</span>WHAT IS VISIBLE</span></span><textarea class="textarea" data-analysis-field="screenContent" placeholder="Describe the visible interface state…">${esc(analysis.screenContent)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">3</span>WHAT HAPPENS NEXT</span></span><textarea class="textarea" data-analysis-field="nextAction" placeholder="Describe the expected result…">${esc(analysis.nextAction)}</textarea></label></div><div class="section"><button class="button primary" style="width:100%" data-action="save-snapshot">Save snapshot</button><button class="button" style="width:100%;margin-top:7px" data-action="add-to-story" data-id="${esc(screen.id)}">Add to walkthrough</button></div>` : `<div class="section"><div class="section-title"><span>ANNOTATIONS</span><button class="button ghost small danger" data-action="clear-annotations" ${annotations.length ? '':'disabled'}>Clear all</button></div><div class="annotation-list">${annotationRows || '<p style="color:var(--dim);font-size:10px;line-height:1.5">Choose a tool and draw directly on the screen. Coordinates remain stable at any display size.</p>'}</div></div><div class="section"><div class="section-title">DRAWING HELP</div><p style="color:var(--dim);font-size:10px;line-height:1.6">Pins and text are placed with a click. Highlights, boxes, arrows, and spotlights are drawn by dragging. Show X places a remove mark on each annotation.</p></div>`}</div></aside></div></section>`;
}


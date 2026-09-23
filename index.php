<?php
declare(strict_types=1);

$appName = 'StoryFlow Studio';
$build = '2026.09';

if (($_GET['action'] ?? '') === 'manifest') {
    header('Content-Type: application/manifest+json; charset=utf-8');
    echo json_encode([
        'name' => $appName,
        'short_name' => 'StoryFlow',
        'description' => 'A local-first walkthrough engineering workbench.',
        'start_url' => './',
        'display' => 'standalone',
        'background_color' => '#020617',
        'theme_color' => '#0f172a',
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_GET['action'] ?? '') === 'health') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'app' => $appName, 'build' => $build]);
    exit;
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="#0f172a">
    <meta name="description" content="Build annotated, animated product walkthroughs from screenshots.">
    <link rel="manifest" href="?action=manifest">
    <title><?= htmlspecialchars($appName, ENT_QUOTES, 'UTF-8') ?></title>
    <style>
        :root {
            color-scheme: dark;
            --bg: #020617;
            --panel: #0b1220;
            --surface: #0f172a;
            --raised: #172033;
            --raised-2: #1e293b;
            --border: #1e293b;
            --border-strong: #334155;
            --text: #f1f5f9;
            --muted: #94a3b8;
            --dim: #64748b;
            --blue: #3b82f6;
            --blue-strong: #2563eb;
            --blue-soft: rgba(59, 130, 246, .14);
            --emerald: #10b981;
            --amber: #f59e0b;
            --red: #ef4444;
            --purple: #8b5cf6;
            --radius: 7px;
            --font: "Avenir Next", Avenir, "Segoe UI", sans-serif;
            --mono: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        }

        * { box-sizing: border-box; }
        html, body { width: 100%; min-height: 100%; margin: 0; background: var(--bg); color: var(--text); }
        body { font-family: var(--font); font-size: 13px; overflow: hidden; }
        button, input, select, textarea { font: inherit; }
        button { color: inherit; }
        button, [role="button"], select, input[type="range"] { cursor: pointer; }
        img { display: block; max-width: 100%; }
        h1, h2, h3, p { margin: 0; }
        :focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
        ::selection { background: rgba(59,130,246,.36); color: var(--text); }
        ::-webkit-scrollbar { width: 9px; height: 9px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #26344a; border: 2px solid transparent; background-clip: padding-box; border-radius: 999px; }

        .app-shell { width: 100vw; height: 100dvh; display: grid; grid-template-rows: 56px minmax(0, 1fr); overflow: hidden; }
        .topbar { display: grid; grid-template-columns: minmax(280px, .8fr) auto minmax(210px, .7fr); align-items: center; gap: 20px; padding: 0 18px; background: rgba(11,18,32,.96); border-bottom: 1px solid var(--border); position: relative; z-index: 50; }
        .brand-group, .brand, .project-control, .nav-tabs, .top-actions, .cluster, .inline-row { display: flex; align-items: center; }
        .brand-group { gap: 14px; min-width: 0; }
        .brand { gap: 9px; white-space: nowrap; }
        .brand-mark { width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px; background: var(--blue); color: #eff6ff; font: 800 11px/1 var(--mono); letter-spacing: -.04em; box-shadow: inset 0 0 0 1px rgba(255,255,255,.13); }
        .brand-name { font-weight: 700; letter-spacing: -.02em; font-size: 14px; }
        .brand-build { color: var(--dim); font: 10px/1 var(--mono); border-left: 1px solid var(--border); padding-left: 9px; }
        .project-control { gap: 7px; min-width: 0; }
        .project-select { min-width: 0; max-width: 190px; height: 31px; color: var(--text); background: var(--surface); border: 1px solid var(--border-strong); border-radius: 6px; padding: 0 26px 0 9px; font-size: 12px; }
        .nav-tabs { justify-self: center; gap: 3px; padding: 3px; border: 1px solid var(--border); background: #070d18; border-radius: 8px; }
        .nav-button { border: 0; background: transparent; color: var(--muted); min-height: 31px; padding: 0 11px; border-radius: 5px; display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 650; transition: color .16s ease, background .16s ease, box-shadow .16s ease; }
        .nav-button:hover { color: var(--text); background: var(--raised); }
        .nav-button.active { color: #bfdbfe; background: var(--blue-soft); box-shadow: inset 0 0 0 1px rgba(59,130,246,.28); }
        .nav-icon { width: 14px; height: 14px; display: inline-grid; place-items: center; font-family: var(--mono); font-size: 11px; }
        .top-actions { justify-content: flex-end; gap: 8px; }

        .button { min-height: 31px; border-radius: 6px; border: 1px solid var(--border-strong); background: var(--raised); color: #dbe6f4; padding: 0 11px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; font-size: 11px; font-weight: 700; letter-spacing: .005em; white-space: nowrap; transition: transform .12s ease, border-color .15s ease, background .15s ease, color .15s ease; }
        .button:hover { background: #22304a; border-color: #475569; color: #fff; }
        .button:active { transform: translateY(1px); }
        .button.primary { background: var(--blue-strong); border-color: #3b82f6; color: #eff6ff; }
        .button.primary:hover { background: var(--blue); }
        .button.ghost { background: transparent; border-color: transparent; color: var(--muted); }
        .button.ghost:hover { background: var(--raised); color: var(--text); }
        .button.danger { color: #fca5a5; }
        .button.danger:hover { border-color: rgba(239,68,68,.45); background: rgba(239,68,68,.12); }
        .button.small { min-height: 27px; padding: 0 8px; font-size: 10px; }
        .button.icon-only { width: 31px; padding: 0; font: 14px/1 var(--mono); }
        .button[disabled] { cursor: not-allowed; opacity: .42; transform: none; }

        #workspace { min-height: 0; overflow: hidden; }
        .workspace-grid { height: 100%; display: grid; grid-template-columns: 238px minmax(0, 1fr); overflow: hidden; }
        .sidebar { background: var(--panel); border-right: 1px solid var(--border); min-width: 0; overflow: hidden; display: flex; flex-direction: column; }
        .sidebar-head { min-height: 59px; display: flex; align-items: center; justify-content: space-between; padding: 0 14px 0 16px; border-bottom: 1px solid var(--border); }
        .eyebrow { color: var(--dim); text-transform: uppercase; font: 700 9px/1.2 var(--mono); letter-spacing: .13em; }
        .sidebar-title { margin-top: 5px; font-weight: 700; font-size: 13px; }
        .sidebar-scroll { overflow: auto; padding: 10px 8px 18px; }
        .folder-row { width: 100%; border: 0; display: grid; grid-template-columns: 18px minmax(0,1fr) auto; gap: 7px; align-items: center; padding: 8px 8px; border-radius: 6px; color: var(--muted); background: transparent; text-align: left; font-size: 11px; }
        .folder-row:hover { background: var(--raised); color: var(--text); }
        .folder-row.active { background: var(--blue-soft); color: #bfdbfe; box-shadow: inset 0 0 0 1px rgba(59,130,246,.22); }
        .folder-row .count { color: var(--dim); font: 10px/1 var(--mono); }
        .tree-label { padding: 13px 8px 6px; color: var(--dim); font: 700 9px/1 var(--mono); letter-spacing: .11em; text-transform: uppercase; }
        .local-note { margin: auto 10px 12px; padding: 12px; border-top: 1px solid var(--border); color: var(--dim); font-size: 10px; line-height: 1.55; }
        .local-note strong { display: block; color: #a7f3d0; font-size: 10px; margin-bottom: 3px; }
        .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--emerald); margin-right: 5px; box-shadow: 0 0 0 3px rgba(16,185,129,.1); }

        .main-pane { min-width: 0; min-height: 0; overflow: hidden; display: flex; flex-direction: column; background: var(--bg); }
        .view-head { flex: 0 0 auto; min-height: 74px; display: flex; align-items: center; justify-content: space-between; gap: 22px; padding: 13px 22px; border-bottom: 1px solid var(--border); background: rgba(2,6,23,.82); }
        .view-title { font-size: 18px; line-height: 1.2; letter-spacing: -.025em; }
        .view-subtitle { margin-top: 5px; color: var(--muted); font-size: 11px; }
        .view-actions { display: flex; align-items: center; gap: 8px; }
        .search { width: 218px; height: 32px; background: #070d18; color: var(--text); border: 1px solid var(--border); border-radius: 6px; padding: 0 10px; font-size: 11px; }
        .search::placeholder, textarea::placeholder, input::placeholder { color: #526079; }

        .library-scroll { overflow: auto; padding: 18px 22px 44px; }
        .library-meta { display: flex; align-items: center; justify-content: space-between; color: var(--dim); font: 10px/1 var(--mono); margin-bottom: 12px; }
        .drop-strip { min-height: 74px; border: 1px dashed #334155; background: rgba(15,23,42,.45); display: flex; align-items: center; justify-content: center; gap: 9px; color: var(--muted); border-radius: 8px; margin-bottom: 18px; transition: border-color .16s ease, background .16s ease; }
        .drop-strip.dragover { border-color: var(--blue); background: var(--blue-soft); color: #bfdbfe; }
        .kbd { border: 1px solid #3b4b63; border-bottom-width: 2px; border-radius: 4px; padding: 2px 5px; color: #cbd5e1; font: 9px/1.1 var(--mono); background: #111b2c; }
        .screen-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; align-items: start; }
        .screen-card { position: relative; border: 1px solid var(--border); background: #0a1020; border-radius: 9px; overflow: hidden; transition: border-color .16s ease, transform .16s ease; }
        .screen-card:hover { border-color: #3b4b63; transform: translateY(-1px); }
        .screen-card.selected { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(59,130,246,.14); }
        .screen-preview { height: 250px; display: grid; place-items: center; padding: 15px; background-color: #080e19; background-image: linear-gradient(#111a2a 1px, transparent 1px), linear-gradient(90deg,#111a2a 1px,transparent 1px); background-size: 24px 24px; overflow: hidden; }
        .screen-preview img { width: auto; max-width: 100%; height: 100%; object-fit: contain; border-radius: 5px; box-shadow: 0 12px 30px rgba(0,0,0,.45); }
        .screen-card-meta { padding: 11px 12px 12px; border-top: 1px solid var(--border); }
        .screen-card-title { font-weight: 700; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .screen-card-sub { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; color: var(--dim); font: 9px/1 var(--mono); }
        .tag { display: inline-flex; align-items: center; min-height: 19px; border-radius: 999px; padding: 0 7px; color: #93c5fd; background: rgba(59,130,246,.11); border: 1px solid rgba(59,130,246,.2); font: 8px/1 var(--mono); text-transform: uppercase; letter-spacing: .07em; }
        .card-actions { position: absolute; top: 8px; right: 8px; display: flex; gap: 4px; opacity: 0; transform: translateY(-3px); transition: opacity .15s ease, transform .15s ease; }
        .screen-card:hover .card-actions, .screen-card:focus-within .card-actions { opacity: 1; transform: translateY(0); }
        .card-action { width: 27px; height: 27px; display: grid; place-items: center; border: 1px solid #334155; border-radius: 5px; background: rgba(8,14,25,.94); color: #cbd5e1; font: 11px/1 var(--mono); }
        .card-action:hover { color: #fff; border-color: #64748b; }

        .studio-layout { min-height: 0; flex: 1; display: grid; grid-template-columns: 196px minmax(360px, 1fr) 330px; }
        .filmstrip, .inspector { min-height: 0; background: var(--panel); overflow: hidden; display: flex; flex-direction: column; }
        .filmstrip { border-right: 1px solid var(--border); }
        .inspector { border-left: 1px solid var(--border); }
        .panel-head { flex: 0 0 48px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; border-bottom: 1px solid var(--border); }
        .panel-head h2 { font-size: 11px; letter-spacing: .01em; }
        .panel-scroll { min-height: 0; overflow: auto; padding: 10px; }
        .film-item { width: 100%; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--muted); text-align: left; padding: 6px; margin-bottom: 6px; }
        .film-item:hover { background: var(--raised); color: var(--text); }
        .film-item.active { background: var(--blue-soft); border-color: rgba(59,130,246,.32); color: #dbeafe; }
        .film-thumb { height: 105px; display: grid; place-items: center; padding: 6px; background: #060b14; border-radius: 4px; overflow: hidden; }
        .film-thumb img { max-width: 100%; height: 100%; object-fit: contain; }
        .film-name { margin-top: 7px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; font-weight: 650; }

        .stage-shell { min-width: 0; min-height: 0; display: grid; grid-template-rows: 48px minmax(0,1fr) 52px; background-color: #050913; background-image: radial-gradient(#1b2739 1px, transparent 1px); background-size: 22px 22px; }
        .stage-toolbar { border-bottom: 1px solid var(--border); background: rgba(11,18,32,.96); display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; }
        .tool-group { display: flex; align-items: center; gap: 4px; }
        .tool-button { min-width: 31px; height: 30px; border: 1px solid transparent; border-radius: 5px; color: var(--muted); background: transparent; font: 11px/1 var(--mono); display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; }
        .tool-button:hover { color: var(--text); background: var(--raised); }
        .tool-button.active { color: #bfdbfe; border-color: rgba(59,130,246,.34); background: var(--blue-soft); }
        .color-dot { width: 15px; height: 15px; border-radius: 50%; border: 2px solid #0b1220; box-shadow: 0 0 0 1px #46566d; }
        .color-dot.active { box-shadow: 0 0 0 2px #e2e8f0; }
        .stage { min-height: 0; overflow: auto; display: grid; place-items: center; padding: 26px; }
        .canvas-wrap { position: relative; max-height: 100%; max-width: min(100%, 720px); display: inline-block; user-select: none; touch-action: none; box-shadow: 0 22px 65px rgba(0,0,0,.52); }
        .canvas-wrap.mobile { height: min(100%, 660px); }
        .canvas-wrap.mobile img { height: 100%; width: auto; }
        .canvas-wrap.desktop { width: min(100%, 900px); }
        .canvas-wrap img { max-height: 100%; max-width: 100%; object-fit: contain; pointer-events: none; }
        .annotation-layer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .ann { position: absolute; pointer-events: none; }
        .ann.rect, .ann.highlight, .ann.spotlight { border: var(--ann-stroke, 3px) solid var(--ann-color); }
        .ann.highlight { background: color-mix(in srgb, var(--ann-color) 22%, transparent); }
        .ann.spotlight { border-radius: 999px; box-shadow: 0 0 0 200vmax rgba(2,6,23,.62); }
        .ann.pin { width: 28px; height: 28px; margin: -14px 0 0 -14px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: grid; place-items: center; color: #fff; background: var(--ann-color); border: 2px solid rgba(255,255,255,.8); box-shadow: 0 4px 12px rgba(0,0,0,.4); }
        .ann.pin span { transform: rotate(45deg); font: 800 10px/1 var(--mono); }
        .ann.text { color: #fff; background: color-mix(in srgb, var(--ann-color) 82%, #020617); border: 1px solid rgba(255,255,255,.3); border-radius: 4px; padding: 5px 7px; min-width: 70px; font-size: 9px; font-weight: 700; box-shadow: 0 4px 12px rgba(0,0,0,.35); }
        .ann-arrow { position: absolute; height: 0; border-top: var(--ann-stroke, 3px) solid var(--ann-color); transform-origin: left center; }
        .ann-arrow::after { content: ""; position: absolute; right: -1px; top: 50%; width: 8px; height: 8px; border-top: var(--ann-stroke, 3px) solid var(--ann-color); border-right: var(--ann-stroke, 3px) solid var(--ann-color); transform: translateY(-50%) rotate(45deg); }
        .draft-ann { opacity: .65; }
        .stage-status { border-top: 1px solid var(--border); background: rgba(11,18,32,.96); display: flex; align-items: center; justify-content: space-between; padding: 0 13px; color: var(--dim); font: 9px/1 var(--mono); }

        .inspector-tabs { height: 39px; display: flex; align-items: end; border-bottom: 1px solid var(--border); padding: 0 10px; gap: 14px; }
        .inspector-tab { height: 39px; border: 0; border-bottom: 2px solid transparent; color: var(--dim); background: transparent; font-size: 10px; font-weight: 700; padding: 0 1px; }
        .inspector-tab.active { color: #bfdbfe; border-color: var(--blue); }
        .section { padding: 13px 13px 15px; border-bottom: 1px solid var(--border); }
        .section-title { display: flex; justify-content: space-between; align-items: center; color: #cbd5e1; font-size: 10px; font-weight: 800; letter-spacing: .03em; margin-bottom: 10px; }
        .field { display: block; margin-bottom: 10px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font: 700 9px/1.3 var(--mono); margin: 0 0 6px; }
        .field-number { width: 18px; height: 18px; display: inline-grid; place-items: center; border-radius: 4px; background: var(--blue-soft); color: #93c5fd; margin-right: 5px; }
        .input, .textarea, .select { width: 100%; border: 1px solid var(--border); border-radius: 6px; background: #060b14; color: var(--text); padding: 8px 9px; font-size: 11px; transition: border-color .15s ease, box-shadow .15s ease; }
        .input, .select { height: 32px; }
        .textarea { resize: vertical; min-height: 62px; line-height: 1.45; }
        .input:focus, .textarea:focus, .select:focus { outline: 0; border-color: var(--blue); box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
        .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .annotation-list { display: grid; gap: 6px; }
        .annotation-row { display: grid; grid-template-columns: 22px minmax(0,1fr) 26px; align-items: center; gap: 7px; padding: 6px; border: 1px solid var(--border); border-radius: 5px; background: #090f1b; }
        .annotation-swatch { width: 16px; height: 16px; border-radius: 4px; background: var(--swatch); }
        .annotation-name { color: var(--muted); font-size: 9px; text-transform: capitalize; }

        .story-layout { min-height: 0; flex: 1; display: grid; grid-template-columns: 265px minmax(380px,1fr) 320px; }
        .story-rail { min-height: 0; overflow: hidden; background: var(--panel); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .story-chooser { padding: 10px 12px; border-bottom: 1px solid var(--border); }
        .step-list { padding: 9px; overflow: auto; counter-reset: steps; }
        .step-item { width: 100%; display: grid; grid-template-columns: 25px 58px minmax(0,1fr); gap: 8px; align-items: center; border: 1px solid transparent; border-radius: 7px; background: transparent; color: var(--muted); text-align: left; padding: 7px; margin-bottom: 6px; }
        .step-item:hover { background: var(--raised); color: var(--text); }
        .step-item.active { background: var(--blue-soft); border-color: rgba(59,130,246,.32); color: #dbeafe; }
        .step-index { width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; background: #172033; color: var(--dim); font: 9px/1 var(--mono); }
        .step-item.active .step-index { background: var(--blue); color: #fff; }
        .step-thumb { width: 58px; height: 45px; display: grid; place-items: center; overflow: hidden; border-radius: 4px; background: #050913; }
        .step-thumb img { width: 100%; height: 100%; object-fit: contain; }
        .step-copy { min-width: 0; }
        .step-title { color: inherit; font-size: 10px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .step-meta { margin-top: 4px; color: var(--dim); font: 8px/1 var(--mono); }
        .flow-stage { min-height: 0; display: grid; grid-template-rows: 48px minmax(0,1fr) 58px; background: #050913; }
        .step-canvas { min-height: 0; overflow: auto; display: grid; place-items: center; padding: 24px; background-image: radial-gradient(#1b2739 1px, transparent 1px); background-size: 22px 22px; }
        .device-mini { max-height: 100%; max-width: 100%; display: grid; place-items: center; }
        .story-bottom { border-top: 1px solid var(--border); background: var(--panel); display: flex; align-items: center; justify-content: space-between; padding: 0 13px; }
        .step-reorder { display: flex; gap: 5px; }
        .meter { height: 3px; width: 100%; background: #1e293b; overflow: hidden; border-radius: 999px; }
        .meter > span { display: block; height: 100%; width: var(--value, 0%); background: var(--blue); }

        .device { position: relative; display: grid; place-items: center; background: #05070c; box-shadow: 0 25px 75px rgba(0,0,0,.6); }
        .device.iphone { height: min(100%, 620px); aspect-ratio: 390 / 844; border: 8px solid #202b3d; border-radius: 42px; padding: 0; overflow: hidden; }
        .device.iphone::before { content: ""; position: absolute; z-index: 4; top: 9px; left: 50%; width: 84px; height: 24px; transform: translateX(-50%); background: #02040a; border-radius: 999px; }
        .device.android { height: min(100%, 620px); aspect-ratio: 390 / 844; border: 7px solid #263244; border-radius: 31px; overflow: hidden; }
        .device.android::before { content: ""; position: absolute; z-index: 4; top: 10px; left: 50%; width: 12px; height: 12px; transform: translateX(-50%); background: #02040a; border-radius: 50%; }
        .device.desktop { width: min(100%, 850px); aspect-ratio: 16 / 10; border: 1px solid #334155; border-radius: 9px; padding-top: 27px; overflow: hidden; background: #0f172a; }
        .device.desktop::before { content: "●  ●  ●"; position: absolute; top: 0; left: 0; right: 0; height: 27px; display: flex; align-items: center; padding-left: 10px; color: #64748b; background: #1e293b; font-size: 9px; letter-spacing: 3px; }
        .device.none { max-height: 100%; max-width: 100%; }
        .device img { width: 100%; height: 100%; object-fit: contain; }
        .device-screen { position: relative; width: 100%; height: 100%; overflow: hidden; background: #05070c; display: grid; place-items: center; }

        .player-view { height: 100%; min-height: 0; display: grid; grid-template-rows: 58px minmax(0,1fr) 82px; background: #02040a; }
        .player-top { display: grid; grid-template-columns: minmax(210px,1fr) auto minmax(210px,1fr); align-items: center; gap: 14px; padding: 0 18px; border-bottom: 1px solid var(--border); background: rgba(11,18,32,.94); }
        .player-title { font-size: 12px; font-weight: 750; }
        .player-caption { color: var(--dim); font: 9px/1 var(--mono); margin-top: 4px; }
        .player-top .view-actions:last-child { justify-self: end; }
        .player-main { min-height: 0; display: grid; grid-template-columns: minmax(0,1fr) 330px; }
        .player-stage { min-height: 0; position: relative; display: grid; place-items: center; padding: 22px; overflow: hidden; background-color: #030711; background-image: radial-gradient(circle at 50% 45%, #111d31 0, #050a14 42%, #02040a 74%); }
        .player-device-wrap { height: 100%; width: 100%; min-height: 0; display: grid; place-items: center; transition: opacity .25s ease, transform .25s ease; }
        .player-device-wrap.fade-out { opacity: .15; transform: scale(.985); }
        .hotspot { position: absolute; left: var(--x); top: var(--y); transform: translate(-50%,-50%); width: 42px; height: 42px; border: 0; border-radius: 50%; background: transparent; z-index: 7; }
        .hotspot::before, .hotspot::after { content: ""; position: absolute; inset: 7px; border-radius: 50%; background: rgba(59,130,246,.72); box-shadow: 0 0 0 1px #bfdbfe; }
        .hotspot::after { animation: ping 1.55s cubic-bezier(0,0,.2,1) infinite; background: rgba(59,130,246,.44); }
        .hotspot-label { position: absolute; left: 50%; top: calc(100% + 4px); transform: translateX(-50%); color: #dbeafe; background: rgba(8,14,25,.9); border: 1px solid rgba(59,130,246,.35); border-radius: 4px; padding: 4px 6px; font: 8px/1 var(--mono); white-space: nowrap; }
        @keyframes ping { 75%,100% { transform: scale(2.2); opacity: 0; } }
        .narrative { min-height: 0; border-left: 1px solid var(--border); background: var(--panel); overflow: auto; padding: 20px 18px; }
        .narrative-step { color: #93c5fd; font: 700 9px/1 var(--mono); letter-spacing: .08em; text-transform: uppercase; }
        .narrative h2 { margin-top: 9px; font-size: 18px; letter-spacing: -.02em; }
        .narrative-block { margin-top: 20px; }
        .narrative-label { color: var(--dim); font: 700 9px/1 var(--mono); text-transform: uppercase; letter-spacing: .08em; }
        .narrative-copy { margin-top: 7px; color: #cbd5e1; font-size: 11px; line-height: 1.65; }
        .player-bottom { border-top: 1px solid var(--border); background: var(--panel); display: grid; grid-template-columns: 160px minmax(0,1fr) 160px; align-items: center; gap: 18px; padding: 0 18px; }
        .transport { display: flex; align-items: center; gap: 6px; }
        .play-button { width: 37px; height: 37px; border: 1px solid #60a5fa; border-radius: 50%; background: var(--blue-strong); color: #fff; display: grid; place-items: center; }
        .timeline { display: grid; grid-template-columns: repeat(var(--steps), 1fr); gap: 5px; }
        .timeline-step { height: 25px; border: 0; background: transparent; padding: 10px 0; position: relative; }
        .timeline-step::before { content: ""; position: absolute; left: 0; right: 0; top: 11px; height: 3px; border-radius: 999px; background: #26344a; }
        .timeline-step.done::before { background: var(--blue-strong); }
        .timeline-step.active::before { background: linear-gradient(90deg, var(--blue) var(--progress), #26344a var(--progress)); }
        .player-time { justify-self: end; color: var(--dim); font: 10px/1 var(--mono); }

        .export-scroll { overflow: auto; padding: 28px clamp(18px,4vw,54px) 60px; }
        .export-grid { max-width: 1080px; margin: 0 auto; display: grid; grid-template-columns: minmax(0,1fr) minmax(300px,.72fr); gap: 34px; }
        .export-section { padding: 0 0 28px; border-bottom: 1px solid var(--border); margin-bottom: 28px; }
        .export-section h2 { font-size: 15px; }
        .export-section > p { color: var(--muted); font-size: 11px; line-height: 1.6; margin-top: 7px; max-width: 620px; }
        .export-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 15px; }
        .scope-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
        .scope-option { border: 1px solid var(--border); border-radius: 7px; background: #080e19; color: var(--muted); text-align: left; padding: 11px; }
        .scope-option strong { color: var(--text); display: block; font-size: 10px; margin-bottom: 4px; }
        .scope-option.active { border-color: var(--blue); background: var(--blue-soft); color: #bfdbfe; }
        .markdown-preview { height: 470px; overflow: auto; border: 1px solid var(--border); border-radius: 8px; background: #050913; padding: 18px; color: #b6c5d8; font: 10px/1.65 var(--mono); white-space: pre-wrap; }
        .export-stats { border-top: 2px solid var(--blue); background: var(--surface); padding: 18px; }
        .export-stats h2 { font-size: 13px; }
        .stat-table { margin-top: 14px; display: grid; gap: 10px; }
        .stat-row { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 10px; }
        .stat-row strong { color: var(--text); font: 700 11px/1 var(--mono); }
        .privacy-seal { margin-top: 24px; padding: 13px 0; border-top: 1px solid var(--border); color: var(--dim); font-size: 10px; line-height: 1.55; }
        .privacy-seal strong { color: #a7f3d0; display: block; margin-bottom: 4px; }

        .empty { height: 100%; min-height: 320px; display: grid; place-items: center; padding: 30px; text-align: center; }
        .empty-mark { width: 46px; height: 46px; margin: 0 auto 15px; display: grid; place-items: center; border: 1px solid var(--border-strong); border-radius: 10px; color: var(--blue); background: var(--surface); font: 16px/1 var(--mono); }
        .empty h2 { font-size: 16px; }
        .empty p { max-width: 380px; margin: 8px auto 16px; color: var(--muted); font-size: 11px; line-height: 1.55; }

        dialog { width: min(460px, calc(100% - 28px)); border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); color: var(--text); padding: 0; box-shadow: 0 30px 90px rgba(0,0,0,.7); }
        dialog::backdrop { background: rgba(2,6,23,.78); backdrop-filter: blur(3px); }
        .dialog-head { padding: 18px 20px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: start; justify-content: space-between; }
        .dialog-head h2 { font-size: 16px; }
        .dialog-head p { color: var(--muted); font-size: 10px; margin-top: 5px; }
        .dialog-body { padding: 18px 20px; }
        .dialog-foot { padding: 13px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px; }
        .range-row { display: grid; grid-template-columns: 74px 1fr 38px; gap: 8px; align-items: center; margin-bottom: 12px; color: var(--muted); font-size: 10px; }
        input[type="range"] { accent-color: var(--blue); }
        .toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 15px; min-height: 34px; color: var(--muted); font-size: 10px; }
        .switch { position: relative; width: 32px; height: 18px; border-radius: 999px; background: #334155; border: 0; transition: background .15s ease; }
        .switch::after { content: ""; position: absolute; left: 3px; top: 3px; width: 12px; height: 12px; border-radius: 50%; background: #cbd5e1; transition: transform .15s ease; }
        .switch.on { background: var(--blue-strong); }
        .switch.on::after { transform: translateX(14px); background: #fff; }
        .toast-region { position: fixed; right: 16px; bottom: 16px; z-index: 100; display: grid; gap: 8px; pointer-events: none; }
        .toast { min-width: 240px; max-width: 360px; padding: 11px 13px; display: flex; align-items: center; gap: 9px; border: 1px solid var(--border-strong); border-radius: 7px; background: #111b2c; color: #dbe6f4; box-shadow: 0 16px 38px rgba(0,0,0,.45); font-size: 10px; animation: toast-in .2s ease-out both; }
        .toast.good::before { content: "✓"; color: #6ee7b7; font-weight: 800; }
        .toast.warn::before { content: "!"; color: #fcd34d; font-weight: 800; }
        @keyframes toast-in { from { opacity: 0; transform: translateY(7px); } }

        @media (max-width: 1120px) {
            .topbar { grid-template-columns: minmax(230px,1fr) auto; }
            .nav-tabs { order: 3; position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; justify-content: center; border-width: 1px 0 0; border-radius: 0; background: rgba(7,13,24,.98); padding-bottom: max(3px, env(safe-area-inset-bottom)); }
            .top-actions { grid-column: 2; }
            .app-shell { padding-bottom: 39px; }
            .studio-layout { grid-template-columns: 160px minmax(330px,1fr) 300px; }
            .story-layout { grid-template-columns: 225px minmax(330px,1fr) 290px; }
        }
        @media (max-width: 860px) {
            body { overflow: auto; }
            .app-shell { height: auto; min-height: 100dvh; overflow: visible; }
            .topbar { position: sticky; top: 0; grid-template-columns: 1fr auto; gap: 8px; }
            .brand-build, .top-actions .button:first-child { display: none; }
            #workspace { min-height: calc(100dvh - 95px); overflow: visible; }
            .workspace-grid { grid-template-columns: 1fr; height: auto; min-height: calc(100dvh - 95px); }
            .sidebar { display: none; }
            .main-pane { min-height: calc(100dvh - 95px); overflow: visible; }
            .library-scroll { overflow: visible; }
            .studio-layout, .story-layout { grid-template-columns: 1fr; grid-template-rows: auto minmax(520px,75vh) auto; }
            .filmstrip, .story-rail { border-right: 0; border-bottom: 1px solid var(--border); max-height: 180px; }
            .panel-scroll, .step-list { display: flex; overflow-x: auto; gap: 7px; }
            .film-item { min-width: 135px; }
            .step-item { min-width: 220px; }
            .inspector { border-left: 0; border-top: 1px solid var(--border); max-height: none; }
            .player-view { min-height: calc(100dvh - 95px); grid-template-rows: auto minmax(650px,1fr) auto; }
            .player-top { grid-template-columns: 1fr auto; padding: 10px 12px; }
            .player-top .cluster { display: none; }
            .player-main { grid-template-columns: 1fr; grid-template-rows: 540px auto; }
            .narrative { border-left: 0; border-top: 1px solid var(--border); }
            .player-bottom { grid-template-columns: auto 1fr auto; padding: 10px 12px; }
            .export-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 620px) {
            .topbar { padding: 0 10px; }
            .project-control { display: none; }
            .nav-button { padding: 0 8px; font-size: 0; }
            .nav-icon { font-size: 11px; }
            .view-head { align-items: flex-start; padding: 14px; flex-direction: column; }
            .view-actions { width: 100%; }
            .search { flex: 1; width: auto; }
            .library-scroll { padding: 14px; }
            .screen-grid { grid-template-columns: 1fr 1fr; gap: 9px; }
            .screen-preview { height: 190px; }
            .card-actions { opacity: 1; transform: none; }
            .studio-layout, .story-layout { grid-template-rows: auto minmax(480px,70vh) auto; }
            .stage-toolbar { overflow-x: auto; }
            .player-main { grid-template-rows: 470px auto; }
            .player-stage { padding: 12px; }
            .narrative { padding: 17px 14px; }
            .player-bottom { grid-template-columns: 1fr auto; }
            .timeline { grid-column: 1 / -1; grid-row: 1; }
            .player-time { display: none; }
            .export-scroll { padding: 20px 14px 50px; }
        }
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
    </style>
</head>
<body>
<div class="app-shell">
    <header class="topbar">
        <div class="brand-group">
            <div class="brand" aria-label="StoryFlow Studio">
                <div class="brand-mark" aria-hidden="true">SF</div>
                <span class="brand-name">StoryFlow Studio</span>
                <span class="brand-build">build <?= htmlspecialchars($build, ENT_QUOTES, 'UTF-8') ?></span>
            </div>
            <div class="project-control">
                <select class="project-select" id="projectSelect" aria-label="Current project"></select>
            </div>
        </div>
        <nav class="nav-tabs" aria-label="Workspace views" id="primaryNav">
            <button class="nav-button active" data-view="screenshots"><span class="nav-icon">▦</span>Library</button>
            <button class="nav-button" data-view="editor"><span class="nav-icon">⌖</span>Annotate</button>
            <button class="nav-button" data-view="stories"><span class="nav-icon">⇥</span>Stories</button>
            <button class="nav-button" data-view="player"><span class="nav-icon">▶</span>Player</button>
            <button class="nav-button" data-view="export"><span class="nav-icon">↗</span>Export</button>
        </nav>
        <div class="top-actions">
            <button class="button ghost" data-action="open-audio"><span aria-hidden="true">◖</span> Narration</button>
            <button class="button primary" data-action="new-project"><span aria-hidden="true">＋</span> New project</button>
        </div>
    </header>
    <main id="workspace"></main>
</div>

<input id="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" multiple hidden>
<input id="jsonInput" type="file" accept="application/json,.json" hidden>

<dialog id="projectDialog">
    <form id="projectForm" method="dialog">
        <div class="dialog-head">
            <div><h2>Create a project</h2><p>Start with a clean workspace and two platform folders.</p></div>
            <button type="button" class="button ghost icon-only" data-action="close-project-dialog" aria-label="Close">×</button>
        </div>
        <div class="dialog-body">
            <label class="field"><span class="field-label">PROJECT NAME</span><input class="input" name="name" required maxlength="60" placeholder="e.g. Mobile checkout refresh"></label>
            <label class="field"><span class="field-label">DESCRIPTION</span><textarea class="textarea" name="description" maxlength="240" placeholder="What journey will this project explain?"></textarea></label>
        </div>
        <div class="dialog-foot">
            <button type="button" class="button" data-action="close-project-dialog">Cancel</button>
            <button type="submit" class="button primary">Create project</button>
        </div>
    </form>
</dialog>

<dialog id="audioDialog">
    <div class="dialog-head">
        <div><h2>Narration settings</h2><p>Uses the browser’s on-device speech service.</p></div>
        <button type="button" class="button ghost icon-only" data-action="close-audio" aria-label="Close">×</button>
    </div>
    <div class="dialog-body" id="audioSettingsBody"></div>
    <div class="dialog-foot"><button type="button" class="button primary" data-action="close-audio">Done</button></div>
</dialog>

<div class="toast-region" id="toastRegion" role="status" aria-live="polite"></div>

<script>
'use strict';

const APP = {
    name: 'StoryFlow Studio',
    storageKey: 'storyflow_projects_v1',
    activeKey: 'storyflow_active_project_id_v1',
    audioKey: 'storyflow_audio_settings_v1'
};

const PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const safeImage = (value = '') => /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i.test(String(value)) ? esc(value) : '';
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const slug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'storyflow';
const formatBytes = (bytes) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1048576).toFixed(1)} MB`;

let currentView = 'screenshots';
let selectedFolder = null;
let searchTerm = '';
let selectedTool = 'callout-pin';
let selectedColor = PALETTE[0];
let inspectorTab = 'analysis';
let exportScope = 'project';
let playerIndex = 0;
let playerTimer = null;
let playerStartedAt = 0;
let isPlaying = false;
let draftAnnotation = null;

const defaultAudio = {
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: .9,
    readTitle: true,
    readUserAction: true,
    readScreenContent: true,
    readNextAction: false,
    advanceOnSpeechEnd: false,
    voiceURI: ''
};

let audioSettings = loadJson(APP.audioKey, defaultAudio);

function loadJson(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : structuredClone(fallback);
    } catch (error) {
        console.warn(`Unable to load ${key}`, error);
        return structuredClone(fallback);
    }
}

function saveJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Unable to save ${key}`, error);
        toast('Browser storage is full. Export a backup before adding more images.', 'warn');
        return false;
    }
}

function isValidProject(project) {
    return Boolean(
        project && typeof project.id === 'string' && typeof project.name === 'string' &&
        Array.isArray(project.screenshots) && Array.isArray(project.stories) &&
        project.screenshots.every(screen => typeof screen?.id === 'string' && /^data:image\/(?:png|jpeg|webp|gif|svg\+xml)(?:;|,)/i.test(String(screen.dataUrl || ''))) &&
        project.stories.every(story => typeof story?.id === 'string' && Array.isArray(story.steps))
    );
}

function mockScreen(variant) {
    const screens = {
        dashboard: {title:'Good morning, Elena', sub:'Your balance', amount:'$24,860.40', accent:'#3b82f6', cta:'Send money', rows:[['Maya Chen','+$1,240.00'],['Figma, Inc.','−$96.00'],['Cloudworks','−$48.20']]},
        recipient: {title:'Send money', sub:'Choose a recipient', amount:'Who are you paying?', accent:'#6366f1', cta:'Continue', rows:[['Maya Chen','@mayachen'],['Jon Bell','@jonb'],['Avery Smith','@avery']]},
        amount: {title:'Transfer details', sub:'Available · $24,860.40', amount:'$1,200', accent:'#10b981', cta:'Review transfer', rows:[['To','Maya Chen'],['From','Orbit checking ·· 4921'],['Arrival','Instant']]},
        confirm: {title:'Transfer complete', sub:'Sep 22, 2026 · 10:42 AM', amount:'$1,200.00', accent:'#10b981', cta:'Done', rows:[['Sent to','Maya Chen'],['Method','Instant transfer'],['Reference','ORB-448201']]},
        request: {title:'Request money', sub:'Requesting from Maya Chen', amount:'$240', accent:'#8b5cf6', cta:'Send request', rows:[['For','Dinner in Oakland'],['Delivery','Orbit notification'],['Due','Friday, Sep 25']]},
        requestconfirm: {title:'Request sent', sub:'Maya Chen · just now', amount:'$240.00', accent:'#8b5cf6', cta:'Done', rows:[['Status','Waiting for payment'],['Reminder','Automatic in 3 days'],['Reference','REQ-920184']]},
        cards: {title:'Your cards', sub:'Orbit Metal ·· 8842', amount:'$3,480 available', accent:'#f59e0b', cta:'Freeze card', rows:[['Apple Store','−$189.00'],['Netflix','−$22.99'],['Metro Market','−$64.18']]},
        frozen: {title:'Card controls', sub:'Orbit Metal ·· 8842', amount:'Card frozen', accent:'#ef4444', cta:'Unfreeze card', rows:[['Online purchases','Blocked'],['Contactless payments','Blocked'],['Cash withdrawal','Blocked']]}
    };
    const s = screens[variant] || screens.dashboard;
    const rows = s.rows.map((row, i) => `<g transform="translate(28 ${442+i*72})"><rect width="334" height="58" rx="13" fill="#f8fafc"/><circle cx="27" cy="29" r="18" fill="${s.accent}" opacity="${.14 + i*.04}"/><text x="58" y="25" font-family="Arial,sans-serif" font-weight="700" font-size="13" fill="#172033">${row[0]}</text><text x="58" y="43" font-family="Arial,sans-serif" font-size="11" fill="#64748b">${row[1]}</text><path d="M312 25l6 6-6 6" fill="none" stroke="#94a3b8" stroke-width="2"/></g>`).join('');
    const isSuccess = variant === 'confirm' || variant === 'requestconfirm';
    const success = isSuccess ? `<circle cx="195" cy="205" r="42" fill="#dcfce7"/><path d="M175 206l13 13 25-28" fill="none" stroke="#10b981" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>` : '';
    const sectionLabel = variant === 'dashboard' ? 'RECENT ACTIVITY' : variant === 'cards' ? 'RECENT CARD ACTIVITY' : variant === 'frozen' ? 'CURRENT RESTRICTIONS' : variant.startsWith('request') ? 'REQUEST SUMMARY' : 'TRANSFER SUMMARY';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#f1f5f9"/><rect width="390" height="112" fill="#0f172a"/><text x="26" y="43" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#e2e8f0">ORBIT PAY</text><circle cx="348" cy="39" r="17" fill="#243249"/><text x="348" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="11" fill="#bfdbfe">ER</text><text x="26" y="91" font-family="Arial,sans-serif" font-weight="700" font-size="23" fill="#fff">${s.title}</text>${success}<text x="195" y="${isSuccess ? 294 : 167}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#64748b">${s.sub}</text><text x="195" y="${isSuccess ? 335 : 222}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${variant === 'amount' ? 48 : 35}" fill="#0f172a">${s.amount}</text><rect x="28" y="${isSuccess ? 365 : 269}" width="334" height="58" rx="14" fill="${s.accent}"/><text x="195" y="${isSuccess ? 401 : 305}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="14" fill="#fff">${s.cta}</text><text x="28" y="423" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#475569">${sectionLabel}</text>${rows}<rect x="145" y="818" width="100" height="5" rx="3" fill="#cbd5e1"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function seedProjects() {
    const screenDefinitions = [
        ['screen-dashboard', '01_Dashboard.png', 'dashboard'],
        ['screen-recipient', '02_Choose_Recipient.png', 'recipient'],
        ['screen-amount', '03_Transfer_Amount.png', 'amount'],
        ['screen-confirm', '04_Confirmation.png', 'confirm'],
        ['screen-request', '05_Request_Amount.png', 'request'],
        ['screen-request-confirm', '06_Request_Sent.png', 'requestconfirm'],
        ['screen-cards', '07_Card_Overview.png', 'cards'],
        ['screen-frozen', '08_Card_Frozen.png', 'frozen']
    ];
    const analysisByVariant = {
        dashboard:{userAction:'The user reviews their balance and chooses a money action.',screenContent:'Account balance, recent activity, and primary transfer controls are visible.',nextAction:'Open the selected money workflow.'},
        recipient:{userAction:'The user selects Maya Chen from recent recipients.',screenContent:'A searchable recipient list shows recent contacts and usernames.',nextAction:'Continue to the amount screen.'},
        amount:{userAction:'The user enters $1,200 and reviews transfer details.',screenContent:'Amount, recipient, source account, and instant arrival method are visible.',nextAction:'Review and confirm the transfer.'},
        confirm:{userAction:'The user confirms the completed transfer.',screenContent:'Success status, amount, recipient, method, and reference number are visible.',nextAction:'Return to the dashboard.'},
        request:{userAction:'The user requests $240 from Maya for dinner.',screenContent:'Request amount, memo, delivery method, and due date are visible.',nextAction:'Send the payment request.'},
        requestconfirm:{userAction:'The user reviews the sent request.',screenContent:'Pending status, reminder timing, and request reference are visible.',nextAction:'Return to the dashboard or share a reminder.'},
        cards:{userAction:'The user opens card controls after noticing their card is missing.',screenContent:'Available credit, recent charges, and a Freeze card action are visible.',nextAction:'Freeze the card immediately.'},
        frozen:{userAction:'The user confirms that the card is frozen.',screenContent:'Card status and blocked transaction categories are visible.',nextAction:'Leave the card frozen or unfreeze it after recovery.'}
    };
    const screens = screenDefinitions.map(([id, name, variant], index) => ({
        id, name, dataUrl:mockScreen(variant), folder:'Orbit Pay / iOS', app:'Orbit Pay', platform:'iOS', width:390, height:844, deviceFrame:'iphone', tags:['orbit-pay','ios',variant], uploadedAt:Date.now() - (screenDefinitions.length-index)*86400000,
        analysis:structuredClone(analysisByVariant[variant]),
        annotations:index === 0 ? [{id:'ann-seed-1',type:'callout-pin',x:49,y:35.5,width:0,height:0,color:'#3b82f6',strokeWidth:3,label:'Primary transfer action',numberBadge:1}] : []
    }));
    const steps = screens.slice(0, 4).map((screen, index) => ({
        id:`step-${index+1}`, screenId:screen.id, title:['Review account','Choose recipient','Enter amount','Transfer complete'][index],
        ...structuredClone(screen.analysis), annotations: structuredClone(screen.annotations),
        transition:{type:index === 3 ? 'modal-pop':'slide-left', duration:.6, easing:index === 3 ? 'spring':'ease-in-out', scrollDistancePx:300},
        interaction:{enabled:index < 3,type:'tap',xPercent:50,yPercent:index === 0 ? 35.5 : index === 1 ? 56 : 36,label:index === 0 ? 'Send money' : index === 1 ? 'Select Maya' : 'Review transfer'},
        dwellSeconds:3.5
    }));
    const makeStep = (id, screen, title, interaction, transition = 'slide-left') => ({
        id, screenId:screen.id, title, ...structuredClone(screen.analysis), annotations:structuredClone(screen.annotations),
        transition:{type:transition,duration:.6,easing:transition === 'modal-pop' ? 'spring':'ease-in-out',scrollDistancePx:300},
        interaction:{enabled:Boolean(interaction),type:'tap',xPercent:50,yPercent:interaction?.y || 36,label:interaction?.label || ''},dwellSeconds:3.5
    });
    const requestSteps = [
        makeStep('step-request-recipient', screens[1], 'Choose requester', {label:'Select Maya',y:56}),
        makeStep('step-request-amount', screens[4], 'Set request details', {label:'Send request',y:36}),
        makeStep('step-request-sent', screens[5], 'Request sent', null, 'modal-pop')
    ];
    const cardSteps = [
        makeStep('step-card-dashboard', screens[0], 'Review account', {label:'Open cards',y:35.5}),
        makeStep('step-card-overview', screens[6], 'Open card controls', {label:'Freeze card',y:36}),
        makeStep('step-card-frozen', screens[7], 'Card frozen', null, 'modal-pop')
    ];
    const now = Date.now();
    return [{
        id:'proj-orbit-pay', name:'Orbit Pay — Transfer', description:'A precision handoff for the instant transfer journey.',
        demoSeedVersion:2, activeScreenshotId:screens[0].id, activeStoryId:'story-transfer', screenshots:screens,
        folders:[{id:'folder-ios',app:'Orbit Pay',platform:'iOS',fullPath:'Orbit Pay / iOS'},{id:'folder-web',app:'Orbit Pay',platform:'Web',fullPath:'Orbit Pay / Web'}],
        stories:[
            {id:'story-transfer',name:'Send money flow',description:'From account overview to successful transfer.',folder:'Orbit Pay / iOS',steps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now},
            {id:'story-request',name:'Request dinner payment',description:'Choose a contact, set a request, and verify delivery.',folder:'Orbit Pay / iOS',steps:requestSteps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now},
            {id:'story-freeze-card',name:'Freeze a missing card',description:'Secure a missing card and verify transaction restrictions.',folder:'Orbit Pay / iOS',steps:cardSteps,settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'android'},createdAt:now,updatedAt:now}
        ],
        createdAt:now,updatedAt:now
    }];
}

let projects = loadProjects();
let activeProjectId = localStorage.getItem(APP.activeKey) || projects[0].id;

function upgradeSeedProjects(projectList) {
    const target = projectList.find(project => project.id === 'proj-orbit-pay');
    if (!target || Number(target.demoSeedVersion || 1) >= 2) return projectList;
    const template = seedProjects()[0];
    const screenIds = new Set(target.screenshots.map(screen => screen.id));
    const storyIds = new Set(target.stories.map(story => story.id));
    template.screenshots.forEach(screen => { if (!screenIds.has(screen.id)) target.screenshots.push(screen); });
    template.stories.forEach(story => { if (!storyIds.has(story.id)) target.stories.push(story); });
    target.demoSeedVersion = 2;
    target.updatedAt = Date.now();
    saveJson(APP.storageKey, projectList);
    return projectList;
}

function loadProjects() {
    const saved = loadJson(APP.storageKey, []);
    if (Array.isArray(saved)) {
        const valid = saved.filter(isValidProject);
        if (valid.length) return upgradeSeedProjects(valid);
    }
    const seeded = seedProjects();
    saveJson(APP.storageKey, seeded);
    return seeded;
}

function activeProject() {
    return projects.find(project => project.id === activeProjectId) || projects[0];
}

function activeStory() {
    const project = activeProject();
    return project.stories.find(story => story.id === project.activeStoryId) || project.stories[0] || null;
}

function activeScreen() {
    const project = activeProject();
    return project.screenshots.find(screen => screen.id === project.activeScreenshotId) || project.screenshots[0] || null;
}

function screenById(id) {
    return activeProject().screenshots.find(screen => screen.id === id) || null;
}

function activeStep() {
    const story = activeStory();
    if (!story?.steps.length) return null;
    if (!story.activeStepId || !story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0].id;
    return story.steps.find(step => step.id === story.activeStepId) || story.steps[0];
}

function persist(render = false) {
    const project = activeProject();
    if (project) project.updatedAt = Date.now();
    saveJson(APP.storageKey, projects);
    localStorage.setItem(APP.activeKey, activeProjectId);
    if (render) renderApp();
}

function toast(message, type = 'good') {
    const region = $('#toastRegion');
    if (!region) return;
    const item = document.createElement('div');
    item.className = `toast ${type}`;
    item.textContent = message;
    region.append(item);
    setTimeout(() => item.remove(), 3200);
}

function stopPlayback() {
    isPlaying = false;
    if (playerTimer) cancelAnimationFrame(playerTimer);
    playerTimer = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function setView(view) {
    stopPlayback();
    currentView = view;
    if (view !== 'player') playerIndex = 0;
    renderApp();
}

function renderApp() {
    const project = activeProject();
    if (!project) return;
    $('#projectSelect').innerHTML = projects.map(p => `<option value="${esc(p.id)}" ${p.id === activeProjectId ? 'selected':''}>${esc(p.name)}</option>`).join('');
    $$('.nav-button').forEach(button => button.classList.toggle('active', button.dataset.view === currentView));
    const workspace = $('#workspace');
    workspace.innerHTML = currentView === 'screenshots' ? renderLibrary() : currentView === 'editor' ? renderEditor() : currentView === 'stories' ? renderStories() : currentView === 'player' ? renderPlayer() : renderExport();
    bindDynamicUI();
}

function folderSidebar() {
    const project = activeProject();
    const folders = project.folders || [];
    const rows = folders.map(folder => {
        const count = project.screenshots.filter(screen => screen.folder === folder.fullPath).length;
        return `<button class="folder-row ${selectedFolder === folder.fullPath ? 'active':''}" data-action="select-folder" data-folder="${esc(folder.fullPath)}"><span aria-hidden="true">⌑</span><span>${esc(folder.fullPath)}</span><span class="count">${count}</span></button>`;
    }).join('');
    return `<aside class="sidebar"><div class="sidebar-head"><div><div class="eyebrow">Project explorer</div><div class="sidebar-title">Folders</div></div><button class="button ghost icon-only" data-action="add-folder" aria-label="Add folder">＋</button></div><div class="sidebar-scroll"><button class="folder-row ${selectedFolder === null ? 'active':''}" data-action="select-folder" data-folder=""><span>▦</span><span>All screens</span><span class="count">${project.screenshots.length}</span></button><div class="tree-label">App / platform</div>${rows || '<p style="color:var(--dim);font-size:10px;padding:8px">No folders yet.</p>'}</div><div class="local-note"><strong><span class="status-dot"></span>Local workspace</strong>Images and project data stay in this browser.</div></aside>`;
}

function renderLibrary() {
    const project = activeProject();
    const screens = project.screenshots.filter(screen => (!selectedFolder || screen.folder === selectedFolder) && (!searchTerm || `${screen.name} ${screen.folder} ${(screen.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm.toLowerCase())));
    const cards = screens.map(screen => `<article class="screen-card ${project.activeScreenshotId === screen.id ? 'selected':''}" data-screen-id="${esc(screen.id)}"><div class="screen-preview"><img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)} preview"></div><div class="card-actions"><button class="card-action" data-action="edit-screen" data-id="${esc(screen.id)}" aria-label="Annotate screen">⌖</button><button class="card-action" data-action="add-to-story" data-id="${esc(screen.id)}" aria-label="Add to story">＋</button><button class="card-action" data-action="duplicate-screen" data-id="${esc(screen.id)}" aria-label="Duplicate screen">⧉</button><button class="card-action" data-action="delete-screen" data-id="${esc(screen.id)}" aria-label="Delete screen">×</button></div><div class="screen-card-meta"><div class="screen-card-title">${esc(screen.name)}</div><div class="screen-card-sub"><span class="tag">${esc(screen.platform)}</span><span>${screen.width}×${screen.height}</span></div></div></article>`).join('');
    return `<div class="workspace-grid">${folderSidebar()}<section class="main-pane"><header class="view-head"><div><h1 class="view-title">Screenshot library</h1><p class="view-subtitle">Ingest, organize, and prepare product states for walkthroughs.</p></div><div class="view-actions"><input class="search" id="screenSearch" value="${esc(searchTerm)}" placeholder="Search screens or tags"><button class="button primary" data-action="upload"><span>↑</span> Upload screens</button></div></header><div class="library-scroll"><div class="library-meta"><span>${screens.length} OF ${project.screenshots.length} SCREENS</span><span>${esc(selectedFolder || 'ALL FOLDERS')}</span></div><div class="drop-strip" id="dropZone"><span aria-hidden="true">⇣</span><span>Drop screenshots here or paste from clipboard</span><span class="kbd">⌘ V</span></div>${cards ? `<div class="screen-grid">${cards}</div>` : renderEmpty('No screens in this view','Upload an image, paste from the clipboard, or clear the current filter.','upload','Upload screens')}</div></section></div>`;
}

function renderEmpty(title, copy, action, label) {
    return `<div class="empty"><div><div class="empty-mark">⌁</div><h2>${esc(title)}</h2><p>${esc(copy)}</p><button class="button primary" data-action="${esc(action)}">${esc(label)}</button></div></div>`;
}

function renderFilmstrip() {
    const project = activeProject();
    const items = project.screenshots.map((screen, index) => `<button class="film-item ${project.activeScreenshotId === screen.id ? 'active':''}" data-action="select-screen" data-id="${esc(screen.id)}"><div class="film-thumb"><img src="${safeImage(screen.dataUrl)}" alt=""></div><div class="film-name"><span style="font-family:var(--mono);color:var(--dim);margin-right:4px">${String(index+1).padStart(2,'0')}</span>${esc(screen.name)}</div></button>`).join('');
    return `<aside class="filmstrip"><div class="panel-head"><h2>Screen source</h2><span class="eyebrow">${project.screenshots.length}</span></div><div class="panel-scroll">${items}</div></aside>`;
}

function annotationMarkup(annotations = [], includeDraft = false) {
    const all = includeDraft && draftAnnotation ? [...annotations, {...draftAnnotation, id:'draft'}] : annotations;
    return all.map((ann, index) => {
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
    return `<section class="main-pane"><div class="studio-layout">${renderFilmstrip()}<div class="stage-shell"><div class="stage-toolbar"><div class="tool-group">${toolButtons}</div><div class="tool-group">${colors}</div></div><div class="stage"><div class="canvas-wrap ${screen.deviceFrame === 'desktop' ? 'desktop':'mobile'}" id="annotationCanvas" data-screen-id="${esc(screen.id)}"><img src="${safeImage(screen.dataUrl)}" alt="Annotating ${esc(screen.name)}" draggable="false"><div class="annotation-layer" id="annotationLayer">${annotationMarkup(annotations, true)}</div></div></div><div class="stage-status"><span>${screen.width} × ${screen.height} · COORDINATES NORMALIZED 0–100%</span><span>${annotations.length} ANNOTATION${annotations.length === 1 ? '':'S'}</span></div></div><aside class="inspector"><div class="panel-head"><h2>Snapshot inspector</h2><span class="tag">${esc(screen.platform)}</span></div><div class="inspector-tabs"><button class="inspector-tab ${inspectorTab === 'analysis' ? 'active':''}" data-action="inspector-tab" data-tab="analysis">Analysis</button><button class="inspector-tab ${inspectorTab === 'layers' ? 'active':''}" data-action="inspector-tab" data-tab="layers">Layers (${annotations.length})</button></div><div class="panel-scroll" style="padding:0">${inspectorTab === 'analysis' ? `<div class="section"><label class="field"><span class="field-label">SNAPSHOT NAME</span><input class="input" data-screen-field="name" value="${esc(screen.name)}"></label></div><div class="section"><div class="section-title"><span>BEHAVIORAL TRIAD</span><span class="tag">Required</span></div><label class="field"><span class="field-label"><span><span class="field-number">1</span>WHAT THE USER IS DOING</span></span><textarea class="textarea" data-analysis-field="userAction" placeholder="Describe the intent and action…">${esc(analysis.userAction)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">2</span>WHAT IS VISIBLE</span></span><textarea class="textarea" data-analysis-field="screenContent" placeholder="Describe the visible interface state…">${esc(analysis.screenContent)}</textarea></label><label class="field"><span class="field-label"><span><span class="field-number">3</span>WHAT HAPPENS NEXT</span></span><textarea class="textarea" data-analysis-field="nextAction" placeholder="Describe the expected result…">${esc(analysis.nextAction)}</textarea></label></div><div class="section"><button class="button primary" style="width:100%" data-action="save-snapshot">Save snapshot</button><button class="button" style="width:100%;margin-top:7px" data-action="add-to-story" data-id="${esc(screen.id)}">Add to walkthrough</button></div>` : `<div class="section"><div class="section-title"><span>ANNOTATIONS</span><button class="button ghost small danger" data-action="clear-annotations" ${annotations.length ? '':'disabled'}>Clear all</button></div><div class="annotation-list">${annotationRows || '<p style="color:var(--dim);font-size:10px;line-height:1.5">Choose a tool and draw directly on the screen. Coordinates remain stable at any display size.</p>'}</div></div><div class="section"><div class="section-title">DRAWING HELP</div><p style="color:var(--dim);font-size:10px;line-height:1.6">Pins and text are placed with a click. Highlights, boxes, arrows, and spotlights are drawn by dragging.</p></div>`}</div></aside></div></section>`;
}

function renderStories() {
    const project = activeProject();
    const story = activeStory();
    if (!story) return `<section class="main-pane">${renderEmpty('No walkthrough yet','Create a story from any screenshot in the library.','screenshots','Open library')}</section>`;
    const step = activeStep();
    const stepItems = story.steps.map((item,index) => {
        const screen = screenById(item.screenId);
        return `<button class="step-item ${step?.id === item.id ? 'active':''}" data-action="select-step" data-id="${esc(item.id)}"><span class="step-index">${index+1}</span><span class="step-thumb">${screen ? `<img src="${safeImage(screen.dataUrl)}" alt="">`:''}</span><span class="step-copy"><span class="step-title">${esc(item.title)}</span><span class="step-meta">${Number(item.transition?.duration || 0).toFixed(1)}s · ${esc(item.transition?.type || 'none')}</span></span></button>`;
    }).join('');
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    if (!step) return `<section class="main-pane"><div class="story-layout"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough</h2></div><div class="story-chooser"><select class="select" data-action="change-story">${storyOptions}</select></div></aside><div>${renderEmpty('This walkthrough has no steps','Add a screen from the library to start the sequence.','screenshots','Add a screen')}</div><aside class="inspector"></aside></div></section>`;
    const screen = screenById(step.screenId);
    const index = story.steps.findIndex(item => item.id === step.id);
    const transitionOptions = ['none','fade','slide-left','slide-right','slide-up','slide-down','scroll-down','scroll-up','tap-zoom','modal-pop'];
    const easingOptions = ['linear','ease','ease-in-out','spring'];
    return `<section class="main-pane"><div class="story-layout"><aside class="story-rail"><div class="panel-head"><h2>Walkthrough steps</h2><span class="eyebrow">${story.steps.length}</span></div><div class="story-chooser"><select class="select" data-action="change-story">${storyOptions}</select><button class="button" data-action="new-story" style="width:100%;margin-top:7px">＋ New walkthrough</button></div><div class="step-list">${stepItems}</div></aside><div class="flow-stage"><div class="stage-toolbar"><div><strong style="font-size:11px">${esc(step.title)}</strong><span style="color:var(--dim);font:9px/1 var(--mono);margin-left:8px">STEP ${index+1} / ${story.steps.length}</span></div><div class="tool-group"><span class="tag">${esc(screen?.deviceFrame || 'none')}</span><button class="button small" data-action="preview-story">▶ Preview</button></div></div><div class="step-canvas"><div class="device-mini">${deviceMarkup(screen, step, false)}</div></div><div class="story-bottom"><div class="step-reorder"><button class="button small" data-action="move-step" data-direction="-1" ${index === 0 ? 'disabled':''}>← Earlier</button><button class="button small" data-action="move-step" data-direction="1" ${index === story.steps.length-1 ? 'disabled':''}>Later →</button></div><div class="cluster" style="gap:6px"><button class="button small" data-action="duplicate-step">⧉ Duplicate</button><button class="button small danger" data-action="delete-step" ${story.steps.length <= 1 ? 'disabled':''}>Delete</button></div></div></div><aside class="inspector"><div class="panel-head"><h2>Step inspector</h2><span class="tag">${index+1}/${story.steps.length}</span></div><div class="panel-scroll" style="padding:0"><div class="section"><label class="field"><span class="field-label">STEP TITLE</span><input class="input" data-step-field="title" value="${esc(step.title)}"></label><label class="field"><span class="field-label">DWELL TIME <span>${Number(step.dwellSeconds).toFixed(1)}s</span></span><input type="range" data-step-field="dwellSeconds" min="1" max="10" step=".5" value="${Number(step.dwellSeconds)}" style="width:100%"></label></div><div class="section"><div class="section-title">TRANSITION</div><label class="field"><span class="field-label">TYPE</span><select class="select" data-transition-field="type">${transitionOptions.map(value => `<option value="${value}" ${step.transition.type === value ? 'selected':''}>${value.replaceAll('-',' ')}</option>`).join('')}</select></label><div class="field-grid"><label class="field"><span class="field-label">DURATION</span><input class="input" type="number" data-transition-field="duration" min=".1" max="4" step=".1" value="${Number(step.transition.duration)}"></label><label class="field"><span class="field-label">EASING</span><select class="select" data-transition-field="easing">${easingOptions.map(value => `<option value="${value}" ${step.transition.easing === value ? 'selected':''}>${value}</option>`).join('')}</select></label></div></div><div class="section"><div class="section-title"><span>INTERACTION HOTSPOT</span><button class="switch ${step.interaction.enabled ? 'on':''}" data-action="toggle-hotspot" aria-label="Toggle hotspot"></button></div>${step.interaction.enabled ? `<label class="field"><span class="field-label">LABEL</span><input class="input" data-interaction-field="label" value="${esc(step.interaction.label || '')}"></label><div class="field-grid"><label class="field"><span class="field-label">X POSITION</span><input class="input" type="number" data-interaction-field="xPercent" min="0" max="100" value="${Number(step.interaction.xPercent)}"></label><label class="field"><span class="field-label">Y POSITION</span><input class="input" type="number" data-interaction-field="yPercent" min="0" max="100" value="${Number(step.interaction.yPercent)}"></label></div>` : '<p style="color:var(--dim);font-size:10px;line-height:1.5">Enable a hotspot to let viewers advance by clicking the target.</p>'}</div><div class="section"><div class="section-title">BEHAVIORAL TRIAD</div><label class="field"><span class="field-label">USER ACTION</span><textarea class="textarea" data-step-field="userAction">${esc(step.userAction)}</textarea></label><label class="field"><span class="field-label">VISIBLE STATE</span><textarea class="textarea" data-step-field="screenContent">${esc(step.screenContent)}</textarea></label><label class="field"><span class="field-label">NEXT ACTION</span><textarea class="textarea" data-step-field="nextAction">${esc(step.nextAction)}</textarea></label></div></div></aside></div></section>`;
}

function deviceMarkup(screen, step, player = false) {
    if (!screen) return '<div class="empty"><p>Source screenshot unavailable.</p></div>';
    const story = activeStory();
    const frame = story?.settings?.showDeviceMockup === false ? 'none' : (story?.settings?.deviceType || screen.deviceFrame || 'none');
    const annotations = step?.annotations?.length ? step.annotations : (screen.annotations || []);
    const hotspot = player && step?.interaction?.enabled ? `<button class="hotspot" data-action="hotspot-next" style="--x:${Number(step.interaction.xPercent)}%;--y:${Number(step.interaction.yPercent)}%" aria-label="${esc(step.interaction.label || 'Advance to next step')}"><span class="hotspot-label">${esc(step.interaction.label || 'Tap')}</span></button>` : '';
    return `<div class="device ${esc(frame)}"><div class="device-screen"><img src="${safeImage(screen.dataUrl)}" alt="${esc(screen.name)}"><div class="annotation-layer">${annotationMarkup(annotations)}</div>${hotspot}</div></div>`;
}

function renderPlayer() {
    const project = activeProject();
    const story = activeStory();
    if (!story?.steps.length) return `<section class="main-pane">${renderEmpty('Nothing to play yet','Add at least one screenshot to a walkthrough.','screenshots','Open library')}</section>`;
    playerIndex = clamp(playerIndex, 0, story.steps.length - 1);
    const step = story.steps[playerIndex];
    const screen = screenById(step.screenId);
    const progress = isPlaying ? 0 : 0;
    const storyOptions = project.stories.map(item => `<option value="${esc(item.id)}" ${item.id === story.id ? 'selected':''}>${esc(item.name)}</option>`).join('');
    const timeline = story.steps.map((item,index) => `<button class="timeline-step ${index < playerIndex ? 'done':''} ${index === playerIndex ? 'active':''}" data-action="player-jump" data-index="${index}" aria-label="Go to step ${index+1}: ${esc(item.title)}" style="--progress:${index === playerIndex ? progress : 0}%"></button>`).join('');
    return `<section class="player-view"><header class="player-top"><div><div class="player-title">${esc(story.name)}</div><div class="player-caption">${esc(project.name)} · INTERACTIVE WALKTHROUGH</div></div><div class="cluster" style="gap:7px"><span class="status-dot"></span><span class="eyebrow">Local preview</span></div><div class="view-actions"><select class="select" style="width:170px" data-action="change-story">${storyOptions}</select><button class="button icon-only" data-action="open-audio" aria-label="Narration settings">◖</button><button class="button icon-only" data-action="fullscreen" aria-label="Enter fullscreen">⛶</button></div></header><div class="player-main"><div class="player-stage"><div class="player-device-wrap" id="playerDevice">${deviceMarkup(screen, step, true)}</div></div><aside class="narrative"><div class="narrative-step">Step ${playerIndex+1} of ${story.steps.length}</div><h2>${esc(step.title)}</h2><div class="narrative-block"><div class="narrative-label">What the user is doing</div><p class="narrative-copy">${esc(step.userAction || 'No action documented.')}</p></div><div class="narrative-block"><div class="narrative-label">What is visible</div><p class="narrative-copy">${esc(step.screenContent || 'No visible state documented.')}</p></div><div class="narrative-block"><div class="narrative-label">What happens next</div><p class="narrative-copy">${esc(step.nextAction || 'End of documented flow.')}</p></div><div class="narrative-block"><span class="tag">${esc(step.transition.type)}</span><span class="tag" style="margin-left:5px">${Number(step.transition.duration).toFixed(1)}s ${esc(step.transition.easing)}</span></div></aside></div><footer class="player-bottom"><div class="transport"><button class="button icon-only" data-action="player-prev" ${playerIndex === 0 ? 'disabled':''} aria-label="Previous step">←</button><button class="play-button" data-action="toggle-play" aria-label="${isPlaying ? 'Pause':'Play'}">${isPlaying ? 'Ⅱ':'▶'}</button><button class="button icon-only" data-action="player-next" ${playerIndex === story.steps.length-1 ? 'disabled':''} aria-label="Next step">→</button></div><div class="timeline" style="--steps:${story.steps.length}" id="timeline">${timeline}</div><div class="player-time"><span id="playerElapsed">${(playerIndex+1).toString().padStart(2,'0')}</span> / ${story.steps.length.toString().padStart(2,'0')} · ${Number(story.settings.defaultSpeed || 1).toFixed(1)}×</div></footer></section>`;
}

function generateMarkdown() {
    const project = activeProject();
    const story = activeStory();
    const lines = [`# ${project.name}`, '', project.description || '', '', '## Walkthrough inventory', '', `- Screens: ${project.screenshots.length}`, `- Walkthroughs: ${project.stories.length}`, `- Exported: ${new Date().toLocaleString()}`, ''];
    const stories = exportScope === 'story' && story ? [story] : project.stories;
    stories.forEach(flow => {
        lines.push(`## ${flow.name}`, '', flow.description || '', '', `**Device:** ${flow.settings.deviceType} · **Default speed:** ${flow.settings.defaultSpeed}x`, '');
        flow.steps.forEach((step,index) => {
            const screen = project.screenshots.find(item => item.id === step.screenId);
            lines.push(`### ${index+1}. ${step.title}`, '', `- **Source:** ${screen?.name || 'Missing source'}`, `- **User action:** ${step.userAction || 'Not documented'}`, `- **Visible state:** ${step.screenContent || 'Not documented'}`, `- **Next action:** ${step.nextAction || 'Not documented'}`, `- **Transition:** ${step.transition.type}, ${step.transition.duration}s, ${step.transition.easing}`, `- **Dwell:** ${step.dwellSeconds}s`, `- **Hotspot:** ${step.interaction.enabled ? `${step.interaction.label || step.interaction.type} at (${step.interaction.xPercent}%, ${step.interaction.yPercent}%)` : 'None'}`, '');
        });
    });
    return lines.join('\n');
}

function projectPayload(scope = exportScope) {
    const project = structuredClone(activeProject());
    if (scope === 'story') {
        const story = activeStory();
        const screenIds = new Set(story?.steps.map(step => step.screenId) || []);
        project.stories = story ? [story] : [];
        project.screenshots = project.screenshots.filter(screen => screenIds.has(screen.id));
        project.activeStoryId = story?.id || '';
    }
    return {version:2, app:APP.name, sharedAt:Date.now(), project};
}

function renderExport() {
    const project = activeProject();
    const story = activeStory();
    const markdown = generateMarkdown();
    const bytes = new Blob([JSON.stringify(projectPayload())]).size;
    return `<section class="main-pane"><header class="view-head"><div><h1 class="view-title">Export & share</h1><p class="view-subtitle">Package the walkthrough for stakeholders, engineers, or safekeeping.</p></div><div class="view-actions"><span class="tag">No server upload</span></div></header><div class="export-scroll"><div class="export-grid"><div><section class="export-section"><h2>Shareable walkthrough link</h2><p>Encode the selected scope into this page’s URL. Anyone with the link can open an independent, local copy.</p><div class="scope-row"><button class="scope-option ${exportScope === 'project' ? 'active':''}" data-action="export-scope" data-scope="project"><strong>All walkthroughs</strong>${project.stories.length} flows · ${project.screenshots.length} screens</button><button class="scope-option ${exportScope === 'story' ? 'active':''}" data-action="export-scope" data-scope="story"><strong>Current walkthrough</strong>${esc(story?.name || 'No story')}</button></div><div class="export-actions"><button class="button primary" data-action="copy-share">⌁ Copy share link</button><button class="button" data-action="preview-story">▶ Open player</button></div></section><section class="export-section"><h2>Portable files</h2><p>Download an offline presentation, a developer-ready specification, or a complete editable backup.</p><div class="export-actions"><button class="button primary" data-action="download-html">↓ Standalone HTML</button><button class="button" data-action="download-markdown">↓ Markdown spec</button><button class="button" data-action="download-json">↓ Project JSON</button><button class="button" data-action="import-json">↑ Restore JSON</button></div></section><section class="export-section" style="border:0"><h2>Specification preview</h2><p>The exported Markdown uses the canonical behavioral triad for every step.</p><div class="markdown-preview" style="margin-top:14px">${esc(markdown)}</div><div class="export-actions"><button class="button" data-action="copy-markdown">Copy Markdown</button></div></section></div><aside><div class="export-stats"><h2>Package telemetry</h2><div class="stat-table"><div class="stat-row"><span>Selected scope</span><strong>${exportScope === 'project' ? 'PROJECT':'STORY'}</strong></div><div class="stat-row"><span>Walkthroughs</span><strong>${exportScope === 'project' ? project.stories.length : (story ? 1 : 0)}</strong></div><div class="stat-row"><span>Screenshots</span><strong>${exportScope === 'project' ? project.screenshots.length : new Set(story?.steps.map(step=>step.screenId)||[]).size}</strong></div><div class="stat-row"><span>Story steps</span><strong>${exportScope === 'project' ? project.stories.reduce((n,item)=>n+item.steps.length,0) : (story?.steps.length || 0)}</strong></div><div class="stat-row"><span>Payload size</span><strong>${formatBytes(bytes)}</strong></div></div><div class="privacy-seal"><strong><span class="status-dot"></span>Private by architecture</strong>No asset is sent to StoryFlow servers. Downloads and share payloads are generated in your browser.</div></div></aside></div></div></section>`;
}

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
        if (event.button !== 0) return;
        event.preventDefault();
        const point = canvasPoint(event, canvas);
        if (selectedTool === 'callout-pin' || selectedTool === 'text-box') {
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
            screen.annotations.push({...draftAnnotation, id:uid('ann')});
            persist();
        }
        start = null;
        draftAnnotation = null;
        renderApp();
    });

    canvas.addEventListener('pointercancel', () => { start = null; draftAnnotation = null; renderApp(); });
}

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

function addScreenToStory(screenId) {
    const project = activeProject();
    const screen = screenById(screenId);
    if (!screen) return;
    let story = activeStory();
    if (!story) {
        story = newStory('Primary walkthrough');
        project.stories.push(story);
        project.activeStoryId = story.id;
    }
    const step = {
        id:uid('step'), screenId:screen.id, title:screen.name.replace(/\.[^.]+$/,''),
        userAction:screen.analysis?.userAction || 'The user interacts with this screen.',
        screenContent:screen.analysis?.screenContent || 'The documented interface state is visible.',
        nextAction:screen.analysis?.nextAction || 'Continue to the next step.',
        annotations:structuredClone(screen.annotations || []),
        transition:{type:'slide-left',duration:.6,easing:'ease-in-out',scrollDistancePx:300},
        interaction:{enabled:true,type:'tap',xPercent:50,yPercent:50,label:'Continue'}, dwellSeconds:3.5
    };
    story.steps.push(step);
    story.activeStepId = step.id;
    project.activeStoryId = story.id;
    persist();
    toast(`Added “${screen.name}” to ${story.name}.`);
}

function newStory(name) {
    const now = Date.now();
    return {id:uid('story'),name,description:'A new documented product journey.',folder:selectedFolder || '',steps:[],settings:{defaultSpeed:1,autoAdvance:false,interactiveHotspots:true,showDeviceMockup:true,deviceType:'iphone'},createdAt:now,updatedAt:now};
}

function moveStep(direction) {
    const story = activeStory();
    const step = activeStep();
    if (!story || !step) return;
    const index = story.steps.findIndex(item => item.id === step.id);
    const target = index + Number(direction);
    if (target < 0 || target >= story.steps.length) return;
    [story.steps[index], story.steps[target]] = [story.steps[target], story.steps[index]];
    persist(true);
}

function setPlayerIndex(index, resume = isPlaying) {
    const story = activeStory();
    if (!story?.steps.length) return;
    const next = clamp(Number(index), 0, story.steps.length - 1);
    const device = $('#playerDevice');
    if (device) device.classList.add('fade-out');
    if (playerTimer) cancelAnimationFrame(playerTimer);
    setTimeout(() => {
        playerIndex = next;
        renderApp();
        if (resume) startStepTimer();
    }, 120);
}

function startStepTimer() {
    const story = activeStory();
    const step = story?.steps[playerIndex];
    if (!isPlaying || !step) return;
    if (playerTimer) cancelAnimationFrame(playerTimer);
    playerStartedAt = performance.now();
    speakStep(step);
    const duration = Math.max(500, Number(step.dwellSeconds || 3.5) * 1000 / Number(story.settings.defaultSpeed || 1));
    const tick = now => {
        if (!isPlaying) return;
        const progress = clamp(((now - playerStartedAt) / duration) * 100, 0, 100);
        const active = $('.timeline-step.active');
        if (active) active.style.setProperty('--progress', `${progress}%`);
        if (progress >= 100) {
            if (playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
            else { stopPlayback(); renderApp(); }
            return;
        }
        playerTimer = requestAnimationFrame(tick);
    };
    playerTimer = requestAnimationFrame(tick);
}

function speakStep(step) {
    if (!audioSettings.enabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const parts = [];
    if (audioSettings.readTitle && step.title) parts.push(step.title);
    if (audioSettings.readUserAction && step.userAction) parts.push(step.userAction);
    if (audioSettings.readScreenContent && step.screenContent) parts.push(step.screenContent);
    if (audioSettings.readNextAction && step.nextAction) parts.push(step.nextAction);
    if (!parts.length) return;
    const utterance = new SpeechSynthesisUtterance(parts.join('. '));
    utterance.rate = Number(audioSettings.rate);
    utterance.pitch = Number(audioSettings.pitch);
    utterance.volume = Number(audioSettings.volume);
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.voiceURI === audioSettings.voiceURI) || voices.find(voice => /Google US English/i.test(voice.name)) || voices.find(voice => /^en-US/i.test(voice.lang)) || null;
    if (audioSettings.advanceOnSpeechEnd) utterance.onend = () => {
        if (!isPlaying) return;
        const story = activeStory();
        if (playerIndex < story.steps.length - 1) setPlayerIndex(playerIndex + 1, true);
    };
    window.speechSynthesis.speak(utterance);
}

function renderAudioSettings() {
    const voices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices().filter(voice => voice.lang.startsWith('en')) : [];
    const voiceOptions = [`<option value="">Automatic English voice</option>`, ...voices.map(voice => `<option value="${esc(voice.voiceURI)}" ${voice.voiceURI === audioSettings.voiceURI ? 'selected':''}>${esc(voice.name)} (${esc(voice.lang)})</option>`)].join('');
    $('#audioSettingsBody').innerHTML = `<div class="toggle-row"><span>Enable spoken narration</span><button class="switch ${audioSettings.enabled ? 'on':''}" data-action="audio-toggle" data-key="enabled" aria-label="Toggle narration"></button></div><label class="field" style="margin-top:12px"><span class="field-label">VOICE</span><select class="select" data-audio-field="voiceURI">${voiceOptions}</select></label><div style="margin-top:16px"><label class="range-row"><span>Rate</span><input type="range" data-audio-field="rate" min=".5" max="2" step=".1" value="${audioSettings.rate}"><span>${Number(audioSettings.rate).toFixed(1)}×</span></label><label class="range-row"><span>Pitch</span><input type="range" data-audio-field="pitch" min=".5" max="1.5" step=".1" value="${audioSettings.pitch}"><span>${Number(audioSettings.pitch).toFixed(1)}</span></label><label class="range-row"><span>Volume</span><input type="range" data-audio-field="volume" min="0" max="1" step=".1" value="${audioSettings.volume}"><span>${Math.round(audioSettings.volume*100)}%</span></label></div><div style="border-top:1px solid var(--border);padding-top:10px;margin-top:10px">${[['readTitle','Read step title'],['readUserAction','Read user action'],['readScreenContent','Read visible state'],['readNextAction','Read next action'],['advanceOnSpeechEnd','Advance when speech ends']].map(([key,label]) => `<div class="toggle-row"><span>${label}</span><button class="switch ${audioSettings[key] ? 'on':''}" data-action="audio-toggle" data-key="${key}" aria-label="Toggle ${label}"></button></div>`).join('')}</div>`;
}

function openAudioDialog() {
    renderAudioSettings();
    $('#audioDialog').showModal();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => { if ($('#audioDialog').open) renderAudioSettings(); };
}

function encodePayload(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = '';
    for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(binary).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

function decodePayload(value) {
    const normalized = value.replaceAll('-','+').replaceAll('_','/');
    const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}

async function copyText(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        toast(message);
    } catch {
        const input = document.createElement('textarea');
        input.value = text;
        document.body.append(input);
        input.select();
        document.execCommand('copy');
        input.remove();
        toast(message);
    }
}

function download(content, filename, type) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], {type}));
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function standaloneHtml() {
    const payload = projectPayload();
    const json = JSON.stringify(payload).replace(/</g, '\\u003c');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(activeProject().name)} — StoryFlow</title><style>*{box-sizing:border-box}body{margin:0;background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif}header{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#0b1220;border-bottom:1px solid #1e293b}main{min-height:calc(100vh - 126px);display:grid;grid-template-columns:1fr 330px}.stage{display:grid;place-items:center;padding:24px;background:radial-gradient(circle,#172033,#020617 60%)}.frame{height:min(72vh,680px);aspect-ratio:390/844;border:8px solid #1e293b;border-radius:40px;overflow:hidden;background:#05070c}.frame img{width:100%;height:100%;object-fit:contain}.notes{padding:26px 20px;border-left:1px solid #1e293b;background:#0b1220}.notes small{color:#60a5fa}.notes h1{font-size:21px}.notes h3{margin:22px 0 6px;color:#64748b;font:700 10px monospace;text-transform:uppercase}.notes p{color:#cbd5e1;font-size:13px;line-height:1.6}.controls{height:68px;display:flex;align-items:center;justify-content:center;gap:10px;border-top:1px solid #1e293b;background:#0b1220}button{border:1px solid #334155;border-radius:6px;background:#172033;color:#e2e8f0;padding:9px 14px;cursor:pointer}button.primary{background:#2563eb;border-color:#3b82f6}@media(max-width:760px){main{grid-template-columns:1fr}.stage{min-height:70vh}.notes{border-left:0;border-top:1px solid #1e293b}.frame{height:min(62vh,620px)}}</style></head><body><header><strong id="project"></strong><span id="flow"></span></header><main><div class="stage"><div class="frame"><img id="screen" alt=""></div></div><aside class="notes"><small id="count"></small><h1 id="title"></h1><h3>What the user is doing</h3><p id="action"></p><h3>What is visible</h3><p id="visible"></p><h3>What happens next</h3><p id="next"></p></aside></main><div class="controls"><button id="prev">Previous</button><button class="primary" id="nextBtn">Next step</button></div><script>const DATA=${json};const P=DATA.project,S=P.stories[0];let i=0;const q=s=>document.querySelector(s);function show(){const x=S.steps[i],img=P.screenshots.find(v=>v.id===x.screenId);q('#project').textContent=P.name;q('#flow').textContent=S.name;q('#screen').src=img?img.dataUrl:'';q('#screen').alt=img?img.name:'';q('#count').textContent='STEP '+(i+1)+' OF '+S.steps.length;q('#title').textContent=x.title;q('#action').textContent=x.userAction;q('#visible').textContent=x.screenContent;q('#next').textContent=x.nextAction;q('#prev').disabled=i===0;q('#nextBtn').textContent=i===S.steps.length-1?'Restart':'Next step'}q('#prev').onclick=()=>{i=Math.max(0,i-1);show()};q('#nextBtn').onclick=()=>{i=i===S.steps.length-1?0:i+1;show()};show();<\/script></body></html>`;
}

function importProjectData(file) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const project = parsed.project || parsed;
            if (!isValidProject(project)) throw new Error('Unsupported project shape');
            project.id = uid('proj-import');
            project.name = `${project.name} (Imported)`;
            projects.unshift(project);
            activeProjectId = project.id;
            selectedFolder = null;
            persist(true);
            toast('Project restored from JSON.');
        } catch (error) {
            console.error(error);
            toast('That file is not a valid StoryFlow project.', 'warn');
        }
    };
    reader.readAsText(file);
}

function ingestSharedHash() {
    const match = location.hash.match(/^#(?:player|flow)=([^&]+)/);
    if (!match) return false;
    try {
        if (match[1].length > 7000000) throw new Error('Payload exceeds safe browser limits');
        const parsed = decodePayload(match[1]);
        const project = parsed.project;
        if (!isValidProject(project)) throw new Error('Invalid payload');
        project.id = uid('shared-proj');
        project.name = `${project.name} (Shared)`;
        projects.unshift(project);
        activeProjectId = project.id;
        currentView = 'player';
        history.replaceState(null,'',location.pathname + location.search);
        persist();
        toast('Shared walkthrough loaded locally.');
        return true;
    } catch (error) {
        console.warn('Invalid shared payload', error);
        toast('This share link is damaged or incomplete.', 'warn');
        return false;
    }
}

document.addEventListener('click', event => {
    const target = event.target.closest('[data-action], [data-view]');
    if (!target) return;
    if (target.dataset.view) { setView(target.dataset.view); return; }
    const action = target.dataset.action;
    const project = activeProject();

    if (['screenshots','editor','stories','player','export'].includes(action)) { setView(action); return; }

    if (action === 'new-project') $('#projectDialog').showModal();
    else if (action === 'close-project-dialog') $('#projectDialog').close();
    else if (action === 'open-audio') openAudioDialog();
    else if (action === 'close-audio') $('#audioDialog').close();
    else if (action === 'upload') $('#fileInput').click();
    else if (action === 'select-folder') { selectedFolder = target.dataset.folder || null; renderApp(); }
    else if (action === 'add-folder') {
        const platform = prompt('Platform folder name (for example, Android or Web):');
        if (!platform?.trim()) return;
        const fullPath = `${project.name.split('—')[0].trim()} / ${platform.trim()}`;
        if (project.folders.some(folder => folder.fullPath === fullPath)) { toast('That folder already exists.', 'warn'); return; }
        project.folders.push({id:uid('folder'),app:project.name.split('—')[0].trim(),platform:platform.trim(),fullPath});
        selectedFolder = fullPath;
        persist(true);
    }
    else if (action === 'edit-screen') { project.activeScreenshotId = target.dataset.id; persist(); setView('editor'); }
    else if (action === 'select-screen') { project.activeScreenshotId = target.dataset.id; persist(true); }
    else if (action === 'duplicate-screen') {
        const original = screenById(target.dataset.id);
        if (!original) return;
        const copy = structuredClone(original); copy.id = uid('screen'); copy.name = original.name.replace(/(\.[^.]+)$/, ' copy$1'); copy.uploadedAt = Date.now();
        project.screenshots.push(copy); project.activeScreenshotId = copy.id; persist(true); toast('Screen duplicated.');
    }
    else if (action === 'delete-screen') {
        const screen = screenById(target.dataset.id);
        if (!screen || !confirm(`Delete “${screen.name}”? Linked walkthrough steps will also be removed.`)) return;
        project.screenshots = project.screenshots.filter(item => item.id !== screen.id);
        project.stories.forEach(story => {
            story.steps = story.steps.filter(step => step.screenId !== screen.id);
            if (!story.steps.some(step => step.id === story.activeStepId)) story.activeStepId = story.steps[0]?.id || '';
        });
        project.activeScreenshotId = project.screenshots[0]?.id || '';
        persist(true);
        toast('Screen and linked steps deleted.');
    }
    else if (action === 'add-to-story') { addScreenToStory(target.dataset.id); setView('stories'); }
    else if (action === 'select-tool') { selectedTool = target.dataset.tool; renderApp(); }
    else if (action === 'select-color') { selectedColor = target.dataset.color; renderApp(); }
    else if (action === 'inspector-tab') { inspectorTab = target.dataset.tab; renderApp(); }
    else if (action === 'delete-annotation') { const screen = activeScreen(); screen.annotations = screen.annotations.filter(item => item.id !== target.dataset.id); persist(true); }
    else if (action === 'clear-annotations') { const screen = activeScreen(); screen.annotations = []; persist(true); }
    else if (action === 'save-snapshot') { persist(); toast('Snapshot and analytical notes saved.'); }
    else if (action === 'new-story') {
        const name = prompt('Walkthrough name:');
        if (!name?.trim()) return;
        const story = newStory(name.trim()); project.stories.push(story); project.activeStoryId = story.id; persist(true);
    }
    else if (action === 'select-step') { const story = activeStory(); story.activeStepId = target.dataset.id; persist(true); }
    else if (action === 'move-step') moveStep(target.dataset.direction);
    else if (action === 'duplicate-step') {
        const story = activeStory(), step = activeStep(), index = story.steps.findIndex(item => item.id === step.id);
        const copy = structuredClone(step); copy.id = uid('step'); copy.title += ' copy'; story.steps.splice(index+1,0,copy); story.activeStepId = copy.id; persist(true);
    }
    else if (action === 'delete-step') {
        const story = activeStory();
        if (story.steps.length <= 1) { toast('A walkthrough must contain at least one step.', 'warn'); return; }
        const step = activeStep(), index = story.steps.findIndex(item => item.id === step.id); story.steps.splice(index,1); story.activeStepId = story.steps[Math.max(0,index-1)].id; persist(true);
    }
    else if (action === 'toggle-hotspot') { const step = activeStep(); step.interaction.enabled = !step.interaction.enabled; persist(true); }
    else if (action === 'preview-story') setView('player');
    else if (action === 'player-prev') setPlayerIndex(playerIndex-1, false);
    else if (action === 'player-next' || action === 'hotspot-next') setPlayerIndex(playerIndex+1, isPlaying);
    else if (action === 'player-jump') setPlayerIndex(Number(target.dataset.index), isPlaying);
    else if (action === 'toggle-play') {
        if (isPlaying) { stopPlayback(); renderApp(); }
        else { isPlaying = true; renderApp(); startStepTimer(); }
    }
    else if (action === 'fullscreen') { const element = $('.player-view'); if (element?.requestFullscreen) element.requestFullscreen(); }
    else if (action === 'export-scope') { exportScope = target.dataset.scope; renderApp(); }
    else if (action === 'copy-share') {
        const hashKey = exportScope === 'project' ? 'player':'flow';
        const url = `${location.origin}${location.pathname}#${hashKey}=${encodePayload(projectPayload())}`;
        copyText(url,'Share link copied.');
    }
    else if (action === 'copy-markdown') copyText(generateMarkdown(),'Markdown copied.');
    else if (action === 'download-markdown') download(generateMarkdown(),`${slug(project.name)}-spec.md`,'text/markdown;charset=utf-8');
    else if (action === 'download-json') download(JSON.stringify(projectPayload('project'),null,2),`${slug(project.name)}-backup.json`,'application/json;charset=utf-8');
    else if (action === 'download-html') download(standaloneHtml(),`${slug(project.name)}-walkthrough.html`,'text/html;charset=utf-8');
    else if (action === 'import-json') $('#jsonInput').click();
    else if (action === 'audio-toggle') { audioSettings[target.dataset.key] = !audioSettings[target.dataset.key]; saveJson(APP.audioKey,audioSettings); renderAudioSettings(); }
});

document.addEventListener('input', event => {
    const target = event.target;
    if (target.id === 'screenSearch') {
        searchTerm = target.value;
        renderApp();
        const search = $('#screenSearch'); search?.focus(); search?.setSelectionRange(search.value.length,search.value.length);
        return;
    }
    const screen = activeScreen();
    const step = activeStep();
    if (target.dataset.analysisField && screen) { screen.analysis ||= {}; screen.analysis[target.dataset.analysisField] = target.value; persist(); }
    else if (target.dataset.screenField && screen) { screen[target.dataset.screenField] = target.value; persist(); }
    else if (target.dataset.stepField && step) { step[target.dataset.stepField] = target.type === 'range' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.transitionField && step) { step.transition[target.dataset.transitionField] = target.type === 'number' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.interactionField && step) { step.interaction[target.dataset.interactionField] = target.type === 'number' ? Number(target.value) : target.value; persist(); }
    else if (target.dataset.audioField) { audioSettings[target.dataset.audioField] = target.type === 'range' ? Number(target.value) : target.value; saveJson(APP.audioKey,audioSettings); if (target.type === 'range') renderAudioSettings(); }
});

document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'projectSelect') {
        activeProjectId = target.value; selectedFolder = null; playerIndex = 0; persist(true);
    } else if (target.id === 'fileInput') {
        handleFiles([...target.files]); target.value = '';
    } else if (target.id === 'jsonInput') {
        if (target.files[0]) importProjectData(target.files[0]); target.value = '';
    } else if (target.dataset.action === 'change-story') {
        activeProject().activeStoryId = target.value; playerIndex = 0; persist(true);
    } else if (target.dataset.transitionField) {
        const step = activeStep(); step.transition[target.dataset.transitionField] = target.type === 'number' ? Number(target.value) : target.value; persist(true);
    } else if (target.dataset.audioField) {
        audioSettings[target.dataset.audioField] = target.type === 'range' ? Number(target.value) : target.value; saveJson(APP.audioKey,audioSettings);
    }
});

document.addEventListener('paste', event => {
    if (currentView !== 'screenshots' || ['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
    const files = [...(event.clipboardData?.files || [])].filter(file => file.type.startsWith('image/'));
    if (files.length) { event.preventDefault(); handleFiles(files); }
});

document.addEventListener('keydown', event => {
    if (currentView !== 'player' || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); setPlayerIndex(playerIndex+1,isPlaying); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); setPlayerIndex(playerIndex-1,isPlaying); }
    else if (event.code === 'Space') { event.preventDefault(); $('[data-action="toggle-play"]')?.click(); }
});

$('#projectForm').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    if (!name) return;
    const now = Date.now();
    const story = newStory('Primary walkthrough');
    const project = {id:uid('proj'),name,description:String(data.get('description')||''),activeScreenshotId:'',activeStoryId:story.id,screenshots:[],folders:[{id:uid('folder'),app:name,platform:'Web',fullPath:`${name} / Web`},{id:uid('folder'),app:name,platform:'Mobile',fullPath:`${name} / Mobile`}],stories:[story],createdAt:now,updatedAt:now};
    projects.push(project); activeProjectId = project.id; selectedFolder = null; currentView = 'screenshots'; persist();
    $('#projectDialog').close(); event.currentTarget.reset(); renderApp(); toast(`Project “${name}” created.`);
});

if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
ingestSharedHash();
renderApp();
</script>
</body>
</html>

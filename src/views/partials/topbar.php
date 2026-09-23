<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/guard.php';
?>
<div class="app-shell">
    <header class="topbar">
        <div class="brand-group">
            <div class="brand" aria-label="StoryFlow Studio">
                <div class="brand-mark" aria-hidden="true">SF</div>
                <span class="brand-name">StoryFlow Studio</span>
                <span class="brand-build">build <?= htmlspecialchars($build, ENT_QUOTES, 'UTF-8') ?></span>
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
            <div class="project-control">
                <select class="project-select" id="projectSelect" aria-label="Current project"></select>
            </div>
            <button class="button primary" data-action="new-project"><span aria-hidden="true">＋</span> New project</button>
        </div>
    </header>
    <main id="workspace"></main>
</div>

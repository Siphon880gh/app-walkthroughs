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
            <span class="nav-divider" role="separator" aria-orientation="vertical"></span>
            <button class="nav-button" data-view="export"><span class="nav-icon">↗</span>Export</button>
            <div class="sync-menu">
                <button type="button" class="nav-button" id="syncMenuButton" data-action="toggle-sync-menu" aria-haspopup="menu" aria-expanded="false" aria-controls="syncMenu"><span class="nav-icon">⟳</span>Sync</button>
                <div class="sync-menu-panel" id="syncMenu" role="menu" hidden>
                    <button type="button" class="sync-option" role="menuitem" data-action="sync-demo">Sync to Demo</button>
                    <p class="sync-warning">This will make it appear to all current users.</p>
                    <button type="button" class="sync-option danger" role="menuitem" data-action="reset-profile">Reset Profile</button>
                    <p class="sync-warning">This removes all your data and resets back to Demo.</p>
                </div>
            </div>
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

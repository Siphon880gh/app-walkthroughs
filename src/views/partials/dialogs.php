<?php
declare(strict_types=1);

require dirname(__DIR__, 2) . '/guard.php';
?>
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

<dialog id="photoDialog">
    <div class="dialog-head">
        <div><h2>Add a photo</h2><p>Append a screen to the current walkthrough. Annotated pictures stay visible until you hide them.</p></div>
        <button type="button" class="button ghost icon-only" data-action="close-photo-picker" aria-label="Close">×</button>
    </div>
    <div class="dialog-body" id="photoPickerBody"></div>
    <div class="dialog-foot"><button type="button" class="button" data-action="close-photo-picker">Cancel</button></div>
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

<dialog id="syncDemoDialog">
    <div class="dialog-head">
        <div><h2>Sync to Demo</h2><p>This will make it appear to all current users.</p></div>
        <button type="button" class="button ghost icon-only" data-action="close-sync-demo" aria-label="Close">×</button>
    </div>
    <div class="dialog-foot">
        <button type="button" class="button" data-action="close-sync-demo">Cancel</button>
        <button type="button" class="button primary" data-action="confirm-sync-demo">Sync to Demo</button>
    </div>
</dialog>

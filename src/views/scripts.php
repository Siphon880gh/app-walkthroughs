<?php
declare(strict_types=1);

require dirname(__DIR__) . '/guard.php';

$configPath = dirname(__DIR__, 2) . '/config/storyflow.php';
$storyflowConfig = is_file($configPath) ? require $configPath : [];

// Order matters: later modules rely on bindings initialized above them.
$modules = [
    'state.js',
    'storage.js',
    'seed.js',
    'session.js',
    'router.js',
    'library.js',
    'editor.js',
    'stories.js',
    'player.js',
    'export.js',
    'canvas.js',
    'ingest.js',
    'story-actions.js',
    'playback.js',
    'share.js',
    'events-click.js',
    'events-fields.js',
    'events-paste.js',
    'events-keyboard.js',
    'events-project.js',
    'boot.js',
];
?>
<script>
const STORYFLOW_CONFIG = <?= json_encode($storyflowConfig, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
<?php
foreach ($modules as $module) {
    $path = dirname(__DIR__) . '/assets/js/' . $module;
    if (!is_file($path)) {
        throw new RuntimeException('Missing script module: ' . $module);
    }
    readfile($path);
}
?>
</script>

<?php
declare(strict_types=1);

require dirname(__DIR__) . '/guard.php';
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
<?php
foreach ([
    'base.css',
    'shell.css',
    'library.css',
    'editor.css',
    'stories.css',
    'player.css',
    'export.css',
    'overlays.css',
    'responsive.css',
] as $stylesheet) {
    readfile(dirname(__DIR__) . '/assets/css/' . $stylesheet);
    echo "\n";
}
?>
    </style>
</head>
<body>
<?php require __DIR__ . '/partials/topbar.php'; ?>
<?php require __DIR__ . '/partials/dialogs.php'; ?>
<?php require __DIR__ . '/scripts.php'; ?>
</body>
</html>

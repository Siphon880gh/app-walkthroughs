<?php
declare(strict_types=1);

require __DIR__ . '/guard.php';

$appName = 'StoryFlow Studio';
$build = '2026.09';

function storyflow_env(string $key): string
{
    static $vars = null;
    if ($vars === null) {
        $vars = [];
        $path = dirname(__DIR__) . '/.env';
        $lines = is_readable($path) ? file($path, FILE_IGNORE_NEW_LINES) : false;
        if (is_array($lines)) {
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || (isset($line[0]) && $line[0] === '#')) {
                    continue;
                }
                $eq = strpos($line, '=');
                if ($eq === false) {
                    continue;
                }
                $name = trim(substr($line, 0, $eq));
                $value = trim(substr($line, $eq + 1));
                $quote = $value[0] ?? '';
                if (($quote === '"' || $quote === "'") && strlen($value) >= 2 && substr($value, -1) === $quote) {
                    $value = substr($value, 1, -1);
                }
                if ($name !== '') {
                    $vars[$name] = $value;
                }
            }
        }
    }

    return $vars[$key] ?? '';
}

function storyflow_ini_bytes(string $value): int
{
    $value = trim($value);
    if ($value === '' || $value === '-1') {
        return 0;
    }
    $unit = strtolower(substr($value, -1));
    $number = (float) $value;
    switch ($unit) {
        case 'g':
            return (int) round($number * 1073741824);
        case 'm':
            return (int) round($number * 1048576);
        case 'k':
            return (int) round($number * 1024);
        default:
            return (int) round($number);
    }
}

function storyflow_sync_fail(int $status, string $error): void
{
    error_log('Sync to Demo failed: ' . $error);
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $error]);
    exit;
}

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

if (($_GET['action'] ?? '') === 'sync-demo') {
    $demoPath = dirname(__DIR__) . '/data/demo-project.json';
    header('Cache-Control: no-store');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!is_file($demoPath)) {
            http_response_code(204);
            exit;
        }
        header('Content-Type: application/json; charset=utf-8');
        readfile($demoPath);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: GET, POST');
        exit;
    }
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    $postMax = storyflow_ini_bytes((string) ini_get('post_max_size'));
    if ($postMax > 0 && $contentLength > $postMax) {
        storyflow_sync_fail(413, 'Project is too large to sync. The request is ' . $contentLength . ' bytes and the server limit is ' . $postMax . ' bytes.');
    }
    $raw = file_get_contents('php://input');
    if ((!is_string($raw) || $raw === '') && $contentLength > 0) {
        storyflow_sync_fail(413, 'The sync request arrived empty. The server limit is ' . ($postMax > 0 ? $postMax . ' bytes.' : 'unknown.'));
    }
    $parsed = is_string($raw) ? json_decode($raw, true) : null;
    $password = is_array($parsed) && is_string($parsed['password'] ?? null) ? $parsed['password'] : '';
    $expected = storyflow_env('SYNC_DEMO_PASSWORD');
    $authorized = $expected !== '' && hash_equals(hash('sha256', $expected), hash('sha256', $password));
    if (!$authorized) {
        storyflow_sync_fail($expected === '' ? 503 : 401, $expected === '' ? 'Sync to Demo is not configured.' : 'Incorrect sync password.');
    }
    $project = is_array($parsed) ? ($parsed['project'] ?? null) : null;
    if (!is_array($project)) {
        storyflow_sync_fail(422, 'That project cannot be synced because the project payload is missing.');
    }
    if (!is_string($project['name'] ?? null) || trim($project['name']) === '') {
        storyflow_sync_fail(422, 'That project cannot be synced because it has no name.');
    }
    if (strlen($project['name']) > 120) {
        storyflow_sync_fail(422, 'That project cannot be synced because the name is longer than 120 characters.');
    }
    if (!is_array($project['screenshots'] ?? null)) {
        storyflow_sync_fail(422, 'That project cannot be synced because its screens are missing.');
    }
    if (!is_array($project['stories'] ?? null)) {
        storyflow_sync_fail(422, 'That project cannot be synced because its walkthroughs are missing.');
    }
    if (!is_string($raw) || strlen($raw) > 20000000) {
        storyflow_sync_fail(413, 'Project is too large to sync. It is ' . (is_string($raw) ? strlen($raw) : 0) . ' bytes and the limit is 20000000 bytes.');
    }
    $project['id'] = 'proj-shared-demo';
    $project['syncedAt'] = (int) round(microtime(true) * 1000);
    $directory = dirname($demoPath);
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        storyflow_sync_fail(500, 'The demo could not be saved because the data folder could not be created.');
    }
    $payload = json_encode(['version' => 2, 'syncedAt' => $project['syncedAt'], 'project' => $project], JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        storyflow_sync_fail(500, 'The demo could not be saved because the project could not be encoded (' . json_last_error_msg() . ').');
    }
    $temporary = $demoPath . '.tmp';
    if (file_put_contents($temporary, $payload, LOCK_EX) === false || !rename($temporary, $demoPath)) {
        $reason = error_get_last()['message'] ?? 'the file could not be written';
        storyflow_sync_fail(500, 'The demo could not be saved. ' . $reason);
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'syncedAt' => $project['syncedAt']]);
    exit;
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

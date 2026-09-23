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
                if ($line === '' || str_starts_with($line, '#')) {
                    continue;
                }
                $eq = strpos($line, '=');
                if ($eq === false) {
                    continue;
                }
                $name = trim(substr($line, 0, $eq));
                $value = trim(substr($line, $eq + 1));
                $quote = $value[0] ?? '';
                if (($quote === '"' || $quote === "'") && str_ends_with($value, $quote) && strlen($value) >= 2) {
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
    $raw = file_get_contents('php://input');
    $parsed = is_string($raw) ? json_decode($raw, true) : null;
    $password = is_array($parsed) && is_string($parsed['password'] ?? null) ? $parsed['password'] : '';
    $expected = storyflow_env('SYNC_DEMO_PASSWORD');
    $authorized = $expected !== '' && hash_equals(hash('sha256', $expected), hash('sha256', $password));
    if (!$authorized) {
        http_response_code($expected === '' ? 503 : 401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => $expected === '' ? 'Sync to Demo is not configured.' : 'Incorrect sync password.']);
        exit;
    }
    $project = is_array($parsed) ? ($parsed['project'] ?? null) : null;
    $valid = is_array($project)
        && is_string($project['name'] ?? null)
        && trim($project['name']) !== ''
        && strlen($project['name']) <= 120
        && is_array($project['screenshots'] ?? null)
        && is_array($project['stories'] ?? null);
    if (!$valid || !is_string($raw) || strlen($raw) > 20000000) {
        http_response_code($valid ? 413 : 422);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => $valid ? 'Project is too large to sync.' : 'That project cannot be synced.']);
        exit;
    }
    $project['id'] = 'proj-shared-demo';
    $project['syncedAt'] = (int) round(microtime(true) * 1000);
    $directory = dirname($demoPath);
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'The demo could not be saved.']);
        exit;
    }
    $payload = json_encode(['version' => 2, 'syncedAt' => $project['syncedAt'], 'project' => $project], JSON_UNESCAPED_SLASHES);
    $temporary = $demoPath . '.tmp';
    if ($payload === false || file_put_contents($temporary, $payload, LOCK_EX) === false || !rename($temporary, $demoPath)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'The demo could not be saved.']);
        exit;
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'syncedAt' => $project['syncedAt']]);
    exit;
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

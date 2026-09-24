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

function storyflow_sync_project_error($project): string
{
    if (!is_array($project)) {
        return 'the project payload is missing';
    }
    if (!is_string($project['name'] ?? null) || trim($project['name']) === '') {
        return 'it has no name';
    }
    if (strlen($project['name']) > 120) {
        return 'the name is longer than 120 characters';
    }
    if (!is_array($project['screenshots'] ?? null)) {
        return 'its screens are missing';
    }
    if (!is_array($project['stories'] ?? null)) {
        return 'its walkthroughs are missing';
    }

    return '';
}

function storyflow_image_fail(int $status, string $error): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $error]);
    exit;
}

function storyflow_image_mime(string $body): string
{
    $info = @getimagesizefromstring($body);
    $mime = is_array($info) ? (string) ($info['mime'] ?? '') : '';
    if (in_array($mime, ['image/png', 'image/jpeg', 'image/webp', 'image/gif'], true)) {
        return $mime;
    }
    if (stripos(substr($body, 0, 2048), '<svg') !== false) {
        return 'image/svg+xml';
    }

    return '';
}

function storyflow_image_extension(string $mime): string
{
    switch ($mime) {
        case 'image/png':
            return 'png';
        case 'image/jpeg':
            return 'jpg';
        case 'image/webp':
            return 'webp';
        case 'image/gif':
            return 'gif';
        case 'image/svg+xml':
            return 'svg';
        default:
            return '';
    }
}

/** Save image bytes as data/screenshots/{sha256}.{ext}. The same bytes always reuse the same file. */
function storyflow_store_screenshot(string $body, string $mime): string
{
    $extension = storyflow_image_extension($mime);
    if ($body === '' || $extension === '') {
        storyflow_image_fail(415, 'Choose a PNG, JPEG, WebP, GIF, or SVG image.');
    }
    $hash = hash('sha256', $body);
    $directory = dirname(__DIR__) . '/data/screenshots';
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        storyflow_image_fail(500, 'The screenshot folder could not be created.');
    }
    $filename = $hash . '.' . $extension;
    $path = $directory . '/' . $filename;
    if (!is_file($path)) {
        $temporary = $directory . '/' . $hash . '.' . bin2hex(random_bytes(6)) . '.tmp';
        if (file_put_contents($temporary, $body, LOCK_EX) === false) {
            @unlink($temporary);
            storyflow_image_fail(500, 'The screenshot could not be saved.');
        }
        if (!rename($temporary, $path)) {
            @unlink($temporary);
            if (!is_file($path)) {
                storyflow_image_fail(500, 'The screenshot could not be saved.');
            }
        }
    }

    return 'data/screenshots/' . $filename;
}

/** @return string[] Every address the host resolves to, or none if any of them is private or reserved. */
function storyflow_public_ips(string $host): array
{
    $ips = filter_var($host, FILTER_VALIDATE_IP) ? [$host] : (gethostbynamel($host) ?: []);
    if (!filter_var($host, FILTER_VALIDATE_IP) && function_exists('dns_get_record')) {
        foreach (@dns_get_record($host, DNS_AAAA) ?: [] as $record) {
            if (!empty($record['ipv6'])) {
                $ips[] = $record['ipv6'];
            }
        }
    }
    foreach ($ips as $ip) {
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return [];
        }
        $long = ip2long($ip);
        if ($long !== false && ($long & 0xFFC00000) === (100 << 24 | 64 << 16)) {
            return [];
        }
    }

    return $ips;
}

if (($_GET['action'] ?? '') === 'upload-screenshot') {
    header('Cache-Control: no-store');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        exit;
    }
    $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin';
    if ($site !== 'same-origin' && $site !== 'none') {
        storyflow_image_fail(403, 'Images can only be uploaded from StoryFlow itself.');
    }
    $maxBytes = 10 * 1048576;
    $file = $_FILES['file'] ?? null;
    if (!is_array($file)) {
        storyflow_image_fail(422, 'Choose an image to upload.');
    }
    $error = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE) {
        storyflow_image_fail(413, 'That image is larger than the server upload limit.');
    }
    if ($error !== UPLOAD_ERR_OK) {
        storyflow_image_fail(422, 'The image did not upload completely.');
    }
    $size = (int) ($file['size'] ?? 0);
    if ($size <= 0 || $size > $maxBytes) {
        storyflow_image_fail($size > $maxBytes ? 413 : 422, $size > $maxBytes ? 'That image is larger than 10 MB.' : 'Choose an image to upload.');
    }
    $temporary = (string) ($file['tmp_name'] ?? '');
    if ($temporary === '' || !is_uploaded_file($temporary)) {
        storyflow_image_fail(422, 'Choose an image to upload.');
    }
    $body = file_get_contents($temporary);
    if (!is_string($body) || $body === '') {
        storyflow_image_fail(422, 'Choose an image to upload.');
    }
    if (strlen($body) > $maxBytes) {
        storyflow_image_fail(413, 'That image is larger than 10 MB.');
    }
    $mime = storyflow_image_mime($body);
    if ($mime === '') {
        storyflow_image_fail(415, 'Choose a PNG, JPEG, WebP, GIF, or SVG image.');
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'path' => storyflow_store_screenshot($body, $mime)], JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_GET['action'] ?? '') === 'fetch-image') {
    header('Cache-Control: no-store');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        exit;
    }
    $site = $_SERVER['HTTP_SEC_FETCH_SITE'] ?? 'same-origin';
    if ($site !== 'same-origin' && $site !== 'none') {
        storyflow_image_fail(403, 'Images can only be fetched from StoryFlow itself.');
    }
    if (!function_exists('curl_init')) {
        storyflow_image_fail(501, 'This server cannot fetch images from other sites.');
    }
    $parsed = json_decode((string) file_get_contents('php://input'), true);
    $url = is_array($parsed) && is_string($parsed['url'] ?? null) ? trim($parsed['url']) : '';
    if ($url === '' || strlen($url) > 2048) {
        storyflow_image_fail(422, 'Enter an image URL.');
    }
    $maxBytes = 10 * 1048576;
    $body = '';
    for ($hop = 0; ; $hop++) {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = trim((string) ($parts['host'] ?? ''), '[]');
        if (($scheme !== 'http' && $scheme !== 'https') || $host === '') {
            storyflow_image_fail(422, 'Enter a full http or https address.');
        }
        $port = (int) ($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
        $ips = storyflow_public_ips($host);
        if ($ips === []) {
            storyflow_image_fail(422, 'That address is not reachable from the public web.');
        }
        $pinned = strpos($ips[0], ':') !== false ? '[' . $ips[0] . ']' : $ips[0];
        $body = '';
        $tooLarge = false;
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
            CURLOPT_RESOLVE => [$host . ':' . $port . ':' . $pinned],
            CURLOPT_PROXY => '',
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_USERAGENT => 'StoryFlow/' . $build,
            CURLOPT_HTTPHEADER => ['Accept: image/png,image/jpeg,image/webp,image/gif,image/svg+xml;q=0.9,*/*;q=0.1'],
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$body, &$tooLarge, $maxBytes): int {
                if (strlen($body) + strlen($chunk) > $maxBytes) {
                    $tooLarge = true;
                    return 0;
                }
                $body .= $chunk;
                return strlen($chunk);
            },
        ]);
        $ok = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $redirect = (string) curl_getinfo($curl, CURLINFO_REDIRECT_URL);
        $curlError = curl_error($curl);
        curl_close($curl);
        if ($tooLarge) {
            storyflow_image_fail(413, 'That image is larger than 10 MB.');
        }
        if ($ok === false) {
            storyflow_image_fail(502, 'The image could not be downloaded. ' . $curlError);
        }
        if ($status >= 300 && $status < 400 && $redirect !== '') {
            if ($hop >= 3) {
                storyflow_image_fail(502, 'That address redirects too many times.');
            }
            $url = $redirect;
            continue;
        }
        if ($status < 200 || $status >= 300) {
            storyflow_image_fail(502, 'The site answered with HTTP ' . $status . '.');
        }
        break;
    }
    $mime = storyflow_image_mime($body);
    if ($mime === '') {
        storyflow_image_fail(415, 'That address is not a PNG, JPEG, WebP, GIF, or SVG image.');
    }
    $name = rawurldecode(basename((string) parse_url($url, PHP_URL_PATH)));
    $name = trim(preg_replace('/[\x00-\x1f]/', '', $name) ?? '');
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true,
        'name' => $name === '' ? 'Linked screen' : substr($name, 0, 120),
        'path' => storyflow_store_screenshot($body, $mime),
    ], JSON_UNESCAPED_SLASHES);
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
    if (!is_string($raw) || strlen($raw) > 20000000) {
        storyflow_sync_fail(413, 'Projects are too large to sync. The request is ' . (is_string($raw) ? strlen($raw) : 0) . ' bytes and the limit is 20000000 bytes.');
    }
    $projectList = is_array($parsed) ? ($parsed['projects'] ?? null) : null;
    // Accept the version 2 single-project request during rolling deployments.
    if (!is_array($projectList) && is_array($parsed['project'] ?? null)) {
        $projectList = [$parsed['project']];
    }
    if (!is_array($projectList) || count($projectList) === 0) {
        storyflow_sync_fail(422, 'No projects were provided to sync.');
    }
    $syncedAt = (int) round(microtime(true) * 1000);
    $syncedProjects = [];
    $sourceIds = [];
    foreach (array_values($projectList) as $index => $project) {
        $issue = storyflow_sync_project_error($project);
        if ($issue !== '') {
            storyflow_sync_fail(422, 'Project ' . ($index + 1) . ' cannot be synced because ' . $issue . '.');
        }
        $sourceId = is_string($project['demoSourceId'] ?? null) && trim($project['demoSourceId']) !== ''
            ? $project['demoSourceId']
            : (is_string($project['id'] ?? null) && trim($project['id']) !== '' ? $project['id'] : 'project-' . ($index + 1));
        if (isset($sourceIds[$sourceId])) {
            storyflow_sync_fail(422, 'Two projects cannot be synced because they share the same project ID.');
        }
        $sourceIds[$sourceId] = true;
        $project['demoSourceId'] = $sourceId;
        $project['id'] = 'proj-shared-demo-' . substr(hash('sha256', $sourceId), 0, 16);
        $project['syncedAt'] = $syncedAt;
        $syncedProjects[] = $project;
    }
    $directory = dirname($demoPath);
    if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
        storyflow_sync_fail(500, 'The demo could not be saved because the data folder could not be created.');
    }
    $payload = json_encode(['version' => 3, 'syncedAt' => $syncedAt, 'projects' => $syncedProjects], JSON_UNESCAPED_SLASHES);
    if ($payload === false) {
        storyflow_sync_fail(500, 'The demo could not be saved because the project could not be encoded (' . json_last_error_msg() . ').');
    }
    $temporary = $demoPath . '.tmp';
    if (file_put_contents($temporary, $payload, LOCK_EX) === false || !rename($temporary, $demoPath)) {
        $reason = error_get_last()['message'] ?? 'the file could not be written';
        storyflow_sync_fail(500, 'The demo could not be saved. ' . $reason);
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'syncedAt' => $syncedAt, 'projectCount' => count($syncedProjects)]);
    exit;
}

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

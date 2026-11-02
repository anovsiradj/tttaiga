<?php

/**
 * Taiga API Proxy
 * 
 * This file acts as a proxy for the Taiga API.
 * It forwards requests to the Taiga API and returns the response.
 */

use app\helpers\TaigaProxyList;

require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/app/init.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
	$originParts = parse_url($origin);
	$hostParts = parse_url((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? ''));
	if (($originParts['host'] ?? null) === ($hostParts['host'] ?? null)) {
		header('Access-Control-Allow-Origin: ' . $origin);
		header('Vary: Origin');
	}
}
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Taiga-Api-Url');
header('Access-Control-Expose-Headers: *');



if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	exit();
}

$config = include 'app/configs/taiga.php';
$method = $_SERVER['REQUEST_METHOD'];

$apiPath = $_SERVER['PATH_INFO'] ?? '';
if ($apiPath === '') {
	$requestUri = $_SERVER['REQUEST_URI'] ?? '';
	$scriptName = $_SERVER['SCRIPT_NAME'] ?? '';

	if (str_starts_with($requestUri, $scriptName)) {
		$apiPath = substr($requestUri, strlen($scriptName));
	} else {
		$apiPath = $requestUri;
	}
}

$apiPath = strtok($apiPath, '?') ?: '/';
$isAuthRequest = ($apiPath === '/auth' && $method === 'POST');
$apiUrl = tttaiga_resolve_api_url(
	$config,
	$isAuthRequest ? ($_SERVER['HTTP_X_TAIGA_API_URL'] ?? null) : null,
	$_SESSION['taiga_api_url'] ?? null
);

if (!$apiUrl) {
	tttaiga_json_error(400, 'Invalid Taiga API server');
}

if (!$isAuthRequest && !tttaiga_is_authenticated()) {
	tttaiga_json_error(401, 'Session expired');
}

$cacheablePaths = [
	'/epic-statuses',
	'/userstory-statuses',
	'/task-statuses',
	'/issue-statuses',
	'/memberships',
	'/users',
	'/issue-types',
	'/priorities',
	'/severities'
];

$isCacheable = ($method === 'GET' && in_array($apiPath, $cacheablePaths, true));
$cacheKey = null;
$cacheFile = null;

if ($isCacheable) {
	$cacheDir = __DIR__ . '/storage/tmp';
	if (!is_dir($cacheDir)) {
		mkdir($cacheDir, 0777, true);
	}

	$queryString = $_SERVER['QUERY_STRING'] ?? '';
	$cacheQuery = [];
	if ($queryString !== '') {
		parse_str($queryString, $cacheQuery);
	}

	if (is_array($cacheQuery)) {
		ksort($cacheQuery);
	}

	if (in_array($apiPath, ['/memberships', '/epic-statuses', '/userstory-statuses', '/task-statuses', '/issue-statuses', '/issue-types', '/priorities', '/severities'])) {
		$projectId = $cacheQuery['project'] ?? null;
		$cacheQuery = ['project' => $projectId];
	}

	$sessionCacheScope = hash('sha256', (string) ($_SESSION['taiga_token'] ?? session_id()));
	$cacheKey = md5($sessionCacheScope . $apiUrl . $apiPath . json_encode($cacheQuery));
	$cacheFile = $cacheDir . '/' . $cacheKey . '.json';

	$cacheTtl = 3600;
	if ($apiPath === '/memberships') $cacheTtl = 300;
	if ($apiPath === '/users') $cacheTtl = 300;

	if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < $cacheTtl)) {
		header('X-Cache: HIT');
		header("X-Api-Cache-Key: {$cacheKey}");
		echo file_get_contents($cacheFile);
		exit();
	}
	header('X-Cache: MISS');
}

$headers = [
	'Content-Type: application/json',
];

if ($isCacheable && $cacheKey) {
	$headers[] = 'X-Api-Cache-Key: ' . $cacheKey;
}

if (!$isAuthRequest) {
	$headers[] = 'Authorization: Bearer ' . $_SESSION['taiga_token'];
}

$input = file_get_contents('php://input');
$input = $input === false ? '' : $input;

$autoMemberId = null;
foreach ($headers as $h) {
	if (str_starts_with($h, 'Authorization: Bearer ')) {
		$token = substr($h, strlen('Authorization: Bearer '));
		$parts = explode('.', $token);
		if (count($parts) === 3) {
			$payload64 = $parts[1];
			$payload64 = strtr($payload64, '-_', '+/');
			$payload64 .= str_repeat('=', (4 - (strlen($payload64) % 4)) % 4);

			$payloadJson = base64_decode($payload64, true);
			if ($payloadJson !== false) {
				$payload = json_decode($payloadJson, true);
				if (is_array($payload)) {
					$autoMemberId = $payload['user_id'] ?? $payload['id'] ?? null;
				}
			}
		}
	}
}

$targetUrl = $apiUrl . $apiPath;

$queryArray = [];
if (!empty($_SERVER['QUERY_STRING'])) {
	parse_str($_SERVER['QUERY_STRING'], $queryArray);
}

if ($apiPath === '/projects' && $method === 'GET' && !isset($queryArray['member']) && $autoMemberId) {
	$queryArray['member'] = $autoMemberId;
}

// Taiga's /tasks has no `epic` filter: translate it via user story membership.
if ($apiPath === '/tasks' && $method === 'GET' && isset($queryArray['epic']) && is_string($queryArray['epic']) && $queryArray['epic'] !== '') {
	tttaigaProxyTasksByEpic($apiUrl, $queryArray);
	exit;
}

// Taiga silently ignores some list params (search/sort). Handle them in the proxy.
if ($method === 'GET' && TaigaProxyList::needsTransform($apiPath, $queryArray)) {
	tttaigaProxyListTransform($apiUrl, $apiPath, $queryArray);
	exit;
}

if (!empty($queryArray)) {
	$targetUrl .= '?' . http_build_query($queryArray);
}

$curl = new \anovsiradj\skit\CURL('', $headers, [
	CURLOPT_URL => $targetUrl,
	CURLOPT_CUSTOMREQUEST => $method,
	CURLOPT_FOLLOWLOCATION => true,
	CURLOPT_ENCODING => '', // Handle gzip/deflate automatically
]);

if ($input !== '') {
	$curl->opt(CURLOPT_POSTFIELDS, $input);
}

$curl->exec();

$statusCode = $curl->code();
$responseBody = $curl->data;

if (!$isAuthRequest && $statusCode === 401) {
	unset($_SESSION['taiga_token'], $_SESSION['taiga_user'], $_SESSION['taiga_api_url']);
}

if ($responseBody === false || $responseBody === null) {
	http_response_code(502);
	header('Content-Type: application/json');
	echo json_encode(['error' => 'Proxy error']);
	exit();
}

http_response_code($statusCode);

if ($isCacheable && $statusCode === 200 && $responseBody) {
	$decoded = json_decode($responseBody, true);
	$isApiError = is_array($decoded) && (
		array_key_exists('error', $decoded)
		|| array_key_exists('_error_message', $decoded)
		|| array_key_exists('_error_type', $decoded)
	);

	if ($decoded && !$isApiError) {
		file_put_contents($cacheFile, $responseBody);
	}
}

foreach ($curl->resHeaders as $header) {
	if (stripos($header, 'X-') === 0) {
		header($header);
	}
}

header('Content-Type: application/json');
echo $responseBody;

/**
 * Perform a JSON GET against the upstream Taiga API.
 *
 * @return array{status:int, data:mixed, raw:string|false, headers:array<string,string>}
 */
function tttaigaProxyGetJson(string $apiUrl, string $path, array $query, string $token): array
{
	$url = rtrim($apiUrl, '/') . $path;
	if (!empty($query)) {
		$url .= '?' . http_build_query($query);
	}

	$curl = new \anovsiradj\skit\CURL('', [
		'Content-Type: application/json',
		'Authorization: Bearer ' . $token,
	], [
		CURLOPT_URL => $url,
		CURLOPT_CUSTOMREQUEST => 'GET',
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_ENCODING => '',
	]);

	$curl->exec();

	$raw = $curl->data;
	$headers = [];
	foreach ($curl->resHeaders as $line) {
		$pos = strpos($line, ':');
		if ($pos !== false) {
			$headers[strtolower(trim(substr($line, 0, $pos)))] = trim(substr($line, $pos + 1));
		}
	}

	return [
		'status' => (int) $curl->code(),
		'data' => is_string($raw) ? json_decode($raw, true) : null,
		'raw' => $raw,
		'headers' => $headers,
	];
}

/**
 * Emit an upstream error without ever falling back to unfiltered data.
 */
function tttaigaProxyEmitUpstreamError(array $response, string $fallback): void
{
	$status = (int) ($response['status'] ?? 0);
	if ($status < 400) {
		$status = 502;
	}

	http_response_code($status);
	header('Content-Type: application/json');

	$raw = $response['raw'] ?? null;
	$decoded = is_string($raw) ? json_decode($raw, true) : null;

	if (is_array($decoded) || is_object($decoded)) {
		echo $raw;
	} else {
		echo json_encode(['error' => $fallback]);
	}

	exit;
}

/**
 * Search/sort a list the way the UI expects, then paginate.
 *
 * Used for `/milestones` text search and for `order_by` fields Taiga ignores
 * (`/epics`, `/milestones?order_by=modified_date`, `/projects` name/date sorts).
 */
function tttaigaProxyListTransform(string $apiUrl, string $path, array $query): void
{
	$token = (string) ($_SESSION['taiga_token'] ?? '');

	$page = isset($query['page']) ? (int) $query['page'] : 1;
	$pageSize = isset($query['page_size']) ? (int) $query['page_size'] : 30;

	$orderBy = isset($query['order_by']) && is_string($query['order_by']) && $query['order_by'] !== ''
		? $query['order_by']
		: null;
	$orderField = $orderBy !== null ? ltrim($orderBy, '-') : null;
	$orderDesc = $orderBy !== null && str_starts_with($orderBy, '-');

	$searchField = $path === '/milestones' ? 'name' : null;
	$needle = null;
	if ($searchField !== null && isset($query['q']) && is_string($query['q']) && trim($query['q']) !== '') {
		$needle = trim($query['q']);
	}

	$sortHere = $orderField !== null && !in_array($orderField, TaigaProxyList::nativeOrderFields($path), true);

	$upstreamQuery = $query;
	unset($upstreamQuery['page'], $upstreamQuery['page_size']);
	if ($needle !== null) {
		// `/milestones` ignores `q`; the proxy filters it after fetching.
		unset($upstreamQuery['q']);
	}
	if ($sortHere) {
		// Taiga ignores this sort field; keep its default order and sort below.
		unset($upstreamQuery['order_by']);
	}

	$items = tttaigaProxyFetchAll($apiUrl, $path, $upstreamQuery, $token, 'Unable to load ' . ltrim($path, '/'));

	if ($needle !== null) {
		$items = TaigaProxyList::filterByText($items, $searchField, $needle);
	}

	if ($sortHere) {
		$items = TaigaProxyList::sortBy($items, $orderField, $orderDesc);
	}

	$paged = TaigaProxyList::paginate($items, $page, $pageSize);

	foreach (TaigaProxyList::paginationHeaders($paged['total'], $page, $pageSize) as $name => $value) {
		header($name . ': ' . $value);
	}

	header('Content-Type: application/json');
	echo json_encode($paged['items']);
}

/**
 * Fetch every page of a list endpoint so the proxy can filter across the whole set.
 *
 * @return array<int, mixed>
 */
function tttaigaProxyFetchAll(string $apiUrl, string $path, array $query, string $token, string $fallback): array
{
	$result = [];
	$page = 1;
	$maxPages = 100;

	$query['page_size'] = 1000;

	while (true) {
		$query['page'] = $page;
		$response = tttaigaProxyGetJson($apiUrl, $path, $query, $token);
		if (($response['status'] ?? 0) >= 400 || !is_array($response['data'])) {
			tttaigaProxyEmitUpstreamError($response, $fallback);
		}

		$batch = $response['data'];
		$result = array_merge($result, $batch);

		$total = isset($response['headers']['x-pagination-count'])
			? (int) $response['headers']['x-pagination-count']
			: count($result);

		if ($batch === [] || count($result) >= $total || $page >= $maxPages) {
			break;
		}

		$page++;
	}

	return $result;
}

/**
 * `GET /tasks` with an `epic` filter.
 *
 * Taiga cannot filter tasks by epic, but it can filter user stories by epic and
 * tasks by a single user story. This translates the epic into the set of its
 * user story ids, keeps only matching tasks, and re-emits pagination headers so
 * the client keeps its normal server-pagination behaviour.
 */
function tttaigaProxyTasksByEpic(string $apiUrl, array $query): void
{
	$token = (string) ($_SESSION['taiga_token'] ?? '');
	$epicId = trim((string) $query['epic']);

	$page = isset($query['page']) ? (int) $query['page'] : 1;
	$pageSize = isset($query['page_size']) ? (int) $query['page_size'] : 30;

	$userStoryFilter = null;
	if (isset($query['user_story']) && $query['user_story'] !== '' && !is_array($query['user_story'])) {
		$userStoryFilter = (int) $query['user_story'];
	}

	$projectId = isset($query['project']) && $query['project'] !== '' && !is_array($query['project'])
		? (string) $query['project']
		: null;

	// 1) Resolve the epic's project when the request did not provide one.
	if ($projectId === null) {
		$epicResponse = tttaigaProxyGetJson($apiUrl, '/epics/' . rawurlencode($epicId), [], $token);
		if (($epicResponse['status'] ?? 0) >= 400 || !is_array($epicResponse['data'])) {
			tttaigaProxyEmitUpstreamError($epicResponse, 'Unable to resolve epic');
		}
		$projectId = isset($epicResponse['data']['project']) ? (string) $epicResponse['data']['project'] : null;
	}

	// 2) Collect the user story ids that belong to the epic.
	$userStoryQuery = [
		'epic' => $epicId,
		'page_size' => 1000,
	];
	if ($projectId !== null) {
		$userStoryQuery['project'] = $projectId;
	}

	$userStoryIds = TaigaProxyList::userStoryIds(
		tttaigaProxyFetchAll($apiUrl, '/userstories', $userStoryQuery, $token, 'Unable to load epic user stories')
	);

	// 3) Fetch every task matching the remaining filters (Taiga already orders them).
	$taskQuery = $query;
	unset($taskQuery['epic'], $taskQuery['page'], $taskQuery['page_size']);
	if (!isset($taskQuery['project']) && $projectId !== null) {
		$taskQuery['project'] = $projectId;
	}

	$tasks = tttaigaProxyFetchAll($apiUrl, '/tasks', $taskQuery, $token, 'Unable to load tasks');

	// 4) Keep only the epic's tasks, then paginate the merged result.
	$filtered = TaigaProxyList::filterByUserStoryIds($tasks, $userStoryIds, $userStoryFilter);
	$paged = TaigaProxyList::paginate($filtered, $page, $pageSize);

	foreach (TaigaProxyList::paginationHeaders($paged['total'], $page, $pageSize) as $name => $value) {
		header($name . ': ' . $value);
	}

	header('Content-Type: application/json');
	echo json_encode($paged['items']);
}

<?php

namespace tests\Integration;

use anovsiradj\skit\CURL;
use PHPUnit\Framework\TestCase;

final class WebIntegrationTest extends TestCase
{
	private static string $baseUrl;
	private static string $allowedApiUrl;

	public static function setUpBeforeClass(): void
	{
		self::$baseUrl = self::readAppUrl();

		$config = require dirname(__DIR__, 2) . '/app/configs/taiga.php';
		self::$allowedApiUrl = rtrim(
			(string) ($config['servers']['default']['api_url'] ?? ''),
			'/'
		);

		if (self::$allowedApiUrl === '') {
			self::fail('The default Taiga API URL is not configured.');
		}
	}

	public function testProtectedPageRedirectsToLoginWithoutSession(): void
	{
		$response = self::request('GET', 'proyeks.php');

		self::assertSame(302, $response['status']);
		self::assertMatchesRegularExpression(
			'/^login\.php\?redirect=/',
			(string) self::header($response, 'Location')
		);
	}

	public function testApiProxyRejectsRequestWithoutSessionBeforeUpstreamCall(): void
	{
		$response = self::request('GET', 'api.php/projects');

		self::assertSame(401, $response['status']);
		self::assertSame(
			['error' => 'Session expired'],
			json_decode($response['body'], true, flags: JSON_THROW_ON_ERROR)
		);
	}

	public function testApiProxyRejectsUnknownTaigaServer(): void
	{
		$response = self::request(
			'POST',
			'api.php/auth',
			[
				'type' => 'normal',
				'username' => 'integration-test-user',
				'password' => 'integration-test-password',
			],
			[
				'X-Taiga-Api-Url: https://not-allowed.example.test/api/v1',
			],
			json: true
		);

		self::assertSame(400, $response['status']);
		self::assertSame(
			['error' => 'Invalid Taiga API server'],
			json_decode($response['body'], true, flags: JSON_THROW_ON_ERROR)
		);
	}

	public function testLoginRejectsInvalidSessionPayload(): void
	{
		$response = self::request('POST', 'login.php', [
			'action' => 'login',
			'taiga_token' => ' ',
			'taiga_user' => '{}',
			'taiga_api_url' => self::$allowedApiUrl,
		]);

		self::assertSame(400, $response['status']);
		self::assertSame(
			['error' => 'Invalid login session'],
			json_decode($response['body'], true, flags: JSON_THROW_ON_ERROR)
		);
	}

	public function testLoginSessionAndLogoutLifecycle(): void
	{
		$login = self::request('POST', 'login.php', [
			'action' => 'login',
			'taiga_token' => 'integration-test-token',
			'taiga_user' => json_encode([
				'id' => 321,
				'username' => 'integration-test-user',
			], JSON_THROW_ON_ERROR),
			'taiga_api_url' => self::$allowedApiUrl,
		]);

		self::assertSame(200, $login['status']);
		self::assertSame(
			['success' => true],
			json_decode($login['body'], true, flags: JSON_THROW_ON_ERROR)
		);

		$cookie = self::sessionCookie($login);
		self::assertNotNull($cookie, 'Login response did not create a PHP session cookie.');

		$protectedPage = self::request('GET', 'proyeks.php', headers: [
			"Cookie: {$cookie}",
		]);

		self::assertSame(200, $protectedPage['status']);
		self::assertStringContainsString(
			'<title>Proyek - TTTaiga</title>',
			$protectedPage['body']
		);

		$logout = self::request(
			'POST',
			'login.php',
			['action' => 'logout'],
			["Cookie: {$cookie}"]
		);

		self::assertSame(200, $logout['status']);
		self::assertSame(
			['success' => true],
			json_decode($logout['body'], true, flags: JSON_THROW_ON_ERROR)
		);

		$afterLogout = self::request('GET', 'proyeks.php', headers: [
			"Cookie: {$cookie}",
		]);

		self::assertSame(302, $afterLogout['status']);
		self::assertMatchesRegularExpression(
			'/^login\.php\?redirect=/',
			(string) self::header($afterLogout, 'Location')
		);
	}

	public function testApiPreflightReturnsProxyCorsContract(): void
	{
		$response = self::request('OPTIONS', 'api.php/projects');

		self::assertSame(200, $response['status']);
		self::assertSame(
			'GET, POST, PATCH, PUT, DELETE, OPTIONS',
			self::header($response, 'Access-Control-Allow-Methods')
		);
		self::assertSame(
			'Content-Type, X-Taiga-Api-Url',
			self::header($response, 'Access-Control-Allow-Headers')
		);
	}

	private static function request(
		string $method,
		string $path,
		?array $data = null,
		array $headers = [],
		bool $json = false
	): array {
		$curl = new CURL(self::$baseUrl, $headers, [
			CURLOPT_CONNECTTIMEOUT => 3,
			CURLOPT_TIMEOUT => 10,
			CURLOPT_FOLLOWLOCATION => false,
		]);
		$curl->url(ltrim($path, '/'));

		if ($data !== null) {
			$curl->post(
				$data,
				$json ? CURL::TYPE_JSON : CURL::TYPE_URLE
			);
		}

		$curl->opt(CURLOPT_CUSTOMREQUEST, $method);
		$curl->exec();

		return [
			'status' => $curl->code(),
			'body' => (string) $curl->data,
			'headers' => $curl->resHeaders,
		];
	}

	private static function header(array $response, string $name): ?string
	{
		$prefix = strtolower($name) . ':';

		foreach ($response['headers'] as $header) {
			if (str_starts_with(strtolower($header), $prefix)) {
				return trim(substr($header, strlen($prefix)));
			}
		}

		return null;
	}

	private static function sessionCookie(array $response): ?string
	{
		$setCookie = self::header($response, 'Set-Cookie');

		if ($setCookie === null) {
			return null;
		}

		return explode(';', $setCookie, 2)[0];
	}

	private static function readAppUrl(): string
	{
		$env = file_get_contents(dirname(__DIR__, 2) . '/.env');
		if ($env === false || !preg_match('/^APP_URL\s*=\s*(.+?)\s*$/m', $env, $match)) {
			self::fail('APP_URL is not defined in .env.');
		}

		$url = trim($match[1], " \t\n\r\0\x0B\"'");

		return rtrim($url, '/') . '/';
	}
}

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const jquerySource = fs.readFileSync(
	path.join(path.dirname(require.resolve('jquery')), 'jquery.min.js'),
	'utf8'
);

async function isolateExternalAssets(page) {
	await page.route(/^https:\/\//, async (route) => {
		if (route.request().url() === 'https://code.jquery.com/jquery-3.6.0.min.js') {
			await route.fulfill({
				contentType: 'application/javascript',
				body: jquerySource,
			});
			return;
		}

		await route.abort();
	});
}

test.beforeEach(async ({ page }) => {
	await isolateExternalAssets(page);
});

test('protected page redirects unauthenticated users to login', async ({ page }) => {
	await page.goto('proyeks.php');

	await expect(page).toHaveURL(/\/login\.php(\?|$)/);
	await expect(page).toHaveTitle('Login - TTTaiga');
	await expect(page.getByText('TTTaiga', { exact: true })).toBeVisible();
});

test('login form exposes configured server and required credentials', async ({ page }) => {
	await page.goto('login.php');

	await expect(page.getByLabel('Server Instance')).toHaveValue(/\/api\/v1$/);
	await expect(page.getByLabel('Username')).toHaveAttribute('required', '');
	await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password');
	await expect(page.getByLabel('Password')).toHaveAttribute('required', '');
	await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
});

test('failed authentication displays the API error and restores the button', async ({ page }) => {
	await page.route('**/api.php/auth', async (route) => {
		const request = route.request();

		expect(request.method()).toBe('POST');
		expect(request.postDataJSON()).toEqual({
			type: 'normal',
			username: 'browser-test-user',
			password: 'invalid-password',
		});

		await route.fulfill({
			status: 400,
			contentType: 'application/json',
			body: JSON.stringify({
				_error_message: 'Invalid browser-test credentials',
			}),
		});
	});

	await page.goto('login.php');
	await page.getByLabel('Username').fill('browser-test-user');
	await page.getByLabel('Password').fill('invalid-password');
	await page.getByRole('button', { name: 'SIGN IN' }).click();

	await expect(page.locator('#errorMessage')).toBeVisible();
	await expect(page.locator('#errorMessage')).toHaveText('Invalid browser-test credentials');
	await expect(page.getByRole('button', { name: 'SIGN IN' })).toBeEnabled();
});

test('successful authentication creates a PHP session and opens projects', async ({ page }) => {
	await page.route('**/api.php/auth', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				auth_token: 'browser-test-token',
				id: 321,
				username: 'browser-test-user',
				full_name: 'Browser Test User',
			}),
		});
	});
	await page.route('**/api.php/projects**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: '[]',
		});
	});

	await page.goto('login.php');
	await page.getByLabel('Username').fill('browser-test-user');
	await page.getByLabel('Password').fill('valid-browser-test-password');
	await page.getByRole('button', { name: 'SIGN IN' }).click();

	await expect(page).toHaveURL(/\/proyeks\.php$/);
	await expect(page).toHaveTitle('Proyek - TTTaiga');
	await expect
		.poll(() => page.context().cookies().then(cs => cs.some(c => c.name === 'PHPSESSID')))
		.toBe(true);

	await page.goto('proyeks.php');
	await expect(page).toHaveURL(/\/proyeks\.php$/);
});

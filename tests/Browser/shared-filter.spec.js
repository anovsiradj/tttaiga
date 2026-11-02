const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const jquerySource = fs.readFileSync(
	path.join(path.dirname(require.resolve('jquery')), 'jquery.min.js'),
	'utf8'
);

const mockVendor = (name) =>
	fs.readFileSync(path.join(__dirname, '..', 'mocks', 'vendor', name), 'utf8');
const bootstrapSource = mockVendor('bootstrap.bundle.min.js');
const select2Source = mockVendor('select2.min.js');

/** Mocks the Taiga API (no network) and serves local vendor assets for CDN URLs. */
async function installMockApi(page) {
	await page.route('**/api.php/**', async (route) => {
		const url = new URL(route.request().url());
		const p = url.pathname.replace(/^.*api\.php/, '');
		const json = (data) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

		if (p === '/projects') return json([{ id: 107, name: 'TTTaiga' }]);
		if (/^\/projects\/\d+$/.test(p)) return json({ id: 107, name: 'TTTaiga', slug: 'tttaiga' });
		if (/^\/epics\/\d+$/.test(p)) {
			const id = parseInt(p.split('/')[2], 10);
			return json({ id, ref: id, subject: 'Epik ' + id, project: 107 });
		}
		if (/^\/userstories\/\d+$/.test(p)) {
			const id = parseInt(p.split('/')[2], 10);
			return json({ id, ref: id, subject: 'Usor ' + id, project: 107 });
		}
		return json([]);
	});

	await page.route(/^https:\/\//, async (route) => {
		const url = route.request().url();
		if (url === 'https://code.jquery.com/jquery-3.6.0.min.js') {
			return route.fulfill({ contentType: 'application/javascript', body: jquerySource });
		}
		if (url.includes('bootstrap') && url.endsWith('.js')) {
			return route.fulfill({ contentType: 'application/javascript', body: bootstrapSource });
		}
		if (url.includes('select2') && url.endsWith('.js')) {
			return route.fulfill({ contentType: 'application/javascript', body: select2Source });
		}
		if (url.endsWith('.css')) {
			return route.fulfill({ contentType: 'text/css', body: '/* mock */' });
		}
		if (url.includes('fonts.gstatic.com') || /\.(woff2?|ttf)(\?|$)/.test(url)) {
			return route.fulfill({ status: 200, body: 'mock-font' });
		}
		await route.abort();
	});
}

async function bootstrapSession(page) {
	const resp = await page.request.post('login.php', {
		form: {
			action: 'login',
			taiga_token: 'browser-test-token',
			taiga_user: JSON.stringify({ id: 19, username: 'test' }),
			taiga_api_url: 'https://taiga.jmc.co.id/api/v1',
		},
	});
	if (!resp.ok()) throw new Error('login.php session bootstrap failed: ' + resp.status());
}

function navLink(page, label) {
	return page.locator('.navbar-nav a.nav-link').filter({ hasText: new RegExp('^' + label + '$') });
}

test.beforeEach(async ({ page }) => {
	await installMockApi(page);
	await bootstrapSession(page);
});

test('epic filter is carried to tasks but dropped from epiks and proyeks', async ({ page }) => {
	await page.goto('usors.php?project=107&epic=55');

	// Wait until the shared-filter navigation has rewritten the links.
	await expect
		.poll(() => navLink(page, 'Task').getAttribute('href'), { timeout: 10000 })
		.toContain('epic=55');

	const taskHref = await navLink(page, 'Task').getAttribute('href');
	expect(taskHref).toContain('project=107');
	expect(taskHref).toContain('epic=55');

	const usorHref = await navLink(page, 'Usor').getAttribute('href');
	expect(usorHref).toContain('epic=55');

	const epikHref = await navLink(page, 'Epik').getAttribute('href');
	expect(epikHref).not.toContain('epic=55');
	expect(epikHref).toContain('project=107');

	const proyekHref = await navLink(page, 'Proyek').getAttribute('href');
	expect(proyekHref).not.toContain('project=107');
	expect(proyekHref).not.toContain('epic=55');
});

test('stored epic filter is not injected when opening epiks directly', async ({ page }) => {
	await page.addInitScript(() => {
		sessionStorage.setItem('tttaiga_shared_filters', JSON.stringify({ project: '107', epic: '55' }));
	});

	await page.goto('epiks.php');

	// epiks whitelist allows project but never epic.
	await expect.poll(() => page.url(), { timeout: 10000 }).toContain('project=107');
	expect(page.url()).not.toContain('epic=');

	// Navigation away from epiks must not reintroduce the stale epic filter.
	const usorHref = await navLink(page, 'Usor').getAttribute('href');
	expect(usorHref).toContain('project=107');
	expect(usorHref).not.toContain('epic=55');
});

test('user_story filter is dropped when leaving tasks for usors', async ({ page }) => {
	await page.goto('tasks.php?project=107&user_story=9');

	await expect
		.poll(() => navLink(page, 'Usor').getAttribute('href'), { timeout: 10000 })
		.toContain('project=107');

	const usorHref = await navLink(page, 'Usor').getAttribute('href');
	expect(usorHref).not.toContain('user_story=9');

	// tasks keeps it, since user_story is whitelisted there.
	const taskHref = await navLink(page, 'Task').getAttribute('href');
	expect(taskHref).toContain('user_story=9');
});

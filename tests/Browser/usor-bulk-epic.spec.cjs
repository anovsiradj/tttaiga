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

const EPICS = [
	{ id: 55, ref: 55, subject: 'Epik Logging' },
	{ id: 56, ref: 56, subject: 'Epik Auth' }
];

/** Mocks the Taiga API (no network) and serves local vendor assets for CDN URLs. */
async function installMockApi(page) {
	await page.route('**/api.php/**', async (route) => {
		const url = new URL(route.request().url());
		const p = url.pathname.replace(/^.*api\.php/, '');
		const json = (data) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

		if (p === '/projects') return json([{ id: 107, name: 'TTTaiga' }]);
		if (p === '/memberships') return json([{ user: 19, full_name: 'Test User' }]);
		if (/^\/projects\/\d+$/.test(p)) return json({ id: 107, name: 'TTTaiga', slug: 'tttaiga' });
		if (p === '/epics') return json(EPICS);
		if (/^\/epics\/\d+$/.test(p)) {
			const id = parseInt(p.split('/')[2], 10);
			return json(EPICS.find((e) => e.id === id) || { id, ref: id, subject: 'Epik ' + id, project: 107 });
		}
		if (p === '/userstories' && route.request().method() === 'POST') {
			return json({ id: 900, ref: 900, subject: 'created' });
		}
		if (/^\/epics\/\d+\/related_userstories$/.test(p)) {
			return json({ epic: 55, user_story: 900 });
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
			taiga_api_url: 'https://taiga.jmc.co.id/api/v1'
		}
	});
	if (!resp.ok()) throw new Error('login.php session bootstrap failed: ' + resp.status());
}

async function openBulkCreate(page) {
	await page.evaluate(() => window.jQuery('#bulkCreateModal').modal('show'));
}

test.beforeEach(async ({ page }) => {
	await installMockApi(page);
	await bootstrapSession(page);
});

test('bulk create epic checkboxes are populated with the project epics', async ({ page }) => {
	await page.goto('usors.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');

	await openBulkCreate(page);

	await expect(page.locator('#bulkCreateEpics input[type="checkbox"]')).toHaveCount(2);
	await expect(page.locator('#bulkCreateEpics label').filter({ hasText: '#55: Epik Logging' })).toHaveCount(1);
	await expect(page.locator('#bulkCreateEpics label').filter({ hasText: '#56: Epik Auth' })).toHaveCount(1);
});

test('bulk create epic checkbox is autofilled from the shared epic filter', async ({ page }) => {
	await page.goto('usors.php?project=107&epic=55');
	await expect(page.locator('#epicSelect')).toHaveValue('55');

	await openBulkCreate(page);

	await expect(page.locator('#bulkCreateEpics input[value="55"]')).toBeChecked();
	await expect(page.locator('#bulkCreateEpics input[value="56"]')).not.toBeChecked();
});

test('bulk create links every checked epic through the relation endpoint', async ({ page }) => {
	const posted = [];
	const linked = [];
	page.on('request', (req) => {
		if (req.method() !== 'POST') return;
		if (req.url().includes('api.php/userstories')) {
			posted.push(JSON.parse(req.postData()));
		}
		if (req.url().includes('/related_userstories')) {
			linked.push(JSON.parse(req.postData()));
		}
	});

	await page.goto('usors.php?project=107&epic=55');
	await expect(page.locator('#epicSelect')).toHaveValue('55');
	await openBulkCreate(page);
	await expect(page.locator('#bulkCreateEpics input[value="55"]')).toBeChecked();
	await page.locator('#bulkCreateEpics input[value="56"]').check();

	await page.locator('#bulkCreateText').fill('Story from bulk epic test');
	await page.locator('#submitBulkCreate').click();

	await expect.poll(() => linked.length).toBe(2);
	expect(posted[0]).toMatchObject({ subject: 'Story from bulk epic test', project: 107 });
	expect(posted[0]).not.toHaveProperty('epic');
	expect(linked.map((l) => l.epic).sort()).toEqual([55, 56]);
	expect(linked.every((l) => l.user_story === 900)).toBe(true);
});

test('bulk create sends the selected assignee in the create payload', async ({ page }) => {
	const posted = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('api.php/userstories')) posted.push(JSON.parse(req.postData()));
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await openBulkCreate(page);
	await expect(page.locator('#bulkCreateEpics input[type="checkbox"]')).toHaveCount(2);
	await expect(page.locator('#bulkCreateAssignee option[value="19"]')).toHaveCount(1);

	await page.locator('#bulkCreateAssignee').selectOption('19');
	await page.locator('#bulkCreateText').fill('Story with assignee');
	await page.locator('#submitBulkCreate').click();

	await expect.poll(() => posted.length).toBe(1);
	expect(posted[0]).toMatchObject({ project: 107, assigned_to: 19 });
	expect(posted[0]).not.toHaveProperty('priority');
});

test('bulk create omits epic when no epic is selected', async ({ page }) => {
	const posted = [];
	const linked = [];
	page.on('request', (req) => {
		if (req.method() !== 'POST') return;
		if (req.url().includes('api.php/userstories')) posted.push(JSON.parse(req.postData()));
		if (req.url().includes('/related_userstories')) linked.push(req.postData());
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await openBulkCreate(page);
	await expect(page.locator('#bulkCreateEpics input[type="checkbox"]')).toHaveCount(2);

	await page.locator('#bulkCreateText').fill('Story without epic');
	await page.locator('#submitBulkCreate').click();

	await expect.poll(() => posted.length).toBe(1);
	expect(posted[0]).not.toHaveProperty('epic');
	expect(linked).toHaveLength(0);
});

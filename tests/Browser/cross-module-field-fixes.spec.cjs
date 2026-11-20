const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const jquerySource = fs.readFileSync(path.join(path.dirname(require.resolve('jquery')), 'jquery.min.js'), 'utf8');
const mockVendor = (name) => fs.readFileSync(path.join(__dirname, '..', 'mocks', 'vendor', name), 'utf8');
const bootstrapSource = mockVendor('bootstrap.bundle.min.js');
const select2Source = mockVendor('select2.min.js');

const ISSUE_TYPES = [{ id: 11, name: 'Bug' }, { id: 12, name: 'Feature' }];
const PRIORITIES = [{ id: 1, name: 'High' }];
const SEVERITIES = [{ id: 3, name: 'Major' }];

async function installMockApi(page) {
	await page.route('**/api.php/**', async (route) => {
		const req = route.request();
		const p = new URL(req.url()).pathname.replace(/^.*api\.php/, '');
		const json = (data) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });

		if (p === '/projects') return json([{ id: 107, name: 'TTTaiga', version: 1 }]);
		if (/^\/projects\/\d+$/.test(p)) return json({ id: 107, name: 'TTTaiga', slug: 'tttaiga', version: 1 });
		if (p === '/memberships') return json([{ user: 19, full_name: 'Test User' }]);
		if (p === '/issue-types') return json(ISSUE_TYPES);
		if (p === '/priorities') return json(PRIORITIES);
		if (p === '/severities') return json(SEVERITIES);
		if (p === '/issues') return req.method() === 'POST'
			? json({ id: 1605, ref: 1605 })
			: json([{ id: 1605, ref: 1605, subject: 'Bug A', version: 2, status: 1, project: 107, issue_type: 11, priority: 1, severity: 3 }]);
		if (p === '/epics') return req.method() === 'POST'
			? json({ id: 55, ref: 55 })
			: json([
				{ id: 55, ref: 55, subject: 'Epik Logging', project: 107 },
				{ id: 56, ref: 56, subject: 'Epik Auth', project: 107 },
				{ id: 57, ref: 57, subject: 'Epik New', project: 107 }
			]);
		if (/^\/epics\/\d+$/.test(p)) {
			const id = parseInt(p.split('/')[2], 10);
			return json({ id, ref: id, subject: 'Epik ' + id, project: 107 });
		}
		if (/^\/userstories\/\d+$/.test(p)) {
			const id = parseInt(p.split('/')[2], 10);
			return json({
				id, ref: id, subject: 'Usor A', version: 1, project: 107,
				epics: [
					{ id: 55, ref: 55, subject: 'Epik Logging' },
					{ id: 56, ref: 56, subject: 'Epik Auth' }
				]
			});
		}
		if (/^\/epics\/\d+\/related_userstories\/\d+$/.test(p) && req.method() === 'DELETE') {
			return route.fulfill({ status: 204, body: '' });
		}
		if (p === '/userstories') return req.method() === 'POST'
			? json({ id: 900, ref: 900, subject: 'created' })
			: json([{
				id: 9, ref: 9, subject: 'Usor A', version: 1, project: 107, status: 1,
				epic_extra_info: { subject: 'Epik Logging' },
				epics: [
					{ id: 55, ref: 55, subject: 'Epik Logging' },
					{ id: 56, ref: 56, subject: 'Epik Auth' }
				]
			}]);
		if (/^\/epics\/\d+\/related_userstories$/.test(p)) return json({ epic: 55, user_story: 900 });
		return json([]);
	});

	await page.route(/^https:\/\//, async (route) => {
		const url = route.request().url();
		if (url === 'https://code.jquery.com/jquery-3.6.0.min.js') return route.fulfill({ contentType: 'application/javascript', body: jquerySource });
		if (url.includes('bootstrap') && url.endsWith('.js')) return route.fulfill({ contentType: 'application/javascript', body: bootstrapSource });
		if (url.includes('select2') && url.endsWith('.js')) return route.fulfill({ contentType: 'application/javascript', body: select2Source });
		if (url.endsWith('.css')) return route.fulfill({ contentType: 'text/css', body: '/* mock */' });
		if (url.includes('fonts.gstatic.com') || /\.(woff2?|ttf)(\?|$)/.test(url)) return route.fulfill({ status: 200, body: 'mock-font' });
		await route.abort();
	});
}

async function bootstrapSession(page) {
	const resp = await page.request.post('login.php', { form: {
		action: 'login', taiga_token: 'browser-test-token',
		taiga_user: JSON.stringify({ id: 19, username: 'test' }),
		taiga_api_url: 'https://taiga.jmc.co.id/api/v1'
	} });
	if (!resp.ok()) throw new Error('login bootstrap failed: ' + resp.status());
}

const showModal = (page, id) => page.evaluate((m) => window.jQuery('#' + m).modal('show'), id);

test.beforeEach(async ({ page }) => {
	await installMockApi(page);
	await bootstrapSession(page);
});

test('isu single CREATE populates type, priority and severity', async ({ page }) => {
	await page.goto('isus.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await showModal(page, 'singleIsuModal');

	await expect(page.locator('#singleIsuType option[value="11"]')).toHaveCount(1);
	await expect(page.locator('#singleIsuPriority option[value="1"]')).toHaveCount(1);
	await expect(page.locator('#singleIsuSeverity option[value="3"]')).toHaveCount(1);
});

test('issue BULK UPDATE type/severity options load and are submitted', async ({ page }) => {
	const patched = [];
	page.on('request', (req) => {
		if (req.method() === 'PATCH' && /api\.php\/issues\/\d+$/.test(req.url())) patched.push(JSON.parse(req.postData()));
	});

	await page.goto('isus.php?project=107');
	await expect(page.locator('.issue-checkbox').first()).toBeVisible();
	await page.locator('.issue-checkbox').first().check();
	await showModal(page, 'issueBulkUpdateModal');

	await expect(page.locator('#bulkUpdateIssueType option[value="12"]')).toHaveCount(1);
	await expect(page.locator('#bulkUpdateIssueSeverity option[value="3"]')).toHaveCount(1);

	await page.locator('#bulkUpdateIssueType').selectOption('12');
	await page.locator('#bulkUpdateIssueSeverity').selectOption('3');
	await page.locator('#submitBulkIssueUpdate').click();

	await expect.poll(() => patched.length).toBe(1);
	expect(patched[0]).toMatchObject({ issue_type: 12, severity: 3 });
});

test('proyek BULK UPDATE opens and applies the name prefix', async ({ page }) => {
	const patched = [];
	page.on('request', (req) => {
		if (req.method() === 'PATCH' && /api\.php\/projects\/\d+$/.test(req.url())) patched.push(JSON.parse(req.postData()));
	});

	await page.goto('proyeks.php');
	await expect(page.locator('.proyek-checkbox').first()).toBeVisible();
	await page.locator('.proyek-checkbox').first().check();
	await showModal(page, 'bulkUpdateProyekModal');

	await expect(page.locator('#proyekPrefixInput')).toBeVisible();
	await page.locator('#proyekPrefixInput').fill('DONE');
	await page.locator('#submitBulkProyekUpdate').click();

	await expect.poll(() => patched.length).toBe(1);
	expect(patched[0]).toMatchObject({ name: '[DONE] TTTaiga' });
});

test('epik bulk create sends color and has no unsupported priority input', async ({ page }) => {
	const posted = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('api.php/epics')) posted.push(JSON.parse(req.postData()));
	});

	await page.goto('epiks.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await showModal(page, 'bulkCreateEpicModal');
	await expect(page.locator('#bulkCreateEpicProject')).toHaveValue('107');

	await expect(page.locator('#bulkCreateEpicPriority')).toHaveCount(0);
	await expect(page.locator('#bulkUpdateEpicPriority')).toHaveCount(0);
	await page.locator('#bulkCreateEpicColor').fill('#123456');
	await page.locator('#bulkCreateEpicText').fill('Epik warna');
	await page.locator('#submitBulkCreateEpic').click();

	await expect.poll(() => posted.length).toBe(1);
	expect(posted[0]).toMatchObject({ project: 107, color: '#123456' });
});

test('usor single CREATE links every checked epic through the relation endpoint', async ({ page }) => {
	const linked = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('/related_userstories')) linked.push(JSON.parse(req.postData()));
	});

	await page.goto('usors.php?project=107&epic=55');
	await expect(page.locator('#epicSelect')).toHaveValue('55');
	await showModal(page, 'singleUsorModal');
	await expect(page.locator('#singleUsorEpics input[value="55"]')).toBeChecked();
	await page.locator('#singleUsorEpics input[value="56"]').check();

	await page.locator('#singleUsorSubject').fill('Single linked story');
	await page.locator('#submitSingleUsor').click();

	await expect.poll(() => linked.length).toBe(2);
	expect(linked.map((l) => l.epic).sort()).toEqual([55, 56]);
	expect(linked.every((l) => l.user_story === 900)).toBe(true);
});

test('usor card shows a badge when the story has more than one epic', async ({ page }) => {
	await page.goto('usors.php?project=107');
	const card = page.locator('.usor-card').first();
	await expect(card).toContainText('In Epik: #55: Epik Logging');
	await expect(card).toContainText('+1 epik');
});

test('usor card has no badge when the story has a single epic', async ({ page }) => {
	await page.route('**/api.php/userstories*', async (route) => {
		const req = route.request();
		if (req.method() !== 'GET') return route.fallback();
		return route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify([{
				id: 9, ref: 9, subject: 'Usor single epic', version: 1, project: 107, status: 1,
				epic_extra_info: { subject: 'Epik Logging' },
				epics: [{ id: 55, ref: 55, subject: 'Epik Logging' }]
			}])
		});
	});
	await page.goto('usors.php?project=107');
	const card = page.locator('.usor-card').first();
	await expect(card).toContainText('In Epik: #55: Epik Logging');
	await expect(card).not.toContainText('+1 epik');
});

test('usor single EDIT with all epics unchecked leaves relations unchanged', async ({ page }) => {
	const linked = [];
	const unlinked = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('/related_userstories')) linked.push(req.postData());
		if (req.method() === 'DELETE' && req.url().includes('/related_userstories/')) unlinked.push(req.url());
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('.story-checkbox').first()).toBeVisible();
	await page.locator('.edit-usor').first().click();
	await expect(page.locator('#singleUsorId')).toHaveValue('9');
	await expect(page.locator('#singleUsorEpics input:checked')).toHaveCount(2);

	await page.locator('#singleUsorEpics input[value="55"]').uncheck();
	await page.locator('#singleUsorEpics input[value="56"]').uncheck();
	await page.locator('#submitSingleUsor').click();

	await expect(page.locator('#singleUsorModal')).toBeHidden();
	expect(linked).toHaveLength(0);
	expect(unlinked).toHaveLength(0);
});

test('usor single EDIT applies the checked epic set without touching untouched ones', async ({ page }) => {
	const linked = [];
	const unlinked = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('/related_userstories')) linked.push(JSON.parse(req.postData()));
		if (req.method() === 'DELETE' && req.url().includes('/related_userstories/')) unlinked.push(req.url());
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('.story-checkbox').first()).toBeVisible();
	await page.locator('.edit-usor').first().click();
	await expect(page.locator('#singleUsorId')).toHaveValue('9');
	await expect(page.locator('#singleUsorEpics input[value="55"]')).toBeChecked();
	await expect(page.locator('#singleUsorEpics input[value="56"]')).toBeChecked();

	await page.locator('#singleUsorEpics input[value="55"]').uncheck();
	await page.locator('#singleUsorEpics input[value="57"]').check();
	await page.locator('#submitSingleUsor').click();

	await expect.poll(() => linked.length).toBe(1);
	expect(unlinked.some((u) => u.includes('/epics/55/related_userstories/9'))).toBe(true);
	expect(unlinked.some((u) => u.includes('/epics/56/related_userstories/9'))).toBe(false);
	expect(linked[0]).toEqual({ epic: 57, user_story: 9 });
});

test('usor BULK UPDATE with no epic checked changes nothing', async ({ page }) => {
	const writes = [];
	page.on('request', (req) => {
		if (['POST', 'PATCH', 'DELETE'].includes(req.method()) && req.url().includes('api.php/')) writes.push(req.method() + ' ' + req.url());
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await expect(page.locator('.story-checkbox').first()).toBeVisible();
	await page.locator('.story-checkbox').first().check();
	await showModal(page, 'bulkUpdateModal');
	await expect(page.locator('#bulkUpdateEpics input[type="checkbox"]:checked')).toHaveCount(0);

	await page.locator('#submitBulkUpdate').click();

	await expect.poll(() => writes.filter((w) => w.includes('/userstories/9') || w.includes('related_userstories'))).toHaveLength(0);
	await expect(page.locator('#bulkUpdateModal')).toBeVisible();
});

test('usor BULK UPDATE adds checked epics without removing existing ones', async ({ page }) => {
	const linked = [];
	const unlinked = [];
	page.on('request', (req) => {
		if (req.method() === 'POST' && req.url().includes('/related_userstories')) linked.push(JSON.parse(req.postData()));
		if (req.method() === 'DELETE' && req.url().includes('/related_userstories/')) unlinked.push(req.url());
	});

	await page.goto('usors.php?project=107');
	await expect(page.locator('#projectSelect')).toHaveValue('107');
	await expect(page.locator('.story-checkbox').first()).toBeVisible();
	await page.locator('.story-checkbox').first().check();
	await showModal(page, 'bulkUpdateModal');

	await expect(page.locator('[data-field="epics"]')).toHaveCount(1);
	await expect(page.locator('[data-field="priority"]')).toHaveCount(0);
	await expect(page.locator('#bulkUpdateEpics input[type="checkbox"]')).toHaveCount(3);
	await expect(page.locator('#bulkUpdateEpics input[type="checkbox"]:checked')).toHaveCount(0);

	await page.locator('#bulkUpdateEpics input[value="57"]').check();
	await page.locator('#submitBulkUpdate').click();

	await expect.poll(() => linked.length).toBe(1);
	expect(unlinked).toHaveLength(0);
	expect(linked[0]).toEqual({ epic: 57, user_story: 9 });
});

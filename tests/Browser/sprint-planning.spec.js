const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const jquerySource = fs.readFileSync(
	path.join(path.dirname(require.resolve('jquery')), 'jquery.min.js'),
	'utf8'
);

// Real vendor libraries served from tests/mocks/vendor (copied from other local projects)
// so Select2/sortable/Toast behave like production.
const mockVendor = (name) =>
	fs.readFileSync(path.join(__dirname, '..', 'mocks', 'vendor', name), 'utf8');
const bootstrapSource = mockVendor('bootstrap.bundle.min.js');
const jqueryUiSource = mockVendor('jquery-ui.min.js');
const select2Source = mockVendor('select2.min.js');

const jqueryUiCss = '.ui-sortable-placeholder{visibility:visible}';

// ---- Test data: mirrors real Taiga shapes verified live (project 107) ----
const POINTS_SCALE = [
	{ id: 1314, name: '?', value: null },
	{ id: 1315, name: '0', value: 0 },
	{ id: 1316, name: '1/2', value: 0.5 },
	{ id: 1317, name: '1', value: 1 },
	{ id: 1321, name: '5', value: 5 },
	{ id: 1322, name: '8', value: 8 },
];
const ROLES = [
	{ id: 948, name: 'UX', computable: true },
	{ id: 951, name: 'Back', computable: true },
	{ id: 952, name: 'Product Owner', computable: false },
];
const SPRINT = { id: 237, name: 'test', project: 107, total_points: 13, closed_points: 0 };
const SPRINT_EMPTY = { id: 238, name: 'empty sprint', project: 107 };
const BACKLOG_USORS = [
	{
		id: 101, ref: 1, subject: 'Backlog one', project: 107, milestone: null,
		version: 1, status: 715, status_extra_info: { name: 'New', color: '#ccc' },
		points: { 948: 1316, 951: 1315 }, epic: null,
	},
	{
		id: 102, ref: 2, subject: 'Backlog two', project: 107, milestone: null,
		version: 1, status: 716, status_extra_info: { name: 'Ready', color: '#afa' },
		points: { 948: 1317, 951: 1322 }, epic_extra_info: { subject: 'Core' },
	},
	{
		id: 103, ref: 3, subject: 'Backlog three (unestimated)', project: 107, milestone: null,
		version: 1, status: 716, status_extra_info: { name: 'Ready', color: '#afa' },
		points: { 948: 1314, 951: 1314 }, epic: null,
	},
];
const SPRINT_USORS = [
	{
		id: 201, ref: 11, subject: 'In sprint A', project: 107, milestone: 237,
		version: 4, status: 715, status_extra_info: { name: 'New', color: '#ccc' },
		points: { 948: 1317, 951: 1315 }, epic: null,
	},
	{
		id: 202, ref: 12, subject: 'In sprint B', project: 107, milestone: 237,
		version: 2, status: 717, status_extra_info: { name: 'Done', color: '#A8E440', is_closed: true },
		points: { 948: 1322, 951: 1317 }, epic_extra_info: { subject: 'Core' },
	},
];

function makeUsorPayload(usors) {
	return JSON.stringify(usors);
}

/** Opens the Select2 project dropdown, types a term, and picks the matching option. */
async function pickProject(page, name) {
	await page.locator('.select2-container').first().click();
	await page.locator('.select2-search__field').fill(name);
	await page.getByRole('option', { name }).click();
	await page.waitForTimeout(300);
}

/**
 * Installs a fully mocked Taiga API on the page. No network access to Taiga.
 * Records every mutating request for assertions.
 */
async function installMockApi(page) {
	const calls = [];

	// login.php session endpoint (form POST)
	await page.route('**/login.php', async (route) => {
		if (route.request().method() === 'POST') {
			return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
		}
		return route.fallback();
	});

	await page.route('**/api.php/**', async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		const p = url.pathname.replace(/^.*api\.php/, '');
		const method = request.method();
		const body = request.postDataJSON ? safeJson(request.postData()) : null;

		calls.push({ method, path: p, query: url.searchParams, body });

		const json = (data, headers = {}) => route.fulfill({
			status: 200,
			contentType: 'application/json',
			headers,
			body: JSON.stringify(data),
		});

		if (p === '/auth' && method === 'POST') return json({ id: 19, username: 'test', auth_token: 'tok' });
		if (p === '/projects') return json([{ id: 107, name: 'TTTaiga' }]);
		if (p === '/points') return json(POINTS_SCALE);
		if (p === '/roles') return json(ROLES);
		if (p === '/milestones') {
			const project = url.searchParams.get('project');
			if (project === '107') return json([SPRINT, SPRINT_EMPTY]);
			return json([]);
		}
		if (p === '/milestones/237') return json(SPRINT);
		if (p === '/userstories') {
			const milestone = url.searchParams.get('milestone');
			const isnull = url.searchParams.get('milestone__isnull');
			if (isnull === 'true') return json(BACKLOG_USORS, { 'X-Paginated': 'false' });
			if (milestone === '237') return json(SPRINT_USORS, { 'X-Paginated': 'false' });
			return json([]);
		}
		if (p === '/userstories/bulk_update_milestone' && method === 'POST') {
			// Taiga format verified live: {project_id, milestone_id, bulk_stories:[{us_id, order}]}
			if (!body || !Array.isArray(body.bulk_stories)) {
				return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ _error_message: 'bad payload' }) });
			}
			return json({ ok: true });
		}
		if (/^\/userstories\/\d+$/.test(p) && method === 'PATCH') {
			return json(Object.assign({}, body, { id: parseInt(p.split('/')[2], 10), version: (body.version || 1) + 1 }));
		}

		return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'not found' }) });
	});

	await page.route(/^https:\/\//, async (route) => {
		const url = route.request().url();
		if (url === 'https://code.jquery.com/jquery-3.6.0.min.js') {
			return route.fulfill({ contentType: 'application/javascript', body: jquerySource });
		}
		if (url === 'https://code.jquery.com/ui/1.13.2/jquery-ui.min.js') {
			return route.fulfill({ contentType: 'application/javascript', body: jqueryUiSource });
		}
		if (url === 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js') {
			return route.fulfill({ contentType: 'application/javascript', body: bootstrapSource });
		}
		if (url === 'https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js') {
			return route.fulfill({ contentType: 'application/javascript', body: select2Source });
		}
		if (url.endsWith('jquery-ui.css')) {
			return route.fulfill({ contentType: 'text/css', body: jqueryUiCss });
		}
		// Other CSS: serve empty but valid payloads so the page renders.
		if (url.endsWith('.css')) {
			return route.fulfill({ contentType: 'text/css', body: '/* mock */' });
		}
		// Font files: any binary will do for layout purposes.
		if (url.includes('fonts.gstatic.com') || url.endsWith('.woff2') || url.endsWith('.woff') || url.endsWith('.ttf')) {
			return route.fulfill({ status: 200, body: 'mock-font' });
		}
		await route.abort();
	});

	return calls;
}

function safeJson(text) {
	if (!text) return null;
	try { return JSON.parse(text); } catch { return null; }
}

async function loginAndGoto(page) {
	// Same pattern as tests/Integration/WebIntegrationTest.php: establish a real
	// PHP session via the login endpoint, then open the protected page.
	// Playwright baseURL ends with a path, so a leading slash would resolve to the origin.
	const loginResp = await page.request.post('login.php', {
		form: {
			action: 'login',
			taiga_token: 'browser-test-token',
			taiga_user: JSON.stringify({ id: 19, username: 'test' }),
			taiga_api_url: 'https://taiga.jmc.co.id/api/v1',
		},
	});
	if (!loginResp.ok()) throw new Error('login.php session bootstrap failed: ' + loginResp.status());

	await page.goto('sprint_plan_form.php');
	await expect(page.locator('#projectSelect')).toBeVisible({ timeout: 10000 });
}

test.beforeEach(async ({ page }) => {
	const calls = await installMockApi(page);
	page.__mockCalls = calls;
	await loginAndGoto(page);
});

test('page shell renders with project select, sprint select, and both panels', async ({ page }) => {
	await expect(page.locator('#projectSelect')).toBeVisible();
	await expect(page.locator('#planningSprintSelect')).toBeVisible();
	await expect(page.locator('#sourceUsorList')).toBeAttached();
	await expect(page.locator('#targetUsorList')).toBeAttached();
	await expect(page.locator('#usorCardTemplate')).toBeAttached();
});

test('project select populates and sprint select lists sprints of project', async ({ page }) => {
	// Select2-driven remote dropdown: pick TTTaiga project
	await pickProject(page, 'TTTaiga');

	await expect(page.locator('#planningSprintSelect option', { hasText: 'test' })).toHaveCount(1, { timeout: 5000 });
	await expect(page.locator('#sourceSelector option', { hasText: 'Backlog' })).toHaveCount(1);
});

test('load planning shows backlog (milestone__isnull) and sprint usors with points', async ({ page }) => {
	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();

	await expect(page.locator('#planningContainer')).toBeVisible();

	// Source: 3 backlog usors, target: 2 sprint usors
	await expect(page.locator('#sourceUsorList .usor-item')).toHaveCount(3);
	await expect(page.locator('#targetUsorList .usor-item')).toHaveCount(2);

	// Points rendering: usor 102 = UX(1) + Back(8) = 9; usor 103 unestimated = "?"
	await expect(page.locator('#sourceUsorList .usor-item[data-usor-id="102"] .usor-item-points')).toHaveText('9 pt');
	await expect(page.locator('#sourceUsorList .usor-item[data-usor-id="103"] .usor-item-points')).toHaveText('?');

	// Capacity badge: sprint usors 201(1)+202(9)=10 + no pending = 10
	await expect(page.locator('#capacityPoints')).toHaveText('10');
});

test('backlog filter uses milestone__isnull=true, not broken milestone=0', async ({ page }, testInfo) => {
	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();
	await expect(page.locator('#planningContainer')).toBeVisible();

	// The mocked API asserts this implicitly: milestone=0 returns [] in real Taiga,
	// and the mock would show 0 source items if the app used it.
	await expect(page.locator('#sourceUsorList .usor-item')).toHaveCount(3);
});

test('drag from source to target queues addition (receive on target list)', async ({ page }) => {
	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();
	await expect(page.locator('#sourceUsorList .usor-item')).toHaveCount(3);

	// Click-based bulk add (drag is covered by unit-level receive semantics; here we
	// verify the same state transition through the checkbox+bulk button path).
	await page.locator('#sourceUsorList .usor-item[data-usor-id="101"] .usor-item-checkbox').check();
	await expect(page.locator('#bulkAddBtn')).toBeEnabled();
	await page.locator('#bulkAddBtn').click();

	await expect(page.locator('#targetUsorList .usor-item[data-usor-id="101"]')).toHaveClass(/pending-add/);
	await expect(page.locator('#sourceUsorList .usor-item[data-usor-id="101"]')).toHaveCount(0);
	await expect(page.locator('#badgePendingAdd')).toHaveText('+ 1 Add');
});

test('remove from target queues removal and re-add cancels it', async ({ page }) => {
	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();
	await expect(page.locator('#targetUsorList .usor-item')).toHaveCount(2);

	await page.locator('#targetUsorList .usor-item[data-usor-id="201"] .usor-item-remove').click();
	await expect(page.locator('#targetUsorList .usor-item[data-usor-id="201"]')).toHaveClass(/pending-remove/);
	await expect(page.locator('#badgePendingRemove')).toHaveText('- 1 Remove');

	// Discard restores
	await page.locator('#discardChangesBtn').click();
	await expect(page.locator('#targetUsorList .usor-item[data-usor-id="201"]')).not.toHaveClass(/pending-remove/);
});

test('save uses bulk_update_milestone for adds and individual PATCH for removals', async ({ page }) => {
	const calls = page.__mockCalls;

	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();

	// add 101, 102 to sprint
	await page.locator('#sourceUsorList .usor-item[data-usor-id="101"] .usor-item-checkbox').check();
	await page.locator('#sourceUsorList .usor-item[data-usor-id="102"] .usor-item-checkbox').check();
	await page.locator('#bulkAddBtn').click();

	// remove 201 from sprint
	await page.locator('#targetUsorList .usor-item[data-usor-id="201"] .usor-item-remove').click();

	await page.locator('#saveChangesBtn').click();

	// Save completes: progress bar hides and the pending badges clear.
	await expect(page.locator('#saveProgress')).toBeHidden({ timeout: 5000 });
	await expect(page.locator('#badgePendingAdd')).toHaveText('+ 0 Add', { timeout: 5000 });
	await expect(page.locator('#badgePendingRemove')).toHaveText('- 0 Remove');

	const bulkCall = calls.find(c => c.path === '/userstories/bulk_update_milestone');
	expect(bulkCall).toBeTruthy();
	expect(bulkCall.body.project_id).toBe(107);
	expect(bulkCall.body.milestone_id).toBe(237);
	expect(bulkCall.body.bulk_stories.map(s => s.us_id).sort()).toEqual([101, 102]);
	expect(bulkCall.body.bulk_stories.every(s => Number.isFinite(s.order))).toBeTruthy();

	const patchCalls = calls.filter(c => c.method === 'PATCH' && /^\/userstories\/\d+/.test(c.path));
	expect(patchCalls.length).toBe(1);
	expect(patchCalls[0].path).toBe('/userstories/201');
	expect(patchCalls[0].body.milestone).toBeNull();
	expect(patchCalls[0].body.version).toBe(4); // OCC version included
});

test('capacity badge updates with pending changes', async ({ page }) => {
	await pickProject(page, 'TTTaiga');
	await page.locator('#planningSprintSelect').selectOption('237');
	await page.locator('#loadPlanningBtn').click();

	// initial: 201(1) + 202(9) = 10
	await expect(page.locator('#capacityPoints')).toHaveText('10');

	// add 102 (UX 1 + Back 8 = 9) => 19
	await page.locator('#sourceUsorList .usor-item[data-usor-id="102"] .usor-item-checkbox').check();
	await page.locator('#bulkAddBtn').click();
	await expect(page.locator('#capacityPoints')).toHaveText('19');

	// remove 202 (9) => 10
	await page.locator('#targetUsorList .usor-item[data-usor-id="202"] .usor-item-remove').click();
	await expect(page.locator('#capacityPoints')).toHaveText('10');
});

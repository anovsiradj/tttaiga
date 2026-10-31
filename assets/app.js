
(() => {
	const session = globalThis.TTTaigaSession || {};
	globalThis.taigaModel = session.user || null;
	globalThis.taigaToken = session.authenticated ? 'session' : null;
	globalThis.apiUrl = session.apiUrl || null;
})()

function tttaigaClearAuthState() {
	window.location.href = 'login.php';
}

function tttaigaSanitizeHtml(html) {
	const template = document.createElement('template');
	template.innerHTML = String(html ?? '');

	const blockedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);
	template.content.querySelectorAll('*').forEach(node => {
		if (blockedTags.has(node.tagName)) {
			node.remove();
			return;
		}

		Array.from(node.attributes).forEach(attr => {
			const name = attr.name.toLowerCase();
			const value = String(attr.value || '').trim().toLowerCase();
			if (name.startsWith('on')) {
				node.removeAttribute(attr.name);
				return;
			}
			if ((name === 'href' || name === 'src' || name === 'xlink:href') && value.startsWith('javascript:')) {
				node.removeAttribute(attr.name);
				return;
			}
			if (name === 'style' && /expression\s*\(|javascript:|url\s*\(/i.test(attr.value)) {
				node.removeAttribute(attr.name);
			}
		});
	});

	return template.innerHTML;
}

function tttaigaInstallHtmlSanitizer() {
	if (!window.jQuery || $.fn.__tttaigaHtmlSanitized) return;

	const originalHtml = $.fn.html;
	$.fn.html = function (value) {
		if (typeof value === 'string') {
			return originalHtml.call(this, tttaigaSanitizeHtml(value));
		}
		if (typeof value === 'function') {
			return originalHtml.call(this, function (index, oldHtml) {
				const nextValue = value.call(this, index, oldHtml);
				return typeof nextValue === 'string' ? tttaigaSanitizeHtml(nextValue) : nextValue;
			});
		}
		return originalHtml.apply(this, arguments);
	};
	$.fn.__tttaigaHtmlSanitized = true;
}

const TTTTAIGA_SHARED_FILTER_KEYS = ['q', 'project', 'status', 'epic', 'user_story', 'assigned_to', 'milestone', 'order_by'];
const TTTTAIGA_SHARED_FILTER_MODULES = new Set(['proyeks.php', 'sprints.php', 'sprint_plan_form.php', 'epiks.php', 'usors.php', 'tasks.php', 'isus.php']);
const TTTTAIGA_SHARED_FILTER_STORAGE_KEY = 'tttaiga_shared_filters';

function tttaigaCurrentPageName() {
	const page = window.location.pathname.split('/').pop();
	return page || 'index.php';
}

function tttaigaIsSharedFilterPage(page) {
	return TTTTAIGA_SHARED_FILTER_MODULES.has(page || tttaigaCurrentPageName());
}

function tttaigaBuildSharedFilterParams(params) {
	const shared = new URLSearchParams();
	TTTTAIGA_SHARED_FILTER_KEYS.forEach(key => {
		const value = params.get(key);
		if (value !== null && String(value).trim() !== '') {
			shared.set(key, value);
		}
	});
	return shared;
}

function tttaigaReadStoredSharedFilters() {
	try {
		const raw = sessionStorage.getItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY);
		if (!raw) return new URLSearchParams();
		const parsed = JSON.parse(raw);
		const params = new URLSearchParams();
		TTTTAIGA_SHARED_FILTER_KEYS.forEach(key => {
			if (parsed && parsed[key] !== undefined && String(parsed[key]).trim() !== '') {
				params.set(key, String(parsed[key]));
			}
		});
		return params;
	} catch (e) {
		return new URLSearchParams();
	}
}

function tttaigaStoreSharedFilters(params) {
	const shared = params instanceof URLSearchParams
		? tttaigaBuildSharedFilterParams(params)
		: tttaigaBuildSharedFilterParams(new URLSearchParams(params || {}));
	const payload = {};
	shared.forEach((value, key) => {
		payload[key] = value;
	});

	try {
		if (Object.keys(payload).length) {
			sessionStorage.setItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY, JSON.stringify(payload));
		} else {
			sessionStorage.removeItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY);
		}
	} catch (e) {
		// Ignore storage failures; URL sharing still works.
	}

	return shared;
}

function tttaigaSharedFilterParams() {
	const current = tttaigaBuildSharedFilterParams(new URLSearchParams(window.location.search));
	if ([...current.keys()].length > 0) return current;
	return tttaigaReadStoredSharedFilters();
}

function tttaigaPersistSharedFilters(params) {
	if (!tttaigaIsSharedFilterPage()) return new URLSearchParams();
	const source = params instanceof URLSearchParams ? params : new URLSearchParams(params || {});
	const shared = tttaigaStoreSharedFilters(source);
	tttaigaBindSharedFilterNavigation();
	return shared;
}

function tttaigaEnsureSharedFiltersInUrl() {
	if (!tttaigaIsSharedFilterPage()) return;

	const url = new URL(window.location.href);
	const current = tttaigaBuildSharedFilterParams(url.searchParams);
	if ([...current.keys()].length > 0) {
		tttaigaStoreSharedFilters(url.searchParams);
		return;
	}

	const stored = tttaigaReadStoredSharedFilters();
	if ([...stored.keys()].length === 0) return;

	stored.forEach((value, key) => {
		url.searchParams.set(key, value);
	});
	window.history.replaceState(null, '', url.toString());
}

function tttaigaUrlWithSharedFilters(href) {
	const shared = tttaigaSharedFilterParams();
	const url = new URL(href, window.location.href);
	TTTTAIGA_SHARED_FILTER_KEYS.forEach(key => {
		url.searchParams.delete(key);
	});
	shared.forEach((value, key) => {
		url.searchParams.set(key, value);
	});
	return url.pathname.split('/').pop() + (url.search ? url.search : '') + (url.hash || '');
}

function tttaigaBindSharedFilterNavigation() {
	$('a[href]').each(function () {
		const rawHref = $(this).attr('href');
		if (!rawHref || rawHref.startsWith('#') || rawHref.includes('://')) return;
		const page = rawHref.split('?')[0].split('#')[0];
		if (!tttaigaIsSharedFilterPage(page)) return;
		$(this).attr('href', tttaigaUrlWithSharedFilters(rawHref));
	});

	$(document).off('click.sharedFilters', 'a[href]').on('click.sharedFilters', 'a[href]', function () {
		const rawHref = $(this).attr('href');
		if (!rawHref || rawHref.startsWith('#') || rawHref.includes('://')) return;
		const page = rawHref.split('?')[0].split('#')[0];
		if (!tttaigaIsSharedFilterPage(page)) return;
		$(this).attr('href', tttaigaUrlWithSharedFilters(rawHref));
	});
}

tttaigaEnsureSharedFiltersInUrl();

function jsonToSelect(json, el, valueKey = 'id', textKey = 'name') {
	const $el = $(el);
	$el.empty().append($('<option>', { value: '', text: ' ... ' }));
	json.forEach(item => {
		$el.append($('<option>', {
			value: item[valueKey],
			text: item[textKey]
		}));
	});
}

$(document).ready(function () {
	tttaigaInstallHtmlSanitizer();
	tttaigaBindSharedFilterNavigation();

	$(document).ajaxError(function (_event, xhr, settings) {
		const url = settings && settings.url ? String(settings.url) : '';
		if (xhr.status === 401 && url.indexOf('api.php') !== -1 && !window.location.pathname.endsWith('login.php')) {
			tttaigaClearAuthState();
			window.location.href = 'login.php';
		}
	});

	$('#logoutBtn').on('click', function () {
		tttaigaClearAuthState();
		$.post('login.php', { action: 'logout' }).always(function () {
			window.location.href = 'login.php';
		});
	});
});

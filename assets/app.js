
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

	$(document).ajaxError(function (_event, xhr, settings) {
		const url = settings && settings.url ? String(settings.url) : '';
		if (xhr.status === 401 && url.indexOf('api.php') !== -1 && !window.location.pathname.endsWith('login.php')) {
			tttaigaClearAuthState();
		}
	});

	$('#logoutBtn').on('click', function () {
		$.post('login.php', { action: 'logout' }).always(function () {
			tttaigaClearAuthState();
		});
	});
});

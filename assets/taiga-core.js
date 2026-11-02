// --- Session Init ---

(() => {
    const session = globalThis.TTTaigaSession || {};
    globalThis.taigaModel = session.user || null;
    if (!globalThis.taigaToken) globalThis.taigaToken = session.authenticated ? 'session' : null;
    if (!globalThis.apiUrl) globalThis.apiUrl = session.apiUrl || null;
})();

window.TTTaiga = { ...window.TTTaiga,
    API: {
        _clearAuth: function () {
            window.location.href = 'login.php';
        },
        _headers: function () {
            return {
                'Authorization': 'Bearer ' + (window.taigaToken || ''),
                'Content-Type': 'application/json',
                'X-Taiga-Api-Url': window.apiUrl || ''
            };
        },
        _handleError: function (xhr, url) {
            if ((xhr.status === 401 || xhr.status === 403) && url.indexOf('api.php') !== -1 && !window.location.pathname.endsWith('login.php')) {
                this._clearAuth();
            }
            return xhr;
        },
        request: function (method, endpoint, data, opts = {}) {
            const settings = {
                url: endpoint,
                type: method.toUpperCase(),
                method: method.toUpperCase(),
                headers: this._headers(),
                dataType: 'json',
                error: function (xhr) {
                    this._handleError(xhr, endpoint);
                    if (typeof opts.onError === 'function') opts.onError(xhr);
                }.bind(this)
            };
            if (data && method !== 'GET') settings.data = JSON.stringify(data);
            if (data && method === 'GET') settings.data = data;
            if (opts.success) settings.success = opts.success;
            if (opts.complete) settings.complete = opts.complete;
            return $.ajax(settings);
        },
        get: function (endpoint, params = {}, opts = {}) {
            return this.request('GET', endpoint, params, opts);
        },
        post: function (endpoint, data = {}, opts = {}) {
            return this.request('POST', endpoint, data, opts);
        },
        patch: function (endpoint, data = {}, opts = {}) {
            return this.request('PATCH', endpoint, data, opts);
        },
        _delete: function (endpoint, opts = {}) {
            return this.request('DELETE', endpoint, null, opts);
        }
    },
    UI: {
        notify: function(message, type = 'primary') {
            const containerId = 'taigaToastContainer';
            let $container = $('#' + containerId);
            if (!$container.length) {
                $('body').append(`<div id="${containerId}" class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1055;"></div>`);
                $container = $('#' + containerId);
            }

            const toastId = 'toast-' + Date.now();
            const html = `
                <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto text-${type}">Notification</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">${message}</div>
                </div>`;

            $container.append(html);
            const toastEl = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
            toast.show();

            toastEl.addEventListener('hidden.bs.toast', () => {
                $(toastEl).remove();
            });
        }
    },
    Form: {
        _toFieldName: function (key, aliases) {
            if (aliases && aliases[key]) return aliases[key];
            return key.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
        },
        _fromFieldName: function (field, aliases) {
            if (aliases) {
                for (const key in aliases) {
                    if (aliases[key] === field) return key;
                }
            }
            return field.charAt(0).toLowerCase() + field.slice(1);
        },
        _getFormData: function (formId, aliases) {
            const data = {};
            const prefix = formId.replace('Form', '');
            $('#' + formId).find('input, select, textarea').each((_index, el) => {
                const $el = $(el);
                const id = $el.attr('id') || '';
                if (!id || $el.is(':disabled')) return;
                const field = id.replace(prefix, '');
                if (!field || field === 'Id' || field === 'Version') return;
                const key = this._fromFieldName(field, aliases);
                const val = $el.val();
                if ($el.is(':checkbox')) {
                    data[key] = $el.is(':checked');
                } else {
                    data[key] = val;
                }
            });
            return data;
        },
        saveModal: function (opts) {
            const { endpoint, formId, modalId, listFn } = opts;
            const $form = $('#' + formId);
            const prefix = formId.replace('Form', '');
            const id = $('#' + prefix + 'Id').val();
            const version = $('#' + prefix + 'Version').val();
            const formData = opts.data || this._getFormData(formId, opts.aliases);
            const method = id && Number(id) > 0 ? 'PATCH' : 'POST';
            const url = id && Number(id) > 0 ? endpoint + '/' + id : endpoint;
            const payload = id && Number(id) > 0 && version ? { ...formData, version: parseInt(version) } : formData;

            const $btn = $form.closest('.modal').find('[type="submit"], .btn-primary').last();
            $btn.prop('disabled', true).text('Saving...');

            TTTaiga.API.request(method, url, payload, {
                success: function () {
                    $btn.prop('disabled', false).text('Save');
                    $('#' + modalId).modal('hide');
                    TTTaiga.UI.notify(id ? 'Updated successfully' : 'Created successfully', 'success');
                    $form[0].reset();
                    $('#' + prefix + 'Id').val('');
                    $('#' + prefix + 'Version').val('');
                    if (typeof listFn === 'function') listFn();
                },
                onError: function (xhr) {
                    $btn.prop('disabled', false).text('Save');
                    const msg = xhr.responseJSON?.error || xhr.responseJSON?._error_message || 'Failed to save';
                    TTTaiga.UI.notify(msg, 'danger');
                }
            });
        },
        populate: function (formId, data, aliases) {
            const prefix = formId.replace('Form', '');
            Object.keys(data).forEach(key => {
                const $el = $('#' + prefix + this._toFieldName(key, aliases));
                if (!$el.length) return;
                if ($el.is(':checkbox')) {
                    $el.prop('checked', !!data[key]);
                } else {
                    $el.val(data[key]);
                }
            });
        },
        _populateList: function (selector, endpoint, pid, selectedValue, formatFn, placeholder, selectedLabel) {
            const $sel = $(selector);
            if (!$sel.length) return;
            if (!pid) {
                if ($sel.data('select2')) $sel.select2('destroy');
                $sel.empty().append(new Option(placeholder + ' (select project first)', '', false, false)).prop('disabled', true);
                return;
            }
            TTTaiga.API.get('api.php' + endpoint, { project: pid }, {
                success: function (items) {
                    if ($sel.data('select2')) $sel.select2('destroy');
                    $sel.empty().append(new Option(placeholder, '', false, false));
                    (items || []).forEach(function (item) {
                        $sel.append(new Option(formatFn(item), item.id, false, false));
                    });
                    if (selectedValue) {
                        const val = String(selectedValue);
                        if ($sel.find('option[value="' + val + '"]').length) {
                            $sel.val(val);
                        } else {
                            $sel.append(new Option(selectedLabel || val, val, true, true));
                        }
                    }
                    $sel.prop('disabled', false);
                    const $modal = $sel.closest('.modal');
                    $sel.select2({
                        theme: 'bootstrap-5',
                        width: '100%',
                        placeholder: placeholder,
                        allowClear: true,
                        dropdownParent: $modal.length && $modal.attr('id') ? $('#' + $modal.attr('id')) : $(document.body)
                    });
                }
            });
        },
        populateDropdowns: function (config, values) {
            values = values || TTTaiga.Filter.read();
            const $project = $(config.projectSel);
            if (!$project.length) return;

            if (values.project && !values.project_label) {
                const $fo = $('#projectSelect option:selected');
                values.project_label = $fo.length && $fo.val() ? $fo.text() : values.project;
            }
            if (values.user_story && !values.user_story_label) {
                const $fo = $('#userStorySelect option:selected');
                values.user_story_label = $fo.length && $fo.val() ? $fo.text() : values.user_story;
            }
            if (values.epic && !values.epic_label) {
                const $fo = $('#epicSelect option:selected');
                values.epic_label = $fo.length && $fo.val() ? $fo.text() : values.epic;
            }

            const refreshDependents = function (pid) {
                if (config.statusSel && config.statusType) {
                    taigaPopulateBulkStatuses(config.statusType, $(config.statusSel), pid,
                        config.statusDefault || 'Select Status', values.status || null);
                }
                if (config.assigneeSel) {
                    taigaPopulateBulkMembers($(config.assigneeSel), pid,
                        config.assigneeDefault || 'Assign to...', values.assigned_to || null);
                }
                if (config.usorSel) {
                    this._populateList(config.usorSel, '/userstories', pid, values.user_story,
                        (item) => `#${item.ref}: ${item.subject}`, 'Select Usor', values.user_story_label);
                }
                if (config.sprintSel) {
                    this._populateList(config.sprintSel, '/milestones', pid, values.milestone,
                        (item) => item.name, 'Select Sprint', values.milestone_label);
                }
                if (config.epicSel) {
                    this._populateList(config.epicSel, '/epics', pid, values.epic,
                        (item) => `#${item.ref}: ${item.subject}`, 'Select Epik', values.epic_label);
                }
                if (typeof config.onDependentsReady === 'function') config.onDependentsReady(pid);
            }.bind(this);

            $project.off('change.taigaForm').on('change.taigaForm', function () {
                refreshDependents($(this).val());
            });

            return taigaPopulateProjectSelect($project, values.project, values.project_label);
        }
    },
    Filter: {
        read: function () {
            return taigaGetFilterParams();
        },
        syncState: function () {
            if (typeof taigaGetFilterParams !== 'function') return {};
            const params = taigaGetFilterParams();
            TTTaiga.State.setState(params);
            return params;
        }
    },
    State: {
        subscribers: [],
        data: JSON.parse(localStorage.getItem('taiga_state')) || {},
        subscribe: function(callback) {
            this.subscribers.push(callback);
        },
        setState: function(newState) {
            this.data = { ...this.data, ...newState };
            localStorage.setItem('taiga_state', JSON.stringify(this.data));
            this.subscribers.forEach(callback => callback(this.data));
        },
        getState: function() {
            return this.data;
        }
    }
};

// --- Shared Filter Logic ---
//
// Filter dipersist antar modul list lewat sessionStorage + URL.
// Setiap modul punya whitelist key sendiri supaya filter yang context-specific
// (mis. epic hanya dipakai di usors/tasks) tidak bocor ke modul lain.

const TTTTAIGA_FILTER_WHITELIST = {
    'proyeks.php': ['q', 'order_by'],
    'sprints.php': ['q', 'project', 'order_by'],
    // Sprint planning hanya punya project select; sprint dipilih lewat `id` (bukan filter).
    'sprint_plan_form.php': ['project'],
    'epiks.php': ['q', 'project', 'status', 'assigned_to', 'order_by'],
    'usors.php': ['q', 'project', 'status', 'epic', 'order_by'],
    'tasks.php': ['q', 'project', 'status', 'epic', 'user_story', 'assigned_to', 'order_by'],
    'isus.php': ['q', 'project', 'status', 'assigned_to', 'order_by']
};

const TTTTAIGA_SHARED_FILTER_MODULES = new Set(Object.keys(TTTTAIGA_FILTER_WHITELIST));
const TTTTAIGA_SHARED_FILTER_STORAGE_KEY = 'tttaiga_shared_filters';

// Union semua key: dipakai untuk membersihkan query param filter lama di URL target.
const TTTTAIGA_ALL_FILTER_KEYS = [...new Set(Object.values(TTTTAIGA_FILTER_WHITELIST).flat())];

function tttaigaCurrentPageName() {
    const page = window.location.pathname.split('/').pop();
    return page || 'index.php';
}

function tttaigaIsSharedFilterPage(page) {
    return TTTTAIGA_SHARED_FILTER_MODULES.has(page || tttaigaCurrentPageName());
}

// Key yang boleh dipakai modul tertentu. Modul tanpa whitelist tidak membawa filter apa pun.
function tttaigaFilterKeysForPage(page) {
    return TTTTAIGA_FILTER_WHITELIST[page] || [];
}

function tttaigaBuildSharedFilterParams(params, targetPage) {
    const page = targetPage || tttaigaCurrentPageName();
    const shared = new URLSearchParams();
    tttaigaFilterKeysForPage(page).forEach(key => {
        const value = params.get(key);
        if (value !== null && String(value).trim() !== '') {
            shared.set(key, value);
        }
    });
    return shared;
}

function tttaigaReadStoredSharedFilters(targetPage) {
    const page = targetPage || tttaigaCurrentPageName();
    try {
        const raw = sessionStorage.getItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY);
        if (!raw) return new URLSearchParams();
        const parsed = JSON.parse(raw);
        const params = new URLSearchParams();
        tttaigaFilterKeysForPage(page).forEach(key => {
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
    const source = params instanceof URLSearchParams ? params : new URLSearchParams(params || {});
    const shared = tttaigaBuildSharedFilterParams(source, tttaigaCurrentPageName());
    const payload = {};
    shared.forEach((value, key) => { payload[key] = value; });
    try {
        if (Object.keys(payload).length) {
            sessionStorage.setItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY, JSON.stringify(payload));
        } else {
            sessionStorage.removeItem(TTTTAIGA_SHARED_FILTER_STORAGE_KEY);
        }
    } catch (e) {}
    return shared;
}

function tttaigaSharedFilterParams(targetPage) {
    const page = targetPage || tttaigaCurrentPageName();
    const current = tttaigaBuildSharedFilterParams(new URLSearchParams(window.location.search), page);
    if ([...current.keys()].length > 0) return current;
    return tttaigaReadStoredSharedFilters(page);
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
    const page = tttaigaCurrentPageName();
    const allowed = tttaigaFilterKeysForPage(page);

    // Buang filter key yang tidak dipakai modul ini. Ini invariant whitelist:
    // key asing (mis. epic di epiks.php) tidak boleh bertahan di URL, karena
    // akan ikut terbawa lagi saat pindah ke modul yang memakainya.
    TTTTAIGA_ALL_FILTER_KEYS.forEach(key => {
        if (!allowed.includes(key)) url.searchParams.delete(key);
    });

    const current = tttaigaBuildSharedFilterParams(url.searchParams, page);
    if ([...current.keys()].length > 0) {
        tttaigaStoreSharedFilters(url.searchParams);
        window.history.replaceState(null, '', url.toString());
        return;
    }

    const stored = tttaigaReadStoredSharedFilters(page);
    stored.forEach((value, key) => { url.searchParams.set(key, value); });
    window.history.replaceState(null, '', url.toString());
}

function tttaigaUrlWithSharedFilters(href) {
    const url = new URL(href, window.location.href);
    const targetPage = url.pathname.split('/').pop();
    if (!tttaigaIsSharedFilterPage(targetPage)) {
        return url.pathname.split('/').pop() + (url.search ? url.search : '') + (url.hash || '');
    }
    TTTTAIGA_ALL_FILTER_KEYS.forEach(key => { url.searchParams.delete(key); });
    tttaigaSharedFilterParams(targetPage).forEach((value, key) => { url.searchParams.set(key, value); });
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

// --- HTML Sanitizer ---

function tttaigaSanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html ?? '');
    const blockedTags = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'LINK', 'META']);
    template.content.querySelectorAll('*').forEach(node => {
        if (blockedTags.has(node.tagName)) { node.remove(); return; }
        Array.from(node.attributes).forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = String(attr.value || '').trim().toLowerCase();
            if (name.startsWith('on')) { node.removeAttribute(attr.name); return; }
            if ((name === 'href' || name === 'src' || name === 'xlink:href') && value.startsWith('javascript:')) { node.removeAttribute(attr.name); return; }
            if (name === 'style' && /expression\s*\(|javascript:|url\s*\(/i.test(attr.value)) { node.removeAttribute(attr.name); }
        });
    });
    return template.innerHTML;
}

function tttaigaInstallHtmlSanitizer() {
    if (!window.jQuery || $.fn.__tttaigaHtmlSanitized) return;
    const originalHtml = $.fn.html;
    $.fn.html = function (value) {
        if (typeof value === 'string') return originalHtml.call(this, tttaigaSanitizeHtml(value));
        if (typeof value === 'function') return originalHtml.call(this, function (index, oldHtml) {
            const nextValue = value.call(this, index, oldHtml);
            return typeof nextValue === 'string' ? tttaigaSanitizeHtml(nextValue) : nextValue;
        });
        return originalHtml.apply(this, arguments);
    };
    $.fn.__tttaigaHtmlSanitized = true;
}

// --- Auto-init ---

tttaigaEnsureSharedFiltersInUrl();

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

function tttaigaClearAuthState() {
}

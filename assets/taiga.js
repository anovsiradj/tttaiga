window.TTTaiga = window.TTTaiga || {};
TTTaiga.selectedItems = {
    tasks: [],
    usors: [],
    epics: [],
    issues: [],
    sprints: [],
    projects: []
};

TTTaiga.BulkUpdate = {
    config: {
        tasks: {
            fields: [
                { key: 'status', label: 'Status', type: 'select', statusType: 'task', param: 'status' },
                { key: 'assignee', label: 'Assign To', type: 'select', member: true, param: 'assigned_to' },
                { key: 'usor', label: 'User Story', type: 'select', remote: '/userstories', param: 'user_story', format: (item) => `#${item.ref}: ${item.subject}` },
                { key: 'sprint', label: 'Sprint', type: 'select', remote: '/milestones', param: 'milestone' },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' },
                { key: 'priority', label: 'Priority', type: 'select', param: 'priority', options: [{value:'', label:'No Change'}, {value:'1', label:'1 - Highest'}, {value:'2', label:'2'}, {value:'3', label:'3'}, {value:'4', label:'4'}, {value:'5', label:'5 - Lowest'}] }
            ],
            endpoint: '/tasks/',
            key: 'tasks',
            label: 'Tasks',
            modalId: 'bulkUpdateTaskModal',
            listId: 'bulkUpdateTaskList',
            projectSel: '#bulkUpdateTaskProject'
        },
        usors: {
            fields: [
                { key: 'status', label: 'Status', type: 'select', statusType: 'us', param: 'status' },
                { key: 'assignee', label: 'Assign To', type: 'select', member: true, param: 'assigned_to' },
                { key: 'epic', label: 'Epic', type: 'select', remote: '/epics', param: 'epic', format: (item) => `#${item.ref}: ${item.subject}` },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' },
                { key: 'priority', label: 'Priority', type: 'select', param: 'priority', options: [{value:'', label:'No Change'}, {value:'1', label:'1 - Highest'}, {value:'2', label:'2'}, {value:'3', label:'3'}, {value:'4', label:'4'}, {value:'5', label:'5 - Lowest'}] }
            ],
            endpoint: '/userstories/',
            key: 'usors',
            label: 'Usors',
            modalId: 'bulkUpdateModal',
            listId: 'bulkUpdateUsors',
            projectSel: '#bulkUpdateProjectOptions'
        },
        epics: {
            fields: [
                { key: 'status', label: 'Status', type: 'select', statusType: 'epic', param: 'status' },
                { key: 'assignee', label: 'Assign To', type: 'select', member: true, param: 'assigned_to' },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' },
                { key: 'priority', label: 'Priority', type: 'select', param: 'priority', options: [{value:'', label:'No Change'}, {value:'1', label:'1 - Highest'}, {value:'2', label:'2'}, {value:'3', label:'3'}, {value:'4', label:'4'}, {value:'5', label:'5 - Lowest'}] },
                { key: 'color', label: 'Color', type: 'color', param: 'color' }
            ],
            endpoint: '/epics/',
            key: 'epics',
            label: 'Epics',
            modalId: 'bulkUpdateEpicModal',
            listId: 'bulkUpdateEpics',
            projectSel: '#bulkUpdateEpicProject'
        },
        issues: {
            fields: [
                { key: 'status', label: 'Status', type: 'select', statusType: 'issue', param: 'status' },
                { key: 'assignee', label: 'Assign To', type: 'select', member: true, param: 'assigned_to' },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' },
                { key: 'priority', label: 'Priority', type: 'select', param: 'priority', options: [{value:'', label:'No Change'}, {value:'1', label:'1 - Highest'}, {value:'2', label:'2'}, {value:'3', label:'3'}, {value:'4', label:'4'}, {value:'5', label:'5 - Lowest'}] }
            ],
            endpoint: '/issues/',
            key: 'issues',
            label: 'Issues',
            modalId: 'issueBulkUpdateModal',
            listId: 'bulkUpdateIssueList',
            projectSel: '#bulkUpdateIssueProject'
        },
        sprints: {
            fields: [
                { key: 'closed', label: 'Closed', type: 'select', options: [{value:'', label:'No Change'}, {value:'true', label:'Closed'}, {value:'false', label:'Open'}], param: 'closed' },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' },
                { key: 'name', label: 'Name', type: 'text', param: 'name' }
            ],
            endpoint: '/milestones/',
            key: 'sprints',
            label: 'Sprints',
            modalId: 'bulkUpdateSprintModal',
            listId: 'bulkUpdateSprints',
            projectSel: '#bulkUpdateSprintProject'
        },
        projects: {
            fields: [
                { key: 'prefix', label: 'Prefix', type: 'text', param: 'prefix' },
                { key: 'description', label: 'Description', type: 'textarea', param: 'description' }
            ],
            endpoint: '/projects/',
            key: 'projects',
            label: 'Projects',
            modalId: 'bulkUpdateProjectModal',
            listId: null
        }
    },
    open: function(type) {
        if (this._opening) return;
        this._opening = true;
        try {
            var cfg = this.config[type];
            if (!cfg) { TTTaiga.UI.notify('Invalid type', 'error'); return; }
            var items = TTTaiga.selectedItems[cfg.key] || [];
            if (items.length === 0) {
                TTTaiga.UI.notify('No items selected', 'warning');
                return;
            }
            var $modal = $('#' + cfg.modalId);
            if (!$modal.length) {
                TTTaiga.UI.notify('Modal not found', 'error');
                return;
            }
            var $list = $modal.find('#' + cfg.listId);
            if ($list.length) {
                var html = items.map(item => `<div class="form-check disabled"><input class="form-check-input" type="checkbox" checked disabled><label class="form-check-label">#${item.ref}: ${item.subject}</label></div>`).join('');
                $list.html(html);
            }
            var populateFields = function(projectId) {
                cfg.fields.forEach(function(field) {
                    var $el = $modal.find('[data-field="' + field.key + '"]');
                    if (!$el.length) return;
                    if (field.type === 'select') {
                        if (field.options) {
                            var optHtml = '';
                            field.options.forEach(function(opt) { optHtml += `<option value="${opt.value}">${opt.label}</option>`; });
                            $el.html(optHtml);
                        } else if (field.statusType) {
                            taigaPopulateBulkStatuses(field.statusType, $el, projectId, 'No Change');
                        } else if (field.member) {
                            taigaPopulateBulkMembers($el, projectId, 'No Change');
                        } else if (field.remote) {
                            // remote select2
                            if ($el.data('select2')) $el.select2('destroy');
                            $el.empty().append(new Option(projectId ? 'No Change' : 'Select project first', ''));
                            $el.prop('disabled', !projectId);
                            taigaInitRemoteSelect2('#' + $el.attr('id'), field.remote, {
                                placeholder: projectId ? 'No Change' : 'Select project first',
                                formatText: field.format || function(item) { return item.name || item.subject || item.full_name; },
                                additionalParams: function() { return projectId ? { project: projectId } : {}; }
                            });
                        }
                    } else if (field.type === 'textarea') {
                        $el.val('');
                    } else if (field.type === 'text') {
                        $el.val('');
                    } else if (field.type === 'color') {
                        $el.val('#fd7e14');
                    }
                });
            };

            var projectId = taigaGetFilterParams().project;
            var projectLabel = null;
            if (projectId) {
                var $headerProject = $('#projectSelect');
                if ($headerProject.length) {
                    var $opt = $headerProject.find('option:selected');
                    if ($opt.length && String($opt.val()) === String(projectId)) {
                        projectLabel = $opt.text();
                    }
                }
            }

            if (cfg.projectSel) {
                var $projectSel = $modal.find(cfg.projectSel);
                if ($projectSel.length) {
                    $projectSel.off('change.bulkShared').on('change.bulkShared', function() {
                        populateFields($(this).val());
                    });
                    taigaPopulateProjectSelect($projectSel, projectId, projectLabel);
                }
            }

            populateFields(projectId);
        } finally {
            this._opening = false;
        }
    },
    submit: function(type) {
        var cfg = this.config[type];
        if (!cfg) { TTTaiga.UI.notify('Invalid type', 'error'); return; }
        var $modal = $('#' + cfg.modalId);
        var items = TTTaiga.selectedItems[cfg.key] || [];
        if (items.length === 0) {
            TTTaiga.UI.notify('No items selected', 'warning');
            return;
        }
        var updateData = {};
        var prefix = null;
        var hasField = false;
        cfg.fields.forEach(function(field) {
            var $el = $modal.find('[data-field="' + field.key + '"]');
            var val = $el.val();
            if (val && val !== '' && val !== 'null') {
                if (field.param === 'closed') {
                    updateData[field.param] = val === 'true';
                    hasField = true;
                } else if (field.param === 'prefix') {
                    prefix = val.trim();
                    if (prefix) hasField = true;
                } else if (field.type === 'color') {
                    if (val && val !== '#fd7e14') {
                        updateData[field.param] = val;
                        hasField = true;
                    }
                } else {
                    updateData[field.param] = field.type === 'select' ? parseInt(val) : val;
                    hasField = true;
                }
            }
        });
        if (!hasField) {
            TTTaiga.UI.notify('Please select at least one field to update', 'warning');
            return;
        }
                var $btn = $modal.find('#submitBulkUpdate, #submitBulkTaskUpdate, #submitBulkUpdateEpic, #submitBulkIssueUpdate, #submitBulkUpdateSprint, #submitBulkProjectUpdate');
                if (!$btn.length) $btn = $modal.find('.btn-primary[data-action="submit"]');
        $btn.prop('disabled', true).text('Updating...');
        $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

        var dataFn = updateData;
        if (type === 'projects' && prefix) {
            dataFn = function(item) {
                var cleanName = item.name.replace(/^\[.*?\]\s*/, '');
                return { name: '[' + prefix + '] ' + cleanName };
            };
        }

        taigaExecuteBulkParallel(cfg.endpoint, items, 'PATCH', dataFn, function(successCount, errorCount) {
            $btn.prop('disabled', false).text('Update ' + cfg.label);
            $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
            if (errorCount === 0) {
                TTTaiga.UI.notify('Successfully updated ' + successCount + ' ' + cfg.label.toLowerCase() + '!', 'success');
                $modal.modal('hide');
                if (type === 'tasks') TTTaiga.Tasks.load();
                else if (type === 'usors') TTTaiga.Usors.load();
                else if (type === 'epics') TTTaiga.Epiks.load();
                else if (type === 'issues') TTTaiga.Issues.load();
                else if (type === 'sprints') TTTaiga.Sprints.load();
                else if (type === 'projects') TTTaiga.Projects.load();
            } else {
                TTTaiga.UI.notify('Updated ' + successCount + ' ' + cfg.label.toLowerCase() + ', but ' + errorCount + ' failed.', 'danger');
            }
        }, { showProgress: true });
    }
};

function taigaLoadProjects(apiUrl, token, targetSelectId = '#projectSelect') {
	$.ajax({
		url: `api.php/projects`,
		data: {
			'member': taigaModel?.id ?? null,
		},
		type: 'GET',
		dataType: 'json',
		headers: {
			'Authorization': `Bearer ${window.taigaToken}`,
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': apiUrl
		},
		success: function (projects) {
			let html = '<option value="">(Semua Project)</option>';
			if (Array.isArray(projects)) {
				projects.forEach(project => {
					html += `<option value="${project.id}">${project.name}</option>`;
				});
			} else {
				console.warn('taigaLoadProjects: projects is not an array', projects);
			}
			$(targetSelectId).html(html);
		},
		error: function (xhr) {
			console.error('Failed to load projects:', xhr);
		}
	});
}

function taigaGetStatusClass(status) {
	if (!status || typeof status !== 'string') return 'secondary';
	const statusString = String(status).toLowerCase().trim();
	switch (statusString) {
		case 'new': return 'new';
		case 'ready': return 'ready';
		case 'in progress': return 'in-progress';
		case 'done': return 'done';
		case 'archived': return 'archived';
		case 'blocked': return 'blocked';
		default: return 'secondary';
	}
}

function taigaGetIssueStatusClass(status) {
	if (!status || typeof status !== 'string') return 'secondary';
	const statusLower = status.toLowerCase();
	switch (statusLower) {
		case 'new': return 'info';
		case 'in progress': return 'warning';
		case 'ready for test': return 'primary';
		case 'closed': return 'success';
		case 'needs info': return 'secondary';
		case 'rejected': return 'danger';
		case 'postponed': return 'dark';
		default: return 'secondary';
	}
}

/**
 * Data Layer: Fetches status objects for a specific project and type.
 * @returns {Promise}
 */
function taigaFetchStatuses(apiUrl, token, projectId, type) {
	let endpoint = '';
	switch (type) {
		case 'epic': endpoint = '/epic-statuses'; break;
		case 'us': case 'userstory': endpoint = '/userstory-statuses'; break;
		case 'task': endpoint = '/task-statuses'; break;
		case 'issue': endpoint = '/issue-statuses'; break;
		default: return Promise.reject('Invalid status type');
	}

	window.taigaCache = window.taigaCache || {};
	window.taigaCache.statusByProjectType = window.taigaCache.statusByProjectType || {};
	window.taigaCache.statusFetchedAt = window.taigaCache.statusFetchedAt || {};

	const cacheKey = `${type}:${String(projectId)}`;
	const cached = window.taigaCache.statusByProjectType[cacheKey];
	const fetchedAt = window.taigaCache.statusFetchedAt[cacheKey];
	const ttlMs = 5 * 60 * 1000;

	if (cached && fetchedAt && (Date.now() - fetchedAt) < ttlMs) {
		return $.Deferred().resolve(cached).promise();
	}

	return $.ajax({
		url: `api.php${endpoint}`,
		data: { project: projectId },
		type: 'GET',
		dataType: 'json',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': apiUrl
		}
	}).done(function (statuses) {
		window.taigaCache.statusByProjectType[cacheKey] = statuses;
		window.taigaCache.statusFetchedAt[cacheKey] = Date.now();
	});
}

/**
 * Logic Layer: Extracts readable name and color from an item.
 * @param {object} item - The Taiga item (epic, us, task, issue)
 * @returns {object} { name, color }
 */
function taigaGetStatusInfo(item) {
	if (item.status_extra_info) {
		return {
			name: item.status_extra_info.name || 'Unknown',
			color: item.status_extra_info.color || '#666666'
		};
	}

	if (item.status_extra) {
		return {
			name: item.status_extra.name || 'Unknown',
			color: item.status_extra.color || '#666666'
		};
	}

	// Fallback if status_extra is missing
	return {
		name: item.status || 'Unknown',
		color: '#666666'
	};
}

/**
 * View Layer: Generates HTML for a status badge.
 * @param {object} statusInfo - { name, color }
 * @returns {string} HTML string
 */
function taigaRenderStatusBadge(statusInfo) {
	const color = /^#[0-9a-f]{6}$/i.test(statusInfo.color || '') ? statusInfo.color : '#666666';
	// Simple luminance check for text color
	const r = parseInt(color.slice(1, 3), 16);
	const g = parseInt(color.slice(3, 5), 16);
	const b = parseInt(color.slice(5, 7), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	const textColor = luminance > 0.5 ? '#000000' : '#ffffff';

	return `<span class="badge status-badge" style="background-color: ${color}; color: ${textColor}; border: 1px solid rgba(0,0,0,0.1);">${taigaEscapeHtml(statusInfo.name)}</span>`;
}

function taigaBaseUrlFromApi(apiUrl) {
	if (!apiUrl) return '';
	return String(apiUrl).replace(/\/api\/v\d+$/, '');
}

function taigaEscapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function taigaGetProjectSlug(projectId, apiUrl, token) {
	window.taigaCache = window.taigaCache || {};
	window.taigaCache.projectSlugById = window.taigaCache.projectSlugById || {};

	const pid = projectId ? String(projectId) : '';
	if (!pid) return $.Deferred().resolve(null).promise();

	const cached = window.taigaCache.projectSlugById[pid];
	if (cached) return $.Deferred().resolve(cached).promise();

	return $.ajax({
		url: 'api.php/projects/' + encodeURIComponent(pid),
		type: 'GET',
		headers: {
			'Authorization': 'Bearer ' + (token || window.taigaToken),
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': apiUrl || window.apiUrl
		}
	}).then(function (project) {
		const slug = project && project.slug ? String(project.slug) : null;
		if (slug) {
			window.taigaCache.projectSlugById[pid] = slug;
		}
		return slug;
	}, function () {
		return null;
	});
}

function taigaItemPermalink(type, item, apiUrl, options) {
	options = options || {};
	if (item && item.permalink) return item.permalink;
	const base = taigaBaseUrlFromApi(apiUrl || window.apiUrl);
	if (!base) return null;

	const projectSlug = options.projectSlug
		|| item?.project_extra?.slug
		|| item?.project_extra_info?.slug
		|| (item?.project && window.taigaCache?.projectSlugById ? window.taigaCache.projectSlugById[String(item.project)] : null)
		|| null;

	const ref = item ? (item.ref ?? item.ref_id ?? item.ref_number ?? item.id) : null;

	switch (String(type || '').toLowerCase()) {
		case 'project':
			return item && item.slug ? base + '/project/' + item.slug : null;
		case 'task':
			return (projectSlug && ref) ? base + '/project/' + projectSlug + '/task/' + encodeURIComponent(String(ref)) : null;
		case 'us':
		case 'usor':
		case 'userstory':
			return (projectSlug && ref) ? base + '/project/' + projectSlug + '/us/' + encodeURIComponent(String(ref)) : null;
		case 'issue':
		case 'isu':
			return (projectSlug && ref) ? base + '/project/' + projectSlug + '/issue/' + encodeURIComponent(String(ref)) : null;
		case 'epic':
		case 'epik':
			return (projectSlug && ref) ? base + '/project/' + projectSlug + '/epic/' + encodeURIComponent(String(ref)) : null;
		case 'sprint':
			return (projectSlug && item && item.slug) ? base + '/project/' + projectSlug + '/taskboard/' + item.slug : null;
		default:
			return null;
	}
}

function taigaRenderMarkdown(text) {
	const content = String(text || '').trim();
	if (!content) {
		return '<p class="text-muted"><em>(kosong)</em></p>';
	}
	try {
		if (window.commonmark) {
			const reader = new commonmark.Parser();
			const writer = new commonmark.HtmlRenderer({ safe: true });
			const parsed = reader.parse(content);
			return writer.render(parsed);
		}
	} catch (e) {}
	const escaped = content
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	return escaped.replace(/\n/g, '<br>');
}

function taigaRenderContent(text) {
	const raw = String(text || '').trim();
	if (!raw) return '<p class="text-muted"><em>(kosong)</em></p>';
	if (/<[a-zA-Z!\/][\s\S]*>/.test(raw)) {
		return raw;
	}
	return taigaRenderMarkdown(raw);
}

/**
 * View Layer: Updates select elements with status options.
 * @param {jQuery} $select - The jQuery select element
 * @param {Array} statuses - List of status objects
 */
function taigaPopulateStatusDropdown($select, statuses) {
	let html = '<option value="">(Semua Status)</option>';
	if (Array.isArray(statuses)) {
		statuses.forEach(status => {
			html += `<option value="${status.id}">${status.name}</option>`;
		});
	} else {
		console.warn('taigaPopulateStatusDropdown: statuses is not an array', statuses);
	}
	$select.html(html);
}

/**
 * Renders Bootstrap pagination dynamically based on Taiga API headers.
 * 
 * @param {XMLHttpRequest} xhr - The AJAX response object containing headers.
 * @param {string} containerSelector - jQuery selector for the pagination ul container.
 * @param {function} onPageChange - Callback function triggered when a page is clicked, receives (pageNumber).
 */
function taigaRenderPagination(xhr, containerSelector, onPageChange) {
	const isPaginated = xhr.getResponseHeader('X-Paginated');
	const $container = $(containerSelector);

	if (isPaginated !== 'true') {
		$container.empty();
		return;
	}

	const total = parseInt(xhr.getResponseHeader('X-Pagination-Count')) || 0;
	const byPage = parseInt(xhr.getResponseHeader('X-Paginated-By')) || 1;
	const current = parseInt(xhr.getResponseHeader('X-Pagination-Current')) || 1;
	const totalPages = Math.ceil(total / byPage);

	if (totalPages <= 1) {
		$container.empty();
		return;
	}

	let paginationHtml = '';

	function getPageItems(current, total) {
		if (total <= 7) {
			return Array.from({ length: total }, (_, i) => i + 1);
		}

		if (current <= 4) {
			return [1, 2, 3, 4, 5, '...', total];
		}

		if (current >= total - 3) {
			return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
		}

		return [1, '...', current - 1, current, current + 1, '...', total];
	}

	const pageItems = getPageItems(current, totalPages);

	pageItems.forEach(item => {
		if (item === '...') {
			paginationHtml += `
				<li class="page-item disabled">
					<span class="page-link">...</span>
				</li>
			`;
		} else {
			paginationHtml += `
				<li class="page-item ${item === current ? 'active' : ''}">
					<a class="page-link" href="#" data-page="${item}">${item}</a>
				</li>
			`;
		}
	});

	$container.html(paginationHtml);

	// Pagination click handler
	$container.find('.page-link').off('click').on('click', function (e) {
		e.preventDefault();
		const page = $(this).data('page');
		if (page && !$(this).parent().hasClass('active')) {
			if (typeof onPageChange === 'function') {
				onPageChange(page);
			}
			$('html, body').animate({ scrollTop: 0 }, 'slow');
		}
	});
}

/**
 * Reads the total matching rows from Taiga pagination headers.
 * Falls back to the visible item count for non-paginated or headerless responses.
 */
function taigaGetPaginationTotal(xhr, fallbackCount) {
	const fallback = Number.isFinite(Number(fallbackCount)) ? Number(fallbackCount) : 0;
	const rawTotal = xhr && typeof xhr.getResponseHeader === 'function'
		? xhr.getResponseHeader('X-Pagination-Count')
		: null;
	const total = parseInt(rawTotal, 10);

	return Number.isFinite(total) ? total : fallback;
}

var taigaBulkBarIds = { totalId: '', filteredId: '', selectionId: '' };

function taigaUpdateListCounts(xhr, visibleCount, totalId, filteredId, selectionId) {
	const shown = Number.isFinite(Number(visibleCount)) ? Number(visibleCount) : 0;
	const total = taigaGetPaginationTotal(xhr, shown);

	taigaBulkBarIds.totalId = totalId || taigaBulkBarIds.totalId;
	taigaBulkBarIds.filteredId = filteredId || taigaBulkBarIds.filteredId;
	taigaBulkBarIds.selectionId = selectionId || taigaBulkBarIds.selectionId;

	taigaUpdateSelectionUI(total, shown, 0, totalId, filteredId, selectionId);
}

function taigaBulkSelectionCallback(checkedCount) {
	const total = parseInt($('#' + taigaBulkBarIds.totalId).text()) || 0;
	const filtered = parseInt($('#' + taigaBulkBarIds.filteredId).text()) || 0;
	taigaUpdateSelectionUI(total, filtered, checkedCount, taigaBulkBarIds.totalId, taigaBulkBarIds.filteredId, taigaBulkBarIds.selectionId);
	// Fallback: also update generic selected count if specific ID not found
	if (!taigaBulkBarIds.selectionId || !$('#' + taigaBulkBarIds.selectionId).length) {
		$('#selectedCount').text(checkedCount);
	}
}

/**
 * Collects filter values from the standard header IDs and returns a params object.
 * @returns {Object} Params for Taiga API calls.
 */
function taigaGetFilterParams() {
	const params = {};
	const q = $('#searchInput').val()?.trim();
	const project = $('#projectSelect').val();
	const status = $('#statusSelect').val();
	const epic = $('#epicSelect').val();
	const usor = $('#userStorySelect').val();
	const assignedTo = $('#assignedToSelect').val();
	const orderBy = $('#sortSelect').val();

	if (q) params.q = q;
	if (project) params.project = project;
	if (status) params.status = status;
	if (epic) params.epic = epic;
	if (usor) params.user_story = usor;
	if (assignedTo) params.assigned_to = assignedTo;
	if (orderBy) params.order_by = orderBy;

	return params;
}

/**
 * Initializes a Select2 instance with remote data and infinite scrolling.
 */
function taigaInitRemoteSelect2(selector, endpoint, options = {}) {
	const $el = $(selector);
	if (!$el.length) return;

	if ($el.data('select2')) {
		$el.select2('destroy');
	}

	$el.select2({
		theme: 'bootstrap-5',
		ajax: {
			url: function () {
				return 'api.php' + endpoint;
			},
			dataType: 'json',
			delay: 250,
			headers: {
				'Authorization': `Bearer ${window.taigaToken}`,
				'Content-Type': 'application/json',
				'X-Taiga-Api-Url': window.apiUrl
			},
			data: function (params) {
				let query = {
					q: params.term,
					page: params.page || 1,
					page_size: 10
				};
				if (typeof options.additionalParams === 'function') {
					query = { ...query, ...options.additionalParams() };
				}
				return query;
			},
			processResults: function (data, params) {
				params.page = params.page || 1;
				return {
					results: data.map(item => ({
						id: item.id,
						text: options.formatText ? options.formatText(item) : (item.name || item.subject || item.full_name)
					})),
					pagination: {
						more: data.length === 10
					}
				};
			},
			cache: true
		},
		placeholder: options.placeholder || 'Select an option',
		allowClear: true,
		width: '100%',
		dropdownParent: options.dropdownParent || (() => { const m = $el.closest('.modal'); return m.length && m.attr('id') ? $('#' + m.attr('id')) : $(document.body); })()
	});
}

function taigaInitStaticSelect2($el, options = {}) {
	if (!$el || !$el.length) return;

	if ($el.data('select2')) {
		$el.select2('destroy');
	}

	$el.select2({
		theme: 'bootstrap-5',
		placeholder: options.placeholder || 'Select an option',
		allowClear: true,
		width: '100%',
		dropdownParent: options.dropdownParent || (() => { const m = $el.closest('.modal'); return m.length && m.attr('id') ? $('#' + m.attr('id')) : $(document.body); })()
	});
}

function taigaEnhanceFormSelects(context) {
	if (!window.jQuery || !$.fn.select2) return;

	const $context = context ? $(context) : $(document);
	$context.find('select.form-select').each(function () {
		const $select = $(this);
		if ($select.data('select2')) return;
		if ($select.closest('.filter-toolbar').length) return;
		if ($select.is('[data-no-select2]')) return;

		const $modal = $select.closest('.modal');
		const emptyOptionText = $select.find('option[value=""]').first().text();
		const placeholder = $select.attr('placeholder') || emptyOptionText || 'Select an option';

		$select.select2({
			theme: 'bootstrap-5',
			width: '100%',
			placeholder: placeholder,
			allowClear: !$select.prop('required'),
			dropdownParent: $modal.length && $modal.attr('id') ? $('#' + $modal.attr('id')) : $(document.body)
		});
	});
}

if (window.jQuery) {
	$(function () {
		taigaEnhanceFormSelects(document);
	});

	$(document).on('shown.bs.modal', '.modal', function () {
		taigaEnhanceFormSelects(this);
	});
}

/**
 * Binds standardized event listeners and initializes Select2 filters.
 * @param {Function} onFilterChange Callback function to trigger on filter update.
 */
function taigaBindFilters(onFilterChange) {
	let searchTimeout;

	// Search input with debounce
	$('#searchInput').on('input', function () {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => onFilterChange(1), 500);
	});

	// Initialize Select2 Dropdowns
	if ($('#projectSelect').length) {
		taigaInitRemoteSelect2('#projectSelect', '/projects', {
			placeholder: '(Semua Project)',
			additionalParams: () => ({ member: taigaModel.id })
		});
	}

	if ($('#epicSelect').length) {
		taigaInitRemoteSelect2('#epicSelect', '/epics', {
			placeholder: '(Semua Epik)',
			additionalParams: () => {
				const pid = $('#projectSelect').val();
				return pid ? { project: pid } : {};
			}
		});
	}

	if ($('#userStorySelect').length) {
		taigaInitRemoteSelect2('#userStorySelect', '/userstories', {
			placeholder: '(Semua Usor)',
			formatText: (item) => `#${item.ref}: ${item.subject}`,
			additionalParams: () => {
				const pid = $('#projectSelect').val();
				return pid ? { project: pid } : {};
			}
		});
	}

	if ($('#assignedToSelect').length) {
		taigaInitStaticSelect2($('#assignedToSelect'), {
			placeholder: '(Semua User)'
		});

		const refreshAssignedToFilter = function () {
			const pid = $('#projectSelect').val();
			const $assigned = $('#assignedToSelect');
			const $aModal = $assigned.closest('.modal');
			const dropdownParent = $aModal.length && $aModal.attr('id') ? $('#' + $aModal.attr('id')) : $(document.body);

			$assigned.val(null);
			$assigned.prop('disabled', true);
			$assigned.html('<option value="">Loading...</option>');
			taigaInitStaticSelect2($assigned, {
				placeholder: '(Semua User)',
				dropdownParent: dropdownParent
			});

			const populate = function (users) {
				let html = '<option value="">(Semua User)</option>';
				if (Array.isArray(users)) {
					users.forEach(u => {
						const name = u.full_name || u.user_email || u.username || 'Unknown';
						html += `<option value="${u.id ?? u.user}">${name}</option>`;
					});
				}
				$assigned.html(html);
				$assigned.prop('disabled', false);
				taigaInitStaticSelect2($assigned, {
					placeholder: '(Semua User)',
					dropdownParent: dropdownParent
				});
			};

			const source = pid
				? taigaFetchMembers(window.apiUrl, window.taigaToken, pid)
				: TTTaiga.API.get('api.php/users');

			source
				.done(populate)
				.fail(function () {
					$assigned.html('<option value="">Error loading users</option>');
					$assigned.prop('disabled', true);
					taigaInitStaticSelect2($assigned, {
						placeholder: 'Error loading users',
						dropdownParent: dropdownParent
					});
				});
		};

		refreshAssignedToFilter();

		$('#projectSelect').off('change.assignedFilter').on('change.assignedFilter', function () {
			refreshAssignedToFilter();
		});
	}

	if ($('#statusSelect').length) {
		taigaInitStaticSelect2($('#statusSelect'), {
			placeholder: '(Pilih Project dulu)'
		});

		const refreshStatusFilter = function () {
			const pid = $('#projectSelect').val();
			const $status = $('#statusSelect');
			const type = $status.data('status-type');
			const $sModal = $status.closest('.modal');
			const dropdownParent = $sModal.length && $sModal.attr('id') ? $('#' + $sModal.attr('id')) : $(document.body);

			$status.val(null);

			if (!pid) {
				$status.prop('disabled', true);
				$status.html('<option value="">(Pilih Project dulu)</option>');
				taigaInitStaticSelect2($status, {
					placeholder: '(Pilih Project dulu)',
					dropdownParent: dropdownParent
				});
				return;
			}

			if (!type) {
				$status.prop('disabled', true);
				$status.html('<option value="">Status type missing</option>');
				taigaInitStaticSelect2($status, {
					placeholder: 'Status type missing',
					dropdownParent: dropdownParent
				});
				return;
			}

			$status.prop('disabled', true);
			$status.html('<option value="">Loading...</option>');
			taigaInitStaticSelect2($status, {
				placeholder: '(Semua Status)',
				dropdownParent: dropdownParent
			});

			taigaFetchStatuses(window.apiUrl, window.taigaToken, pid, type)
				.done(function (statuses) {
					taigaPopulateStatusDropdown($status, statuses);
					$status.prop('disabled', false);
					taigaInitStaticSelect2($status, {
						placeholder: '(Semua Status)',
						dropdownParent: dropdownParent
					});
				})
				.fail(function () {
					$status.html('<option value="">Error loading statuses</option>');
					$status.prop('disabled', true);
					taigaInitStaticSelect2($status, {
						placeholder: 'Error loading statuses',
						dropdownParent: dropdownParent
					});
				});
		};

		refreshStatusFilter();
		$('#projectSelect').off('change.statusFilter').on('change.statusFilter', function () {
			refreshStatusFilter();
		});
	}

	$('#sortSelect').select2({
		theme: 'bootstrap-5',
		width: '100%',
		placeholder: 'Urutkan...',
		allowClear: true
	});

	// Dropdown and Select2 changes
	const $selectors = $('#projectSelect, #statusSelect, #epicSelect, #userStorySelect, #assignedToSelect, #sortSelect');
	$selectors.on('change', function () {
        if (window.TTTaiga && window.TTTaiga.isInitializing) return;
        
		// When project changes, clear dependent Select2 dropdowns
		if ($(this).attr('id') === 'projectSelect') {
			$('#epicSelect, #userStorySelect').val(null).trigger('change.select2');
			$('#statusSelect').val(null).trigger('change.select2');
			$('#assignedToSelect').val(null).trigger('change.select2');
		}

        // Update Global State with normalized filter keys
        if (window.TTTaiga && window.TTTaiga.Filter) {
            TTTaiga.Filter.syncState();
        }
        
		onFilterChange(1);
	});

	// Refresh button
	$('#refreshBtn').on('click', function () {
		onFilterChange(1);
	});
}

/**
 * Loads items for bulk operations (update/delete) based on current filters.
 * @param {string} endpoint - API endpoint (e.g., '/epics')
 * @param {jQuery} $container - Container to hold the checkboxes or select options
 * @param {Function} formatItemCallback - Function to format how each item appears
 */
function taigaLoadBulkItems(endpoint, $container, formatItemCallback) {
	const params = {
		...taigaGetFilterParams(),
		page_size: 100 // Load more for bulk operations
	};

	$container.html('<div class="text-center p-3"><div class="spinner-border spinner-border-sm" role="status"></div> Loading...</div>');

	$.ajax({
		url: 'api.php' + endpoint,
		type: 'GET',
		data: params,
		headers: {
			'Authorization': `Bearer ${window.taigaToken}`,
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': window.apiUrl
		},
		success: function (items) {
			if (items.length === 0) {
				$container.html('<div class="alert alert-info p-2 mb-0">No items found matching current filters.</div>');
				return;
			}
			let html = '';
			items.forEach(item => {
				html += formatItemCallback(item);
			});
			$container.html(html);
		},
		error: function (xhr) {
			console.error(`Failed to load bulk items from ${endpoint}:`, xhr);
			$container.html('<div class="alert alert-danger p-2 mb-0">Failed to load items.</div>');
		}
	});
}

/**
 * Executes bulk operations (PATCH or DELETE) sequentially.
 * @param {string} endpoint - Base API endpoint (e.g., '/epics/')
 * @param {Array} ids - List of item IDs to process
 * @param {string} method - 'PATCH' or 'DELETE'
 * @param {Object} data - Data to send for PATCH (optional)
 * @param {Function} onComplete - Callback when all requests finished (successCount, errorCount)
 */
function taigaExecuteBulk(endpoint, items, method, data, onComplete, opts = {}) {
	let doneCount = 0;
	let successCount = 0;
	let errorCount = 0;

	if (items.length === 0) {
		if (typeof onComplete === 'function') onComplete(0, 0);
		return;
	}

	if (opts.showProgress) {
		const $progress = $(opts.progressContainer || '#bulkProgressContainer');
		if ($progress.length) {
			const total = items.length;
			$progress.html(`
				<div class="progress mt-2" style="height: 20px;">
					<div class="progress-bar progress-bar-striped progress-bar-animated" id="bulkProgressBar" role="progressbar" style="width: 0%">0/${total}</div>
				</div>
			`);
		}
	}

	items.forEach(item => {
		const id = typeof item === 'object' ? item.id : item;
		const version = typeof item === 'object' ? item.version : null;

		let requestData = typeof data === 'function' ? data(item) : data;
		if (method === 'PATCH' && version !== null) {
			requestData = { ...requestData, version: version };
		}

		const endpointUrl = method === 'POST' ? 'api.php' + endpoint.replace(/\/$/, '') : 'api.php' + endpoint + id;

		$.ajax({
			url: endpointUrl,
			type: method,
			headers: {
				'Authorization': `Bearer ${window.taigaToken}`,
				'Content-Type': 'application/json',
				'X-Taiga-Api-Url': window.apiUrl
			},
			data: requestData ? JSON.stringify(requestData) : undefined,
			success: function () { successCount++; },
			error: function (xhr) { console.error(`Bulk operation failed for ${endpoint}${id}:`, xhr.responseJSON); errorCount++; },
			complete: function () {
				doneCount++;
				if (opts.showProgress) {
					const pct = Math.round((doneCount / items.length) * 100);
					$('#bulkProgressBar').css('width', pct + '%').text(`${doneCount}/${items.length}`);
				}
				if (doneCount === items.length) {
					if (typeof onComplete === 'function') onComplete(successCount, errorCount);
				}
			}
		});
	});
}

// Old taigaLoad* functions removed as they are replaced by dynamic Select2 loading for filters.

/**
 * Fetches and populates a status dropdown for bulk operations, avoiding hardcoded values.
 * @param {string} type - 'epic', 'us', 'task', 'issue'
 * @param {jQuery} $select - Select element to populate
 * @param {number} projectId - ID of the project to fetch statuses for
 * @param {string} defaultText - Text for the default option (e.g. 'Select Status' or 'No Change')
 */
function taigaPopulateBulkStatuses(type, $select, projectId, defaultText = 'Select Status', selectedValue = null) {
	if (!projectId) {
		$select.html(`<option value="">${defaultText} (Select Project first)</option>`);
		return;
	}

	taigaFetchStatuses(window.apiUrl, window.taigaToken, projectId, type)
		.done(function (statuses) {
			let html = `<option value="">${defaultText}</option>`;
			if (Array.isArray(statuses)) {
				statuses.forEach(status => {
					html += `<option value="${status.id}">${status.name}</option>`;
				});
			} else {
				console.warn('taigaPopulateBulkStatuses: statuses is not an array', statuses);
			}
			if ($select.data('select2')) {
				$select.select2('destroy');
			}
			$select.html(html);

			if (selectedValue) {
				$select.val(String(selectedValue));
			}

			// Initialize Select2
			setTimeout(function() {
				const $modal = $select.closest('.modal');
				$select.select2({
					theme: 'bootstrap-5',
					width: '100%',
					placeholder: defaultText,
					allowClear: true,
					dropdownParent: $modal.length && $modal.attr('id') ? $('#' + $modal.attr('id')) : $(document.body)
				});
			}, 0);
		})
		.fail(function (xhr) {
			console.error(`Failed to fetch statuses for ${type} in project ${projectId}:`, xhr);
			$select.html(`<option value="">Error loading statuses</option>`);
		});
}

/**
 * Data Layer: Fetches project members (memberships).
 */
function taigaFetchMembers(apiUrl, token, projectId) {
	window.taigaCache = window.taigaCache || {};
	window.taigaCache.memberByProject = window.taigaCache.memberByProject || {};
	window.taigaCache.memberFetchedAt = window.taigaCache.memberFetchedAt || {};

	const cacheKey = String(projectId);
	const cached = window.taigaCache.memberByProject[cacheKey];
	const fetchedAt = window.taigaCache.memberFetchedAt[cacheKey];
	const ttlMs = 5 * 60 * 1000;

	if (cached && fetchedAt && (Date.now() - fetchedAt) < ttlMs) {
		return $.Deferred().resolve(cached).promise();
	}

	return $.ajax({
		url: `api.php/memberships`,
		data: { project: projectId },
		type: 'GET',
		dataType: 'json',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': apiUrl
		}
	}).done(function (memberships) {
		window.taigaCache.memberByProject[cacheKey] = memberships;
		window.taigaCache.memberFetchedAt[cacheKey] = Date.now();
	});
}

function taigaParseBulkLines(text) {
	return String(text || '')
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean)
		.map(line => {
			const parts = line.split('|');
			return {
				subject: (parts[0] || '').trim(),
				name: (parts[0] || '').trim(),
				description: (parts[1] || '').trim()
			};
		})
		.filter(item => item.subject || item.name);
}

function taigaRenderBulkPreview($target, items, labelKey) {
	labelKey = labelKey || 'subject';
	if (!$target || !$target.length) return;
	if (!items.length) {
		$target.addClass('d-none').empty();
		return;
	}

	const list = $('<ol class="mb-0"></ol>');
	items.forEach(item => {
		const text = item[labelKey] || item.subject || item.name || '';
const li = $('<li></li>').text(text);
		if (item.description) {
			li.append($('<div class="text-muted small"></div>').html(taigaRenderContent(item.description)));
		}
		list.append(li);
	});
	$target.empty().append(list).removeClass('d-none');
}

function taigaPopulateProjectSelect($select, selectedProjectId, selectedLabel) {
	if (!$select || !$select.length) return $.Deferred().resolve([]).promise();
	if ($select.data('select2')) {
		$select.select2('destroy');
	}
	$select.prop('disabled', true).empty().append($('<option>', { value: '', text: 'Loading projects...' }));

	return $.ajax({
		url: 'api.php/projects',
		type: 'GET',
		dataType: 'json',
		headers: {
			'Authorization': `Bearer ${window.taigaToken}`,
			'Content-Type': 'application/json',
			'X-Taiga-Api-Url': window.apiUrl
		}
	}).done(function (projects) {
		$select.empty().append($('<option>', { value: '', text: 'Select Project' }));
		if (Array.isArray(projects)) {
			projects.forEach(project => {
				$select.append($('<option>', {
					value: project.id,
					text: project.name || ('Project ' + project.id)
				}));
			});
		}
		if (selectedProjectId) {
			const val = String(selectedProjectId);
			if ($select.find('option[value="' + val + '"]').length) {
				$select.val(val);
			} else {
				$select.append(new Option(selectedLabel || val, val, true, true));
			}
		}
		$select.prop('disabled', false).trigger('change');
	}).fail(function () {
		$select.empty().append($('<option>', { value: '', text: 'Error loading projects' })).prop('disabled', true);
	});
}

var taigaBulkExecuting = false;

function taigaExecuteBulkParallel(endpoint, items, method, data, onComplete, opts = {}) {
	if (taigaBulkExecuting) {
		console.warn('Bulk operation already in progress');
		return;
	}
	taigaBulkExecuting = true;

	const batchSize = opts.batchSize || 10;
	const showProgress = opts.showProgress !== false;
	const progressContainer = opts.progressContainer || '#bulkProgressContainer';
	let successCount = 0;
	let errorCount = 0;
	let doneCount = 0;
	const total = items.length;

	const cleanup = function() {
		taigaBulkExecuting = false;
	};

	if (total === 0) {
		cleanup();
		if (typeof onComplete === 'function') onComplete(0, 0);
		return;
	}

	if (showProgress) {
		const $progress = $(progressContainer);
		if ($progress.length) {
			$progress.html(`
				<div class="progress mt-2" style="height: 20px;">
					<div class="progress-bar progress-bar-striped progress-bar-animated" id="bulkProgressBar" role="progressbar" style="width: 0%">0/${total}</div>
				</div>
			`);
		}
	}

	const processBatch = function(start) {
		const end = Math.min(start + batchSize, total);
		const batch = items.slice(start, end);
		const promises = batch.map(item => {
			const id = typeof item === 'object' ? item.id : item;
			const version = typeof item === 'object' ? item.version : null;
			let requestData = typeof data === 'function' ? data(item) : data;
			if (method === 'PATCH' && version !== null) {
				requestData = { ...requestData, version: version };
			}
			const endpointUrl = method === 'POST' ? 'api.php' + endpoint.replace(/\/$/, '') : 'api.php' + endpoint + id;
			return $.ajax({
				url: endpointUrl,
				type: method,
				headers: {
					'Authorization': `Bearer ${window.taigaToken}`,
					'Content-Type': 'application/json',
					'X-Taiga-Api-Url': window.apiUrl
				},
				data: requestData ? JSON.stringify(requestData) : undefined
			}).then(function() {
				successCount++;
			}).fail(function(xhr) {
				console.error(`Bulk operation failed for ${endpoint}${id}:`, xhr.responseJSON);
				errorCount++;
			}).always(function() {
				doneCount++;
				if (showProgress) {
					const pct = Math.round((doneCount / total) * 100);
					$('#bulkProgressBar').css('width', pct + '%').text(`${doneCount}/${total}`);
				}
			});
		});

		$.when.apply($, promises).always(function() {
			if (end < total) {
				// Use setTimeout to avoid deep recursion
				setTimeout(function() { processBatch(end); }, 0);
			} else {
				cleanup();
				if (typeof onComplete === 'function') onComplete(successCount, errorCount);
			}
		});
	};

	processBatch(0);
}

function taigaExecuteBulkCreate(endpoint, items, dataFactory, onComplete) {
	let doneCount = 0;
	let successCount = 0;
	let errorCount = 0;

	if (!items.length) {
		if (typeof onComplete === 'function') onComplete(0, 0);
		return;
	}

	items.forEach(item => {
		$.ajax({
			url: 'api.php' + endpoint,
			type: 'POST',
			headers: {
				'Authorization': `Bearer ${window.taigaToken}`,
				'Content-Type': 'application/json',
				'X-Taiga-Api-Url': window.apiUrl
			},
			data: JSON.stringify(dataFactory(item))
		}).done(function () {
			successCount++;
		}).fail(function (xhr) {
			console.error(`Bulk create failed for ${endpoint}:`, xhr.responseJSON || xhr.responseText);
			errorCount++;
		}).always(function () {
			doneCount++;
			if (doneCount === items.length && typeof onComplete === 'function') {
				onComplete(successCount, errorCount);
			}
		});
	});
}

/**
 * Logic-View Layer: Populates a member dropdown for bulk operations with Select2.
 * @param {jQuery} $select - Select element to populate
 * @param {number} projectId - ID of the project to fetch members for
 * @param {string} defaultText - Text for the default option
 */
function taigaPopulateBulkMembers($select, projectId, defaultText = 'Assign to...', selectedValue = null) {
	if (!projectId) {
		$select.html(`<option value="">${defaultText} (Select Project first)</option>`);
		return;
	}

	taigaFetchMembers(window.apiUrl, window.taigaToken, projectId)
		.done(function (memberships) {
			let html = `<option value="">${defaultText}</option>`;
			if (Array.isArray(memberships)) {
				memberships.forEach(m => {
					const name = m.full_name || m.user_email || 'Unknown';
					html += `<option value="${m.user}">${name}</option>`;
				});
			} else {
				console.warn('taigaPopulateBulkMembers: memberships is not an array', memberships);
			}
			if ($select.data('select2')) {
				$select.select2('destroy');
			}
			$select.html(html);

			if (selectedValue) {
				$select.val(String(selectedValue));
			}

			// Initialize Select2
			const $modal = $select.closest('.modal');
			$select.select2({
				theme: 'bootstrap-5',
				width: '100%',
				placeholder: defaultText,
				allowClear: true,
				dropdownParent: $modal.length && $modal.attr('id') ? $('#' + $modal.attr('id')) : $(document.body)
			});
		})
		.fail(function (xhr) {
			console.error(`Failed to fetch members for project ${projectId}:`, xhr);
			$select.html(`<option value="">Error loading members</option>`);
		});
}

/**
 * Updates the selection bar visibility and counts.
 * @param {number} total
 * @param {number} filtered
 * @param {number} selected
 * @param {string} totalId - The base DOM id for total count (e.g. 'totalProjects')
 * @param {string} filteredId - The base DOM id for filtered count (e.g. 'filteredProjects')
 * @param {string} selectionId - The DOM id for selected count (e.g. 'selectedProjectsCount')
 */
var taigaUpdateLock = false;

function taigaUpdateSelectionUI(total, filtered, selected, totalId, filteredId, selectionId) {
	if (taigaUpdateLock) return;
	taigaUpdateLock = true;
	try {
		selectionId = selectionId || 'selectedCount';

		if (totalId) {
			$('#' + totalId + '_simple').text(total);
			$('#' + totalId).text(total);
		}
		if (filteredId) {
			$('#' + filteredId + '_simple').text(filtered);
			$('#' + filteredId).text(filtered);
		}
		if (selectionId) {
			$('#' + selectionId).text(selected);
		}

		var $bulkBar = $('#bulkActionsBar');
		if ($bulkBar.length) {
			$bulkBar.toggleClass('has-selection', selected > 0);
		}

		$('#clearSelectionBtn').prop('disabled', selected === 0);
		// Bulk Actions dropdown tetap enabled agar Bulk Create selalu accessible
		if (typeof taigaUpdateBulkActionAvailability === 'function') {
			taigaUpdateBulkActionAvailability(selected);
		}

		if (selected === 0) {
			$('#masterCheckbox').prop('checked', false);
		}
	} finally {
		taigaUpdateLock = false;
	}
}

function taigaBulkActionRequiresSelection($item) {
	if ($item.data('bulk-requires-selection') !== undefined) {
		return String($item.data('bulk-requires-selection')) !== 'false';
	}

	const text = String($item.text() || '').toLowerCase();
	return !text.includes('bulk create') && !text.includes('create ');
}

function taigaUpdateBulkActionAvailability(selected) {
	const hasSelection = selected > 0;
	// Find dropdown items in common containers
	const $items = $('#bulkActionsDropdownContainer .tttaiga-bulk-action, #bulkActionsDropdown .tttaiga-bulk-action, .bulk-actions-dropdown .tttaiga-bulk-action, [data-bulk-actions] .tttaiga-bulk-action');
	// Also find the dropdown toggle button

	$items.each(function () {
		const $item = $(this);
		// Skip theme toggle items (light/dark/auto) — must never be disabled
		if ($item.attr('data-bs-theme-value')) {
			return;
		}
		// Skip items that don't require selection (like create)
		if (!taigaBulkActionRequiresSelection($item)) {
			$item.removeClass('disabled').attr('aria-disabled', 'false');
			if ($item.data('bulk-toggle')) {
				$item.attr('data-bs-toggle', $item.data('bulk-toggle'));
			}
			if ($item.data('bulk-target')) {
				$item.attr('data-bs-target', $item.data('bulk-target'));
			}
			return;
		}

		$item.toggleClass('disabled', !hasSelection);
		$item.attr('aria-disabled', hasSelection ? 'false' : 'true');
		if (!$item.data('bulk-toggle') && $item.attr('data-bs-toggle')) {
			$item.data('bulk-toggle', $item.attr('data-bs-toggle'));
		}
		if (!$item.data('bulk-target') && $item.attr('data-bs-target')) {
			$item.data('bulk-target', $item.attr('data-bs-target'));
		}
		if (hasSelection) {
			if ($item.data('bulk-toggle')) {
				$item.attr('data-bs-toggle', $item.data('bulk-toggle'));
			}
			if ($item.data('bulk-target')) {
				$item.attr('data-bs-target', $item.data('bulk-target'));
			}
		} else {
			$item.removeAttr('data-bs-toggle');
			$item.removeAttr('data-bs-target');
		}
	});
}

/**
 * Binds master checkboxes and individual item selection logic.
 * @param {string} itemCheckboxClass - CSS class of individual checkboxes
 * @param {Function} onSelectionChange - Callback receives (checkedCount)
 */
function taigaBindSelectionLogic(itemCheckboxClass, onSelectionChange, type) {
	if (!type) {
		if (itemCheckboxClass.includes('task')) type = 'tasks';
		else if (itemCheckboxClass.includes('story')) type = 'usors';
		else if (itemCheckboxClass.includes('epic')) type = 'epics';
		else if (itemCheckboxClass.includes('issue')) type = 'issues';
		else if (itemCheckboxClass.includes('sprint')) type = 'sprints';
		else if (itemCheckboxClass.includes('project')) type = 'projects';
		else type = 'items';
	}

	taigaUpdateBulkActionAvailability(0);

	$(document).off('click.bulkAvailability', '#bulkActionsDropdownContainer .tttaiga-bulk-action.disabled').on('click.bulkAvailability', '#bulkActionsDropdownContainer .tttaiga-bulk-action.disabled', function (e) {
		e.preventDefault();
		e.stopPropagation();
		return false;
	});

	var taigaMasterLock = false;

	$(document).off('change', '#masterCheckbox').on('change', '#masterCheckbox', function () {
		if (taigaMasterLock) return;
		taigaMasterLock = true;
		try {
			var isChecked = $(this).is(':checked');
			$('#masterCheckbox').prop('checked', isChecked);
			$('.' + itemCheckboxClass).prop('checked', isChecked).trigger('change.selection');
			var totalCount = $('.' + itemCheckboxClass).length;
			var checkedCount = isChecked ? totalCount : 0;
			// Update global state for all checkboxes on the page
			$('.' + itemCheckboxClass).each(function() {
				var $cb = $(this);
				var id = $cb.val();
				var version = $cb.data('version');
				var subject = $cb.data('subject') || 'Untitled';
				var ref = $cb.data('ref') || '';
				var item = { id: id, version: version, subject: subject, ref: ref };
				if (!TTTaiga.selectedItems[type]) {
					TTTaiga.selectedItems[type] = [];
				}
				if (isChecked) {
					if (!TTTaiga.selectedItems[type].some(i => i.id == id)) {
						TTTaiga.selectedItems[type].push(item);
					}
				} else {
					TTTaiga.selectedItems[type] = TTTaiga.selectedItems[type].filter(i => i.id != id);
				}
			});
			// Directly update UI counts
			taigaUpdateSelectionUI(
				parseInt($('#' + taigaBulkBarIds.totalId).text()) || 0,
				totalCount,
				checkedCount,
				taigaBulkBarIds.totalId,
				taigaBulkBarIds.filteredId,
				taigaBulkBarIds.selectionId
			);
			if (typeof onSelectionChange === 'function') {
				onSelectionChange(checkedCount);
			}
		} finally {
			taigaMasterLock = false;
		}
	});

	$(document).off('change.selection', '.' + itemCheckboxClass).on('change.selection', '.' + itemCheckboxClass, function () {
		var $cb = $(this);
		var id = $cb.val();
		var version = $cb.data('version');
		var subject = $cb.data('subject') || 'Untitled';
		var ref = $cb.data('ref') || '';
		var item = { id: id, version: version, subject: subject, ref: ref };

		if (!TTTaiga.selectedItems[type]) {
			TTTaiga.selectedItems[type] = [];
		}
		if (!TTTaiga.selectedItems[type]) {
			TTTaiga.selectedItems[type] = [];
		}
		if ($cb.is(':checked')) {
			if (!TTTaiga.selectedItems[type].some(i => i.id == id)) {
				TTTaiga.selectedItems[type].push(item);
			}
		} else {
			TTTaiga.selectedItems[type] = TTTaiga.selectedItems[type].filter(i => i.id != id);
		}

		$cb.closest('.card').toggleClass('taiga-selected', $cb.is(':checked'));
		var totalCount = $('.' + itemCheckboxClass).length;
		var checkedCount = $('.' + itemCheckboxClass + ':checked').length;
		var allChecked = totalCount > 0 && checkedCount === totalCount;
		if ($('#masterCheckbox').prop('checked') !== allChecked) {
			$('#masterCheckbox').prop('checked', allChecked);
		}
		// Directly update UI counts
		taigaUpdateSelectionUI(
			parseInt($('#' + taigaBulkBarIds.totalId).text()) || 0,
			totalCount,
			checkedCount,
			taigaBulkBarIds.totalId,
			taigaBulkBarIds.filteredId,
			taigaBulkBarIds.selectionId
		);
		if (typeof onSelectionChange === 'function') {
			onSelectionChange(checkedCount);
		}
	});

	$('#clearSelectionBtn').off('click').on('click', function () {
		$('#masterCheckbox').prop('checked', false);
		$('.' + itemCheckboxClass).prop('checked', false).trigger('change.selection');
		if (typeof onSelectionChange === 'function') {
			onSelectionChange(0);
		}
		TTTaiga.selectedItems[type] = [];
	});
}

function taigaReplaceUrlQuery(params) {
	params = params || {};
	const url = new URL(window.location.href);
	const search = new URLSearchParams();

	Object.keys(params).forEach(key => {
		const value = params[key];
		if (value === undefined || value === null) return;
		if (String(value).trim() === '') return;
		search.set(key, String(value));
	});

	const query = search.toString();
	url.search = query ? `?${query}` : '';
	window.history.replaceState(null, '', url.toString());

	if (typeof window.tttaigaPersistSharedFilters === 'function') {
		window.tttaigaPersistSharedFilters(search);
	}
}

function taigaGetUrlQueryParams() {
	const urlParams = new URLSearchParams(window.location.search);
	const params = {};
	urlParams.forEach((value, key) => {
		params[key] = value;
	});
	return params;
}

function taigaApplyFiltersFromUrl() {
    window.TTTaiga = window.TTTaiga || {};
    window.TTTaiga.isInitializing = true;
    
    if (typeof window.tttaigaEnsureSharedFiltersInUrl === 'function') {
        window.tttaigaEnsureSharedFiltersInUrl();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const page = parseInt(urlParams.get('page') || '1') || 1;
    const q = urlParams.get('q');
    const orderBy = urlParams.get('order_by');
    const projectIdParam = urlParams.get('project');
    const epicIdParam = urlParams.get('epic');
    const userStoryIdParam = urlParams.get('user_story');
    const statusIdParam = urlParams.get('status');
    const assignedToParam = urlParams.get('assigned_to');

    const apiGet = function (url, data) {
        return $.ajax({
            url: url,
            type: 'GET',
            data: data,
            headers: {
                'Authorization': 'Bearer ' + window.taigaToken,
                'Content-Type': 'application/json',
                'X-Taiga-Api-Url': window.apiUrl
            }
        });
    };

    const setSelectValue = function (selector, id, label) {
        if (!id) return;
        const $select = $(selector);
        if (!$select.length) return;
        const option = new Option(label || id, id, true, true);
        $select.append(option).trigger('change');
    };

    const applyProject = function (projectId) {
        if (!projectId) return $.Deferred().resolve().promise();
        if (!$('#projectSelect').length) return $.Deferred().resolve().promise();
        return apiGet('api.php/projects/' + encodeURIComponent(projectId)).then(function (project) {
            setSelectValue('#projectSelect', String(project.id), project.name || ('Project ' + project.id));
        }, function () {
            setSelectValue('#projectSelect', String(projectId), 'Project ' + projectId);
        });
    };

    const applyEpic = function (epicId) {
        if (!epicId) return $.Deferred().resolve(null).promise();
        if (!$('#epicSelect').length) return $.Deferred().resolve(null).promise();
        return apiGet('api.php/epics/' + encodeURIComponent(epicId)).then(function (epic) {
            setSelectValue('#epicSelect', String(epic.id), `#${epic.ref}: ${epic.subject || 'Untitled Epik'}`);
            return epic;
        }, function () {
            setSelectValue('#epicSelect', String(epicId), 'Epik ' + epicId);
            return null;
        });
    };

    const applyUserStory = function (usorId) {
        if (!usorId) return $.Deferred().resolve(null).promise();
        if (!$('#userStorySelect').length) return $.Deferred().resolve(null).promise();
        return apiGet('api.php/userstories/' + encodeURIComponent(usorId)).then(function (usor) {
            setSelectValue('#userStorySelect', String(usor.id), `#${usor.ref}: ${usor.subject || 'Untitled Usor'}`);
            return usor;
        }, function () {
            setSelectValue('#userStorySelect', String(usorId), 'Usor ' + usorId);
            return null;
        });
    };

    const applyStatusAndAssigned = function (projectId) {
        const jobs = [];

        if (statusIdParam && $('#statusSelect').length && projectId && $('#statusSelect').data('status-type')) {
            jobs.push(
                taigaFetchStatuses(window.apiUrl, window.taigaToken, projectId, $('#statusSelect').data('status-type'))
                    .then(function (statuses) {
                        const $status = $('#statusSelect');
                        taigaPopulateStatusDropdown($status, statuses);
                        $status.val(String(statusIdParam)).trigger('change');
                    })
            );
        }

        if (assignedToParam && $('#assignedToSelect').length && projectId) {
            jobs.push(
                taigaFetchMembers(window.apiUrl, window.taigaToken, projectId)
                    .then(function (memberships) {
                        const $assigned = $('#assignedToSelect');
                        let html = '<option value="">(Semua User)</option>';
                        if (Array.isArray(memberships)) {
                            memberships.forEach(m => {
                                const name = m.full_name || m.user_email || 'Unknown';
                                html += `<option value="${m.user}">${name}</option>`;
                            });
                        }
                        $assigned.html(html);
                        $assigned.val(String(assignedToParam)).trigger('change');
                    })
            );
        }

        if (!jobs.length) return $.Deferred().resolve().promise();
        return $.when.apply($, jobs);
    };

    if (q && $('#searchInput').length) {
        $('#searchInput').val(q);
    }
    if (orderBy && $('#sortSelect').length) {
        $('#sortSelect').val(orderBy).trigger('change');
    }

    let chain = $.Deferred().resolve().promise();
    let resolvedProjectId = projectIdParam ? String(projectIdParam) : null;

    if (!resolvedProjectId && userStoryIdParam) {
        chain = chain
            .then(function () {
                return applyUserStory(userStoryIdParam);
            })
            .then(function (usor) {
                if (usor && usor.project && !resolvedProjectId) {
                    resolvedProjectId = String(usor.project);
                    return applyProject(resolvedProjectId);
                }
            });
    } else {
        if (resolvedProjectId) {
            chain = chain.then(function () {
                return applyProject(resolvedProjectId);
            });
        }
        if (userStoryIdParam) {
            chain = chain.then(function () {
                return applyUserStory(userStoryIdParam);
            });
        }
    }

    if (!resolvedProjectId && epicIdParam) {
        chain = chain
            .then(function () {
                return applyEpic(epicIdParam);
            })
            .then(function (epic) {
                if (epic && epic.project && !resolvedProjectId) {
                    resolvedProjectId = String(epic.project);
                    return applyProject(resolvedProjectId);
                }
            });
    } else if (epicIdParam) {
        chain = chain.then(function () {
            return applyEpic(epicIdParam);
        });
    }

    if (resolvedProjectId) {
        chain = chain.then(function () {
            return applyStatusAndAssigned(resolvedProjectId);
        });
    }

    return chain.then(function () {
        if (window.TTTaiga && window.TTTaiga.Filter) {
            window.TTTaiga.Filter.syncState();
        }
        return page;
    }).always(function () {
        window.TTTaiga.isInitializing = false;
    });
}

function taigaCacheGet(key, ttlMs) {
	ttlMs = typeof ttlMs === 'number' ? ttlMs : 0;
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object') return null;
		const t = parsed.t;
		if (!t || (ttlMs > 0 && (Date.now() - t) > ttlMs)) return null;
		return parsed.v;
	} catch (e) {
		return null;
	}
}

function taigaCacheSet(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value }));
		return true;
	} catch (e) {
		return false;
	}
}

function taigaCacheKey(parts) {
	parts = Array.isArray(parts) ? parts : [parts];
	const safe = parts.map(p => String(p == null ? '' : p));
	return 'taiga_cache:' + safe.join('|');
}

function taigaCachedGetJson(url, ajaxOptions, cacheKey, ttlMs) {
	const cached = taigaCacheGet(cacheKey, ttlMs);
	if (cached !== null) {
		return $.Deferred().resolve(cached).promise();
	}

	ajaxOptions = ajaxOptions || {};
	return $.ajax({
		url: url,
		type: 'GET',
		data: ajaxOptions.data,
		dataType: 'json',
		headers: ajaxOptions.headers
	}).then(function (data) {
		taigaCacheSet(cacheKey, data);
		return data;
	});
}

function taigaHistoryTypeFromItemType(type) {
	const t = String(type || '').toLowerCase().trim();
	if (t === 'us' || t === 'usor' || t === 'userstory' || t === 'user_story') return 'userstory';
	if (t === 'task') return 'task';
	if (t === 'issue' || t === 'isu') return 'issue';
	if (t === 'wiki' || t === 'wikipage') return 'wiki';
	if (t === 'epic') return 'epic';
	return null;
}

function taigaFormatDateTime(value) {
	if (!value) return '';
	const d = new Date(value);
	if (isNaN(d.getTime())) return String(value);
	return d.toLocaleString();
}

function taigaExtractHistoryComments(historyEntries) {
	const entries = Array.isArray(historyEntries) ? historyEntries : [];
	const comments = [];

	entries.forEach(entry => {
		if (!entry || typeof entry !== 'object') return;

		const isDeleted = entry.comment_deleted || entry.is_comment_deleted || entry.deleted || entry.is_deleted;
		if (isDeleted) return;

		const html = entry.comment_html || entry.commentHtml || null;
		const text = entry.comment || entry.comment_text || entry.text || null;
		const raw = html ? html : text;
		if (!raw || String(raw).trim() === '') return;

		const authorObj = entry.user || entry.owner || entry.by || entry.created_by || entry.user_extra || null;
		const author = authorObj
			? (authorObj.full_name_display || authorObj.full_name || authorObj.name || authorObj.username || authorObj.email || null)
			: null;

		const date = entry.created_at || entry.created_date || entry.created || entry.date || entry.modified_at || null;
		const bodyHtml = html ? html : taigaRenderContent(String(text || ''));

		comments.push({
			id: entry.id || entry.comment_id || entry.pk || null,
			author: author || 'Unknown',
			date: date,
			html: bodyHtml
		});
	});

	comments.sort(function (a, b) {
		const ta = a && a.date ? new Date(a.date).getTime() : 0;
		const tb = b && b.date ? new Date(b.date).getTime() : 0;
		return tb - ta;
	});

	return comments;
}

function taigaRenderCommentsList(comments) {
	if (!Array.isArray(comments) || comments.length === 0) {
		return '<div class="text-muted italic"><em>(kosong)</em></div>';
	}

	let html = '';
	comments.forEach(c => {
		const author = taigaEscapeHtml(c && c.author ? String(c.author) : 'Unknown');
		const date = taigaEscapeHtml(c && c.date ? taigaFormatDateTime(c.date) : '');
		const body = c && c.html ? String(c.html) : '';

		html += `
			<div class="mb-3">
				<div class="d-flex justify-content-between align-items-center">
					<strong>${author}</strong>
					<small class="text-muted">${date}</small>
				</div>
				<div class="mt-2 description-content">${body}</div>
			</div>
		`;
	});
	return html;
}

function taigaLoadComments(targetSelector, itemType, itemId, apiUrl, token, options) {
	options = options || {};
	const ttlMs = typeof options.ttlMs === 'number' ? options.ttlMs : (2 * 60 * 1000);
	const historyType = taigaHistoryTypeFromItemType(itemType);
	const id = itemId ? String(itemId) : '';
	const $target = $(targetSelector);
	if (!historyType) {
		$target.html('<div class="text-muted italic"><em>(comment tidak tersedia)</em></div>');
		return $.Deferred().resolve([]).promise();
	}
	if (!$target.length || !id) return $.Deferred().resolve([]).promise();

	const cacheKey = taigaCacheKey(['history', apiUrl || window.apiUrl, historyType, id]);

	return taigaCachedGetJson(
		'api.php/history/' + encodeURIComponent(historyType) + '/' + encodeURIComponent(id),
		{
			headers: {
				'Authorization': 'Bearer ' + (token || window.taigaToken),
				'Content-Type': 'application/json',
				'X-Taiga-Api-Url': apiUrl || window.apiUrl
			}
		},
		cacheKey,
		ttlMs
	).then(function (historyEntries) {
		const comments = taigaExtractHistoryComments(historyEntries);
		$target.html(taigaRenderCommentsList(comments));
		return comments;
	}, function (xhr) {
		const status = xhr && xhr.status ? xhr.status : 0;
		if (status === 404) {
			$target.html('<div class="text-muted italic"><em>(comment tidak tersedia)</em></div>');
		} else {
			$target.html('<div class="alert alert-warning mb-0">Unable to load comments.</div>');
		}
		return [];
	});
}

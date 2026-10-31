$(document).ready(function () {
    if (!window.taigaToken) {
        window.location.href = 'login.php';
        return;
    }

    const config = window.taigaConfig || {};
    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    // ----- State -----
    let currentSprintId = null;
    let currentProjectId = null;
    let currentSprint = null;
    let pointsScale = [];   // [{id, name, value}] from GET /points?project=
    let roles = [];         // [{id, name, computable}] from GET /roles?project=
    let sourceUsors = [];
    let targetUsors = [];
    let pendingAdditions = new Map(); // usorId -> usor
    let pendingRemovals = new Map();   // usorId -> usor
    let sourceSearchTimeout = null;
    let targetSearchTimeout = null;
    let isLoading = false;

    // ----- DOM -----
    const $projectSelect = $('#projectSelect');
    const $sprintSelect = $('#planningSprintSelect');
    const $loadBtn = $('#loadPlanningBtn');
    const $planningContainer = $('#planningContainer');
    const $planningActions = $('#planningActions');
    const $sourceSelector = $('#sourceSelector');
    const $sourceSearch = $('#sourceSearch');
    const $targetSearch = $('#targetSearch');
    const $sourceList = $('#sourceUsorList');
    const $targetList = $('#targetUsorList');
    const $sourceCount = $('#sourceCount');
    const $targetCount = $('#targetCount');
    const $pendingAddCount = $('#pendingAddCount');
    const $pendingRemoveCount = $('#pendingRemoveCount');
    const $badgePendingAdd = $('#badgePendingAdd');
    const $badgePendingRemove = $('#badgePendingRemove');
    const $capacityBadge = $('#capacityBadge');
    const $capacityPoints = $('#capacityPoints');
    const $saveBtn = $('#saveChangesBtn');
    const $discardBtn = $('#discardChangesBtn');
    const $saveProgress = $('#saveProgress');
    const $bulkAddBtn = $('#bulkAddBtn');
    const $bulkAddCount = $('#bulkAddCount');
    const $bulkRemoveBtn = $('#bulkRemoveBtn');
    const $bulkRemoveCount = $('#bulkRemoveCount');
    const $sourceSelectAll = $('#sourceSelectAll');
    const $targetSelectAll = $('#targetSelectAll');
    const $cardTemplate = $('#usorCardTemplate');

    // ----- Helpers -----

    // Sum computable-role points for a usor using the project points scale.
    // usor.points = {roleId: pointScaleId}; scale maps pointScaleId -> numeric value.
    function calcUsorPoints(usor) {
        if (!usor || typeof usor.points !== 'object' || usor.points === null) return null;
        const scaleById = {};
        pointsScale.forEach(p => { scaleById[p.id] = p; });
        const computableRoles = new Set(roles.filter(r => r.computable).map(r => String(r.id)));
        let total = 0;
        let known = false;
        Object.keys(usor.points).forEach(roleId => {
            if (!computableRoles.has(String(roleId))) return;
            const scale = scaleById[usor.points[roleId]];
            if (scale && typeof scale.value === 'number') {
                total += scale.value;
                known = true;
            }
        });
        return known ? total : null;
    }

    function formatPoints(usor) {
        const pts = calcUsorPoints(usor);
        if (pts === null) return { text: '?', cls: 'usor-item-points unknown', title: 'No estimable points' };
        const display = (pts % 1 === 0) ? String(pts) : pts.toFixed(1);
        return { text: display + ' pt', cls: 'usor-item-points', title: display + ' story points' };
    }

    // Build one usor card from the <template>. No HTML string concat in JS.
    function buildUsorCard(usor, side) {
        const node = $cardTemplate[0].content.cloneNode(true);
        const $card = $(node).children().first();

        $card.attr('data-usor-id', usor.id).attr('data-usor-ref', usor.ref || '');
        $card.find('.usor-item-ref').text('#' + (usor.ref || '?'));
        $card.find('.usor-item-subject').text(usor.subject || 'Untitled Usor');
        $card.find('.usor-item-checkbox').val(usor.id);

        const statusInfo = taigaGetStatusInfo(usor);
        $card.find('.usor-item-status').html(taigaRenderStatusBadge(statusInfo));

        const pts = formatPoints(usor);
        const $pts = $card.find('.usor-item-points').attr('title', pts.title);
        $pts.text(pts.text);
        if (pts.cls !== 'usor-item-points') $pts.addClass('unknown');

        const epicInfo = usor.epic_extra_info ? usor.epic_extra_info.subject
            : (usor.epic ? 'Epik #' + usor.epic : null);
        if (epicInfo) $card.find('.usor-item-epic').text(epicInfo);

        if (side === 'source') {
            $card.find('.usor-item-remove').remove();
            if (pendingAdditions.has(usor.id)) $card.addClass('pending-add');
        } else {
            if (pendingAdditions.has(usor.id)) $card.addClass('pending-add');
            if (pendingRemovals.has(usor.id)) $card.addClass('pending-remove');
        }

        return $card;
    }

    // Fetch all pages of a list endpoint, honoring X-Pagination-* headers.
    // Falls back to single response when unpaginated.
    function fetchAllPages(endpoint, baseParams) {
        const result = $.Deferred();
        const collected = [];
        const pageSize = 100;

        function fetchPage(page) {
            const params = Object.assign({}, baseParams, { page: page, page_size: pageSize });
            TTTaiga.API.get(endpoint, params, {
                success: function (items, status, xhr) {
                    const arr = Array.isArray(items) ? items : [];
                    collected.push.apply(collected, arr);
                    const paginated = xhr && xhr.getResponseHeader && xhr.getResponseHeader('X-Paginated');
                    const total = xhr && xhr.getResponseHeader ? parseInt(xhr.getResponseHeader('X-Pagination-Count'), 10) : NaN;
                    if (paginated === 'true' && Number.isFinite(total) && collected.length < total && arr.length > 0) {
                        fetchPage(page + 1);
                    } else {
                        result.resolve(collected, xhr);
                    }
                },
                onError: function (xhr) {
                    result.reject(xhr);
                }
            });
        }

        fetchPage(1);
        return result.promise();
    }

    function loadPointsScale(projectId) {
        const done = $.Deferred();
        if (!projectId) { pointsScale = []; roles = []; return done.resolve().promise(); }
        if (String(currentProjectId) !== String(projectId) || pointsScale.length === 0) {
            $.when(
                TTTaiga.API.get('api.php/points', { project: projectId }).then(p => { pointsScale = p || []; }),
                TTTaiga.API.get('api.php/roles', { project: projectId }).then(r => { roles = r || []; })
            ).always(() => done.resolve());
        } else {
            done.resolve();
        }
        return done.promise();
    }

    // ----- Data loading -----

    // Returns a promise that resolves when the sprint select is populated.
    function loadSprintsForProject(projectId) {
        $sprintSelect.prop('disabled', true).empty().append('<option value="">Loading sprints...</option>');
        $sourceSelector.prop('disabled', true).empty().append('<option value="">Select project first</option>');

        return TTTaiga.API.get('api.php/milestones', { project: projectId }).then(function (sprints) {
            $sprintSelect.empty().append('<option value="">Select a sprint...</option>');
            $sourceSelector.empty().append('<option value="backlog">Backlog (No Sprint)</option>');

            (sprints || []).forEach(sprint => {
                $sprintSelect.append($('<option>', { value: sprint.id }).text(sprint.name));
                $sourceSelector.append($('<option>', { value: sprint.id }).text('Sprint: ' + sprint.name));
            });

            $sprintSelect.prop('disabled', false);
            $sourceSelector.prop('disabled', false);
        }, function () {
            TTTaiga.UI.notify('Failed to load sprints', 'danger');
            $sprintSelect.empty().append('<option value="">Error loading sprints</option>').prop('disabled', true);
        });
    }

    function loadTargetUsors() {
        $targetList.html('<li class="empty-state"><div class="spinner-border spinner-border-sm" role="status"></div><p>Loading sprint USORs...</p></li>');

        return fetchAllPages('api.php/userstories', {
            project: currentProjectId,
            milestone: currentSprintId
        }).then(function (usors) {
            targetUsors = usors || [];
            renderTargetUsors();
        }, function () {
            TTTaiga.UI.notify('Failed to load sprint USORs', 'danger');
            $targetList.html('<li class="empty-state"><p class="text-danger">Failed to load USORs</p></li>');
            targetUsors = [];
            renderTargetUsors();
        });
    }

    function loadSourceUsors() {
        const sourceValue = $sourceSelector.val();
        if (!sourceValue) return $.Deferred().resolve().promise();

        $sourceList.html('<li class="empty-state"><div class="spinner-border spinner-border-sm" role="status"></div><p>Loading USORs...</p></li>');

        const params = { project: currentProjectId };
        if (sourceValue === 'backlog') {
            // Verified live against Taiga: milestone=0 returns nothing; the backlog filter is milestone__isnull.
            params.milestone__isnull = 'true';
        } else {
            params.milestone = sourceValue;
        }

        return fetchAllPages('api.php/userstories', params).then(function (usors) {
            sourceUsors = usors || [];
            const targetIds = new Set(targetUsors.map(u => u.id));
            sourceUsors = sourceUsors.filter(u => !targetIds.has(u.id) && !pendingAdditions.has(u.id));
            renderSourceUsors();
        }, function () {
            TTTaiga.UI.notify('Failed to load source USORs', 'danger');
            $sourceList.html('<li class="empty-state"><p class="text-danger">Failed to load USORs</p></li>');
            sourceUsors = [];
            renderSourceUsors();
        });
    }

    function loadSprintMeta() {
        if (!currentSprintId) return $.Deferred().resolve(null).promise();
        return TTTaiga.API.get('api.php/milestones/' + currentSprintId).then(
            sprint => { currentSprint = sprint; return sprint; },
            () => { currentSprint = null; return null; }
        );
    }

    function loadPlanningData() {
        if (isLoading || isSaving || !currentSprintId || !currentProjectId) return;
        isLoading = true;
        $loadBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Loading...');
        $planningContainer.hide();
        $planningActions.addClass('d-none');

        // Sequential promise chain, no setTimeout races.
        loadSprintMeta().then(() => loadPointsScale(currentProjectId))
            .then(() => loadTargetUsors())
            .then(() => { $sourceSelector.val('backlog'); return loadSourceUsors(); })
            .always(function () {
                isLoading = false;
                $loadBtn.prop('disabled', false).html('<i class="bi bi-arrow-repeat me-1"></i> Load Planning');
                $planningContainer.show();
                $planningActions.removeClass('d-none');
                updatePendingUI();
            });
    }

    // ----- Rendering -----

    function filterBySearch(usors, searchTerm) {
        if (!searchTerm) return usors;
        return usors.filter(u =>
            (u.subject && u.subject.toLowerCase().includes(searchTerm)) ||
            (u.ref && String(u.ref).includes(searchTerm)) ||
            (u.description && u.description.toLowerCase().includes(searchTerm))
        );
    }

    function renderSourceUsors() {
        // Hide usors queued for addition so source only shows what's actually available.
        const available = sourceUsors.filter(u => !pendingAdditions.has(u.id));
        const filtered = filterBySearch(available, $sourceSearch.val().toLowerCase().trim());
        $sourceCount.text(filtered.length);

        if (filtered.length === 0) {
            $sourceList.html('<li class="empty-state"><i class="bi bi-search"></i><p>No USORs found</p></li>');
            $sourceSelectAll.prop('checked', false);
            updateBulkButtons();
            return;
        }

        const $items = filtered.map(usor => buildUsorCard(usor, 'source'));
        $sourceList.empty().append($items);
        initSourceSortable();
        updateBulkButtons();
    }

    function renderTargetUsors() {
        // Target list = saved sprint usors + pending additions (marked pending-add),
        // minus pending removals which stay visible with pending-remove styling.
        const search = $targetSearch.val().toLowerCase().trim();
        const display = targetUsors.slice();
        pendingAdditions.forEach(usor => {
            if (!targetUsors.some(u => u.id === usor.id)) display.push(usor);
        });
        const filtered = filterBySearch(display, search);
        $targetCount.text(filtered.length);

        if (filtered.length === 0) {
            $targetList.html('<li class="empty-state"><i class="bi bi-flag"></i><p>No USORs in this sprint</p></li>');
            $targetSelectAll.prop('checked', false);
        } else {
            const $items = filtered.map(usor => buildUsorCard(usor, 'target'));
            $targetList.empty().append($items);
            initTargetSortable();
        }
        updateCapacity();
        updateBulkButtons();
    }

    // Sprint capacity: committed = points of (kept + pending add - pending remove) usors.
    function updateCapacity() {
        const idsToRemove = new Set(pendingRemovals.keys());
        const committed = targetUsors.filter(u => !idsToRemove.has(u.id));
        pendingAdditions.forEach(usor => committed.push(usor));

        let total = 0;
        let known = 0;
        committed.forEach(usor => {
            const pts = calcUsorPoints(usor);
            if (pts !== null) { total += pts; known++; }
        });

        $capacityPoints.text(total);
        $capacityBadge.removeClass('d-none').attr(
            'title',
            known + ' of ' + committed.length + ' USORs estimated; '
            + (committed.length - known) + ' unestimated (counted as 0)'
        );
    }

    // ----- Drag & drop (jQuery UI Sortable) -----
    // NOTE: `receive` fires on the ACCEPTING list. The accepting list owns the
    // state change; the dragged item's origin is the other list.

    // jQuery UI sortable('destroy') throws on never-initialized elements
    // ("cannot call methods on sortable prior to initialization"), so guard it.
    function destroySortable($list) {
        if ($list.hasClass('ui-sortable')) {
            $list.sortable('destroy');
        }
    }

    function initSourceSortable() {
        destroySortable($sourceList);
        $sourceList.sortable({
            connectWith: '#targetUsorList',
            helper: 'clone',
            revert: 'invalid',
            placeholder: 'ui-sortable-placeholder',
            start: function (event, ui) {
                ui.helper.addClass('ui-sortable-helper').css('width', ui.item.width());
            },
            receive: function (event, ui) {
                // Source list ACCEPTS an item dropped from target => queue removal.
                const usorId = parseInt(ui.item.data('usor-id'), 10);
                ui.item.remove();
                $(this).sortable('cancel');
                if (queueRemoval(usorId)) {
                    renderTargetUsors();
                    renderSourceUsors();
                    updatePendingUI();
                }
            }
        }).disableSelection();
    }

    function initTargetSortable() {
        destroySortable($targetList);
        $targetList.sortable({
            connectWith: '#sourceUsorList',
            helper: 'clone',
            revert: 'invalid',
            placeholder: 'ui-sortable-placeholder',
            start: function (event, ui) {
                ui.helper.addClass('ui-sortable-helper').css('width', ui.item.width());
            },
            receive: function (event, ui) {
                // Target list ACCEPTS an item dropped from source => queue addition.
                const usorId = parseInt(ui.item.data('usor-id'), 10);
                const usor = sourceUsors.find(u => u.id === usorId);
                ui.item.remove();
                $(this).sortable('cancel');
                if (usor && queueAddition(usor)) {
                    renderSourceUsors();
                    renderTargetUsors();
                    updatePendingUI();
                }
            }
        }).disableSelection();
    }

    // ----- State transitions (single authority) -----

    function queueAddition(usor) {
        if (!usor || pendingRemovals.has(usor.id)) {
            // Usor already in sprint (removal pending) => cancel the removal instead.
            if (usor && pendingRemovals.has(usor.id)) {
                pendingRemovals.delete(usor.id);
                return true;
            }
            return false;
        }
        if (pendingAdditions.has(usor.id)) return false;
        pendingAdditions.set(usor.id, usor);
        return true;
    }

    function queueRemoval(usorId) {
        const usor = targetUsors.find(u => u.id === usorId);
        if (!usor) return false;

        if (pendingAdditions.has(usorId)) {
            pendingAdditions.delete(usorId); // never-saved addition: just drop it
        } else if (!pendingRemovals.has(usorId)) {
            pendingRemovals.set(usorId, usor);
        } else {
            return false;
        }
        return true;
    }

    // ----- Bulk selection -----

    function updateBulkButtons() {
        const srcChecked = $sourceList.find('.usor-item-checkbox:checked').length;
        const tgtChecked = $targetList.find('.usor-item-checkbox:checked').length;
        $bulkAddBtn.prop('disabled', srcChecked === 0);
        $bulkAddCount.text(srcChecked);
        $bulkRemoveBtn.prop('disabled', tgtChecked === 0);
        $bulkRemoveCount.text(tgtChecked);
    }

    $sourceList.on('change', '.usor-item-checkbox', updateBulkButtons);
    $targetList.on('change', '.usor-item-checkbox', updateBulkButtons);

    $sourceSelectAll.on('change', function () {
        $sourceList.find('.usor-item-checkbox').prop('checked', this.checked);
        updateBulkButtons();
    });
    $targetSelectAll.on('change', function () {
        $targetList.find('.usor-item-checkbox').prop('checked', this.checked);
        updateBulkButtons();
    });

    $bulkAddBtn.on('click', function () {
        const ids = [];
        $sourceList.find('.usor-item-checkbox:checked').each(function () {
            ids.push(parseInt(this.value, 10));
        });
        let changed = false;
        ids.forEach(id => {
            const usor = sourceUsors.find(u => u.id === id);
            if (usor && queueAddition(usor)) changed = true;
        });
        if (changed) {
            renderSourceUsors();
            renderTargetUsors();
            updatePendingUI();
        }
    });

    $bulkRemoveBtn.on('click', function () {
        const ids = [];
        $targetList.find('.usor-item-checkbox:checked').each(function () {
            ids.push(parseInt(this.value, 10));
        });
        let changed = false;
        ids.forEach(id => {
            if (queueRemoval(id)) changed = true;
        });
        if (changed) {
            renderTargetUsors();
            renderSourceUsors();
            updatePendingUI();
        }
    });

    // ----- Pending / save -----

    function updatePendingUI() {
        const addCount = pendingAdditions.size;
        const removeCount = pendingRemovals.size;
        const hasPending = addCount > 0 || removeCount > 0;

        $pendingAddCount.text('+' + addCount).toggleClass('d-none', addCount === 0);
        $pendingRemoveCount.text('-' + removeCount).toggleClass('d-none', removeCount === 0);
        $badgePendingAdd.text('+ ' + addCount + ' Add').toggleClass('d-none', addCount === 0);
        $badgePendingRemove.text('- ' + removeCount + ' Remove').toggleClass('d-none', removeCount === 0);

        $saveBtn.prop('disabled', !hasPending);
        $discardBtn.prop('disabled', !hasPending);
        updateCapacity();
    }

    function discardChanges() {
        if (isSaving) return;
        pendingAdditions.clear();
        pendingRemovals.clear();
        loadTargetUsors().then(() => loadSourceUsors()).then(() => updatePendingUI());
        TTTaiga.UI.notify('Changes discarded', 'info');
    }

    // True while a save is in flight; blocks reload/discard so pending maps
    // cannot be mutated underneath the save loop.
    let isSaving = false;

    function saveChanges() {
        const additions = [...pendingAdditions.values()];
        const removals = [...pendingRemovals.values()];
        const totalChanges = additions.length + removals.length;
        if (totalChanges === 0 || isSaving) return;
        isSaving = true;

        $saveBtn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Saving...');
        $discardBtn.prop('disabled', true);
        $saveProgress.removeClass('d-none').find('.progress-bar').css('width', '0%');

        let completed = 0;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Phase 1: bulk add to sprint via one bulk_update_milestone call (verified live).
        // Phase 2: bulk remove must be individual PATCHes because Taiga rejects
        //          milestone_id: null on bulk_update_milestone (verified live).
        function runBulkAdd() {
            const done = $.Deferred();
            if (additions.length === 0) return done.resolve().promise();

            const bulkStories = additions.map((usor, i) => ({ us_id: usor.id, order: i + 1 }));
            TTTaiga.API.post('api.php/userstories/bulk_update_milestone', {
                project_id: Number(currentProjectId),
                milestone_id: Number(currentSprintId),
                bulk_stories: bulkStories
            }, {
                success: function () {
                    successCount += additions.length;
                    additions.forEach(usor => pendingAdditions.delete(usor.id));
                    done.resolve();
                },
                onError: function (xhr) {
                    const msg = xhr.responseJSON?._error_message || 'Bulk add failed';
                    errorCount += additions.length;
                    errors.push('Bulk add (' + additions.length + ' USORs): ' + msg);
                    done.resolve(); // continue with removals
                }
            });
            return done.promise();
        }

        function runRemovals() {
            const done = $.Deferred();
            if (removals.length === 0) return done.resolve().promise();

            function next(index) {
                if (index >= removals.length) { done.resolve(); return; }
                const usor = removals[index];
                TTTaiga.API.patch('api.php/userstories/' + usor.id, {
                    milestone: null,
                    version: usor.version
                }, {
                    success: function () {
                        successCount++;
                        pendingRemovals.delete(usor.id);
                        targetUsors = targetUsors.filter(u => u.id !== usor.id);
                    },
                    onError: function (xhr) {
                        errorCount++;
                        const msg = xhr.responseJSON?._error_message
                            || (xhr.responseJSON && xhr.responseJSON.error)
                            || 'Unknown error';
                        errors.push('USOR #' + (usor.ref || usor.id) + ': ' + msg);
                    },
                    complete: function () {
                        completed++;
                        const pct = Math.round((completed / totalChanges) * 100);
                        $saveProgress.find('.progress-bar').css('width', pct + '%');
                        next(index + 1);
                    }
                });
            }
            next(0);
            return done.promise();
        }

        runBulkAdd().then(runRemovals).then(finishSave);

        function finishSave() {
            completed = totalChanges;
            isSaving = false;
            $saveProgress.find('.progress-bar').css('width', '100%');
            $saveProgress.addClass('d-none');
            $saveBtn.prop('disabled', false).html('<i class="bi bi-check-circle me-1"></i> Save Changes');
            $discardBtn.prop('disabled', false);

            // Reload fresh data with new versions.
            loadTargetUsors().then(() => loadSourceUsors()).then(function () {
                updatePendingUI();
                if (errorCount === 0) {
                    TTTaiga.UI.notify('Successfully saved ' + successCount + ' changes', 'success');
                } else {
                    TTTaiga.UI.notify('Saved ' + successCount + ', failed ' + errorCount, 'warning');
                    if (errors.length) console.error('Save errors:', errors);
                }
            });
        }
    }

    function resetState() {
        currentSprintId = null;
        currentSprint = null;
        sourceUsors = [];
        targetUsors = [];
        pendingAdditions.clear();
        pendingRemovals.clear();
        $sourceList.html('<li class="empty-state"><i class="bi bi-arrow-left-right"></i><p>Select a sprint and click "Load Planning" to start</p></li>');
        $targetList.html('<li class="empty-state"><i class="bi bi-flag"></i><p>USORs in this sprint will appear here</p></li>');
        $sourceCount.text('0');
        $targetCount.text('0');
        $capacityBadge.addClass('d-none');
        updatePendingUI();
    }

    // ----- Event wiring -----

    taigaInitRemoteSelect2('#projectSelect', '/projects', {
        placeholder: 'Select Project',
        additionalParams: () => ({ member: window.TTTaigaSession?.user?.id })
    });

    // Select2's own 'select2:select' event fires only on user picks; jQuery
    // 'change' from Select2 always has originalEvent === undefined, so guarding
    // 'change' with originalEvent would silently swallow every user selection.
    $projectSelect.on('select2:select', function () {
        onProjectSelected();
    });
    // Plain select fallback (if Select2 fails to initialize) still works.
    $projectSelect.on('change', function (e) {
        if (e.originalEvent === undefined) return; // skip programmatic triggers
        if ($(this).data('select2')) return; // Select2 path handled above
        onProjectSelected();
    });

    function onProjectSelected() {
        currentProjectId = $projectSelect.val();

        if (typeof window.tttaigaPersistSharedFilters === 'function') {
            window.tttaigaPersistSharedFilters({ project: currentProjectId });
        }

        resetState();
        $loadBtn.prop('disabled', true);
        $planningContainer.hide();
        $planningActions.addClass('d-none');
        loadSprintsForProject(currentProjectId);
    }

    $sprintSelect.on('change', function () {
        currentSprintId = $(this).val();
        $loadBtn.prop('disabled', !currentSprintId);
    });

    $loadBtn.on('click', loadPlanningData);

    $sourceSelector.on('change', function () {
        if (!currentProjectId) return;
        loadSourceUsors();
    });

    // Separate debounce timers per search input.
    $sourceSearch.on('input', function () {
        clearTimeout(sourceSearchTimeout);
        sourceSearchTimeout = setTimeout(renderSourceUsors, 300);
    });
    $targetSearch.on('input', function () {
        clearTimeout(targetSearchTimeout);
        targetSearchTimeout = setTimeout(renderTargetUsors, 300);
    });

    $saveBtn.on('click', saveChanges);
    $discardBtn.on('click', discardChanges);

    // Remove button (delegated: cards are rebuilt constantly).
    $targetList.on('click', '.usor-item-remove', function (e) {
        e.stopPropagation();
        const usorId = parseInt($(this).closest('.usor-item').data('usor-id'), 10);
        if (queueRemoval(usorId)) {
            renderTargetUsors();
            renderSourceUsors();
            updatePendingUI();
        }
    });

    // ----- Bootstrap from shared filters / URL -----

    function autoSelectSprint(sprintId) {
        return loadSprintsForProject(currentProjectId).then(function () {
            $sprintSelect.val(sprintId).trigger('change');
            if ($sprintSelect.val() === String(sprintId)) {
                loadPlanningData();
            } else {
                TTTaiga.UI.notify('Sprint not found in this project', 'warning');
            }
        });
    }

    function bootstrapWithProject(projectId) {
        currentProjectId = projectId;
        // Programmatic select set: applyProject in taiga.js appends the option.
        return loadSprintsForProject(currentProjectId);
    }

    function bootstrapFromSprint(sprintId) {
        return TTTaiga.API.get('api.php/milestones/' + sprintId).then(function (sprint) {
            if (sprint && sprint.project) return bootstrapWithProject(sprint.project).then(() => autoSelectSprint(sprintId));
        }, function () {
            console.error('Failed to load pre-selected sprint');
        });
    }

    if (typeof window.taigaApplyFiltersFromUrl === 'function') {
        window.taigaApplyFiltersFromUrl().then(function () {
            currentProjectId = $projectSelect.val();
            if (window.preSelectedSprintId) {
                if (currentProjectId) {
                    autoSelectSprint(window.preSelectedSprintId);
                } else {
                    bootstrapFromSprint(window.preSelectedSprintId);
                }
            }
        });
    } else if (window.preSelectedSprintId) {
        bootstrapFromSprint(window.preSelectedSprintId);
    }
});

$(document).ready(function () {
    if (!window.taigaToken) {
        window.location.href = 'login.php';
        return;
    }

    const config = window.taigaConfig || {};
    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    TTTaiga.Sprints = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page };

            $('#sprintsContent').html(`<div class="loading-spinner text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>`);

            TTTaiga.API.get('api.php/milestones', params, {
                success: function (sprints, status, xhr) {
                    this.render(sprints, xhr);
                    taigaRenderPagination(xhr, '#sprintsPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#sprintsContent').html(`<div class="alert alert-danger">Failed to load sprints.</div>`);
                }
            });
        },
        render: function (sprints, xhr) {
            taigaUpdateListCounts(xhr, sprints.length, 'totalSprints', 'filteredSprints', 'selectedSprintsCount');
            if (sprints.length === 0) {
                $('#sprintsContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            sprints.forEach(sprint => {
                const statusBadge = sprint.closed ? '<span class="badge bg-secondary">Closed</span>' : '<span class="badge bg-success">Open</span>';
                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card sprint-card h-100" data-sprint-id="${sprint.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check"><input class="form-check-input sprint-checkbox" type="checkbox" value="${sprint.id}" data-version="${sprint.version}" data-subject="${sprint.name || 'Untitled Sprint'}"></div>
                                ${statusBadge}
                            </div>
                            <h6 class="card-title text-truncate">${sprint.name || 'Untitled Sprint'}</h6>
                            <div class="card-text taiga-card-description text-muted small mb-0">${sprint.description ? taigaRenderContent(sprint.description) : ''}</div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('sprint', sprint, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <a href="sprint_plan_form.php?id=${sprint.id}" class="btn btn-sm btn-outline-success" title="Sprint Planning"><i class="bi bi-kanban me-1"></i> Planning</a>
                            <button class="btn btn-sm btn-outline-primary view-sprint" data-sprint-id="${sprint.id}">View</button>
                            <button class="btn btn-sm btn-outline-secondary edit-sprint" data-sprint-id="${sprint.id}" data-bs-toggle="modal" data-bs-target="#singleSprintModal">Edit</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#sprintsContent').html(html);
            taigaBindSelectionLogic('sprint-checkbox', taigaBulkSelectionCallback, 'sprints');
            $('.sprint-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.sprints.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.sprint-checkbox').length;
            var checked = $('.sprint-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
            $('.view-sprint').off('click').on('click', function() { window.location.href = `sprint.php?id=${$(this).data('sprint-id')}`; });
        },
        populateBulkCreateDropdowns: function() {
            TTTaiga.Form.populateDropdowns({
                projectSel: '#bulkCreateSprintProject'
            });
        },
        populateBulkUpdateDropdowns: function() {
            const filterParams = taigaGetFilterParams();
            const projectId = filterParams.project;
            taigaPopulateProjectSelect($('#bulkUpdateSprintProject'), projectId).done(function() {
                const select = $('#bulkUpdateSprints');
                select.empty().append(new Option('Loading sprints...', ''));
                TTTaiga.API.get('api.php/milestones', projectId ? { project: projectId } : {}, {
                    success: function(sprints) {
                        select.empty();
                        sprints.forEach(s => {
                            const $opt = $('<option>').val(s.id).text(s.name + ' (#' + s.id + ')').data('version', s.version);
                            select.append($opt);
                        });
                    }
                });
            });
        },
        submitBulkCreate: function() {
            const text = $('#bulkCreateSprintText').val().trim();
            if (!text) { TTTaiga.UI.notify('Please enter some sprints', 'warning'); return; }

            const projectId = $('#bulkCreateSprintProject').val();
            if (!projectId) { TTTaiga.UI.notify('Please select a project', 'warning'); return; }

            const $btn = $('#submitBulkCreateSprints');
            $btn.prop('disabled', true).text('Creating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            const sprints = taigaParseBulkLines(text);
            const defaultStart = $('#bulkCreateSprintStart').val();
            const defaultFinish = $('#bulkCreateSprintFinish').val();

            let createdCount = 0; let errorCount = 0;

            sprints.forEach(s => {
                const data = {
                    project: parseInt(projectId),
                    name: s.name,
                    description: s.description || ''
                };
                if (defaultStart) data.estimated_start = defaultStart;
                if (defaultFinish) data.estimated_finish = defaultFinish;

                TTTaiga.API.post('api.php/milestones', data, {
                    success: () => { createdCount++; checkFinished(); },
                    onError: () => { errorCount++; checkFinished(); }
                });
            });

            function checkFinished() {
                if (createdCount + errorCount === sprints.length) {
                    $btn.prop('disabled', false).text('Create Sprints');
                    $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                    TTTaiga.UI.notify(`Created ${createdCount} sprints, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                    if (errorCount === 0) { $('#bulkCreateSprintModal').modal('hide'); TTTaiga.Sprints.load(); }
                }
            }
        },
        submitBulkUpdate: function() {
            const selectedSprints = [];
            $('#bulkUpdateSprints option:selected').each(function () {
                selectedSprints.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedSprints.length === 0) { TTTaiga.UI.notify('Please select at least one sprint', 'warning'); return; }

            const updateData = {};
            const closed = $('#bulkUpdateClosed').val();
            if (closed !== '') updateData.closed = closed === 'true';
            const description = $('#bulkUpdateDescription').val().trim();
            if (description) updateData.description = description;

            if (Object.keys(updateData).length === 0) { TTTaiga.UI.notify('No fields to update', 'warning'); return; }

            const $btn = $('#submitBulkUpdateSprint');
            $btn.prop('disabled', true).text('Updating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/milestones/', selectedSprints, 'PATCH', updateData, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Update Sprints');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Updated ${successCount} sprints, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) { $('#bulkUpdateSprintModal').modal('hide'); TTTaiga.Sprints.load(); }
            }, { showProgress: true });
        },
        deleteBulk: function() {
            const selectedSprints = [];
            $('#sprintsContent input.sprint-checkbox:checked').each(function () {
                selectedSprints.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedSprints.length === 0) { TTTaiga.UI.notify('Please select at least one sprint', 'warning'); return; }

            const list = selectedSprints.map(s => '<li class="list-group-item list-group-item-danger">Sprint #' + s.id + '</li>').join('');
            $('#selectedSprintsDeleteList').html('<ul class="list-group list-group-flush">' + list + '</ul>');
        },
        confirmDeleteBulk: function() {
            const selectedSprints = [];
            $('#sprintsContent input.sprint-checkbox:checked').each(function () {
                selectedSprints.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedSprints.length === 0) { TTTaiga.UI.notify('Please select at least one sprint', 'warning'); return; }

            const $btn = $('#confirmBulkDeleteSprints');
            $btn.prop('disabled', true).text('Deleting...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/milestones/', selectedSprints, 'DELETE', null, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Delete Sprints');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Deleted ${successCount} sprints, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) { $('#bulkDeleteSprintModal').modal('hide'); TTTaiga.Sprints.load(); }
            }, { showProgress: true });
        }
    };

    // Bind event handlers
    $('#submitSingleSprint').on('click', function () {
        TTTaiga.Form.saveModal({
            endpoint: 'api.php/milestones',
            formId: 'singleSprintForm',
            modalId: 'singleSprintModal',
            listFn: () => TTTaiga.Sprints.load(),
            data: {
                project: parseInt($('#singleSprintProject').val()),
                name: $('#singleSprintName').val(),
                estimated_start: $('#singleSprintStart').val() || undefined,
                estimated_finish: $('#singleSprintEnd').val() || undefined
            }
        });
    });
    $('#singleSprintModal').on('show.bs.modal', function (e) {
        const id = $(e.relatedTarget).data('sprint-id');
        if (!id) {
            $('#singleSprintModalLabel').text('Create Sprint');
            $('#singleSprintId').val('');
            $('#singleSprintVersion').val('');
            $('#singleSprintForm')[0].reset();
            TTTaiga.Form.populateDropdowns({
                projectSel: '#singleSprintProject'
            });
            return;
        }
        $('#singleSprintModalLabel').text('Edit Sprint');
        TTTaiga.API.get('api.php/milestones/' + id, {}, {
            success: function (sprint) {
                $('#singleSprintId').val(sprint.id);
                $('#singleSprintVersion').val(sprint.version);
                $('#singleSprintName').val(sprint.name);
                $('#singleSprintStart').val(sprint.estimated_start || '');
                $('#singleSprintEnd').val(sprint.estimated_finish || '');
                TTTaiga.Form.populateDropdowns({
                    projectSel: '#singleSprintProject'
                }, {
                    project: sprint.project,
                    project_label: sprint.project_extra_info ? sprint.project_extra_info.name : null
                });
            }
        });
    });
    $('#bulkCreateSprintModal').on('show.bs.modal', () => TTTaiga.Sprints.populateBulkCreateDropdowns());
    $('#submitBulkCreateSprints').on('click', () => TTTaiga.Sprints.submitBulkCreate());
    $('#previewBulkCreateSprints').on('click', function() {
        const text = $('#bulkCreateSprintText').val().trim();
        const $preview = $('#bulkCreateSprintPreview');
        if (!text) { $preview.addClass('d-none'); return; }
        const items = taigaParseBulkLines(text);
        $preview.html('<strong>Preview (' + items.length + ' sprints):</strong><ul class="mb-0 mt-1">' + items.map(i => '<li>' + i.name + (i.description ? ' | ' + i.description : '') + '</li>').join('') + '</ul>').removeClass('d-none');
    });
    // Bulk update: handled by TTTaiga.BulkUpdate
    $('#bulkUpdateSprintModal').on('show.bs.modal', function() {
        TTTaiga.BulkUpdate.open('sprints');
    });
    $('#submitBulkUpdateSprint').on('click', function() {
        TTTaiga.BulkUpdate.submit('sprints');
    });
    $('#bulkDeleteSprintModal').on('show.bs.modal', () => TTTaiga.Sprints.deleteBulk());
    $('#confirmBulkDeleteSprints').on('click', () => TTTaiga.Sprints.confirmDeleteBulk());

    taigaBindFilters((page) => TTTaiga.Sprints.load(page));
    taigaApplyFiltersFromUrl()
        .then(page => TTTaiga.Sprints.load(page))
        .catch(() => TTTaiga.Sprints.load(1));
});

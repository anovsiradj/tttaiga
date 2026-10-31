$(document).ready(function () {
    if (!window.taigaToken) {
        window.location.href = 'login.php';
        return;
    }

    const config = window.taigaConfig || {};

    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    let allProjects = [];

    TTTaiga.Epiks = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page };

            $('#epicsContent').html(`
                <div class="loading-spinner text-center p-3">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
            `);

            TTTaiga.API.get('api.php/epics', params, {
                success: function (epics, status, xhr) {
                    this.render(epics, xhr);
                    taigaRenderPagination(xhr, '#epicsPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#epicsContent').html(`<div class="alert alert-danger">Unable to load epiks. Please try again.</div>`);
                    $('#epicsPagination').empty();
                }
            });
        },
        render: function (epics, xhr) {
            taigaUpdateListCounts(xhr, epics.length, 'totalEpics', 'filteredEpics', 'selectedEpicsCount');
            if (epics.length === 0) {
                $('#epicsContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            epics.forEach(epic => {
                const project = allProjects.find(p => p.id === epic.project) || {};
                const statusInfo = taigaGetStatusInfo(epic);
                const statusBadge = taigaRenderStatusBadge(statusInfo);
                const assignedTo = epic.assigned_to_extra_info ? epic.assigned_to_extra_info.full_name_display : (epic.assigned_to ? 'User ID: ' + epic.assigned_to : 'Unassigned');
                const owner = epic.owner_extra_info ? epic.owner_extra_info.full_name_display : 'Unknown';

                const refHtml = epic.ref ? `<small class="text-muted mt-1">#${epic.ref}</small>` : '';

                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card epic-card h-100" data-epic-id="${epic.id}" data-epic-ref="${epic.ref}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input epic-checkbox" type="checkbox" value="${epic.id}" data-version="${epic.version}" data-subject="${epic.subject || 'Untitled Epik'}" data-ref="${epic.ref}" id="epic-${epic.id}">
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    ${statusBadge}
                                    ${refHtml}
                                </div>
                            </div>
                            <h6 class="card-title text-truncate">${epic.subject || 'Untitled Epik'}</h6>
                            <div class="card-text text-muted taiga-card-description small mb-0">${epic.description ? taigaRenderContent(epic.description) : ''}</div>
                            <div class="taiga-card-meta">
                                <small class="text-muted d-block text-truncate">Assigned: <strong>${assignedTo}</strong></small>
                            </div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('epic', epic, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <button class="btn btn-sm btn-outline-primary view-epic" data-epic-id="${epic.id}" data-epic-ref="${epic.ref}">View</button>
                            <button class="btn btn-sm btn-outline-secondary edit-epic" data-epic-id="${epic.id}" data-bs-toggle="modal" data-bs-target="#singleEpicModal">Edit</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#epicsContent').html(html);
            taigaBindSelectionLogic('epic-checkbox', taigaBulkSelectionCallback, 'epics');
            $('.epic-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.epics.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.epic-checkbox').length;
            var checked = $('.epic-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
            $('.view-epic').off('click').on('click', function() { window.location.href = `epik.php?id=${$(this).data('epic-id')}`; });
        },
        populateBulkCreateDropdowns: function() {
            TTTaiga.Form.populateDropdowns({
                projectSel: '#bulkCreateEpicProject',
                statusSel: '#bulkCreateEpicStatus',
                statusType: 'epic',
                assigneeSel: '#bulkCreateEpicAssignee'
            });
        },
        submitBulkCreate: function() {
            const text = $('#bulkCreateEpicText').val().trim();
            if (!text) { TTTaiga.UI.notify('Please enter some epiks', 'warning'); return; }

            const projectId = $('#bulkCreateEpicProject').val();
            if (!projectId) { TTTaiga.UI.notify('Please select a project', 'warning'); return; }

            const $btn = $('#submitBulkCreateEpic');
            $btn.prop('disabled', true).text('Creating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            const epics = taigaParseBulkLines(text);
            let createdCount = 0; let errorCount = 0;

            epics.forEach(epic => {
                TTTaiga.API.post('api.php/epics', {
                    project: parseInt(projectId),
                    subject: epic.subject,
                    description: epic.description || '',
                    status: $('#bulkCreateEpicStatus').val() ? parseInt($('#bulkCreateEpicStatus').val()) : undefined,
                    assigned_to: $('#bulkCreateEpicAssignee').val() ? parseInt($('#bulkCreateEpicAssignee').val()) : undefined
                }, {
                    success: () => { createdCount++; checkFinished(); },
                    onError: () => { errorCount++; checkFinished(); }
                });
            });

            function checkFinished() {
                if (createdCount + errorCount === epics.length) {
                    $btn.prop('disabled', false).text('Create Epiks');
                    $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                    TTTaiga.UI.notify(`Created ${createdCount} epiks, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                    if (errorCount === 0) {
                        $('#bulkCreateEpicModal').modal('hide');
                        TTTaiga.Epiks.load();
                    }
                }
            }
        },

        deleteBulk: function() {
            const selectedEpics = [];
            $('#epicsContent input.epic-checkbox:checked').each(function () {
                selectedEpics.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedEpics.length === 0) { TTTaiga.UI.notify('Please select at least one epik', 'warning'); return; }

            const $btn = $('#confirmBulkDeleteEpics');
            $btn.prop('disabled', true).text('Deleting...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/epics/', selectedEpics, 'DELETE', null, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Delete Epiks');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Deleted ${successCount} epiks, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) { $('#bulkDeleteEpicModal').modal('hide'); TTTaiga.Epiks.load(); }
            }, { showProgress: true });
        }
    };

    // Load projects first
    TTTaiga.API.get('api.php/projects', {}, {
        success: function (projects) {
            allProjects = projects;
            
            $('#bulkCreateEpicModal').on('show.bs.modal', function() { 
                TTTaiga.Epiks.populateBulkCreateDropdowns(); 
            });
            $('#submitBulkCreateEpic').on('click', () => TTTaiga.Epiks.submitBulkCreate());
            $('#bulkUpdateEpicModal').on('show.bs.modal', () => TTTaiga.BulkUpdate.open('epics'));
            $('#submitBulkUpdateEpic').on('click', () => TTTaiga.BulkUpdate.submit('epics'));
            $('#confirmBulkDeleteEpics').on('click', () => TTTaiga.Epiks.deleteBulk());
            $('#submitSingleEpic').on('click', function () {
                TTTaiga.Form.saveModal({
                    endpoint: 'api.php/epics',
                    formId: 'singleEpicForm',
                    modalId: 'singleEpicModal',
                    listFn: () => TTTaiga.Epiks.load(),
                    data: {
                        project: parseInt($('#singleEpicProject').val()),
                        subject: $('#singleEpicSubject').val(),
                        description: $('#singleEpicDescription').val(),
                        status: $('#singleEpicStatus').val() ? parseInt($('#singleEpicStatus').val()) : undefined,
                        assigned_to: $('#singleEpicAssignee').val() ? parseInt($('#singleEpicAssignee').val()) : undefined
                    }
                });
            });
            $('#singleEpicModal').on('show.bs.modal', function (e) {
                const id = $(e.relatedTarget).data('epic-id');
                if (!id || Number(id) <= 0) {
                    $('#singleEpicModalLabel').text('Create Epic');
                    $('#singleEpicId').val('');
                    $('#singleEpicVersion').val('');
                    $('#singleEpicForm')[0].reset();
                    TTTaiga.Form.populateDropdowns({
                        projectSel: '#singleEpicProject',
                        statusSel: '#singleEpicStatus',
                        statusType: 'epic',
                        assigneeSel: '#singleEpicAssignee'
                    });
                    return;
                }
                $('#singleEpicModalLabel').text('Edit Epic');
                TTTaiga.API.get('api.php/epics/' + id, {}, {
                    success: function (epic) {
                        $('#singleEpicId').val(epic.id);
                        $('#singleEpicVersion').val(epic.version);
                        $('#singleEpicSubject').val(epic.subject);
                        $('#singleEpicDescription').val(epic.description);
                        TTTaiga.Form.populateDropdowns({
                            projectSel: '#singleEpicProject',
                            statusSel: '#singleEpicStatus',
                            statusType: 'epic',
                            assigneeSel: '#singleEpicAssignee'
                        }, {
                            project: epic.project,
                            status: epic.status,
                            assigned_to: epic.assigned_to,
                            project_label: epic.project_extra_info ? epic.project_extra_info.name : null
                        });
                    }
                });
            });

            taigaBindFilters((page) => TTTaiga.Epiks.load(page));

            taigaApplyFiltersFromUrl()
                .then(page => TTTaiga.Epiks.load(page))
                .catch(() => TTTaiga.Epiks.load(1));
        }
    });
});

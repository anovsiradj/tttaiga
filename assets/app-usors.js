$(document).ready(function () {
    if (!window.taigaToken) {
        window.location.href = 'login.php';
        return;
    }

    const config = window.taigaConfig || {};

    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    TTTaiga.Usors = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page, include: 'epics' };

            $('#usorsContent').html(`
                <div class="loading-spinner text-center p-3">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
            `);

            TTTaiga.API.get('api.php/userstories', params, {
                success: function (usors, status, xhr) {
                    this.render(usors, xhr);
                    taigaRenderPagination(xhr, '#usorsPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#usorsContent').html(`<div class="alert alert-danger">Unable to load usors. Please try again.</div>`);
                    $('#usorsPagination').empty();
                }
            });
        },
        render: function (usors, xhr) {
            taigaUpdateListCounts(xhr, usors.length, 'totalUsors', 'filteredUsors', 'selectedUsorsCount');
            if (usors.length === 0) {
                $('#usorsContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            usors.forEach(usor => {
                const statusInfo = taigaGetStatusInfo(usor);
                const statusBadge = taigaRenderStatusBadge(statusInfo);
                const assignedTo = usor.assigned_to_extra_info ? usor.assigned_to_extra_info.full_name_display : (usor.assigned_to ? 'User ID: ' + usor.assigned_to : 'Unassigned');
                const owner = usor.owner_extra_info ? usor.owner_extra_info.full_name_display : 'Unknown';

                const epicInfo = usor.epic_extra_info ? usor.epic_extra_info.subject : (usor.epic ? `Epik #${usor.epic}` : null);
                const epicHtml = epicInfo ? `<small class="text-muted d-block text-truncate">In Epik: <strong>${epicInfo}</strong></small>` : '';

                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card usor-card h-100" data-us-id="${usor.id}" data-us-ref="${usor.ref}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input story-checkbox" type="checkbox" value="${usor.id}" data-version="${usor.version}" data-subject="${usor.subject || 'Untitled Usor'}" data-ref="${usor.ref}" id="us-${usor.id}">
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    ${statusBadge}
                                    <small class="text-muted mt-1">#${usor.ref}</small>
                                </div>
                            </div>
                            <h6 class="card-title text-truncate">${usor.subject || 'Untitled Usor'}</h6>
                            <div class="card-text taiga-card-description text-muted small mb-0">${usor.description ? taigaRenderContent(usor.description) : ''}</div>
                            <div class="taiga-card-meta">
                                <small class="text-muted d-block text-truncate">Assigned: <strong>${assignedTo}</strong></small>
                                ${epicHtml}
                            </div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('usor', usor, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <a href="usor.php?id=${usor.id}" class="btn btn-sm btn-outline-primary">View</a>
                            <button class="btn btn-sm btn-outline-secondary edit-usor" data-usor-id="${usor.id}" data-bs-toggle="modal" data-bs-target="#singleUsorModal">Edit</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#usorsContent').html(html);
            taigaBindSelectionLogic('story-checkbox', taigaBulkSelectionCallback, 'usors');
            $('.story-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.usors.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.story-checkbox').length;
            var checked = $('.story-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
        },
        populateBulkCreateDropdowns: function() {
            TTTaiga.Form.populateDropdowns({
                projectSel: '#bulkCreateProject',
                statusSel: '#bulkCreateStatus',
                statusType: 'us',
                assigneeSel: '#bulkCreateAssignee'
            });
        },
        submitBulkCreate: function() {
            const text = $('#bulkCreateText').val().trim();
            if (!text) {
                TTTaiga.UI.notify('Please enter some usors to create', 'warning');
                return;
            }

            const projectId = $('#bulkCreateProject').val();
            if (!projectId) {
                TTTaiga.UI.notify('Please select a project', 'warning');
                return;
            }

            const $btn = $('#submitBulkCreate');
            $btn.prop('disabled', true).text('Creating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            const stories = text.split('\n').filter(line => line.trim()).map(line => {
                const parts = line.split('|');
                return { 
                    subject: parts[0]?.trim() || 'Untitled Usor', 
                    description: parts[1]?.trim() || '', 
                    status: parts[2]?.trim() || $('#bulkCreateStatus').val() 
                };
            });

            let createdCount = 0;
            let errorCount = 0;

            stories.forEach(story => {
                TTTaiga.API.post('api.php/userstories', {
                    subject: story.subject,
                    description: story.description,
                    project: parseInt(projectId),
                    status: story.status
                }, {
                    success: () => { createdCount++; checkFinished(); },
                    onError: () => { errorCount++; checkFinished(); }
                });
            });

            function checkFinished() {
                if (createdCount + errorCount === stories.length) {
                    $btn.prop('disabled', false).text('Create Stories');
                    $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                    TTTaiga.UI.notify(`Created ${createdCount} usors, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                    if (errorCount === 0) {
                        $('#bulkCreateModal').modal('hide');
                        TTTaiga.Usors.load();
                    }
                }
            }
        },

        deleteBulk: function() {
            const selectedUsors = [];
            $('#usorsContent input.story-checkbox:checked').each(function () {
                selectedUsors.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedUsors.length === 0) {
                TTTaiga.UI.notify('Please select at least one usor to delete', 'warning');
                return;
            }

            const $btn = $('#confirmBulkDelete');
            $btn.prop('disabled', true).text('Deleting...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/userstories/', selectedUsors, 'DELETE', null, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Delete Usors');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Deleted ${successCount} usors, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) {
                    $('#bulkDeleteModal').modal('hide');
                    TTTaiga.Usors.load();
                }
            }, { showProgress: true });
        }
    };

    $('#bulkCreateModal').on('show.bs.modal', function() { 
        TTTaiga.Usors.populateBulkCreateDropdowns(); 
    });
    $('#submitBulkCreate').on('click', function() { TTTaiga.Usors.submitBulkCreate(); });
    $('#bulkUpdateModal').on('show.bs.modal', function() { TTTaiga.BulkUpdate.open('usors'); });
    $('#submitBulkUpdate').on('click', function() { TTTaiga.BulkUpdate.submit('usors'); });
    $('#confirmBulkDelete').on('click', function() { TTTaiga.Usors.deleteBulk(); });
    $('#submitSingleUsor').on('click', function () {
        TTTaiga.Form.saveModal({
            endpoint: 'api.php/userstories',
            formId: 'singleUsorForm',
            modalId: 'singleUsorModal',
            listFn: () => TTTaiga.Usors.load(),
            data: {
                project: parseInt($('#singleUsorProject').val()),
                subject: $('#singleUsorSubject').val(),
                description: $('#singleUsorDescription').val(),
                status: $('#singleUsorStatus').val() ? parseInt($('#singleUsorStatus').val()) : undefined,
                assigned_to: $('#singleUsorAssignee').val() ? parseInt($('#singleUsorAssignee').val()) : undefined,
                epic: $('#singleUsorEpic').val() ? parseInt($('#singleUsorEpic').val()) : undefined
            }
        });
    });
    $('#singleUsorModal').on('show.bs.modal', function (e) {
        const id = $(e.relatedTarget).data('usor-id');
        if (!id || Number(id) <= 0) {
            $('#singleUsorModalLabel').text('Create User Story');
            $('#singleUsorId').val('');
            $('#singleUsorVersion').val('');
            $('#singleUsorForm')[0].reset();
            TTTaiga.Form.populateDropdowns({
                projectSel: '#singleUsorProject',
                statusSel: '#singleUsorStatus',
                statusType: 'us',
                assigneeSel: '#singleUsorAssignee',
                epicSel: '#singleUsorEpic'
            });
            return;
        }
        $('#singleUsorModalLabel').text('Edit User Story');
        TTTaiga.API.get('api.php/userstories/' + id, {}, {
            success: function (usor) {
                $('#singleUsorId').val(usor.id);
                $('#singleUsorVersion').val(usor.version);
                $('#singleUsorSubject').val(usor.subject);
                $('#singleUsorDescription').val(usor.description);
                TTTaiga.Form.populateDropdowns({
                    projectSel: '#singleUsorProject',
                    statusSel: '#singleUsorStatus',
                    statusType: 'us',
                    assigneeSel: '#singleUsorAssignee',
                    epicSel: '#singleUsorEpic'
                }, {
                    project: usor.project,
                    status: usor.status,
                    assigned_to: usor.assigned_to,
                    epic: usor.epic,
                    project_label: usor.project_extra_info ? usor.project_extra_info.name : null
                });
            }
        });
    });

    taigaBindFilters((page) => TTTaiga.Usors.load(page));

    taigaApplyFiltersFromUrl()
        .then(page => TTTaiga.Usors.load(page))
        .catch(() => TTTaiga.Usors.load(1));
});

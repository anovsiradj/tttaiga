$(document).ready(function () {
    if (!window.taigaToken) {
        window.location.href = 'login.php';
        return;
    }

    const config = window.taigaConfig || {};
    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    TTTaiga.Issues = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page };

            $('#issuesContent').html(`
                <div class="loading-spinner text-center p-3">
                    <div class="spinner-border text-primary" role="status"></div>
                </div>
            `);

            TTTaiga.API.get('api.php/issues', params, {
                success: function (issues, status, xhr) {
                    this.render(issues, xhr);
                    taigaRenderPagination(xhr, '#issuesPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#issuesContent').html(`<div class="alert alert-danger">Unable to load issues. Please try again.</div>`);
                    $('#issuesPagination').empty();
                }
            });
        },
        render: function (issues, xhr) {
            taigaUpdateListCounts(xhr, issues.length, 'totalIssues', 'filteredIssues', 'selectionCount');
            if (issues.length === 0) {
                $('#issuesContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            issues.forEach(issue => {
                const statusInfo = taigaGetStatusInfo(issue);
                const statusBadge = taigaRenderStatusBadge(statusInfo);
                const assignedTo = issue.assigned_to_extra_info ? issue.assigned_to_extra_info.full_name_display : (issue.assigned_to ? 'User ID: ' + issue.assigned_to : 'Unassigned');
                const owner = issue.owner_extra_info ? issue.owner_extra_info.full_name_display : 'Unknown';

                const refHtml = issue.ref ? `<small class="text-muted mt-1">#${issue.ref}</small>` : '';

                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card issue-card h-100" data-issue-id="${issue.id}" data-issue-ref="${issue.ref}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input issue-checkbox" type="checkbox" value="${issue.id}" data-version="${issue.version}" data-subject="${issue.subject || 'Untitled Isu'}" data-ref="${issue.ref}" id="issue-${issue.id}">
                                </div>
                                <div class="d-flex flex-column align-items-end">
                                    ${statusBadge}
                                    ${refHtml}
                                </div>
                            </div>
                            <h6 class="card-title text-truncate">${issue.subject || 'Untitled Isu'}</h6>
                            <div class="card-text text-muted taiga-card-description small mb-0">${issue.description ? taigaRenderContent(issue.description) : ''}</div>
                            <div class="taiga-card-meta">
                                <small class="text-muted d-block text-truncate">Assigned: <strong>${assignedTo}</strong></small>
                            </div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('issue', issue, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <a href="isu.php?id=${issue.id}" class="btn btn-sm btn-outline-primary">View</a>
                            <button class="btn btn-sm btn-outline-secondary edit-isu" data-isu-id="${issue.id}" data-bs-toggle="modal" data-bs-target="#singleIsuModal">Edit</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#issuesContent').html(html);
            taigaBindSelectionLogic('issue-checkbox', taigaBulkSelectionCallback, 'issues');
            $('.issue-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.issues.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.issue-checkbox').length;
            var checked = $('.issue-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
        },
        populateBulkCreateDropdowns: function() {
            TTTaiga.Form.populateDropdowns({
                projectSel: '#bulkCreateIssueProject',
                statusSel: '#bulkCreateIssueStatus',
                statusType: 'issue',
                assigneeSel: '#bulkCreateIssueAssignee'
            });
        },
        submitBulkCreate: function() {
            const text = $('#bulkCreateIssueText').val().trim();
            if (!text) { TTTaiga.UI.notify('Please enter some isus', 'warning'); return; }

            const projectId = $('#bulkCreateIssueProject').val();
            if (!projectId) { TTTaiga.UI.notify('Please select a project', 'warning'); return; }

            const $btn = $('#submitBulkCreateIssues');
            $btn.prop('disabled', true).text('Creating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            const items = taigaParseBulkLines(text);
            let createdCount = 0; let errorCount = 0;

            items.forEach(item => {
                TTTaiga.API.post('api.php/issues', {
                    project: parseInt(projectId),
                    subject: item.subject,
                    description: item.description || '',
                    status: $('#bulkCreateIssueStatus').val() ? parseInt($('#bulkCreateIssueStatus').val()) : undefined,
                    assigned_to: $('#bulkCreateIssueAssignee').val() ? parseInt($('#bulkCreateIssueAssignee').val()) : undefined
                }, {
                    success: () => { createdCount++; checkFinished(); },
                    onError: () => { errorCount++; checkFinished(); }
                });
            });

            function checkFinished() {
                if (createdCount + errorCount === items.length) {
                    $btn.prop('disabled', false).text('Create Isus');
                    $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                    TTTaiga.UI.notify(`Created ${createdCount} isus, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                    if (errorCount === 0) {
                        $('#issueBulkCreateModal').modal('hide');
                        TTTaiga.Issues.load();
                    }
                }
            }
        },

        deleteBulk: function() {
            const selectedIssues = [];
            $('#issuesContent input.issue-checkbox:checked').each(function () {
                selectedIssues.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedIssues.length === 0) { TTTaiga.UI.notify('Please select at least one isu', 'warning'); return; }

            const $btn = $('#confirmBulkDeleteIssues');
            $btn.prop('disabled', true).text('Deleting...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/issues/', selectedIssues, 'DELETE', null, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Delete Isus');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Deleted ${successCount} isus, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) { $('#issueBulkDeleteModal').modal('hide'); TTTaiga.Issues.load(); }
            }, { showProgress: true });
        }
    };

    $('#issueBulkCreateModal').on('show.bs.modal', () => TTTaiga.Issues.populateBulkCreateDropdowns());
    $('#submitBulkCreateIssues').on('click', () => TTTaiga.Issues.submitBulkCreate());
    $('#issueBulkUpdateModal').on('show.bs.modal', () => TTTaiga.BulkUpdate.open('issues'));
    $('#submitBulkIssueUpdate').on('click', () => TTTaiga.BulkUpdate.submit('issues'));
    $('#confirmBulkDeleteIssues').on('click', () => TTTaiga.Issues.deleteBulk());
    $('#submitSingleIsu').on('click', function () {
        TTTaiga.Form.saveModal({
            endpoint: 'api.php/issues',
            formId: 'singleIsuForm',
            modalId: 'singleIsuModal',
            listFn: () => TTTaiga.Issues.load(),
            data: {
                project: parseInt($('#singleIsuProject').val()),
                subject: $('#singleIsuSubject').val(),
                description: $('#singleIsuDescription').val(),
                status: $('#singleIsuStatus').val() ? parseInt($('#singleIsuStatus').val()) : undefined,
                assigned_to: $('#singleIsuAssignee').val() ? parseInt($('#singleIsuAssignee').val()) : undefined,
                issue_type: $('#singleIsuType').val() ? parseInt($('#singleIsuType').val()) : undefined,
                priority: $('#singleIsuPriority').val() ? parseInt($('#singleIsuPriority').val()) : undefined,
                severity: $('#singleIsuSeverity').val() ? parseInt($('#singleIsuSeverity').val()) : undefined
            }
        });
    });
    $('#singleIsuModal').on('show.bs.modal', function (e) {
        const id = $(e.relatedTarget).data('isu-id');
        if (!id || Number(id) <= 0) {
            $('#singleIsuModalLabel').text('Create Issue');
            $('#singleIsuId').val('');
            $('#singleIsuVersion').val('');
            $('#singleIsuForm')[0].reset();
            TTTaiga.Form.populateDropdowns({
                projectSel: '#singleIsuProject',
                statusSel: '#singleIsuStatus',
                statusType: 'issue',
                assigneeSel: '#singleIsuAssignee'
            });
            return;
        }
        $('#singleIsuModalLabel').text('Edit Issue');
        TTTaiga.API.get('api.php/issues/' + id, {}, {
            success: function (issue) {
                $('#singleIsuId').val(issue.id);
                $('#singleIsuVersion').val(issue.version);
                $('#singleIsuSubject').val(issue.subject);
                $('#singleIsuDescription').val(issue.description);
                TTTaiga.Form.populateDropdowns({
                    projectSel: '#singleIsuProject',
                    statusSel: '#singleIsuStatus',
                    statusType: 'issue',
                    assigneeSel: '#singleIsuAssignee',
                    typeSel: '#singleIsuType',
                    prioritySel: '#singleIsuPriority',
                    severitySel: '#singleIsuSeverity'
                }, {
                    project: issue.project,
                    status: issue.status,
                    assigned_to: issue.assigned_to,
                    project_label: issue.project_extra_info ? issue.project_extra_info.name : null,
                    type: issue.issue_type,
                    priority: issue.priority,
                    severity: issue.severity
                });
            }
        });
    });

    taigaBindFilters((page) => TTTaiga.Issues.load(page));

    taigaApplyFiltersFromUrl()
        .then(page => TTTaiga.Issues.load(page))
        .catch(() => TTTaiga.Issues.load(1));
});

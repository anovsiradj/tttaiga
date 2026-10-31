$(document).ready(function () {
    if (!window.taigaToken) { window.location.href = 'login.php'; return; }

    const config = window.taigaConfig || {};
    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    TTTaiga.Projects = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page, member: window.taigaModel?.id };
            if (!params.member) delete params.member;

            $('#projectsContent').html(`<div class="loading-spinner text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>`);

            TTTaiga.API.get('api.php/projects', params, {
                success: function (projects, status, xhr) {
                    this.render(projects, xhr);
                    taigaRenderPagination(xhr, '#projectsPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#projectsContent').html(`<div class="alert alert-danger">Failed to load projects.</div>`);
                }
            });
        },
        render: function (projects, xhr) {
            taigaUpdateListCounts(xhr, projects.length, 'totalProjects', 'filteredProjects', 'selectedProjectsCount');
            if (projects.length === 0) {
                $('#projectsContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            projects.forEach(project => {
                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card project-card h-100" data-project-id="${project.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input project-checkbox" type="checkbox" value="${project.id}" data-version="${project.version}" data-subject="${project.name}" data-name="${project.name}">
                                </div>
                                <span class="badge bg-${project.is_private ? 'secondary' : 'primary'}">${project.is_private ? 'Private' : 'Public'}</span>
                            </div>
                            <h6 class="card-title text-truncate">${project.name}</h6>
                            <div class="card-text taiga-card-description text-muted small mb-0">${project.description ? taigaRenderContent(project.description) : ''}</div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('project', project, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <button class="btn btn-sm btn-outline-primary view-project" data-project-id="${project.id}">View</button>
                            <button class="btn btn-sm btn-outline-secondary edit-project" data-project-id="${project.id}" data-bs-toggle="modal" data-bs-target="#singleProjectModal">Edit</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#projectsContent').html(html);
            taigaBindSelectionLogic('project-checkbox', taigaBulkSelectionCallback, 'projects');
            $('.project-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.projects.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.project-checkbox').length;
            var checked = $('.project-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
            $('.view-project').off('click').on('click', function() { window.location.href = `project.php?id=${$(this).data('project-id')}`; });
        },
        submitBulkCreate: function() {
            const text = $('#bulkCreateProjectText').val().trim();
            if (!text) { TTTaiga.UI.notify('Please enter some projects', 'warning'); return; }

            const $btn = $('#submitBulkCreateProjects');
            $btn.prop('disabled', true).text('Creating...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            const projects = taigaParseBulkLines(text);
            let createdCount = 0; let errorCount = 0;

            projects.forEach(p => {
                TTTaiga.API.post('api.php/projects', { name: p.name, description: p.description || '' }, {
                    success: () => { createdCount++; checkFinished(); },
                    onError: () => { errorCount++; checkFinished(); }
                });
            });

            function checkFinished() {
                if (createdCount + errorCount === projects.length) {
                    $btn.prop('disabled', false).text('Create Projects');
                    $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                    TTTaiga.UI.notify(`Created ${createdCount} projects, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                    if (errorCount === 0) { $('#bulkCreateProjectModal').modal('hide'); TTTaiga.Projects.load(); }
                }
            }
        },

        deleteBulk: function() {
            const selectedProjects = [];
            $('#projectsContent input.project-checkbox:checked').each(function () {
                selectedProjects.push({ id: $(this).val(), version: $(this).data('version') });
            });

            if (selectedProjects.length === 0) { TTTaiga.UI.notify('Please select at least one project', 'warning'); return; }

            const $btn = $('#confirmBulkDeleteProjects');
            $btn.prop('disabled', true).text('Deleting...');
            $('.filter-toolbar, .tttaiga-bulk-handle').addClass('disabled');

            taigaExecuteBulkParallel('/projects/', selectedProjects, 'DELETE', null, (successCount, errorCount) => {
                $btn.prop('disabled', false).text('Delete Projects');
                $('.filter-toolbar, .tttaiga-bulk-handle').removeClass('disabled');
                TTTaiga.UI.notify(`Deleted ${successCount} projects, ${errorCount} failed.`, errorCount === 0 ? 'success' : 'danger');
                if (errorCount === 0) {
                    $('#bulkDeleteProjectModal').modal('hide');
                    TTTaiga.Projects.load();
                }
            }, { showProgress: true });
        }
    };

    $('#submitSingleProject').on('click', function () {
        TTTaiga.Form.saveModal({
            endpoint: 'api.php/projects',
            formId: 'singleProjectForm',
            modalId: 'singleProjectModal',
            listFn: () => TTTaiga.Projects.load(),
            data: {
                name: $('#singleProjectName').val(),
                description: $('#singleProjectDescription').val(),
                is_private: $('#singleProjectPrivate').is(':checked')
            }
        });
    });
    $('#singleProjectModal').on('show.bs.modal', function (e) {
        const id = $(e.relatedTarget).data('project-id');
        if (!id) {
            $('#singleProjectModalLabel').text('Create Project');
            $('#singleProjectId').val('');
            $('#singleProjectVersion').val('');
            $('#singleProjectForm')[0].reset();
            return;
        }
        $('#singleProjectModalLabel').text('Edit Project');
        TTTaiga.API.get('api.php/projects/' + id, {}, {
            success: function (project) {
                $('#singleProjectId').val(project.id);
                $('#singleProjectVersion').val(project.version);
                $('#singleProjectName').val(project.name);
                $('#singleProjectDescription').val(project.description);
                $('#singleProjectPrivate').prop('checked', project.is_private);
            }
        });
    });
    $('#bulkUpdateProjectModal').on('show.bs.modal', () => TTTaiga.BulkUpdate.open('projects'));
    $('#submitBulkProjectUpdate').on('click', () => TTTaiga.BulkUpdate.submit('projects'));
    $('#confirmBulkDeleteProjects').on('click', () => TTTaiga.Projects.deleteBulk());
    $('#submitBulkCreateProjects').on('click', () => TTTaiga.Projects.submitBulkCreate());
    $('#previewBulkCreateProjects').on('click', function() {
        const text = $('#bulkCreateProjectText').val().trim();
        const $preview = $('#bulkCreateProjectPreview');
        if (!text) { $preview.addClass('d-none'); return; }
        const items = taigaParseBulkLines(text);
        $preview.html('<strong>Preview (' + items.length + ' projects):</strong><ul class="mb-0 mt-1">' + items.map(i => '<li>' + i.name + (i.description ? ' | ' + i.description : '') + '</li>').join('') + '</ul>').removeClass('d-none');
    });

    taigaBindFilters((page) => TTTaiga.Projects.load(page));
    taigaApplyFiltersFromUrl()
        .then(page => TTTaiga.Projects.load(page))
        .catch(() => TTTaiga.Projects.load(1));
});

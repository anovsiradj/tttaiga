$(document).ready(function () {
    if (!window.taigaToken) { window.location.href = 'login.php'; return; }

    const config = window.taigaConfig || {};
    window.apiUrl = window.apiUrl || config.servers?.default?.api_url;

    TTTaiga.Proyeks = {
        load: function (page = 1) {
            taigaReplaceUrlQuery({ ...taigaGetFilterParams(), page: page });
            const params = { ...taigaGetFilterParams(), page: page, member: window.taigaModel?.id };
            if (!params.member) delete params.member;

            $('#proyeksContent').html(`<div class="loading-spinner text-center p-3"><div class="spinner-border text-primary" role="status"></div></div>`);

            TTTaiga.API.get('api.php/projects', params, {
                success: function (proyeks, status, xhr) {
                    this.render(proyeks, xhr);
                    taigaRenderPagination(xhr, '#proyeksPagination', (page) => this.load(page));
                }.bind(this),
                onError: function (xhr) {
                    $('#proyeksContent').html(`<div class="alert alert-danger">Failed to load proyeks.</div>`);
                }
            });
        },
        render: function (proyeks, xhr) {
            taigaUpdateListCounts(xhr, proyeks.length, 'totalProyeks', 'filteredProyeks', 'selectedProyeksCount');
            if (proyeks.length === 0) {
                $('#proyeksContent').html(`<div class="text-muted italic p-3 text-center"><em>(kosong)</em></div>`);
                return;
            }
            let html = '<div class="row taiga-list-grid">';
            proyeks.forEach(proyek => {
                html += `
                <div class="col-md-6 col-lg-4">
                    <div class="card taiga-list-card proyek-card h-100" data-proyek-id="${proyek.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <div class="form-check">
                                    <input class="form-check-input proyek-checkbox" type="checkbox" value="${proyek.id}" data-version="${proyek.version}" data-subject="${proyek.name}" data-name="${proyek.name}">
                                </div>
                                <span class="badge bg-${proyek.is_private ? 'secondary' : 'primary'}">${proyek.is_private ? 'Private' : 'Public'}</span>
                            </div>
                            <h6 class="card-title text-truncate">${proyek.name}</h6>
                            <div class="card-text taiga-card-description text-muted small mb-0">${proyek.description ? taigaRenderContent(proyek.description) : ''}</div>
                            <div class="taiga-card-meta mt-2 d-flex justify-content-between">
                                <small class="text-muted text-truncate">Created: <strong>${taigaFormatDateCard(proyek.created_date)}</strong></small>
                                <small class="text-muted text-truncate">Modified: <strong>${taigaFormatDateCard(proyek.modified_date)}</strong></small>
                            </div>
                        </div>
                        <div class="card-footer taiga-card-actions">
                            <a href="${taigaItemPermalink('project', proyek, window.apiUrl) || '#'}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-secondary">Taiga</a>
                            <button class="btn btn-sm btn-outline-primary view-proyek" data-proyek-id="${proyek.id}">View</button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
            $('#proyeksContent').html(html);
            taigaBindSelectionLogic('proyek-checkbox', taigaBulkSelectionCallback, 'proyeks');
            $('.proyek-checkbox').each(function() {
                var id = $(this).val();
                if (TTTaiga.selectedItems.proyeks.some(i => i.id == id)) {
                    $(this).prop('checked', true);
                    $(this).closest('.card').addClass('taiga-selected');
                }
            });
            var total = $('.proyek-checkbox').length;
            var checked = $('.proyek-checkbox:checked').length;
            $('#masterCheckbox').prop('checked', total > 0 && checked === total);
            $('.view-proyek').off('click').on('click', function() { window.location.href = `proyek.php?id=${$(this).data('proyek-id')}`; });
        }
    };

    $('#bulkUpdateProyekModal').on('show.bs.modal', () => TTTaiga.BulkUpdate.open('proyeks'));
    $('#submitBulkProyekUpdate').on('click', () => TTTaiga.BulkUpdate.submit('proyeks'));

    taigaBindFilters((page) => TTTaiga.Proyeks.load(page));
    taigaApplyFiltersFromUrl()
        .then(page => TTTaiga.Proyeks.load(page))
        .catch(() => TTTaiga.Proyeks.load(1));
});
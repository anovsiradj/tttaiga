<!-- Bulk Delete Usor Modal -->
<div class="modal fade" id="bulkDeleteModal" tabindex="-1" aria-labelledby="bulkDeleteModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkDeleteModalLabel">Bulk Delete Usors</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete the selected usors? This action cannot be undone.</p>
				<div id="selectedUsorsList" class="small text-muted mb-3"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger tttaiga-bulk-handle" id="confirmBulkDelete">Delete Usors</button>
			</div>
		</div>
	</div>
</div>

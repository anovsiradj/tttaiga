<!-- Bulk Delete Epik Modal -->
<div class="modal fade" id="bulkDeleteEpicModal" tabindex="-1" aria-labelledby="bulkDeleteEpicModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkDeleteEpicModalLabel">Bulk Delete Epiks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete the selected epiks? This action cannot be undone.</p>
				<div id="selectedEpicsList" class="small text-muted mb-3"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger tttaiga-bulk-handle" id="confirmBulkDeleteEpics">Delete Epiks</button>
			</div>
		</div>
	</div>
</div>

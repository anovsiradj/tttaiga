<!-- Bulk Delete Task Modal -->
<div class="modal fade" id="bulkDeleteTaskModal" tabindex="-1" aria-labelledby="bulkDeleteTaskModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkDeleteTaskModalLabel">Bulk Delete Tasks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete the selected tasks? This action cannot be undone.</p>
				<div id="selectedTasksList" class="small text-muted mb-3"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger tttaiga-bulk-handle" id="confirmBulkDeleteTasks">Delete Tasks</button>
			</div>
		</div>
	</div>
</div>

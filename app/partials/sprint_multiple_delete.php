<!-- Bulk Delete Sprint Modal -->
<div class="modal fade" id="bulkDeleteSprintModal" tabindex="-1" aria-labelledby="bulkDeleteSprintModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkDeleteSprintModalLabel">Bulk Delete Sprints</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div class="alert alert-danger mb-3">This will delete the selected sprints.</div>
				<div id="selectedSprintsDeleteList"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger tttaiga-bulk-handle" id="confirmBulkDeleteSprints">Delete Sprints</button>
			</div>
		</div>
	</div>
</div>
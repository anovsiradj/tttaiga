<!-- Bulk Delete Project Modal -->
<div class="modal fade" id="bulkDeleteProjectModal" tabindex="-1" aria-labelledby="bulkDeleteProjectModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkDeleteProjectModalLabel">Bulk Delete Projects</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div class="alert alert-danger mb-3">This will delete the selected projects.</div>
				<div id="selectedProjectsDeleteList"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger tttaiga-bulk-handle" id="confirmBulkDeleteProjects">Delete Projects</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Create Sprint Modal -->
<div class="modal fade" id="bulkCreateSprintModal" tabindex="-1" aria-labelledby="bulkCreateSprintModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkCreateSprintModalLabel">Bulk Create Sprints</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div class="mb-3">
					<label class="form-label" for="bulkCreateSprintProject">Project</label>
					<select class="form-select" id="bulkCreateSprintProject" required></select>
				</div>
				<div class="row">
					<div class="col-md-6 mb-3">
						<label class="form-label" for="bulkCreateSprintStart">Default Start</label>
						<input type="date" class="form-control" id="bulkCreateSprintStart">
					</div>
					<div class="col-md-6 mb-3">
						<label class="form-label" for="bulkCreateSprintFinish">Default Finish</label>
						<input type="date" class="form-control" id="bulkCreateSprintFinish">
					</div>
				</div>
				<label class="form-label" for="bulkCreateSprintText">Sprints</label>
				<textarea class="form-control" id="bulkCreateSprintText" rows="8" placeholder="Sprint Name|Description optional"></textarea>
				<div class="form-text">One sprint per line. Description is optional.</div>
				<div id="bulkCreateSprintPreview" class="border rounded p-2 bg-body-tertiary mt-3 d-none"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-outline-primary tttaiga-bulk-handle" id="previewBulkCreateSprints">Preview</button>
				<button type="button" class="btn btn-success tttaiga-bulk-handle" id="submitBulkCreateSprints">Create Sprints</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Sprint Modal -->
<div class="modal fade" id="bulkUpdateSprintModal" tabindex="-1" aria-labelledby="bulkUpdateSprintModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateSprintModalLabel">Bulk Update Sprints</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkUpdateSprintForm">
					<div class="mb-3">
						<label class="form-label" for="bulkUpdateSprintProject">Project</label>
						<select class="form-select" id="bulkUpdateSprintProject"></select>
					</div>
					<div class="mb-3">
						<label class="form-label">Selected Sprints to Update</label>
						<div id="bulkUpdateSprints" class="border p-3" style="max-height: 200px; overflow-y: auto;">
							<div class="text-center text-muted">Loading selected sprints...</div>
						</div>
						<div class="form-text">Sprints you selected in the list will appear here.</div>
					</div>
					<div class="mb-3">
						<label class="form-label">Status</label>
						<select class="form-select" id="bulkUpdateClosed" data-field="closed">
							<option value="">No Change</option>
							<option value="false">Open</option>
							<option value="true">Closed</option>
						</select>
					</div>
					<div class="mb-3">
						<label class="form-label">Name</label>
						<input type="text" class="form-control" id="bulkUpdateSprintName" placeholder="Leave empty for no change" data-field="name">
					</div>
					<div class="mb-3">
						<label class="form-label">Description (optional)</label>
						<textarea class="form-control" id="bulkUpdateDescription" rows="3" placeholder="Leave empty for no change" data-field="description"></textarea>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkUpdateSprint">Update Sprints</button>
			</div>
		</div>
	</div>
</div>

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

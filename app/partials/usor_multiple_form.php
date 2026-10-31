<!-- Bulk Create Usor Modal -->
<div class="modal fade" id="bulkCreateModal" tabindex="-1" aria-labelledby="bulkCreateModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkCreateModalLabel">Bulk Create Usors</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkCreateForm">
					<div id="bulkCreateSearchContext" class="alert alert-info py-2 d-none">
						<i class="bi bi-search me-2"></i>
						Active Search: <strong id="activeSearchQuery"></strong>
						<div class="form-check d-inline-block ms-3">
							<input class="form-check-input" type="checkbox" id="prependSearchCheck" checked>
							<label class="form-check-label small" for="prependSearchCheck">Prepend to subjects</label>
						</div>
					</div>
					<div class="mb-3">
						<label class="form-label">Usors (one per line)</label>
						<textarea class="form-control" id="bulkCreateText" rows="10" placeholder="Enter usors, one per line. Format: Subject|Description (optional)|Status (optional)" required></textarea>
						<small class="form-text text-muted">Example: Login page|Create login form with validation|new</small>
					</div>
					<div class="row">
						<div class="col-md-6">
							<label class="form-label">Project</label>
							<select class="form-select" id="bulkCreateProject" required>
								<option value="">Select Project</option>
							</select>
						</div>
						<div class="col-md-6">
							<label class="form-label">Epik (optional)</label>
							<select class="form-select" id="bulkCreateEpic">
								<option value="">Select Epik</option>
							</select>
						</div>
					</div>
					<div class="row mt-3">
						<div class="col-md-4">
							<label class="form-label">Default Status</label>
							<select class="form-select" id="bulkCreateStatus"></select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="bulkCreateAssignee"></select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Priority (optional)</label>
							<input type="number" class="form-control" id="bulkCreatePriority" min="1" max="100" value="10">
						</div>
					</div>
				</form>
				<div id="bulkCreatePreview" class="mt-3 d-none">
					<h6>Preview:</h6>
					<div class="border rounded p-2 bg-body-tertiary" id="previewContent"></div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-outline-primary tttaiga-bulk-handle" id="previewBulkCreate">Preview</button>
				<button type="button" class="btn btn-success tttaiga-bulk-handle" id="submitBulkCreate">Create Usors</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Usor Modal -->
<div class="modal fade" id="bulkUpdateModal" tabindex="-1" aria-labelledby="bulkUpdateModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateModalLabel">Bulk Update Usors</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkUpdateForm">
					<div class="mb-3">
						<label class="form-label" for="bulkUpdateProjectOptions">Project for Options</label>
						<select class="form-select" id="bulkUpdateProjectOptions">
							<option value="">Select project to load statuses and members</option>
						</select>
						<div class="form-text">Autofilled from the active filter when available. You can still change it here.</div>
					</div>
					<div class="mb-3">
						<label class="form-label">Select Usors to Update</label>
						<div id="bulkUpdateUsors" class="border p-3" style="max-height: 200px; overflow-y: auto;">
							<div class="text-center text-muted">
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading usors...</span>
								</div>
								<p class="mt-2 mb-0">Loading usors...</p>
							</div>
						</div>
						<div class="form-text">Select the usors you want to update</div>
					</div>
					<div class="row">
						<div class="col-md-4">
							<label class="form-label">Status</label>
							<select class="form-select" id="bulkUpdateStatus" data-field="status">
								<option value="">No Change</option>
							</select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="bulkUpdateAssignee" data-field="assignee">
								<option value="">No Change</option>
							</select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Priority</label>
							<select class="form-select" id="bulkUpdatePriority" data-field="priority">
								<option value="">No Change</option>
								<option value="1">1 - Highest</option>
								<option value="2">2</option>
								<option value="3">3</option>
								<option value="4">4</option>
								<option value="5">5 - Lowest</option>
							</select>
						</div>
					</div>
					<div class="mb-3 mt-3">
						<label class="form-label">Description (optional)</label>
						<textarea class="form-control" id="bulkUpdateDescription" rows="3" placeholder="Leave empty for no change" data-field="description"></textarea>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkUpdate">Update Usors</button>
			</div>
		</div>
	</div>
</div>

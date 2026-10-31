<!-- Bulk Create Epik Modal -->
<div class="modal fade" id="bulkCreateEpicModal" tabindex="-1" aria-labelledby="bulkCreateEpicModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkCreateEpicModalLabel">Bulk Create Epiks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkCreateEpicForm">
					<div class="mb-3">
						<label class="form-label">Epiks (one per line)</label>
						<textarea class="form-control" id="bulkCreateEpicText" rows="10" placeholder="Enter epiks, one per line. Format: Subject|Description (optional)|Status (optional)" required></textarea>
						<small class="form-text text-muted">Example: Authentication Module|Implement login and registration|new</small>
					</div>
					<div class="row">
						<div class="col-md-6">
							<label class="form-label">Project</label>
							<select class="form-select" id="bulkCreateEpicProject" required>
								<option value="">Select Project</option>
							</select>
						</div>
						<div class="col-md-6">
							<label class="form-label">Default Status</label>
							<select class="form-select" id="bulkCreateEpicStatus">
								<option value="">Select Status</option>
							</select>
						</div>
					</div>
					<div class="row mt-3">
						<div class="col-md-4">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="bulkCreateEpicAssignee"></select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Color (optional)</label>
							<input type="color" class="form-control form-control-color" id="bulkCreateEpicColor" value="#fd7e14">
						</div>
						<div class="col-md-4">
							<label class="form-label">Priority (optional)</label>
							<input type="number" class="form-control" id="bulkCreateEpicPriority" min="1" max="100" value="10">
						</div>
					</div>
				</form>
				<div id="bulkCreateEpicPreview" class="mt-3 d-none">
					<h6>Preview:</h6>
					<div class="border rounded p-2 bg-body-tertiary" id="epicPreviewContent"></div>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-outline-primary tttaiga-bulk-handle" id="previewBulkCreateEpic">Preview</button>
				<button type="button" class="btn btn-success tttaiga-bulk-handle" id="submitBulkCreateEpic">Create Epiks</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Epik Modal -->
<div class="modal fade" id="bulkUpdateEpicModal" tabindex="-1" aria-labelledby="bulkUpdateEpicModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateEpicModalLabel">Bulk Update Epiks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkUpdateEpicForm">
					<div class="mb-3">
						<label class="form-label" for="bulkUpdateEpicProject">Project for Options</label>
						<select class="form-select" id="bulkUpdateEpicProject">
							<option value="">Select project to load statuses and members</option>
						</select>
						<div class="form-text">Autofilled from the active filter when available. You can still change it here.</div>
					</div>
					<div class="mb-3">
						<label class="form-label">Select Epiks to Update</label>
						<div id="bulkUpdateEpics" class="border p-3" style="max-height: 200px; overflow-y: auto;">
							<div class="text-center text-muted">
								<div class="spinner-border spinner-border-sm" role="status">
									<span class="visually-hidden">Loading epiks...</span>
								</div>
								<p class="mt-2 mb-0">Loading epiks...</p>
							</div>
						</div>
						<div class="form-text">Select the epiks you want to update</div>
					</div>
					<div class="row">
						<div class="col-md-4">
							<label class="form-label">Status</label>
							<select class="form-select" id="bulkUpdateEpicStatus" data-field="status">
								<option value="">No Change</option>
							</select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="bulkUpdateEpicAssignee" data-field="assignee">
								<option value="">No Change</option>
							</select>
						</div>
						<div class="col-md-4">
							<label class="form-label">Priority</label>
							<select class="form-select" id="bulkUpdateEpicPriority" data-field="priority">
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
						<textarea class="form-control" id="bulkUpdateEpicDescription" rows="3" placeholder="Leave empty for no change" data-field="description"></textarea>
					</div>
					<div class="mb-3">
						<label class="form-label">Color (optional)</label>
						<input type="color" class="form-control form-control-color" id="bulkUpdateEpicColor" data-field="color">
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkUpdateEpic">Update Epiks</button>
			</div>
		</div>
	</div>
</div>

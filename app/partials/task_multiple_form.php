<!-- Bulk Create Task Modal -->
<div class="modal fade" id="bulkCreateTaskModal" tabindex="-1" aria-labelledby="bulkCreateTaskModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkCreateTaskModalLabel">Bulk Create Tasks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div id="bulkTaskSearchContext" class="alert alert-info py-1 mb-3 d-none">
					<i class="bi bi-search me-2"></i>
					Active Search: <strong id="activeTaskSearchQuery"></strong>
					<div class="form-check d-inline-block ms-3">
						<input class="form-check-input" type="checkbox" id="prependTaskSearchCheck" checked>
						<label class="form-check-label small" for="prependTaskSearchCheck">Prepend to subjects</label>
					</div>
				</div>
				<div class="mb-3">
					<label for="bulkTaskTitles" class="form-label">Task Titles (one per line)</label>
					<textarea class="form-control" id="bulkTaskTitles" rows="5" placeholder="Enter task titles, one per line\nExample:\nDesign database schema\nImplement user authentication\nCreate API endpoints"></textarea>
					<div class="form-text">Enter each task title on a separate line</div>
				</div>

				<div class="row">
					<div class="col-md-6">
						<div class="mb-3">
							<label for="bulkTaskStatus" class="form-label">Status</label>
							<select class="form-select" id="bulkTaskStatus"></select>
						</div>
						<div class="mb-3">
							<label for="bulkTaskAssignee" class="form-label">Assigned To</label>
							<select class="form-select" id="bulkTaskAssignee"></select>
						</div>
					</div>
					<div class="col-md-6">
						<div class="mb-3">
							<label for="bulkTaskProject" class="form-label">Project</label>
							<select class="form-select" id="bulkTaskProject">
								<option value="">Loading projects...</option>
							</select>
						</div>
					</div>
				</div>

				<div class="mb-3">
					<label for="bulkTaskUserStory" class="form-label">Usor</label>
					<select class="form-select" id="bulkTaskUserStory">
						<option value="">Loading usors...</option>
					</select>
				</div>

				<div class="mb-3">
					<label for="bulkTaskDescription" class="form-label">Description (applies to all tasks)</label>
					<textarea class="form-control" id="bulkTaskDescription" rows="3" placeholder="Optional description that will be applied to all created tasks"></textarea>
				</div>

				<div id="bulkTaskPreview" class="alert alert-info">
					<p class="mb-0">Preview will appear here after clicking "Preview"</p>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-info tttaiga-bulk-handle" id="previewBulkTaskCreate">Preview</button>
				<button type="button" class="btn btn-success tttaiga-bulk-handle" id="submitBulkTaskCreate">Create Tasks</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Task Modal -->
<div class="modal fade" id="bulkUpdateTaskModal" tabindex="-1" aria-labelledby="bulkUpdateTaskModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateTaskModalLabel">Bulk Update Tasks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<div class="mb-3">
					<label for="bulkUpdateTaskProject" class="form-label">Project for Options</label>
					<select class="form-select" id="bulkUpdateTaskProject">
						<option value="">Select project to load statuses, usors, sprints, and members</option>
					</select>
					<div class="form-text">Autofilled from the active filter when available. You can still change it here.</div>
				</div>
				<div class="mb-3">
					<label class="form-label">Select Tasks to Update</label>
					<div id="bulkUpdateTaskList" class="border p-3" style="max-height: 200px; overflow-y: auto;">
						<div class="text-center text-muted">
							<div class="spinner-border spinner-border-sm" role="status">
								<span class="visually-hidden">Loading tasks...</span>
							</div>
							<p class="mt-2 mb-0">Loading tasks...</p>
						</div>
					</div>
					<div class="form-text">Select the tasks you want to update</div>
				</div>

				<div class="mb-3">
					<label for="bulkUpdateTaskStatus" class="form-label">Update Status</label>
					<select class="form-select" id="bulkUpdateTaskStatus" data-field="status">
						<option value="">No Change</option>
					</select>
					<div class="form-text">Leave as "No Change" to keep current status</div>
				</div>

				<div class="mb-3">
					<label for="bulkUpdateTaskUsor" class="form-label">Update Usor</label>
					<select class="form-select" id="bulkUpdateTaskUsor" data-field="usor">
						<option value="">No Change</option>
						<option value="null">None (Unassign)</option>
					</select>
					<div class="form-text">Leave as "No Change" to keep current usor</div>
				</div>

				<div class="mb-3">
					<label for="bulkUpdateTaskSprint" class="form-label">Update Sprint</label>
					<select class="form-select" id="bulkUpdateTaskSprint" data-field="sprint">
						<option value="">No Change</option>
						<option value="null">None (Unassign)</option>
					</select>
					<div class="form-text">Leave as "No Change" to keep current sprint</div>
				</div>


				<div class="mb-3">
					<label for="bulkUpdateTaskAssignee" class="form-label">Assign To</label>
					<select class="form-select" id="bulkUpdateTaskAssignee" data-field="assignee">
						<option value="">No Change</option>
					</select>
					<div class="form-text">Leave as "No Change" to keep current assignment</div>
				</div>

				<div class="alert alert-warning">
					<h6 class="alert-heading">⚠️ Warning</h6>
					<p class="mb-0">This action will update all selected tasks with the chosen settings. This cannot be undone.</p>
				</div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkTaskUpdate">Update Tasks</button>
			</div>
		</div>
	</div>
</div>

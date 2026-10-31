<!-- Bulk Create Project Modal -->
<div class="modal fade" id="bulkCreateProjectModal" tabindex="-1" aria-labelledby="bulkCreateProjectModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkCreateProjectModalLabel">Bulk Create Projects</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<label class="form-label" for="bulkCreateProjectText">Projects</label>
				<textarea class="form-control" id="bulkCreateProjectText" rows="8" placeholder="Project Name|Description optional"></textarea>
				<div class="form-text">One project per line. Description is optional.</div>
				<div id="bulkCreateProjectPreview" class="border rounded p-2 bg-body-tertiary mt-3 d-none"></div>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-outline-primary tttaiga-bulk-handle" id="previewBulkCreateProjects">Preview</button>
				<button type="button" class="btn btn-success tttaiga-bulk-handle" id="submitBulkCreateProjects">Create Projects</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Project Modal -->
<div class="modal fade" id="bulkUpdateProjectModal" tabindex="-1" aria-labelledby="bulkUpdateProjectModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateProjectModalLabel">Bulk Update Projects</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkUpdateProjectForm">
					<div class="mb-3">
						<label class="form-label">Name Prefix</label>
						<div class="input-group">
							<span class="input-group-text">[</span>
							<input type="text" class="form-control" id="projectPrefixInput" placeholder="ARCHIVED" data-field="prefix">
							<span class="input-group-text">]</span>
						</div>
						<div class="form-text">Result will be <code>[PREFIX] Current Name</code></div>
					</div>
					<div class="mb-3">
						<label class="form-label">Description (optional)</label>
						<textarea class="form-control" id="projectDescriptionInput" rows="3" placeholder="Leave empty for no change" data-field="description"></textarea>
					</div>
					<div class="alert alert-info">
						This will update <span id="selectedProjectsCountLabel">0</span> selected projects.
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkProjectUpdate">Apply Prefix</button>
			</div>
		</div>
	</div>
</div>

<!-- Bulk Update Proyek Modal -->
<div class="modal fade" id="bulkUpdateProyekModal" tabindex="-1" aria-labelledby="bulkUpdateProyekModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="bulkUpdateProyekModalLabel">Bulk Update Proyeks</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="bulkUpdateProyekForm">
					<div class="mb-3">
						<label class="form-label">Name Prefix</label>
						<div class="input-group">
							<span class="input-group-text">[</span>
							<input type="text" class="form-control" id="proyekPrefixInput" placeholder="ARCHIVED" data-field="prefix">
							<span class="input-group-text">]</span>
						</div>
						<div class="form-text">Result will be <code>[PREFIX] Current Name</code></div>
					</div>
					<div class="mb-3">
						<label class="form-label">Description (optional)</label>
						<textarea class="form-control" id="proyekDescriptionInput" rows="3" placeholder="Leave empty for no change" data-field="description"></textarea>
					</div>
					<div class="alert alert-info">
						This will update <span id="selectedProyeksCountLabel">0</span> selected proyeks.
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary tttaiga-bulk-handle" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary tttaiga-bulk-handle" id="submitBulkProyekUpdate">Apply Prefix</button>
			</div>
		</div>
	</div>
</div>
<!-- Single Create/Update User Story Modal -->
<div class="modal fade" id="singleUsorModal" tabindex="-1" aria-labelledby="singleUsorModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="singleUsorModalLabel">Create User Story</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="singleUsorForm">
					<input type="hidden" id="singleUsorId">
					<input type="hidden" id="singleUsorVersion">
					<div class="mb-3">
						<label class="form-label">Project</label>
						<select class="form-select" id="singleUsorProject" required></select>
					</div>
					<div class="mb-3">
						<label class="form-label">Epik</label>
						<div id="singleUsorEpics" class="border rounded p-2" style="max-height: 140px; overflow-y: auto;"></div>
						<div class="form-text">Bisa memilih lebih dari satu epik.</div>
					</div>
					<div class="mb-3">
						<label class="form-label">Subject</label>
						<input type="text" class="form-control" id="singleUsorSubject" required>
					</div>
					<div class="mb-3">
						<label class="form-label">Description</label>
						<textarea class="form-control" id="singleUsorDescription" rows="4"></textarea>
					</div>
					<div class="row">
						<div class="col-md-6">
							<label class="form-label">Status</label>
							<select class="form-select" id="singleUsorStatus"></select>
						</div>
						<div class="col-md-6">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="singleUsorAssignee"></select>
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary" id="submitSingleUsor">Save</button>
			</div>
		</div>
	</div>
</div>

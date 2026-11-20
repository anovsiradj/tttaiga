<!-- Single Create/Update Epic Modal -->
<div class="modal fade" id="singleEpicModal" tabindex="-1" aria-labelledby="singleEpicModalLabel" aria-hidden="true">
	<div class="modal-dialog modal-lg">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="singleEpicModalLabel">Create Epic</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
				<form id="singleEpicForm">
					<input type="hidden" id="singleEpicId">
					<input type="hidden" id="singleEpicVersion">
					<div class="mb-3">
						<label class="form-label">Project</label>
						<select class="form-select" id="singleEpicProject" required></select>
					</div>
					<div class="mb-3">
						<label class="form-label">Subject</label>
						<input type="text" class="form-control" id="singleEpicSubject" required>
					</div>
					<div class="mb-3">
						<label class="form-label">Description</label>
						<textarea class="form-control" id="singleEpicDescription" rows="4"></textarea>
					</div>
					<div class="row">
						<div class="col-md-6">
							<label class="form-label">Status</label>
							<select class="form-select" id="singleEpicStatus"></select>
						</div>
						<div class="col-md-6">
							<label class="form-label">Assigned To</label>
							<select class="form-select" id="singleEpicAssignee"></select>
						</div>
					</div>
					<div class="row mt-3">
						<div class="col-md-6">
							<label class="form-label">Color</label>
							<input type="color" class="form-control form-control-color" id="singleEpicColor" value="#fd7e14">
						</div>
					</div>
				</form>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-primary" id="submitSingleEpic">Save</button>
			</div>
		</div>
	</div>
</div>

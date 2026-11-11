<?php
require __DIR__ . '/app/init.php';
?>

<!DOCTYPE html>
<html lang="en" data-bs-theme="auto">

<head>
	<?php include __DIR__ . '/app/layouts/main_head.php'; ?>
	<title>Sprint Planning - TTTaiga</title>
	<!-- jQuery UI CSS for Sortable -->
	<link rel="stylesheet" href="https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css">
	<!-- Select2 CSS -->
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css">
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/select2-bootstrap-5-theme@1.3.0/dist/select2-bootstrap-5-theme.min.css">
	<style>
		.planning-container {
			display: flex;
			gap: 1rem;
			height: calc(100vh - 250px);
			min-height: 600px;
		}
		
		.planning-panel {
			flex: 1;
			display: flex;
			flex-direction: column;
			background: var(--bs-body-bg);
			border: 1px solid var(--bs-border-color);
			border-radius: 0.5rem;
			overflow: hidden;
		}
		
		.planning-panel-header {
			padding: 1rem;
			background: var(--bs-tertiary-bg);
			border-bottom: 1px solid var(--bs-border-color);
			display: flex;
			align-items: center;
			gap: 0.5rem;
			flex-wrap: wrap;
		}
		
		.planning-panel-title {
			font-weight: 600;
			margin: 0;
		}
		
		.planning-panel-body {
			flex: 1;
			overflow-y: auto;
			padding: 0.5rem;
		}
		
		.usor-list {
			list-style: none;
			padding: 0;
			margin: 0;
			min-height: 200px;
		}
		
		.usor-item {
			background: var(--bs-card-bg);
			border: 1px solid var(--bs-border-color);
			border-radius: 0.375rem;
			padding: 0.75rem;
			margin-bottom: 0.5rem;
			cursor: grab;
			transition: box-shadow 0.2s, transform 0.1s;
		}
		
		.usor-item:hover {
			box-shadow: 0 2px 8px rgba(0,0,0,0.1);
			transform: translateY(-1px);
		}
		
		.usor-item.ui-sortable-helper {
			box-shadow: 0 4px 16px rgba(0,0,0,0.2);
			transform: rotate(2deg);
		}
		
		.usor-item.ui-sortable-placeholder {
			border: 2px dashed var(--bs-primary);
			background: var(--bs-primary-bg-subtle);
			height: auto !important;
			visibility: visible !important;
			margin-bottom: 0.5rem;
		}
		
		.usor-item-header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 0.25rem;
			gap: 0.5rem;
		}
		
		.usor-item-header-left {
			display: flex;
			align-items: center;
			gap: 0.375rem;
			min-width: 0;
		}
		
		.usor-item-ref {
			font-size: 0.75rem;
			color: var(--bs-secondary-color);
			font-weight: 600;
		}
		
		.usor-item-subject {
			font-weight: 500;
			margin: 0.25rem 0;
			word-break: break-word;
		}
		
		.usor-item-meta {
			display: flex;
			gap: 0.75rem;
			font-size: 0.75rem;
			color: var(--bs-secondary-color);
			align-items: center;
			flex-wrap: wrap;
		}
		
		.usor-item-points {
			background: var(--bs-primary-bg-subtle);
			color: var(--bs-emphasis-color);
			font-weight: 600;
			padding: 0.05rem 0.4rem;
			border-radius: 0.375rem;
			white-space: nowrap;
		}
		
		.usor-item-points.unknown {
			background: var(--bs-tertiary-bg);
			color: var(--bs-secondary-color);
		}
		
		.usor-item-check {
			margin: 0;
			flex-shrink: 0;
		}
		
		.planning-capacity {
			padding: 0.75rem 1rem;
			background: var(--bs-tertiary-bg);
			border-bottom: 1px solid var(--bs-border-color);
			display: flex;
			align-items: center;
			gap: 1rem;
			flex-wrap: wrap;
			font-size: 0.875rem;
		}
		
		.planning-capacity-points {
			font-size: 1.25rem;
			font-weight: 700;
			line-height: 1;
		}
		
		.planning-capacity-meta {
			color: var(--bs-secondary-color);
			font-size: 0.75rem;
		}
		
		.bulk-add-btn, .bulk-remove-btn {
			white-space: nowrap;
		}
		
		.usor-item-status {
			display: inline-flex;
			align-items: center;
			gap: 0.25rem;
		}
		
		.usor-item-remove {
			color: var(--bs-danger);
			cursor: pointer;
			padding: 0.125rem 0.375rem;
			border-radius: 0.25rem;
			font-size: 0.75rem;
			display: none;
			align-items: center;
			gap: 0.25rem;
			background: var(--bs-danger-bg-subtle);
			border: 1px solid var(--bs-danger-border-subtle);
		}
		
		.usor-item-remove:hover {
			background: var(--bs-danger);
			color: white;
		}
		
		.target-panel .usor-item-remove {
			display: inline-flex;
		}
		
		.usor-item.pending-add {
			border-left: 3px solid var(--bs-success);
			background: var(--bs-success-bg-subtle);
		}
		
		.usor-item.pending-remove {
			border-left: 3px solid var(--bs-danger);
			background: var(--bs-danger-bg-subtle);
			opacity: 0.6;
		}
		
		.search-input {
			flex: 1;
			min-width: 150px;
		}
		
		.source-select {
			min-width: 200px;
		}
		
		.sprint-select {
			flex: 1;
			min-width: 200px;
			max-width: 400px;
		}
		
		.planning-actions {
			padding: 1rem;
			background: var(--bs-tertiary-bg);
			border-top: 1px solid var(--bs-border-color);
			display: flex;
			justify-content: flex-end;
			gap: 0.5rem;
		}
		
		.pending-badge {
			background: var(--bs-warning);
			color: var(--bs-warning-text);
			font-size: 0.7rem;
			padding: 0.125rem 0.375rem;
			border-radius: 1rem;
			margin-left: 0.5rem;
		}
		
		.empty-state {
			text-align: center;
			padding: 2rem;
			color: var(--bs-secondary-color);
		}
		
		.empty-state .bi {
			font-size: 2rem;
			margin-bottom: 0.5rem;
			opacity: 0.5;
		}
		
		@media (max-width: 991.98px) {
			.planning-container {
				flex-direction: column;
				height: auto;
				min-height: auto;
			}
			
			.planning-panel {
				min-height: 300px;
			}
		}
		
		/* Select2 customizations */
		.select2-container--bootstrap-5 .select2-selection {
			min-height: 38px;
		}
		.select2-container--bootstrap-5 .select2-selection--single .select2-selection__rendered {
			padding-top: 4px;
			padding-bottom: 4px;
		}
	</style>
</head>

<body>

	<?php include __DIR__ . '/app/layouts/main_navbar.php' ?>

	<div class="container-fluid mt-4">
		<div class="d-flex justify-content-between align-items-center mb-4">
			<h1 class="h3 mb-0">Sprint Planning</h1>
			<a href="sprints.php" class="btn btn-outline-secondary">
				<i class="bi bi-arrow-left me-1"></i> Back to Sprints
			</a>
		</div>

		<!-- Unified Filter & Sprint Selector Card -->
		<div class="card mb-4">
			<div class="card-body">
				<div class="row g-3 align-items-end">
					<div class="col-md-4">
						<!-- Project Filter (Select2, shared filter) -->
						<select class="form-select" id="projectSelect" 
						        placeholder="Select Project"
						        style="width: 100%;">
							<option value=""></option>
						</select>
					</div>
					<div class="col-md-5">
						<!-- Sprint Selector -->
						<select class="form-select sprint-select" id="planningSprintSelect" required>
							<option value="">Select a sprint to plan...</option>
						</select>
					</div>
					<div class="col-md-3">
						<div class="d-grid">
							<button type="button" class="btn btn-primary" id="loadPlanningBtn" disabled>
								<i class="bi bi-arrow-repeat me-1"></i> Load Planning
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Planning Areas -->
		<div class="planning-container" id="planningContainer" style="display: none;">
			<!-- Source Panel (Left) -->
			<div class="planning-panel source-panel">
				<div class="planning-panel-header">
					<h5 class="planning-panel-title mb-0">
						<i class="bi bi-box-seam me-2"></i> Source: Backlog / Other Sprints
						<span class="badge bg-secondary" id="sourceCount">0</span>
					</h5>
				</div>
				<div class="planning-panel-header">
					<div class="input-group search-input">
						<span class="input-group-text"><i class="bi bi-search"></i></span>
						<input type="text" class="form-control" id="sourceSearch" placeholder="Pencarian ...">
					</div>
					<select class="form-select source-select" id="sourceSelector">
						<option value="backlog">Backlog (No Sprint)</option>
						<!-- Sprints will be loaded dynamically -->
					</select>
				</div>
				<div class="planning-panel-header py-2">
					<div class="form-check mb-0">
						<input class="form-check-input" type="checkbox" id="sourceSelectAll">
						<label class="form-check-label small" for="sourceSelectAll">Select all</label>
					</div>
					<button type="button" class="btn btn-sm btn-success bulk-add-btn" id="bulkAddBtn" disabled>
						<i class="bi bi-arrow-right-short"></i> Add Selected (<span id="bulkAddCount">0</span>)
					</button>
				</div>
				<div class="planning-panel-body">
					<ul class="usor-list" id="sourceUsorList">
						<li class="empty-state">
							<i class="bi bi-arrow-left-right"></i>
							<p>Select a sprint and click "Load Planning" to start</p>
						</li>
					</ul>
				</div>
			</div>

			<!-- Target Panel (Right) -->
			<div class="planning-panel target-panel">
				<div class="planning-panel-header">
					<h5 class="planning-panel-title mb-0">
						<i class="bi bi-flag-fill me-2"></i> Target Sprint
						<span class="badge bg-primary" id="targetCount">0</span>
						<span class="pending-badge d-none" id="pendingAddCount">+0</span>
						<span class="pending-badge bg-danger" id="pendingRemoveCount">-0</span>
					</h5>
				</div>
				<div class="planning-panel-header">
					<div class="input-group search-input">
						<span class="input-group-text"><i class="bi bi-search"></i></span>
						<input type="text" class="form-control" id="targetSearch" placeholder="Pencarian ...">
					</div>
				</div>
				<div class="planning-panel-header py-2">
					<div class="form-check mb-0">
						<input class="form-check-input" type="checkbox" id="targetSelectAll">
						<label class="form-check-label small" for="targetSelectAll">Select all</label>
					</div>
					<button type="button" class="btn btn-sm btn-outline-danger bulk-remove-btn" id="bulkRemoveBtn" disabled>
						<i class="bi bi-arrow-left-short"></i> Remove Selected (<span id="bulkRemoveCount">0</span>)
					</button>
				</div>
				<div class="planning-panel-body">
					<ul class="usor-list" id="targetUsorList">
						<li class="empty-state">
							<i class="bi bi-flag"></i>
							<p>USORs in this sprint will appear here</p>
						</li>
					</ul>
				</div>
			</div>
		</div>

	<!-- Save Actions -->
	<div class="card mb-4 planning-actions d-none" id="planningActions">
		<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
			<div>
				<span class="text-muted">Pending changes:</span>
				<span class="badge bg-success ms-1" id="badgePendingAdd">+0 Add</span>
				<span class="badge bg-danger ms-1" id="badgePendingRemove">-0 Remove</span>
				<span class="badge bg-primary ms-1 d-none" id="capacityBadge" title="Total story points committed to this sprint">
					<i class="bi bi-speedometer2 me-1"></i><span id="capacityPoints">0</span> pts
				</span>
			</div>
			<div>
				<button type="button" class="btn btn-secondary" id="discardChangesBtn" disabled>
					<i class="bi bi-x-circle me-1"></i> Discard Changes
				</button>
				<button type="button" class="btn btn-success" id="saveChangesBtn" disabled>
					<i class="bi bi-check-circle me-1"></i> Save Changes
				</button>
			</div>
		</div>
		<div class="progress mt-2 d-none" id="saveProgress" style="height: 6px;">
			<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%"></div>
		</div>
	</div>

	<!-- USOR card template: single source for both planning panels -->
	<template id="usorCardTemplate">
		<li class="usor-item">
			<div class="usor-item-header">
				<div class="usor-item-header-left">
					<div class="form-check usor-item-check">
						<input class="form-check-input usor-item-checkbox" type="checkbox">
					</div>
					<span class="usor-item-ref"></span>
				</div>
				<button type="button" class="usor-item-remove" title="Remove from sprint">
					<i class="bi bi-x-lg"></i> Remove
				</button>
			</div>
			<div class="usor-item-subject"></div>
			<div class="usor-item-meta">
				<span class="usor-item-status"></span>
				<span class="usor-item-points"></span>
				<span class="usor-item-epic text-truncate" style="max-width: 150px;"></span>
			</div>
		</li>
	</template>

	<!-- jQuery and Bootstrap JS -->
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
	<!-- jQuery UI for Sortable -->
	<script src="https://code.jquery.com/ui/1.13.2/jquery-ui.min.js"></script>
	<!-- Select2 JS -->
	<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

	<script src="assets/taiga.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga.js'); ?>"></script>
    <script src="assets/taiga-core.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga-core.js'); ?>"></script>
    <script src="assets/app-sprint-planning.js?v=<?php echo filemtime(__DIR__ . '/assets/app-sprint-planning.js'); ?>"></script>

	<script>
		// Pre-fill sprint ID from URL parameter if present
		const urlParams = new URLSearchParams(window.location.search);
		const sprintId = urlParams.get('id');
		if (sprintId) {
			// Store for app-sprint-planning.js to use
			window.preSelectedSprintId = sprintId;
		}
	</script>
</body>

</html>
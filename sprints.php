<?php
require __DIR__ . '/app/init.php';
?>

<!DOCTYPE html>
<html lang="en" data-bs-theme="auto">

<head>
	<?php include __DIR__ . '/app/layouts/main_head.php'; ?>
</head>

<body>

	<?php include __DIR__ . '/app/layouts/main_navbar.php' ?>

	<div class="container mt-4">
		<?php
		$pageTitle = 'Sprints';
		$bulkUpdateModalId = 'bulkUpdateSprintModal';
		$searchPlaceholder = 'Search sprints...';
		$filterStatusEnable = false; // We'll handle closed/open filter separately if needed or just use search
		$sortOptions = [
			'name' => 'Name (A-Z)',
			'-name' => 'Name (Z-A)',
			'created_date' => 'Created (Oldest)',
			'-created_date' => 'Created (Newest)',
			'modified_date' => 'Modified (Oldest)',
			'-modified_date' => 'Modified (Newest)',
			'estimated_start' => 'Start Date (ASC)',
			'-estimated_start' => 'Start Date (DESC)',
			'estimated_finish' => 'Finish Date (ASC)',
			'-estimated_finish' => 'Finish Date (DESC)',
		];
		$primaryAction = '<button class="btn btn-primary tttaiga-bulk-handle" data-bs-toggle="modal" data-bs-target="#singleSprintModal"><i class="bi bi-plus-lg me-1"></i> Add New</button>';
		$additionalControls = '';
		$bulkActions = '
			<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkCreateSprintModal"><i class="bi bi-plus-lg me-2"></i> Bulk Create</a></li>
			<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkUpdateSprintModal"><i class="bi bi-pencil-square me-2"></i> Bulk Update</a></li>
			<li><a class="dropdown-item text-danger tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkDeleteSprintModal"><i class="bi bi-trash me-2"></i> Bulk Delete</a></li>
		';
		include __DIR__ . '/app/partials/list_header.php';
		?>

		<?php
		$totalId = 'totalSprints';
		$filteredId = 'filteredSprints';
		$selectionCountId = 'selectedSprintsCount';
		include __DIR__ . '/app/partials/list_status.php';
		?>

		<div id="sprintsContent">
			<div class="loading-spinner">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Loading sprints...</span>
				</div>
			</div>
		</div>

		<nav aria-label="Sprints pagination" class="pagination-container">
			<ul class="pagination justify-content-center" id="sprintsPagination">
				<!-- Pagination items will be injected here -->
			</ul>
		</nav>
	</div>

	<!-- jQuery and Bootstrap JS -->
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Select2 JS -->
	<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

	<script src="assets/taiga.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga.js'); ?>"></script>
    <!-- New Architecture -->
    <script src="assets/taiga-core.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga-core.js'); ?>"></script>
    <script src="assets/app-sprints.js?v=<?php echo filemtime(__DIR__ . '/assets/app-sprints.js'); ?>"></script>


	<?php include __DIR__ . '/app/partials/sprint_multiple_form.php'; ?>
<?php include __DIR__ . '/app/partials/sprint_single_form.php'; ?>

</body>

</html>
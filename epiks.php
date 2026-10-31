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
		$pageTitle = 'Epik';
		$statusType = 'epic';
		$bulkCreateModalId = 'bulkCreateEpicModal';
		$bulkUpdateModalId = 'bulkUpdateEpicModal';
		$searchPlaceholder = 'Search epiks...';
		$filterAssignedEnable = true;
		$sortOptions = [
			'subject' => 'Subject (A-Z)',
			'-subject' => 'Subject (Z-A)',
			'created_date' => 'Created (Oldest)',
			'-created_date' => 'Created (Newest)',
			'modified_date' => 'Modified (Oldest)',
			'-modified_date' => 'Modified (Newest)',
			'status' => 'Status (ASC)',
			'-status' => 'Status (DESC)',
			'epic_order' => 'Custom Order (ASC)',
			'-epic_order' => 'Custom Order (DESC)',
		];
		$primaryAction = '<button class="btn btn-primary tttaiga-bulk-handle" data-bs-toggle="modal" data-bs-target="#singleEpicModal"><i class="bi bi-plus-lg me-1"></i> Add New</button>';
$bulkActions = '
	<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkCreateEpicModal"><i class="bi bi-plus-lg me-2"></i> Bulk Create</a></li>
	<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkUpdateEpicModal"><i class="bi bi-pencil-square me-2"></i> Bulk Update</a></li>
	<li><a class="dropdown-item text-danger tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkDeleteEpicModal"><i class="bi bi-trash me-2"></i> Bulk Delete</a></li>
';
		include __DIR__ . '/app/partials/list_header.php';

		$totalId = 'totalEpics';
		$filteredId = 'filteredEpics';
		$selectionCountId = 'selectedEpicsCount';
		include __DIR__ . '/app/partials/list_status.php';
		?>

		<div id="epicsContent">
			<div class="loading-spinner">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Loading epik...</span>
				</div>
			</div>
		</div>

		<nav aria-label="Epiks pagination" class="pagination-container">
			<ul class="pagination justify-content-center" id="epicsPagination">
				<!-- Pagination items will be injected here -->
			</ul>
		</nav>
	</div>

	<!-- jQuery and Bootstrap JS -->
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Theme Script -->
	<!-- Select2 JS -->
	<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

	<script src="assets/taiga.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga.js'); ?>"></script>
    
    <!-- New Architecture -->
    <script src="assets/taiga-core.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga-core.js'); ?>"></script>
    <script src="assets/app-epiks.js?v=<?php echo filemtime(__DIR__ . '/assets/app-epiks.js'); ?>"></script>


	<?php include __DIR__ . '/app/partials/epic_multiple_form.php'; ?>
<?php include __DIR__ . '/app/partials/epic_multiple_delete.php'; ?>
<?php include __DIR__ . '/app/partials/epic_single_form.php'; ?>

</body>

</html>

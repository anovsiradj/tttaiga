<?php

require __DIR__ . '/app/init.php';

$pageTitle = 'Proyek';
$primaryAction = ''; // No create action for Proyek
$bulkActions = '
	<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkUpdateProyekModal"><i class="bi bi-pencil-square me-2"></i> Bulk Prefix</a></li>
';

$sortOptions = [
	'name' => 'Name (A-Z)',
	'-name' => 'Name (Z-A)',
	'created_date' => 'Created (Oldest)',
	'-created_date' => 'Created (Newest)',
	'modified_date' => 'Modified (Oldest)',
	'-modified_date' => 'Modified (Newest)',
	'total_fans' => 'Fans (Fewest)',
	'-total_fans' => 'Fans (Most)',
	'total_activity' => 'Activity (Lowest)',
	'-total_activity' => 'Activity (Highest)',
];

$filterProjectEnable = false;
$filterStatusEnable = false;
?>

<!DOCTYPE html>
<html lang="en" data-bs-theme="auto">

<head>
	<?php include __DIR__ . '/app/layouts/main_head.php'; ?>
</head>

<body>

	<?php include __DIR__ . '/app/layouts/main_navbar.php' ?>

	<div class="container mt-4">
		<?php include __DIR__ . '/app/partials/list_header.php' ?>

		<?php
		$totalLabel = 'Total Proyeks';
		$totalId = 'totalProyeks';
		$filteredId = 'filteredProyeks';
		$selectionCountId = 'selectedProyeksCount';
		include __DIR__ . '/app/partials/list_status.php';
		?>

		<div id="proyeksContent">
			<div class="loading-spinner">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Loading proyeks...</span>
				</div>
			</div>
		</div>

		<nav aria-label="Proyeks pagination" class="mt-4">
			<ul class="pagination justify-content-center" id="proyeksPagination">
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
    <script src="assets/app-proyeks.js?v=<?php echo filemtime(__DIR__ . '/assets/app-proyeks.js'); ?>"></script>


	<?php include __DIR__ . '/app/partials/proyek_multiple_form.php'; ?>

</body>

</html>
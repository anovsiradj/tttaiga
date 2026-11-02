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
		$pageTitle = 'Tasks';
		$statusType = 'task';

		$searchPlaceholder = 'Search tasks...';
		$userStorySelect = true;
		$epicSelect = true;
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
			'us_order' => 'Task Order (ASC)',
			'-us_order' => 'Task Order (DESC)',
		];
		$primaryAction = '<button class="btn btn-primary tttaiga-bulk-handle" data-bs-toggle="modal" data-bs-target="#singleTaskModal"><i class="bi bi-plus-lg me-1"></i> Add New</button>';
$bulkActions = '
	<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkCreateTaskModal"><i class="bi bi-plus-lg me-2"></i> Bulk Create</a></li>
	<li><a class="dropdown-item tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkUpdateTaskModal"><i class="bi bi-pencil-square me-2"></i> Bulk Update</a></li>
	<li><a class="dropdown-item text-danger tttaiga-bulk-handle tttaiga-bulk-action" href="#" data-bs-toggle="modal" data-bs-target="#bulkDeleteTaskModal"><i class="bi bi-trash me-2"></i> Bulk Delete</a></li>
';
		include __DIR__ . '/app/partials/list_header.php';

		$totalLabel = 'Total Tasks';
		$totalId = 'totalTasks';
		$filteredId = 'filteredTasks';
		$selectionCountId = 'selectedTasksCount';
		include __DIR__ . '/app/partials/list_status.php';
		?>

		<div id="tasksContent">
			<div class="loading-spinner">
				<div class="spinner-border text-primary" role="status">
					<span class="visually-hidden">Loading tasks...</span>
				</div>
			</div>
		</div>

		<nav aria-label="Tasks pagination" class="pagination-container">
			<ul class="pagination justify-content-center" id="tasksPagination">
				<!-- Pagination items will be injected here -->
			</ul>
		</nav>
	</div>

	<?php include __DIR__ . '/app/partials/task_multiple_form.php'; ?>
<?php include __DIR__ . '/app/partials/task_multiple_delete.php'; ?>
<?php include __DIR__ . '/app/partials/task_single_form.php'; ?>

	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<!-- Select2 JS -->
	<script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>

	<script src="assets/taiga.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga.js'); ?>&t=<?php echo time(); ?>"></script>
    
    <!-- New Architecture -->
    <script src="assets/taiga-core.js?v=<?php echo filemtime(__DIR__ . '/assets/taiga-core.js'); ?>&t=<?php echo time(); ?>"></script>
    <script src="assets/app-tasks.js?v=<?php echo filemtime(__DIR__ . '/assets/app-tasks.js'); ?>&t=<?php echo time(); ?>"></script>

</body>

</html>

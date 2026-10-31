<?php
$currentPage = basename($_SERVER['PHP_SELF'] ?? '');
$navItems = [
	'index.php' => 'Me',
	'proyeks.php' => 'Proyek',
	'sprints.php' => 'Sprint',
	'sprint_plan_form.php' => 'Sprint Planning',
	'epiks.php' => 'Epik',
	'usors.php' => 'Usor',
	'tasks.php' => 'Task',
	'isus.php' => 'Isu',
];
// Detail pages (proyek.php, sprint.php, ...) highlight their list nav item.
$detailToList = [
	'proyek.php' => 'proyeks.php',
	'sprint.php' => 'sprints.php',
	'sprint_plan_form.php' => 'sprint_plan_form.php',
	'epik.php' => 'epiks.php',
	'usor.php' => 'usors.php',
	'task.php' => 'tasks.php',
	'isu.php' => 'isus.php',
];
$activePage = $detailToList[$currentPage] ?? $currentPage;
?>
<nav class="navbar navbar-expand-lg sticky-top bg-body-tertiary border-bottom">
	<div class="container">
		<a class="navbar-brand" href="index.php">TTTaiga</a>
		<div class="navbar-nav ms-auto">
			<?php foreach ($navItems as $href => $label) { ?>
				<a class="nav-link<?php echo $activePage === $href ? ' active' : ''; ?>" href="<?php echo $href; ?>"><?php echo $label; ?></a>
			<?php } ?>

			<?php include __DIR__ . '/../../vendor/anovsiradj/web-skit/widgets/twbs/v5-dark-mode-toggle.html'; ?>
			<button class="btn btn-outline-danger btn-sm" id="logoutBtn" title="Logout" data-bs-toggle="tooltip">
				<i class="bi bi-box-arrow-right"></i>
			</button>
		</div>
	</div>
</nav>
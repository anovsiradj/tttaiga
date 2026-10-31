<?php
require __DIR__ . '/app/init.php';
?>

<!DOCTYPE html>
<html lang="en" data-bs-theme="auto">

<head>
	<?php include __DIR__ . '/app/layouts/main_head.php'; ?>
</head>

<body class="item-page">

	<?php include __DIR__ . '/app/layouts/main_navbar.php' ?>

	<?php
	$backUrl = 'proyeks.php';
	$backLabel = 'Back to Proyeks';
	$headerId = 'proyekHeaderContent';
	$loadingLabel = 'Loading proyek...';
	include __DIR__ . '/app/partials/item_header.php';
	?>

	<div class="container">
		<div class="row">
			<div class="col-md-8">
				<div class="card mb-4">
					<div class="card-header">
						<h5 class="mb-0">Proyek Details</h5>
					</div>
					<div class="card-body" id="proyekDetailsContent">
						<div class="loading-spinner">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading details...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="card mb-4">
					<div class="card-header">
						<h5 class="mb-0">Description</h5>
					</div>
					<div class="card-body" id="proyekDescriptionContent">
						<div class="loading-spinner">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading description...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="card mb-4">
					<div class="card-header">
						<h5 class="mb-0">Komentar</h5>
					</div>
					<div class="card-body" id="proyekCommentsContent">
						<div class="loading-spinner">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading comments...</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="col-md-4">
				<div class="card mb-4">
					<div class="card-header">
						<h5 class="mb-0">Proyek Stats</h5>
					</div>
					<div class="card-body" id="proyekStatsContent">
						<div class="loading-spinner">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading stats...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="card">
					<div class="card-header">
						<h5 class="mb-0">Team Members</h5>
					</div>
					<div class="card-body" id="proyekMembersContent">
						<div class="loading-spinner">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading members...</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- jQuery and Bootstrap JS -->
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<script src="assets/taiga.js"></script>

	<script>
		$(document).ready(function () {
			const session = window.TTTaigaSession || {};
			const token = session.authenticated ? 'session' : null;

			if (!token) {
				window.location.href = 'login.php';
				return;
			}

			const config = <?php echo json_encode(include 'app/configs/taiga.php'); ?>;
			const apiUrl = session.apiUrl || config.servers.default.api_url;

			// Get proyek ID from URL
			const urlParams = new URLSearchParams(window.location.search);
			const proyekId = urlParams.get('id');

			if (!proyekId) {
				window.location.href = 'proyeks.php';
				return;
			}

			taigaLoadComments('#proyekCommentsContent', 'project', proyekId, apiUrl, token);

			// Load proyek data
			loadProyekData(proyekId);

			function loadProyekData(proyekId) {
				// Load proyek basic info
				$.ajax({
					url: 'api.php/projects/' + proyekId,
					type: 'GET',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Content-Type': 'application/json',
						'X-Taiga-Api-Url': apiUrl
					},
					success: function (proyek) {
						displayProyekHeader(proyek);
						displayProyekDetails(proyek);
						displayProyekDescription(proyek);

						// Load additional data
						loadProyekStats(proyekId);
						loadProyekMembers(proyekId);
					},
					error: function (xhr) {
						console.error('Failed to load proyek:', xhr);
						$('#proyekHeaderContent').html(`
					<div class="alert alert-danger">
						Failed to load proyek. Please check if you have access to this proyek.
						<a href="proyeks.php" class="btn btn-sm btn-outline-danger ms-2">Back to Proyeks</a>
					</div>
				`);
					}
				});
			}

			function loadProyekStats(proyekId) {
				// This would typically include user stories, tasks, etc.
				// For now, we'll show basic stats
				const statsHtml = `
			<div class="row text-center">
				<div class="col-4">
					<div class="stats-card">
						<div class="stat-number">0</div>
						<small class="text-muted">Usor</small>
					</div>
				</div>
				<div class="col-4">
					<div class="stats-card">
						<div class="stat-number">0</div>
						<small class="text-muted">Tasks</small>
					</div>
				</div>
				<div class="col-4">
					<div class="stats-card">
						<div class="stat-number">0</div>
						<small class="text-muted">Isu</small>
					</div>
				</div>
			</div>
		`;
				$('#proyekStatsContent').html(statsHtml);
			}

			function loadProyekMembers(proyekId) {
				// Load proyek members
				$.ajax({
					url: 'api.php/memberships',
					data: { project: proyekId },
					type: 'GET',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Content-Type': 'application/json',
						'X-Taiga-Api-Url': apiUrl
					},
					success: function (members) {
						displayProyekMembers(members);
					},
					error: function (xhr) {
						console.error('Failed to load members:', xhr);
						$('#proyekMembersContent').html(`
					<div class="alert alert-warning">
						Unable to load team members.
					</div>
				`);
					}
				});
			}

			function displayProyekHeader(proyek) {
				const headerHtml = `
			<div class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
				<div class="me-3">
					<h1 class="display-4 mb-2">${proyek.name}</h1>
					<p class="lead mb-0">${proyek.slug}</p>
					<span class="badge bg-${proyek.is_private ? 'secondary' : 'primary'} mt-2">
						${proyek.is_private ? 'Private Proyek' : 'Public Proyek'}
					</span>
				</div>
				<div class="mt-3 mt-md-0">
					<a class="btn btn-light btn-sm d-none" id="proyekTaigaLinkBtn" href="#" target="_blank" rel="noopener">Open in Taiga</a>
				</div>
			</div>
		`;
				$('#proyekHeaderContent').html(headerHtml);

				const taigaLink = taigaItemPermalink('project', proyek, apiUrl);
				if (taigaLink) {
					$('#proyekTaigaLinkBtn').removeClass('d-none').attr('href', taigaLink);
				}
			}

			function displayProyekDetails(proyek) {
				const detailsHtml = `
			<div class="row">
				<div class="col-6">
					<strong>Created:</strong><br>
					${new Date(proyek.created_date).toLocaleDateString()}
				</div>
				<div class="col-6">
					<strong>Modified:</strong><br>
					${new Date(proyek.modified_date).toLocaleDateString()}
				</div>
				<div class="col-6 mt-3">
					<strong>Total Members:</strong><br>
					${proyek.total_memberships || 0}
				</div>
				<div class="col-6 mt-3">
					<strong>Total Milestones:</strong><br>
					${proyek.total_milestones || 0}
				</div>
				<div class="col-12 mt-3">
					<strong>Proyek ID:</strong><br>
					<code>${proyek.id}</code>
				</div>
			</div>
		`;
				$('#proyekDetailsContent').html(detailsHtml);
			}

			function displayProyekDescription(proyek) {
				const html = taigaRenderContent(proyek.description);
				$('#proyekDescriptionContent').html(html);
			}

			function displayProyekMembers(members) {
				if (members.length === 0) {
					$('#proyekMembersContent').html(`
				<p class="text-muted">No team members found.</p>
			`);
					return;
				}

				let html = '';
				members.forEach(member => {
					const avatar = member.photo
						? member.photo
						: 'https://via.placeholder.com/40x40?text=?';

					html += `
				<div class="d-flex align-items-center mb-3">
					<img src="${avatar}" class="member-avatar me-3" alt="${member.full_name}">
					<div>
						<strong>${member.full_name || member.username}</strong>
						<br>
						<small class="text-muted">@${member.username}</small>
					</div>
				</div>
			`;
				});

				$('#proyekMembersContent').html(html);
			}
		});
	</script>

</body>

</html>
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
	$backUrl = 'tasks.php';
	$backLabel = 'Back to Tasks';
	$headerId = 'taskHeaderContent';
	$loadingLabel = 'Loading task...';
	include __DIR__ . '/app/partials/item_header.php';
	?>

	<div class="container">
		<div class="row">
			<div class="col-md-8">
				<div class="card mb-4">
					<div class="card-header">
						<h5 class="mb-0">Task Details</h5>
					</div>
					<div class="card-body" id="taskDetailsContent">
						<div class="loading-spinner text-center p-3">
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
					<div class="card-body" id="taskDescriptionContent">
						<div class="loading-spinner text-center p-3">
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
					<div class="card-body" id="taskCommentsContent">
						<div class="loading-spinner text-center p-3">
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
						<h5 class="mb-0">Belongs To</h5>
					</div>
					<div class="card-body" id="taskBelongsToContent">
						<div class="loading-spinner text-center p-3">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading links...</span>
							</div>
						</div>
					</div>
				</div>

				<div class="card">
					<div class="card-header">
						<h5 class="mb-0">Metadata</h5>
					</div>
					<div class="card-body" id="taskMetadataContent">
						<div class="loading-spinner text-center p-3">
							<div class="spinner-border" role="status">
								<span class="visually-hidden">Loading metadata...</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<script src="assets/taiga.js"></script>
	<script src="assets/taiga-view.js"></script>

	<script>
		$(document).ready(function() {
			const session = window.TTTaigaSession || {};
			const token = session.authenticated ? 'session' : null;

			if (!token) {
				window.location.href = 'login.php';
				return;
			}

			const config = <?php echo json_encode(include 'app/configs/taiga.php'); ?>;
			const apiUrl = session.apiUrl || config.servers.default.api_url;

			const urlParams = new URLSearchParams(window.location.search);
			const taskId = urlParams.get('id');

			if (!taskId) {
				window.location.href = 'tasks.php';
				return;
			}

			taigaLoadComments('#taskCommentsContent', 'task', taskId, apiUrl, token);

			const apiGet = function(url) {
				return $.ajax({
					url: url,
					type: 'GET',
					headers: {
						'Authorization': 'Bearer ' + token,
						'Content-Type': 'application/json',
						'X-Taiga-Api-Url': apiUrl
					}
				});
			};

			apiGet('api.php/tasks/' + encodeURIComponent(taskId))
				.done(function(task) {
					displayTaskHeader(task);
					displayTaskDetails(task);
					displayTaskDescription(task);
					displayTaskMetadata(task);
					displayTaskBelongsTo(task);
				})
				.fail(function(xhr) {
					console.error('Failed to load task:', xhr);
					$('#taskHeaderContent').html(`
						<div class="alert alert-danger">
							Failed to load task. It might have been deleted or you don't have access.
							<a href="tasks.php" class="btn btn-sm btn-outline-light ms-2">Back to Tasks</a>
						</div>
					`);
					$('#taskDetailsContent, #taskDescriptionContent, #taskMetadataContent, #taskBelongsToContent').html('');
				});

			function displayTaskHeader(task) {
				const statusInfo = taigaGetStatusInfo(task);
				const statusBadge = taigaRenderStatusBadge(statusInfo);
				const assignedTo = task.assigned_to_extra_info ? task.assigned_to_extra_info.full_name_display : (task.assigned_to ? 'User ID: ' + task.assigned_to : 'Unassigned');
				const headerHtml = `
					<div class="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between">
						<div class="me-3">
							<h1 class="display-4 mb-2 text-white">${task.subject || 'Untitled Task'}</h1>
							<p class="lead mb-0 text-white-50">Ref: #${task.ref}</p>
							<div class="mt-2 d-flex align-items-center gap-2 flex-wrap">
								${statusBadge}
								<span class="badge bg-dark-subtle text-dark">Assigned: <strong>${assignedTo}</strong></span>
							</div>
						</div>
						<div class="mt-3 mt-md-0">
							<a class="btn btn-light btn-sm d-none" id="taskTaigaLinkBtn" href="#" target="_blank" rel="noopener">Open in Taiga</a>
						</div>
					</div>
				`;
				$('#taskHeaderContent').html(headerHtml);

				const taigaLink = taigaItemPermalink('task', task, apiUrl);
				if (taigaLink) {
					$('#taskTaigaLinkBtn').removeClass('d-none').attr('href', taigaLink);
				} else if (task.project) {
					taigaGetProjectSlug(task.project, apiUrl, token).then(function(projectSlug) {
						const link = taigaItemPermalink('task', task, apiUrl, {
							projectSlug: projectSlug
						});
						if (link) {
							$('#taskTaigaLinkBtn').removeClass('d-none').attr('href', link);
						}
					});
				}
			}

			function displayTaskDetails(task) {
				const projectName = task.project_extra_info?.name || (task.project ? ('Project ID: ' + task.project) : 'N/A');
				const usorLabel = task.user_story_extra_info ? `#${task.user_story_extra_info.ref}: ${task.user_story_extra_info.subject}` : (task.user_story ? ('Usor ID: ' + task.user_story) : 'None');
				const sprintLabel = task.milestone_extra_info?.name || (task.milestone ? ('Sprint ID: ' + task.milestone) : 'None');

				const detailsHtml = `
					<div class="row">
						<div class="col-6">
							<strong>Project:</strong><br>
							<span id="taskProjectName">${projectName}</span>
						</div>
						<div class="col-6">
							<strong>Usor:</strong><br>
							<span id="taskUsorName">${usorLabel}</span>
						</div>
						<div class="col-6 mt-3">
							<strong>Sprint:</strong><br>
							<span id="taskSprintName">${sprintLabel}</span>
						</div>
						<div class="col-6 mt-3">
							<strong>Created:</strong><br>
							${task.created_date ? new Date(task.created_date).toLocaleString() : 'Unknown'}
						</div>
						<div class="col-6 mt-3">
							<strong>Modified:</strong><br>
							${task.modified_date ? new Date(task.modified_date).toLocaleString() : 'Unknown'}
						</div>
					</div>
				`;
				$('#taskDetailsContent').html(detailsHtml);

				if (task.project && !task.project_extra_info?.name) {
					apiGet('api.php/projects/' + encodeURIComponent(task.project))
						.done(function(project) {
							$('#taskProjectName').text(project.name || ('Project ID: ' + task.project));
						});
				}

				if (task.user_story && !task.user_story_extra_info) {
					apiGet('api.php/userstories/' + encodeURIComponent(task.user_story))
						.done(function(usor) {
							$('#taskUsorName').text(`#${usor.ref}: ${usor.subject || 'Untitled Usor'}`);
						});
				}

				if (task.milestone && !task.milestone_extra_info?.name) {
					apiGet('api.php/milestones/' + encodeURIComponent(task.milestone))
						.done(function(sprint) {
							$('#taskSprintName').text(sprint.name || ('Sprint ID: ' + task.milestone));
						});
				}
			}

			function displayTaskDescription(task) {
				const html = taigaRenderContent(task.description_html);
				$('#taskDescriptionContent').html(html);

				taigaViewAdjustTable('#taskDescriptionContent')
			}

			function displayTaskMetadata(task) {
				const owner = task.owner_extra_info ? task.owner_extra_info.full_name_display : (task.owner ? 'User ID: ' + task.owner : 'N/A');
				const assignedTo = task.assigned_to_extra_info ? task.assigned_to_extra_info.full_name_display : (task.assigned_to ? 'User ID: ' + task.assigned_to : 'Unassigned');
				const metadataHtml = `
					<div class="small">
						<div class="mb-2">
							<strong>Task ID:</strong><br>
							<code>${task.id}</code>
						</div>
						<div class="mb-2">
							<strong>Version:</strong><br>
							${task.version || '1'}
						</div>
						<div class="mb-2">
							<strong>Owner:</strong><br>
							${owner}
						</div>
						<div class="mb-2">
							<strong>Assigned To:</strong><br>
							${assignedTo}
						</div>
						<div>
							<strong>Project ID:</strong><br>
							<code>${task.project || 'N/A'}</code>
						</div>
					</div>
				`;
				$('#taskMetadataContent').html(metadataHtml);
			}

			function displayTaskBelongsTo(task) {
				let html = '<div class="d-grid gap-2">';

				if (task.project_extra_info) {
					html += `<a class="btn btn-outline-primary btn-sm" href="proyek.php?id=${encodeURIComponent(task.project)}">View Proyek Details</a>`;
				}

				if (task.user_story_extra_info) {
					html += `<a class="btn btn-outline-primary btn-sm" href="usor.php?id=${encodeURIComponent(task.user_story)}">View Usor Details</a>`;
				}

				if (task.milestone_extra_info) {
					html += `<a class="btn btn-outline-primary btn-sm" href="sprint.php?id=${encodeURIComponent(task.milestone_extra_info.name)}">View Sprint Details</a>`;
				} else if (task.milestone_slug) {
					html += `<a class="btn btn-outline-primary btn-sm" href="sprint.php?id=${encodeURIComponent(task.milestone_slug)}">View Sprint Details</a>`;
				}

				if (!task.project_extra_info && !task.user_story_extra_info && !task.milestone_extra_info && !task.milestone_slug) {
					html += `<div class="text-muted italic"><em>(kosong)</em></div>`;
				}

				html += '</div>';

				$('#taskBelongsToContent').html(html);
			}
		});
	</script>

</body>

</html>

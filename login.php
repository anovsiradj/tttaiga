<?php
require __DIR__ . '/app/init.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
	$action = $_POST['action'];
	if ($action === 'login') {
		$config = include __DIR__ . '/app/configs/taiga.php';
		$apiUrl = tttaiga_resolve_api_url($config, $_POST['taiga_api_url'] ?? null);
		$token = trim((string) ($_POST['taiga_token'] ?? ''));
		if (!$apiUrl || $token === '') {
			tttaiga_json_error(400, 'Invalid login session');
		}

		session_regenerate_id(true);
		$_SESSION['taiga_token'] = $token;
		$_SESSION['taiga_user'] = $_POST['taiga_user'] ?? '';
		$_SESSION['taiga_api_url'] = $apiUrl;
		header('Content-Type: application/json');
		echo json_encode(['success' => true]);
		exit;
	} elseif ($action === 'logout') {
		$_SESSION = [];
		if (ini_get('session.use_cookies')) {
			$params = session_get_cookie_params();
			setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
		}
		session_destroy();
		header('Content-Type: application/json');
		echo json_encode(['success' => true]);
		exit;
	}
}

$pageTitle = 'Login';
$redirect = $_GET['redirect'] ?? 'proyeks.php';
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="auto">

<head>
	<?php include __DIR__ . '/app/layouts/main_head.php'; ?>
	<style>
		body {
			background-color: #1B1F2A;
			background-image:
				radial-gradient(900px 480px at 85% -10%, rgba(224, 90, 80, 0.22), transparent 60%),
				radial-gradient(800px 420px at 8% 108%, rgba(245, 138, 60, 0.14), transparent 60%),
				radial-gradient(1000px 500px at -10% -10%, rgba(92, 128, 200, 0.16), transparent 55%);
			background-attachment: fixed;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
			margin: 0;
		}
		.login-card {
			background: rgba(36, 42, 56, 0.72);
			backdrop-filter: blur(16px) saturate(140%);
			-webkit-backdrop-filter: blur(16px) saturate(140%);
			border: 1px solid rgba(177, 191, 214, 0.16);
			border-radius: 1rem;
			box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
			width: 100%;
			max-width: 400px;
			padding: 2.5rem;
		}
		.login-header {
			text-align: center;
			margin-bottom: 2rem;
		}
		.login-logo {
			font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
			font-size: 2.5rem;
			font-weight: 700;
			letter-spacing: -0.03em;
			margin-bottom: 0.5rem;
			background: linear-gradient(135deg, #E05A50 0%, #F58A3C 130%);
			-webkit-background-clip: text;
			background-clip: text;
			color: transparent;
		}
		.login-subtitle {
			color: #A4AEC2;
			font-size: 0.8rem;
			letter-spacing: 0.14em;
		}
		.login-card .form-label {
			color: #A4AEC2;
		}
		.login-card .form-control,
		.login-card .form-select,
		.login-card .input-group-text {
			background-color: #2A3142;
			border: 1px solid rgba(177, 191, 214, 0.2);
			border-radius: 0.5rem;
			color: #E7EAF1;
			padding: 0.75rem 1rem;
		}
		.login-card .input-group-text {
			border-right: 0;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
		}
		.login-card .input-group .form-control {
			border-left: 0;
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
		.login-card .form-control::placeholder {
			color: #76829A;
		}
		.login-card .form-control:focus,
		.login-card .form-select:focus {
			background-color: #2A3142;
			border-color: rgba(224, 90, 80, 0.6);
			box-shadow: 0 0 0 0.25rem rgba(224, 90, 80, 0.18);
			color: #E7EAF1;
		}
		.btn-login {
			background: linear-gradient(135deg, #C9403B 0%, #F0762B 140%);
			border: none;
			border-radius: 0.5rem;
			color: #FFF;
			padding: 0.75rem;
			font-weight: 700;
			letter-spacing: 0.08em;
			transition: transform 0.15s ease, box-shadow 0.2s ease, filter 0.15s ease;
		}
		.btn-login:hover {
			color: #FFF;
			filter: brightness(1.08);
			transform: translateY(-2px);
			box-shadow: 0 10px 24px rgba(201, 64, 59, 0.35);
		}
		.btn-login:active {
			color: #FFF;
			transform: translateY(0);
		}
		.login-card .text-muted {
			color: #76829A !important;
		}
	</style>
</head>

<body>

	<div class="login-card animate__animated animate__fadeIn">
		<div class="login-header">
			<div class="login-logo">TTTaiga</div>
			<div class="login-subtitle text-uppercase small ls-wide">Management Dashboard</div>
		</div>
		
		<form id="loginForm">
			<div class="mb-3">
				<label for="server" class="form-label small fw-bold text-muted text-uppercase">Server Instance</label>
				<select class="form-select" id="server" name="server" required></select>
			</div>
			
			<div class="mb-3">
				<label for="username" class="form-label small fw-bold text-muted text-uppercase">Username</label>
				<div class="input-group">
				<span class="input-group-text border-end-0"><i class="bi bi-person text-muted"></i></span>
				<input type="text" class="form-control border-start-0" id="username" name="username" placeholder="Enter your username" required>
				</div>
			</div>
			
			<div class="mb-4">
				<label for="password" class="form-label small fw-bold text-muted text-uppercase">Password</label>
				<div class="input-group">
				<span class="input-group-text border-end-0"><i class="bi bi-lock text-muted"></i></span>
				<input type="password" class="form-control border-start-0" id="password" name="password" placeholder="Enter your password" required>
				</div>
			</div>
			
			<div id="errorMessage" class="alert alert-danger d-none py-2 px-3 small border-0 shadow-sm mb-4"></div>
			
			<button type="submit" class="btn btn-primary w-100 btn-login" id="loginBtn">SIGN IN</button>
		</form>
		
		<div class="mt-4 text-center">
			<p class="small text-muted mb-0">&copy; <?php echo date('Y'); ?> TTTaiga Team</p>
		</div>
	</div>

	<!-- jQuery and Bootstrap JS -->
	<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

	<script src="assets/app.js"></script>
		<script>
		$(document).ready(function () {
			const config = <?php echo json_encode(include 'app/configs/taiga.php'); ?>;
			const redirectUrl = <?php echo json_encode($redirect); ?>;


			const $serverSelect = $('#server');
			$.each(config.servers, function (key, server) {
				$serverSelect.append($('<option>', {
					value: server.api_url,
					text: server.name
				}));
			});

			$('#loginForm').on('submit', function (e) {
				e.preventDefault();

				const apiUrl = $('#server').val();
				const username = $('#username').val();
				const password = $('#password').val();
				const $btn = $('#loginBtn');
				const $error = $('#errorMessage');

				$btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-2"></span>AUTHENTICATING...');
				$error.addClass('d-none').text('');

				$.ajax({
					url: 'api.php/auth',
					type: 'POST',
					contentType: 'application/json',
					headers: {
						'X-Taiga-Api-Url': apiUrl
					},
					data: JSON.stringify({
						type: 'normal',
						username: username,
						password: password
					}),
					success: function (response) {
						$.ajax({
							url: 'login.php',
							type: 'POST',
							data: {
								action: 'login',
								taiga_token: response.auth_token,
								taiga_user: JSON.stringify(response),
								taiga_api_url: apiUrl
							},
							success: function () {
								window.location.href = redirectUrl;
							}
						});
					},
					error: function (xhr) {
						console.error('Login failed:', xhr);
						$btn.prop('disabled', false).text('SIGN IN');
						$error.removeClass('d-none').text(xhr.responseJSON?._error_message || 'Login failed. Please check your credentials.');
					}
				});
			});
		});
	</script>

</body>

</html>

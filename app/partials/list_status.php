<?php
/**
 * Expected variables:
 * $totalLabel - e.g. 'Total Isus' (Legacy support)
 * $totalId - e.g. 'totalIssues'
 * $filteredId - e.g. 'filteredIssues'
 * $filteredLabel - (Optional) e.g. 'Shown'
 * $selectionCountId - (Optional) ID for selection count span
 * $selectionLabel - (Optional) e.g. 'Selected'
 * $bulkActions - (Optional) HTML for dropdown items
 */
$totalLabel ??= 'Total';
$filteredLabel ??= 'Shown';
$selectionLabel ??= 'Selected';
$totalId ??= 'totalCount';
$filteredId ??= 'shownCount';
$selectionCountId ??= 'selectedCount';
?>
<div class="sticky-bulk-bar" id="bulkActionsBar">
	<div class="container d-flex justify-content-between align-items-center">
		<div class="d-flex align-items-center">
			<div class="master-checkbox-container me-3" id="masterCheckboxContainer">
				<div class="form-check mb-0">
					<input class="form-check-input" type="checkbox" id="masterCheckbox">
					<label class="form-check-label fw-bold" for="masterCheckbox">Select All</label>
				</div>
			</div>
			
			<div class="text-muted small border-start ps-3">
				<span class="me-3"><?php echo htmlspecialchars($totalLabel, ENT_QUOTES, 'UTF-8'); ?>: <strong id="<?php echo htmlspecialchars($totalId, ENT_QUOTES, 'UTF-8'); ?>">0</strong></span>
				<span class="me-3"><?php echo htmlspecialchars($filteredLabel, ENT_QUOTES, 'UTF-8'); ?>: <strong id="<?php echo htmlspecialchars($filteredId, ENT_QUOTES, 'UTF-8'); ?>">0</strong></span>
				<span><?php echo htmlspecialchars($selectionLabel, ENT_QUOTES, 'UTF-8'); ?>: <strong id="<?php echo htmlspecialchars($selectionCountId, ENT_QUOTES, 'UTF-8'); ?>">0</strong></span>
			</div>
		</div>

		<div class="d-flex align-items-center">
			<button class="btn btn-sm btn-outline-secondary me-3 tttaiga-bulk-handle" id="clearSelectionBtn" disabled>
				Clear
			</button>

			<div id="bulkActionsDropdownContainer">
				<?php if (isset($bulkActions)): ?>
					<div class="dropdown">
						<button class="btn btn-primary btn-sm dropdown-toggle tttaiga-bulk-handle" type="button" id="bulkActionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
							<i class="bi bi-gear-fill me-1"></i> Bulk Actions
						</button>
						<ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="bulkActionsDropdown">
							<?php echo $bulkActions; ?>
						</ul>
					</div>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>

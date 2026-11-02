<?php

namespace app\helpers;

/**
 * Pure helpers for list transformations the Taiga API cannot do itself.
 *
 * The proxy uses these to bridge API gaps:
 *   - `/tasks` has no `epic` filter (see `filterByUserStoryIds`).
 *   - `/milestones` ignores text search (`q`).
 *   - `/epics` ignores every `order_by` field.
 *   - `/projects` ignores `order_by` for name/date fields.
 *   - `/milestones` ignores `order_by=modified_date`.
 *
 * Everything here is dependency-free so it can be unit tested directly.
 */
final class TaigaProxyList
{
	/** Endpoints whose list params need proxy-side help. */
	private const LIST_PATHS = ['/projects', '/milestones', '/epics'];

	/**
	 * Which `order_by` fields Taiga honors for a list endpoint.
	 *
	 * Anything else must be sorted by the proxy (`sortBy`).
	 *
	 * @return list<string>
	 */
	public static function nativeOrderFields(string $path): array
	{
		return match ($path) {
			'/projects' => ['total_fans', 'total_activity'],
			'/milestones' => ['name', 'created_date', 'estimated_start', 'estimated_finish'],
			default => [],
		};
	}

	/**
	 * True when the request carries a filter/sort Taiga would silently ignore.
	 */
	public static function needsTransform(string $path, array $query): bool
	{
		if (!in_array($path, self::LIST_PATHS, true)) {
			return false;
		}

		// Only `/milestones` lacks `q` search.
		if ($path === '/milestones' && isset($query['q']) && is_string($query['q']) && trim($query['q']) !== '') {
			return true;
		}

		$orderBy = $query['order_by'] ?? null;
		if (!is_string($orderBy) || $orderBy === '') {
			return false;
		}

		return !in_array(ltrim($orderBy, '-'), self::nativeOrderFields($path), true);
	}

	/**
	 * Extract unique integer ids from a list of user story records.
	 *
	 * @param array<int, mixed> $userStories
	 * @return list<int>
	 */
	public static function userStoryIds(array $userStories): array
	{
		$ids = [];

		foreach ($userStories as $userStory) {
			if (!is_array($userStory) || !isset($userStory['id'])) {
				continue;
			}

			if (is_int($userStory['id']) || (is_string($userStory['id']) && ctype_digit($userStory['id']))) {
				$ids[] = (int) $userStory['id'];
			}
		}

		return array_values(array_unique($ids));
	}

	/**
	 * Keep only tasks whose user_story belongs to the given set.
	 *
	 * When $userStoryFilter is provided the task must match that exact user
	 * story too (this mirrors a combined `epic` + `user_story` filter).
	 *
	 * @param array<int, mixed> $tasks
	 * @param array<int, int> $userStoryIds
	 */
	public static function filterByUserStoryIds(array $tasks, array $userStoryIds, ?int $userStoryFilter = null): array
	{
		$allowed = [];
		foreach ($userStoryIds as $id) {
			$allowed[(int) $id] = true;
		}

		if ($allowed === []) {
			return [];
		}

		$filtered = [];

		foreach ($tasks as $task) {
			if (!is_array($task) || !isset($task['user_story'])) {
				continue;
			}

			$userStoryId = (int) $task['user_story'];
			if (!isset($allowed[$userStoryId])) {
				continue;
			}

			if ($userStoryFilter !== null && $userStoryId !== $userStoryFilter) {
				continue;
			}

			$filtered[] = $task;
		}

		return $filtered;
	}

	/**
	 * Keep items whose field contains the needle (case-insensitive substring).
	 *
	 * Mirrors the intent of Taiga's `q` full-text search for endpoints that do
	 * not implement it, e.g. `/milestones?q=` matches the milestone name.
	 *
	 * @param array<int, mixed> $items
	 */
	public static function filterByText(array $items, string $field, string $needle): array
	{
		$needle = trim($needle);
		if ($needle === '') {
			return array_values($items);
		}

		$filtered = [];

		foreach ($items as $item) {
			if (!is_array($item) || !isset($item[$field])) {
				continue;
			}

			$value = $item[$field];
			if (!is_scalar($value) || $value === null) {
				continue;
			}

			if (mb_stripos((string) $value, $needle) !== false) {
				$filtered[] = $item;
			}
		}

		return $filtered;
	}

	/**
	 * Sort a list by a field, mimicking Postgres ordering.
	 *
	 * Null values sort last in ascending order and first in descending order.
	 * Numeric values compare numerically, everything else byte-wise.
	 *
	 * @param array<int, mixed> $items
	 */
	public static function sortBy(array $items, string $field, bool $desc = false): array
	{
		$field = ltrim($field, '-');

		usort($items, static function ($a, $b) use ($field, $desc) {
			$left = is_array($a) ? ($a[$field] ?? null) : null;
			$right = is_array($b) ? ($b[$field] ?? null) : null;

			$cmp = self::compareValues($left, $right);

			return $desc ? -$cmp : $cmp;
		});

		return $items;
	}

	/**
	 * @param mixed $left
	 * @param mixed $right
	 */
	private static function compareValues($left, $right): int
	{
		if ($left === $right) {
			return 0;
		}

		if ($left === null) {
			return 1;
		}

		if ($right === null) {
			return -1;
		}

		if (is_numeric($left) && is_numeric($right)) {
			return (float) $left <=> (float) $right;
		}

		return strcmp((string) $left, (string) $right);
	}

	/**
	 * Slice a list for the requested page.
	 *
	 * @param array<int, mixed> $items
	 * @return array{items: list<mixed>, total: int, page: int, pageSize: int, offset: int, hasNext: bool}
	 */
	public static function paginate(array $items, int $page, int $pageSize): array
	{
		$page = $page > 0 ? $page : 1;
		$pageSize = $pageSize > 0 ? $pageSize : 30;
		$total = count($items);
		$offset = ($page - 1) * $pageSize;
		$slice = array_slice($items, $offset, $pageSize);

		return [
			'items' => array_values($slice),
			'total' => $total,
			'page' => $page,
			'pageSize' => $pageSize,
			'offset' => $offset,
			'hasNext' => $offset + $pageSize < $total,
		];
	}

	/**
	 * Build the pagination headers consumed by `taigaRenderPagination()`.
	 *
	 * @return array<string, string>
	 */
	public static function paginationHeaders(int $total, int $page, int $pageSize): array
	{
		$page = $page > 0 ? $page : 1;
		$pageSize = $pageSize > 0 ? $pageSize : 30;

		return [
			'X-Paginated' => 'true',
			'X-Paginated-By' => (string) $pageSize,
			'X-Pagination-Count' => (string) max(0, $total),
			'X-Pagination-Current' => (string) $page,
		];
	}
}

<?php

namespace app\helpers;

/**
 * Pure helpers for the proxy-side translation of an `epic` task filter into
 * `user_story` membership.
 *
 * Taiga's `/tasks` endpoint supports `project`, `user_story` (single value),
 * `status`, `assigned_to`, etc. — but it has no `epic` filter. Epic membership
 * lives on the user story (`/userstories?epic=` does work), so the proxy must:
 *   1. resolve the epic's user story ids,
 *   2. keep only tasks whose `user_story` belongs to that set,
 *   3. re-slice + re-emit pagination for the merged result.
 *
 * Everything here is dependency-free so it can be unit tested directly.
 */
final class TaigaTaskEpicFilter
{
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
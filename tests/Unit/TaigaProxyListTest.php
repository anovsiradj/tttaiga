<?php

namespace tests\Unit;

use app\helpers\TaigaProxyList;
use PHPUnit\Framework\TestCase;

final class TaigaProxyListTest extends TestCase
{
	public function testNativeOrderFieldsPerEndpoint(): void
	{
		self::assertSame(['total_fans', 'total_activity'], TaigaProxyList::nativeOrderFields('/projects'));
		self::assertSame(
			['name', 'created_date', 'estimated_start', 'estimated_finish'],
			TaigaProxyList::nativeOrderFields('/milestones')
		);
		self::assertSame([], TaigaProxyList::nativeOrderFields('/epics'));
		self::assertSame([], TaigaProxyList::nativeOrderFields('/userstories'));
	}

	public function testNeedsTransformOnlyForKnownPaths(): void
	{
		self::assertFalse(TaigaProxyList::needsTransform('/tasks', ['order_by' => 'subject']));
		self::assertFalse(TaigaProxyList::needsTransform('/userstories', ['q' => 'x']));
	}

	public function testNeedsTransformForIgnoredSortFields(): void
	{
		// `/epics` ignores every order_by field.
		self::assertTrue(TaigaProxyList::needsTransform('/epics', ['order_by' => 'subject']));
		self::assertTrue(TaigaProxyList::needsTransform('/epics', ['order_by' => '-epics_order']));

		// `/projects` ignores name/date but honors aggregate counters.
		self::assertTrue(TaigaProxyList::needsTransform('/projects', ['order_by' => 'name']));
		self::assertTrue(TaigaProxyList::needsTransform('/projects', ['order_by' => '-created_date']));
		self::assertFalse(TaigaProxyList::needsTransform('/projects', ['order_by' => 'total_activity']));
		self::assertFalse(TaigaProxyList::needsTransform('/projects', ['order_by' => '-total_fans']));

		// `/milestones` ignores modified_date but honors the rest.
		self::assertTrue(TaigaProxyList::needsTransform('/milestones', ['order_by' => '-modified_date']));
		self::assertFalse(TaigaProxyList::needsTransform('/milestones', ['order_by' => 'estimated_start']));
	}

	public function testNeedsTransformForMilestoneSearchOnly(): void
	{
		self::assertTrue(TaigaProxyList::needsTransform('/milestones', ['q' => 'sprint']));
		self::assertTrue(TaigaProxyList::needsTransform('/milestones', ['q' => '  sprint  ']));
		self::assertFalse(TaigaProxyList::needsTransform('/milestones', ['q' => '   ']));
		self::assertFalse(TaigaProxyList::needsTransform('/milestones', []));

		// The other endpoints do implement `q` natively.
		self::assertFalse(TaigaProxyList::needsTransform('/epics', ['q' => 'sprint']));
		self::assertFalse(TaigaProxyList::needsTransform('/projects', ['q' => 'sprint']));
	}

	public function testNeedsTransformIgnoresEmptyOrderBy(): void
	{
		self::assertFalse(TaigaProxyList::needsTransform('/epics', ['order_by' => '']));
		self::assertFalse(TaigaProxyList::needsTransform('/epics', ['order_by' => null]));
		self::assertFalse(TaigaProxyList::needsTransform('/epics', []));
	}

	public function testUserStoryIdsExtractsUniqueIntegers(): void
	{
		$userStories = [
			['id' => 3524],
			['id' => '3525'],
			['id' => 3524],
			['id' => 0],
			['no_id' => 1],
			['id' => 'not-a-number'],
			'garbage',
		];

		self::assertSame([3524, 3525, 0], TaigaProxyList::userStoryIds($userStories));
	}

	public function testUserStoryIdsReturnsEmptyForEmptyInput(): void
	{
		self::assertSame([], TaigaProxyList::userStoryIds([]));
	}

	public function testFilterKeepsOnlyTasksInTheEpic(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
			['id' => 2, 'user_story' => 9999],
			['id' => 3, 'user_story' => 3525],
			['id' => 4],
			['id' => 5, 'user_story' => 3524],
		];

		$filtered = TaigaProxyList::filterByUserStoryIds($tasks, [3524, 3525]);

		self::assertSame([1, 3, 5], array_column($filtered, 'id'));
	}

	public function testFilterWithEmptyEpicReturnsNothing(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
		];

		self::assertSame([], TaigaProxyList::filterByUserStoryIds($tasks, []));
	}

	public function testFilterHonoursExplicitUserStory(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
			['id' => 2, 'user_story' => 3525],
		];

		self::assertSame(
			[2],
			array_column(TaigaProxyList::filterByUserStoryIds($tasks, [3524, 3525], 3525), 'id')
		);
	}

	public function testFilterExplicitUserStoryOutsideEpicReturnsNothing(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
		];

		self::assertSame(
			[],
			TaigaProxyList::filterByUserStoryIds($tasks, [3524], 3525)
		);
	}

	public function testFilterByTextIsCaseInsensitiveSubstring(): void
	{
		$items = [
			['id' => 1, 'name' => 'Sprint Alpha'],
			['id' => 2, 'name' => 'Sprint Beta'],
			['id' => 3, 'name' => 'Backlog'],
			['id' => 4],
			['id' => 5, 'name' => 'sprint gamma'],
		];

		self::assertSame([1, 2, 5], array_column(TaigaProxyList::filterByText($items, 'name', 'SPRINT'), 'id'));
		self::assertSame([1, 2, 5], array_column(TaigaProxyList::filterByText($items, 'name', 'sprint'), 'id'));
		self::assertSame([], array_column(TaigaProxyList::filterByText($items, 'name', 'zzz'), 'id'));
	}

	public function testFilterByTextBlankNeedleKeepsEverything(): void
	{
		$items = [
			['id' => 1, 'name' => 'A'],
			['id' => 2, 'name' => 'B'],
		];

		self::assertSame([1, 2], array_column(TaigaProxyList::filterByText($items, 'name', '   '), 'id'));
	}

	public function testSortByAscendingAndDescending(): void
	{
		$items = [
			['id' => 'c', 'subject' => 'Charlie'],
			['id' => 'a', 'subject' => 'Alpha'],
			['id' => 'b', 'subject' => 'Bravo'],
		];

		self::assertSame(
			['a', 'b', 'c'],
			array_column(TaigaProxyList::sortBy($items, 'subject'), 'id')
		);

		self::assertSame(
			['c', 'b', 'a'],
			array_column(TaigaProxyList::sortBy($items, 'subject', true), 'id')
		);
	}

	public function testSortByNumericField(): void
	{
		$items = [
			['id' => 1, 'status' => 30],
			['id' => 2, 'status' => 3],
			['id' => 3, 'status' => 200],
		];

		self::assertSame(
			[2, 1, 3],
			array_column(TaigaProxyList::sortBy($items, 'status'), 'id')
		);
	}

	public function testSortByPutsNullsLastWhenAscendingAndFirstWhenDescending(): void
	{
		$items = [
			['id' => 1, 'epics_order' => 20],
			['id' => 2, 'epics_order' => null],
			['id' => 3, 'epics_order' => 10],
		];

		self::assertSame([3, 1, 2], array_column(TaigaProxyList::sortBy($items, 'epics_order'), 'id'));
		self::assertSame([2, 1, 3], array_column(TaigaProxyList::sortBy($items, 'epics_order', true), 'id'));
	}

	public function testSortByUnknownFieldKeepsInputOrder(): void
	{
		$items = [
			['id' => 1, 'subject' => 'Bravo'],
			['id' => 2, 'subject' => 'Alpha'],
		];

		self::assertSame([1, 2], array_column(TaigaProxyList::sortBy($items, 'missing_field'), 'id'));
	}

	public function testPaginateSlicesRequestedPage(): void
	{
		$items = range(1, 95);

		$page1 = TaigaProxyList::paginate($items, 1, 30);
		self::assertSame(95, $page1['total']);
		self::assertSame(1, $page1['page']);
		self::assertSame(30, $page1['pageSize']);
		self::assertSame(0, $page1['offset']);
		self::assertTrue($page1['hasNext']);
		self::assertSame(range(1, 30), $page1['items']);

		$page4 = TaigaProxyList::paginate($items, 4, 30);
		self::assertSame(90, $page4['offset']);
		self::assertFalse($page4['hasNext']);
		self::assertSame(range(91, 95), $page4['items']);
	}

	public function testPaginateNormalisesInvalidPaging(): void
	{
		$result = TaigaProxyList::paginate([1, 2, 3], 0, 0);

		self::assertSame(1, $result['page']);
		self::assertSame(30, $result['pageSize']);
		self::assertSame([1, 2, 3], $result['items']);
	}

	public function testPaginationHeadersMatchClientContract(): void
	{
		self::assertSame(
			[
				'X-Paginated' => 'true',
				'X-Paginated-By' => '30',
				'X-Pagination-Count' => '278',
				'X-Pagination-Current' => '1',
			],
			TaigaProxyList::paginationHeaders(278, 1, 30)
		);

		self::assertSame(
			[
				'X-Paginated' => 'true',
				'X-Paginated-By' => '30',
				'X-Pagination-Count' => '0',
				'X-Pagination-Current' => '3',
			],
			TaigaProxyList::paginationHeaders(-5, 3, 30)
		);
	}
}

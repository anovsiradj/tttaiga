<?php

namespace tests\Unit;

use app\helpers\TaigaTaskEpicFilter;
use PHPUnit\Framework\TestCase;

final class TaigaTaskEpicFilterTest extends TestCase
{
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

		self::assertSame([3524, 3525, 0], TaigaTaskEpicFilter::userStoryIds($userStories));
	}

	public function testUserStoryIdsReturnsEmptyForEmptyInput(): void
	{
		self::assertSame([], TaigaTaskEpicFilter::userStoryIds([]));
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

		$filtered = TaigaTaskEpicFilter::filterByUserStoryIds($tasks, [3524, 3525]);

		self::assertSame([1, 3, 5], array_column($filtered, 'id'));
	}

	public function testFilterWithEmptyEpicReturnsNothing(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
		];

		self::assertSame([], TaigaTaskEpicFilter::filterByUserStoryIds($tasks, []));
	}

	public function testFilterHonoursExplicitUserStory(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
			['id' => 2, 'user_story' => 3525],
		];

		self::assertSame(
			[2],
			array_column(TaigaTaskEpicFilter::filterByUserStoryIds($tasks, [3524, 3525], 3525), 'id')
		);
	}

	public function testFilterExplicitUserStoryOutsideEpicReturnsNothing(): void
	{
		$tasks = [
			['id' => 1, 'user_story' => 3524],
		];

		self::assertSame(
			[],
			TaigaTaskEpicFilter::filterByUserStoryIds($tasks, [3524], 3525)
		);
	}

	public function testPaginateSlicesRequestedPage(): void
	{
		$items = range(1, 95);

		$page1 = TaigaTaskEpicFilter::paginate($items, 1, 30);
		self::assertSame(95, $page1['total']);
		self::assertSame(1, $page1['page']);
		self::assertSame(30, $page1['pageSize']);
		self::assertSame(0, $page1['offset']);
		self::assertTrue($page1['hasNext']);
		self::assertSame(range(1, 30), $page1['items']);

		$page4 = TaigaTaskEpicFilter::paginate($items, 4, 30);
		self::assertSame(90, $page4['offset']);
		self::assertFalse($page4['hasNext']);
		self::assertSame(range(91, 95), $page4['items']);
	}

	public function testPaginateNormalisesInvalidPaging(): void
	{
		$result = TaigaTaskEpicFilter::paginate([1, 2, 3], 0, 0);

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
			TaigaTaskEpicFilter::paginationHeaders(278, 1, 30)
		);

		self::assertSame(
			[
				'X-Paginated' => 'true',
				'X-Paginated-By' => '30',
				'X-Pagination-Count' => '0',
				'X-Pagination-Current' => '3',
			],
			TaigaTaskEpicFilter::paginationHeaders(-5, 3, 30)
		);
	}
}
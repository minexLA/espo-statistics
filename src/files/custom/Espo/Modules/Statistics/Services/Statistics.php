<?php

namespace Espo\Modules\Statistics\Services;

use Espo\Core\Templates\Services\Base;
use Espo\ORM\EntityManager;

class Statistics extends Base
{
    protected $entityManager;
    protected array $success_statuses = [
        'Deposit',
        'RE Deposit (Voice changed)',
    ];

    // 1. Inject the EntityManager automatically
    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    public function getConversionStats(array $params): array
    {
        $agentId = $params['agentId'] ?? null;
        $source = $params['source'] ?? null;
        $period = $params['period'] ?? 'last30Days';

        $query = $this->entityManager->getQueryBuilder()
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('status');

        // 1. Apply Agent Filter
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        // 2. Apply Partner Filter
        if ($source) {
            $query->where(['source' => $source]);
        }

        // 3. Apply Date Filter
        $this->applyDateFilter($query, $period);

        // Execute
        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        // 4. Process Results
        $total = 0;
        $converted = 0;

        foreach ($rows as $row) {
            $count = (int)$row['count'];
            $total += $count;
            if (in_array($row['status'], $this->success_statuses)) {
                $converted += $count;
            }
        }

        $rate = ($total > 0) ? round(($converted / $total) * 100, 2) : 0;

        return [
            'total' => $total,
            'converted' => $converted,
            'rate' => $rate
        ];
    }

    private function applyDateFilter($query, $period)
    {
        // Use the native PHP DateTime class (note the backslash)
        $dt = new \DateTime();

        switch ($period) {
            case 'today':
                $start = $dt->format('Y-m-d 00:00:00');
                $query->where(['createdAt>=' => $start]);
                break;

            case 'last7Days':
                $dt->modify('-7 days');
                $start = $dt->format('Y-m-d 00:00:00');
                $query->where(['createdAt>=' => $start]);
                break;

            case 'thisMonth':
                // First day of current month
                $start = $dt->format('Y-m-01 00:00:00');
                $query->where(['createdAt>=' => $start]);
                break;

            case 'lastMonth':
                $dt->modify('first day of last month');
                $start = $dt->format('Y-m-d 00:00:00');

                $dt->modify('last day of last month');
                $end = $dt->format('Y-m-d 23:59:59');

                $query->where(['createdAt>=' => $start, 'createdAt<=' => $end]);
                break;

            case 'last30Days':
            default:
                $dt->modify('-30 days');
                $start = $dt->format('Y-m-d 00:00:00');
                $query->where(['createdAt>=' => $start]);
                break;
        }
    }
}

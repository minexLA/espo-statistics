<?php

namespace Espo\Modules\Statistics\Services;

use Espo\Core\Templates\Services\Base;
use Espo\ORM\EntityManager;

class Statistics extends Base
{
    protected $entityManager;

    // -------------------------------------------------------------------------
    // Configurable constants — rename the field/value here if your CRM schema changes
    // -------------------------------------------------------------------------

    /** Lead field that holds the validity flag */
    protected string $validityField = 'cVal';

    /** Value that marks a lead as fully valid */
    protected string $validityValue = 'full';

    // -------------------------------------------------------------------------

    protected array $success_statuses = [
        'Deposit',
        'RE Deposit (Voice changed)',
    ];

    public function __construct(EntityManager $entityManager)
    {
        $this->entityManager = $entityManager;
    }

    // -------------------------------------------------------------------------
    // 1. Conversion Stats
    // -------------------------------------------------------------------------

    public function getConversionStats(array $params): array
    {
        $agentId = $params['agentId'] ?? null;
        $geo     = $params['geo']     ?? null;

        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        $query = $this->entityManager->getQueryBuilder()
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('status');

        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }
        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($geo) {
            $query->where(['cGeo' => $geo]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        return $this->buildConversionResult($rows);
    }

    // -------------------------------------------------------------------------
    // 2. Avg Wallet Stats
    // -------------------------------------------------------------------------

    public function getAvgWalletStats(array $params): array
    {
        $agentId = $params['agentId'] ?? null;

        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        // Query 1: leads with walletBalance > 0 — SUM + AVG
        $query = $this->entityManager->getQueryBuilder()
            ->select('COUNT:id', 'totalLeads')
            ->select('SUM:walletBalance', 'totalAmount')
            ->select('AVG:walletBalance', 'avgAmount')
            ->from('Lead');

        $query->where(['walletBalance>' => 0]);

        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }
        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();
        $row  = $rows[0] ?? [];

        $totalLeads  = (int)   ($row['totalLeads']  ?? 0);
        $totalAmount = (float) ($row['totalAmount'] ?? 0);
        $avgAmount   = $totalLeads > 0 ? round($totalAmount / $totalLeads, 2) : 0;

        // Query 2: total leads (no walletBalance restriction)
        $totalQuery = $this->entityManager->getQueryBuilder()
            ->select('COUNT:id', 'total')
            ->from('Lead');

        if ($agentId) {
            $totalQuery->where(['assignedUserId' => $agentId]);
        }
        if (!empty($sourceList)) {
            $totalQuery->where(['source' => $sourceList]);
        }

        $this->applyDateFilter($totalQuery, $params);

        $totalRows = $this->entityManager->getQueryExecutor()->execute($totalQuery->build())->fetchAll();
        $totalAll  = (int) ($totalRows[0]['total'] ?? 0);

        return [
            'totalLeads'      => $totalAll,
            'leadsWithAmount' => $totalLeads,
            'totalAmount'     => round($totalAmount, 2),
            'avgAmount'       => $avgAmount,
        ];
    }

    // -------------------------------------------------------------------------
    // 3. Source Conversion Stats
    // -------------------------------------------------------------------------

    public function getSourceConversionStats(array $params): array
    {
        $sources = $params['sources'] ?? null;
        $agentId = $params['agentId'] ?? null;

        // Normalize sources param (may come as JSON-encoded array)
        $sourceList = [];
        if ($sources) {
            if (is_string($sources)) {
                $decoded = json_decode($sources, true);
                if (is_array($decoded)) {
                    $sourceList = $decoded;
                } else {
                    $sourceList = array_filter(array_map('trim', explode(',', $sources)));
                }
            } elseif (is_array($sources)) {
                $sourceList = $sources;
            }
        }

        $query = $this->entityManager->getQueryBuilder()
            ->select('source')
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('source')
            ->group('status');

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        $bySource = [];
        foreach ($rows as $row) {
            $src   = $row['source'] ?? '';
            $count = (int) $row['count'];

            if (!isset($bySource[$src])) {
                $bySource[$src] = ['total' => 0, 'converted' => 0];
            }

            $bySource[$src]['total'] += $count;
            if (in_array($row['status'], $this->success_statuses)) {
                $bySource[$src]['converted'] += $count;
            }
        }

        $result = [];
        foreach ($bySource as $src => $data) {
            $rate = $data['total'] > 0
                ? round(($data['converted'] / $data['total']) * 100, 2)
                : 0;

            $result[] = [
                'source'    => $src,
                'total'     => $data['total'],
                'converted' => $data['converted'],
                'rate'      => $rate,
            ];
        }

        usort($result, fn($a, $b) => $b['total'] <=> $a['total']);

        return ['rows' => $result];
    }

    // -------------------------------------------------------------------------
    // 4. Geo Conversion Stats (all GEOs) — field: cGeo
    // -------------------------------------------------------------------------

    public function getGeoConversionStats(array $params): array
    {
        $agentId = $params['agentId'] ?? null;

        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        $query = $this->entityManager->getQueryBuilder()
            ->select('cGeo')
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('cGeo')
            ->group('status');

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        $byGeo = [];
        foreach ($rows as $row) {
            $geo   = $row['cGeo'] ?? '—';
            $count = (int) $row['count'];

            if (!isset($byGeo[$geo])) {
                $byGeo[$geo] = ['total' => 0, 'converted' => 0];
            }

            $byGeo[$geo]['total'] += $count;
            if (in_array($row['status'], $this->success_statuses)) {
                $byGeo[$geo]['converted'] += $count;
            }
        }

        $result = [];
        foreach ($byGeo as $geo => $data) {
            $rate = $data['total'] > 0
                ? round(($data['converted'] / $data['total']) * 100, 2)
                : 0;

            $result[] = [
                'geo'       => $geo,
                'total'     => $data['total'],
                'converted' => $data['converted'],
                'rate'      => $rate,
            ];
        }

        usort($result, fn($a, $b) => $b['total'] <=> $a['total']);

        return ['rows' => $result];
    }

    // -------------------------------------------------------------------------
    // 5. Agent Stats (extended)
    //    Returns per-agent: total, converted (all), convValid (only valid leads),
    //    totalAmount, avgCheck (amount / converted), avgPerClient (amount / total)
    // -------------------------------------------------------------------------

    public function getAgentStats(array $params): array
    {
        $agentId = $params['agentId'] ?? null;

        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        // ---- Query 1: all leads grouped by agent + status ----
        $query = $this->entityManager->getQueryBuilder()
            ->select('assignedUserId')
            ->select('assignedUserName')
            ->select('status')
            ->select('COUNT:id', 'count')
            ->select('SUM:walletBalance', 'totalAmount')
            ->from('Lead')
            ->group('assignedUserId')
            ->group('status');

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        // ---- Query 2: valid leads grouped by agent + status ----
        $validQuery = $this->entityManager->getQueryBuilder()
            ->select('assignedUserId')
            ->select('status')
            ->select('COUNT:id', 'count')
            ->select('SUM:walletBalance', 'totalAmount')
            ->from('Lead')
            ->group('assignedUserId')
            ->group('status');

        $validQuery->where([$this->validityField => $this->validityValue]);

        if (!empty($sourceList)) {
            $validQuery->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $validQuery->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($validQuery, $params);

        $validRows = $this->entityManager->getQueryExecutor()->execute($validQuery->build())->fetchAll();

        // ---- Aggregate all-leads data ----
        $byAgent = [];
        foreach ($rows as $row) {
            $uid   = $row['assignedUserId']   ?? '';
            $uname = $row['assignedUserName'] ?? $uid;
            $count = (int)   $row['count'];
            $amt   = (float) ($row['totalAmount'] ?? 0);

            if (!isset($byAgent[$uid])) {
                $byAgent[$uid] = [
                    'agentId'       => $uid,
                    'agentName'     => $uname,
                    'total'         => 0,
                    'converted'     => 0,
                    'totalAmount'   => 0,
                    'convValid'     => 0,
                    'validTotal'    => 0,
                    'validAmount'   => 0,
                ];
            }

            $byAgent[$uid]['total']       += $count;
            $byAgent[$uid]['totalAmount'] += $amt;
            if (in_array($row['status'], $this->success_statuses)) {
                $byAgent[$uid]['converted'] += $count;
            }
        }

        // ---- Aggregate valid-leads data ----
        foreach ($validRows as $row) {
            $uid   = $row['assignedUserId'] ?? '';
            $count = (int)   $row['count'];
            $amt   = (float) ($row['totalAmount'] ?? 0);

            if (!isset($byAgent[$uid])) continue; // agent already exists from query 1

            $byAgent[$uid]['validTotal']  += $count;
            $byAgent[$uid]['validAmount'] += $amt;
            if (in_array($row['status'], $this->success_statuses)) {
                $byAgent[$uid]['convValid'] += $count;
            }
        }

        // ---- Build result ----
        $result = [];
        foreach ($byAgent as $data) {
            // Conversion rate (all leads)
            $rate = $data['total'] > 0
                ? round(($data['converted'] / $data['total']) * 100, 2)
                : 0;

            // Conversion rate (valid leads only)
            $rateValid = $data['validTotal'] > 0
                ? round(($data['convValid'] / $data['validTotal']) * 100, 2)
                : 0;

            // Avg check = total wallet amount / number of converted leads (deposits)
            $avgCheck = $data['converted'] > 0
                ? round($data['totalAmount'] / $data['converted'], 2)
                : 0;

            // Avg per client = total wallet amount / total lead count
            $avgPerClient = $data['total'] > 0
                ? round($data['totalAmount'] / $data['total'], 2)
                : 0;

            $result[] = [
                'agentId'      => $data['agentId'],
                'agentName'    => $data['agentName'],
                'total'        => $data['total'],
                'converted'    => $data['converted'],
                'rate'         => $rate,
                'rateValid'    => $rateValid,
                'convValid'    => $data['convValid'],
                'validTotal'   => $data['validTotal'],
                'totalAmount'  => round($data['totalAmount'], 2),
                'avgCheck'     => $avgCheck,
                'avgPerClient' => $avgPerClient,
            ];
        }

        usort($result, fn($a, $b) => $b['total'] <=> $a['total']);

        return ['rows' => $result];
    }

    // -------------------------------------------------------------------------
    // 6. GEO Charbar Stats — conversion rate per GEO (valid leads only)
    // -------------------------------------------------------------------------

    public function getGeoCharbarStats(array $params): array
    {
        $agentId    = $params['agentId'] ?? null;
        $metric     = $params['metric']  ?? 'rate'; // rate | count | share
        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        $query = $this->entityManager->getQueryBuilder()
            ->select('cGeo')
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('cGeo')
            ->group('status');

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        $byGeo = [];
        $grandTotal = 0;
        foreach ($rows as $row) {
            $geo   = $row['cGeo'] ?? '—';
            $count = (int) $row['count'];
            if (!isset($byGeo[$geo])) {
                $byGeo[$geo] = ['total' => 0, 'converted' => 0];
            }
            $byGeo[$geo]['total'] += $count;
            $grandTotal += $count;
            if (in_array($row['status'], $this->success_statuses)) {
                $byGeo[$geo]['converted'] += $count;
            }
        }

        $result = [];
        foreach ($byGeo as $geo => $data) {
            $rate  = $data['total'] > 0 ? round(($data['converted'] / $data['total']) * 100, 2) : 0;
            $share = $grandTotal > 0   ? round(($data['total'] / $grandTotal) * 100, 2) : 0;

            $barValue = match($metric) {
                'count' => $data['total'],
                'share' => $share,
                default => $rate, // 'rate'
            };

            $result[] = [
                'label'     => $geo,
                'total'     => $data['total'],
                'converted' => $data['converted'],
                'rate'      => $rate,
                'share'     => $share,
                'barValue'  => $barValue,
            ];
        }

        usort($result, fn($a, $b) => $b['barValue'] <=> $a['barValue']);

        return ['rows' => $result, 'metric' => $metric, 'grandTotal' => $grandTotal];
    }

    // -------------------------------------------------------------------------
    // 7. Valid Charbar Stats — distribution by validity field (c_ccval)
    // -------------------------------------------------------------------------

    public function getValidCharbarStats(array $params): array
    {
        $agentId    = $params['agentId'] ?? null;
        $metric     = $params['metric']  ?? 'count'; // count | share
        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        $query = $this->entityManager->getQueryBuilder()
            ->select($this->validityField)
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group($this->validityField);

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        $grandTotal = 0;
        $data = [];
        foreach ($rows as $row) {
            $val   = $row[$this->validityField] ?? '—';
            $count = (int) $row['count'];
            $data[$val] = $count;
            $grandTotal += $count;
        }

        $result = [];
        foreach ($data as $val => $count) {
            $share    = $grandTotal > 0 ? round(($count / $grandTotal) * 100, 2) : 0;
            $barValue = $metric === 'share' ? $share : $count;
            $isValid  = ($val === $this->validityValue);

            $result[] = [
                'label'    => $val ?: '—',
                'count'    => $count,
                'share'    => $share,
                'barValue' => $barValue,
                'isValid'  => $isValid,
            ];
        }

        usort($result, fn($a, $b) => $b['barValue'] <=> $a['barValue']);

        return ['rows' => $result, 'metric' => $metric, 'grandTotal' => $grandTotal];
    }

    // -------------------------------------------------------------------------
    // 8. Status Charbar Stats — distribution by lead status
    // -------------------------------------------------------------------------

    public function getStatusCharbarStats(array $params): array
    {
        $agentId    = $params['agentId'] ?? null;
        $metric     = $params['metric']  ?? 'count'; // count | share
        $sourceList = $this->parseSourceList($params['sources'] ?? null);

        $query = $this->entityManager->getQueryBuilder()
            ->select('status')
            ->select('COUNT:id', 'count')
            ->from('Lead')
            ->group('status');

        if (!empty($sourceList)) {
            $query->where(['source' => $sourceList]);
        }
        if ($agentId) {
            $query->where(['assignedUserId' => $agentId]);
        }

        $this->applyDateFilter($query, $params);

        $rows = $this->entityManager->getQueryExecutor()->execute($query->build())->fetchAll();

        $grandTotal = 0;
        $data = [];
        foreach ($rows as $row) {
            $status = $row['status'] ?? '—';
            $count  = (int) $row['count'];
            $data[$status] = $count;
            $grandTotal += $count;
        }

        $result = [];
        foreach ($data as $status => $count) {
            $share     = $grandTotal > 0 ? round(($count / $grandTotal) * 100, 2) : 0;
            $barValue  = $metric === 'share' ? $share : $count;
            $isSuccess = in_array($status, $this->success_statuses);

            $result[] = [
                'label'     => $status ?: '—',
                'count'     => $count,
                'share'     => $share,
                'barValue'  => $barValue,
                'isSuccess' => $isSuccess,
            ];
        }

        usort($result, fn($a, $b) => $b['barValue'] <=> $a['barValue']);

        return ['rows' => $result, 'metric' => $metric, 'grandTotal' => $grandTotal];
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Parse a JSON-encoded list of sources from request params.
     * Returns an empty array if no sources are specified.
     */
    private function parseSourceList(?string $sources): array
    {
        if (!$sources) return [];
        $decoded = json_decode($sources, true);
        return is_array($decoded) ? array_filter($decoded) : [];
    }

    private function buildConversionResult(array $rows): array
    {
        $total     = 0;
        $converted = 0;

        foreach ($rows as $row) {
            $count  = (int) $row['count'];
            $total += $count;
            if (in_array($row['status'], $this->success_statuses)) {
                $converted += $count;
            }
        }

        $rate = ($total > 0) ? round(($converted / $total) * 100, 2) : 0;

        return [
            'total'     => $total,
            'converted' => $converted,
            'rate'      => $rate,
        ];
    }

    /**
     * Apply date filter from params.
     * Supports:
     *  - dateFrom / dateTo  (custom range, YYYY-MM-DD)
     *  - period             (named preset, backward compat)
     */
    private function applyDateFilter($query, array $params): void
    {
        $dateFrom = $params['dateFrom'] ?? null;
        $dateTo   = $params['dateTo']   ?? null;

        // Custom date range takes priority
        if ($dateFrom || $dateTo) {
            if ($dateFrom) {
                $query->where(['createdAt>=' => $dateFrom . ' 00:00:00']);
            }
            if ($dateTo) {
                $query->where(['createdAt<=' => $dateTo . ' 23:59:59']);
            }
            return;
        }

        // Fall back to named period (backward compat)
        $period = $params['period'] ?? 'all';

        if (!$period || $period === 'all') {
            return;
        }

        $dt = new \DateTime();

        switch ($period) {
            case 'today':
                $query->where(['createdAt>=' => $dt->format('Y-m-d 00:00:00')]);
                break;

            case 'yesterday':
                $dt->modify('-1 day');
                $query->where([
                    'createdAt>=' => $dt->format('Y-m-d 00:00:00'),
                    'createdAt<=' => $dt->format('Y-m-d 23:59:59'),
                ]);
                break;

            case 'last7Days':
                $dt->modify('-7 days');
                $query->where(['createdAt>=' => $dt->format('Y-m-d 00:00:00')]);
                break;

            case 'thisMonth':
                $query->where(['createdAt>=' => $dt->format('Y-m-01 00:00:00')]);
                break;

            case 'lastMonth':
                $dt->modify('first day of last month');
                $start = $dt->format('Y-m-d 00:00:00');
                $dt->modify('last day of last month');
                $query->where([
                    'createdAt>=' => $start,
                    'createdAt<=' => $dt->format('Y-m-d 23:59:59'),
                ]);
                break;

            case 'last30Days':
                $dt->modify('-30 days');
                $query->where(['createdAt>=' => $dt->format('Y-m-d 00:00:00')]);
                break;
        }
    }
}

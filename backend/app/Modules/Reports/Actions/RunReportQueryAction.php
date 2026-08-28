<?php

declare(strict_types=1);

namespace App\Modules\Reports\Actions;

use App\Modules\Reports\Contracts\ReportQueryInterface;
use App\Modules\Reports\Models\ReportDefinition;
use App\Modules\Reports\Queries\GeneralLedgerSummaryReportQuery;
use App\Modules\Reports\Queries\PayrollSummaryReportQuery;
use App\Modules\Reports\Queries\ProductionYieldReportQuery;
use App\Modules\Reports\Queries\SalesPerformanceReportQuery;
use App\Modules\Reports\Queries\StockValuationReportQuery;
use Illuminate\Validation\ValidationException;

class RunReportQueryAction
{
    /**
     * @var array<string, class-string<ReportQueryInterface>>
     */
    protected array $queryMap = [
        'production_yield' => ProductionYieldReportQuery::class,
        'stock_valuation' => StockValuationReportQuery::class,
        'sales_performance' => SalesPerformanceReportQuery::class,
        'gl_summary' => GeneralLedgerSummaryReportQuery::class,
        'payroll_summary' => PayrollSummaryReportQuery::class,
    ];

    public function execute(string $code, array $filters = [], int $page = 1, int $perPage = 25): array
    {
        $definition = ReportDefinition::where('code', $code)->first();

        if (!$definition) {
            throw ValidationException::withMessages([
                'code' => ["Report definition with code '{$code}' not found."],
            ]);
        }

        $queryClass = $this->queryMap[$code] ?? null;

        if (!$queryClass || !class_exists($queryClass)) {
            throw ValidationException::withMessages([
                'code' => ["No query runner registered for report '{$code}'."],
            ]);
        }

        /** @var ReportQueryInterface $runner */
        $runner = new $queryClass();

        $result = $runner->query($filters, $page, $perPage);
        $summary = $runner->summary($filters);
        $columns = $runner->columns();

        return [
            'report' => [
                'code' => $definition->code,
                'name' => $definition->name,
                'category' => $definition->category,
                'module' => $definition->module,
                'tier' => $definition->tier ?? 'live',
            ],
            'columns' => $columns,
            'data' => $result['data'],
            'pagination' => [
                'total' => $result['total'],
                'current_page' => $result['current_page'],
                'per_page' => $result['per_page'],
                'last_page' => (int) ceil($result['total'] / max(1, $result['per_page'])),
            ],
            'summary' => $summary,
            'meta' => [
                'freshness' => [
                    'as_of' => now()->toIso8601String(),
                    'tier' => $definition->tier ?? 'live',
                    'stale' => false,
                ],
            ],
        ];
    }
}

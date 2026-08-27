<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\ProductionBatch;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AnalyzeBatchYieldAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: User, productionBatch: ProductionBatch}  $input
     * @return array{productionBatch: ProductionBatch}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        /** @var ProductionBatch $batch */
        $batch = $input['productionBatch'];

        $batch->load(['billOfMaterial', 'inputs', 'outputs']);

        $totalInput = (float) $batch->total_input_quantity;
        $totalOutput = (float) $batch->total_output_quantity;
        $plannedQty = (float) $batch->planned_quantity;

        if ($totalInput <= 0 && $totalOutput <= 0) {
            throw ValidationException::withMessages([
                'batch' => 'Cannot analyse batch yield without material inputs or production outputs.',
            ]);
        }

        $batch = DB::transaction(function () use ($actor, $batch, $totalInput, $totalOutput, $plannedQty): ProductionBatch {
            $before = $batch->toArray();

            // 1. Calculate yield percentage: (output / input) * 100
            $yieldPercentage = $totalInput > 0
                ? round(($totalOutput / $totalInput) * 100, 4)
                : 100.0000;

            // 2. Calculate variance vs planned: output - planned
            $varianceQty = round($totalOutput - $plannedQty, 4);
            $variancePct = $plannedQty > 0
                ? round(($varianceQty / $plannedQty) * 100, 4)
                : 0.0000;

            // 3. Expected yield from BOM
            $bomExpectedYield = (float) $batch->billOfMaterial->expected_yield_percentage;
            $yieldEfficiency = $bomExpectedYield > 0
                ? round(($yieldPercentage / $bomExpectedYield) * 100, 4)
                : 100.0000;

            $analysis = [
                'computed_at' => now()->toIso8601String(),
                'total_input' => number_format($totalInput, 4, '.', ''),
                'total_output' => number_format($totalOutput, 4, '.', ''),
                'planned_quantity' => number_format($plannedQty, 4, '.', ''),
                'bom_expected_yield' => number_format($bomExpectedYield, 4, '.', ''),
                'yield_efficiency_percentage' => number_format($yieldEfficiency, 4, '.', ''),
                'process_loss_quantity' => number_format(max(0, $totalInput - $totalOutput), 4, '.', ''),
            ];

            $batch->update([
                'yield_percentage' => number_format($yieldPercentage, 4, '.', ''),
                'variance_quantity' => number_format($varianceQty, 4, '.', ''),
                'variance_percentage' => number_format($variancePct, 4, '.', ''),
                'analysis' => $analysis,
                'context_completeness' => 'analysed',
                'updated_by' => $actor->id,
            ]);

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $batch,
                before: $before,
                after: $batch->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_batch', 'event' => 'yield_analysis']
            );

            return $batch;
        });

        return [
            'productionBatch' => $batch->load(['product', 'billOfMaterial', 'outputUnit', 'inputs.product', 'inputs.unit', 'outputs.product', 'outputs.unit', 'outputs.targetWarehouse']),
        ];
    }
}

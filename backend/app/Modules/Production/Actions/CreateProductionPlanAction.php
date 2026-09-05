<?php

declare(strict_types=1);

namespace App\Modules\Production\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\ProductionPlan;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateProductionPlanAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{productionPlan: ProductionPlan}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        $tenantId = (int) $actor->tenant_id;

        if (ProductionPlan::withoutGlobalScope('tenant')
            ->where('tenant_id', $tenantId)
            ->where('plan_number', $input['plan_number'])
            ->exists()
        ) {
            throw new DuplicateResourceException(
                field: 'plan_number',
                value: is_string($input['plan_number']) ? $input['plan_number'] : ''
            );
        }

        $plan = DB::transaction(function () use ($input, $actor, $tenantId): ProductionPlan {
            $companyId = $this->resolveId('companies', $input['company_id'], $tenantId, 'company_id');
            $factoryId = $this->resolveId('factories', $input['factory_id'], $tenantId, 'factory_id');

            $plan = ProductionPlan::create([
                'uuid' => (string) Str::uuid(),
                'company_id' => $companyId,
                'factory_id' => $factoryId,
                'plan_number' => $input['plan_number'],
                'plan_date' => $input['plan_date'],
                'period_start' => $input['period_start'],
                'period_end' => $input['period_end'],
                'source' => $input['source'],
                'status' => $input['status'] ?? 'draft',
                'notes' => $input['notes'] ?? null,
                'created_by' => $actor->id,
            ]);

            /** @var array<int, mixed> $items */
            $items = $input['items'];
            $this->syncItems($plan, $items, $tenantId, $actor->id);

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $plan,
                after: $plan->load('items')->toArray(),
                actor: $actor,
                context: ['module' => 'production', 'resource' => 'production_plan']
            );

            return $plan;
        });

        return [
            'productionPlan' => $plan->load(['items.product', 'items.billOfMaterial', 'items.unit']),
        ];
    }

    /**
     * @param  array<int, mixed>  $items
     */
    public function syncItems(ProductionPlan $plan, array $items, int $tenantId, int $actorId): void
    {
        $plan->items()->delete();

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                throw ValidationException::withMessages(['items' => 'Each item must be an object.']);
            }

            $productId = $this->resolveId('products', $item['product_id'] ?? null, $tenantId, "items.{$index}.product_id");
            $bomId = $this->resolveId('bill_of_materials', $item['bill_of_material_id'] ?? null, $tenantId, "items.{$index}.bill_of_material_id");
            $unitId = $this->resolveId('units', $item['unit_id'] ?? null, $tenantId, "items.{$index}.unit_id");

            $lineId = null;
            if (! empty($item['production_line_id'])) {
                $lineId = $this->resolveId('production_lines', $item['production_line_id'], $tenantId, "items.{$index}.production_line_id");
            }

            $plan->items()->create([
                'uuid' => (string) Str::uuid(),
                'product_id' => $productId,
                'bill_of_material_id' => $bomId,
                'planned_quantity' => $item['planned_quantity'] ?? '0.0000',
                'unit_id' => $unitId,
                'production_line_id' => $lineId,
                'scheduled_date' => $item['scheduled_date'] ?? null,
                'produced_quantity' => '0.0000',
                'status' => 'draft',
                'sort_order' => $item['sort_order'] ?? $index,
                'created_by' => $actorId,
            ]);
        }
    }

    private function resolveId(string $table, mixed $uuid, int $tenantId, string $field): int
    {
        $query = DB::table($table)->where('tenant_id', $tenantId);
        if (is_numeric($uuid)) {
            $row = (clone $query)->where('id', (int) $uuid)->first();
            if ($row !== null) {
                return (int) $row->id;
            }
        }

        $row = $query->where('uuid', $uuid)->first();
        if ($row === null) {
            $fallback = DB::table($table)->where('uuid', $uuid)->first();
            if ($fallback !== null) {
                return (int) $fallback->id;
            }

            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->id;
    }
}

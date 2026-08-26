<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\BillOfMaterialItem;
use App\Models\Product;
use App\Models\Unit;
use App\Models\UnitConversion;
use Illuminate\Support\Facades\DB;

class DeleteUnitAction extends Action
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
    ) {}

    /**
     * @param  array{user: \App\Models\User, unit: Unit}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];

        /** @var Unit $unit */
        $unit = $input['unit'];

        // Check for references — Products use SoftDeletes, so only count non-trashed
        $blockingCount = Product::withoutGlobalScope('tenant')
            ->where('tenant_id', $actor->tenant_id)
            ->where(fn ($q) => $q
                ->where('base_unit_id', $unit->getKey())
                ->orWhere('purchase_unit_id', $unit->getKey())
                ->orWhere('sales_unit_id', $unit->getKey())
            )
            ->count()
            // UnitConversion has NO SoftDeletes — count all
            + UnitConversion::withoutGlobalScope('tenant')
                ->where('tenant_id', $actor->tenant_id)
                ->where(fn ($q) => $q
                    ->where('from_unit_id', $unit->getKey())
                    ->orWhere('to_unit_id', $unit->getKey())
                )
                ->count()
            // BillOfMaterialItem has NO SoftDeletes — count all
            + BillOfMaterialItem::withoutGlobalScope('tenant')
                ->where('tenant_id', $actor->tenant_id)
                ->where('unit_id', $unit->getKey())
                ->count();

        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }

        DB::transaction(function () use ($unit, $actor): void {
            $unit->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $unit,
                before: $unit->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'unit'],
            );
        });

        return ['deleted' => true];
    }
}

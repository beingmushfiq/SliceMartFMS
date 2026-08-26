<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Brand;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

final class DeleteBrandAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, brand: Brand}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Brand $brand */
        $brand = $input['brand'];
        $blockingCount = Product::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('brand_id', $brand->getKey())->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }

        DB::transaction(function () use ($brand, $actor): void {
            $brand->delete();
            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $brand,
                before: $brand->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'brand'],
            );
        });

        return ['deleted' => true];
    }
}

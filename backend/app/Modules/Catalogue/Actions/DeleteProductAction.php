<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\BillOfMaterial;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;

final class DeleteProductAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Product $product */
        $product = $input['product'];
        $blockingCount = ProductVariant::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('product_id', $product->getKey())->count()
            + ProductImage::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('product_id', $product->getKey())->count()
            + BillOfMaterial::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('product_id', $product->getKey())->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }
        DB::transaction(function () use ($product, $actor): void {
            $product->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $product, before: $product->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'product']);
        });

        return ['deleted' => true];
    }
}

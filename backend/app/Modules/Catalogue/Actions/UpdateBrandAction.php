<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Brand;
use Illuminate\Support\Facades\DB;

final class UpdateBrandAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, brand: Brand, code?: string, name?: string, logo_path?: string|null, is_active?: bool}  $input
     * @return array{brand: Brand}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Brand $brand */
        $brand = $input['brand'];
        if (isset($input['code']) && $input['code'] !== $brand->code && Brand::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->where('id', '!=', $brand->getKey())->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $input['code']);
        }

        $before = $brand->toArray();
        DB::transaction(function () use ($input, $actor, $brand, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'brand']));
            /** @phpstan-ignore argument.type */
            $brand->update([...$payload, 'updated_by' => $actor->getKey()]);
            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $brand,
                before: $before,
                after: $brand->fresh()?->toArray() ?? $brand->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'brand'],
            );
        });

        return ['brand' => $brand->refresh()];
    }
}

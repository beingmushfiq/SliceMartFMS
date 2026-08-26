<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Brand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateBrandAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, code: string, name: string, logo_path?: string|null, is_active?: bool}  $input
     * @return array{brand: Brand}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        if (Brand::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $input['code']);
        }

        $brand = DB::transaction(function () use ($input, $actor): Brand {
            $brand = Brand::create([
                'uuid' => (string) Str::uuid(),
                'code' => $input['code'],
                'name' => $input['name'],
                'logo_path' => $input['logo_path'] ?? null,
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
            ]);
            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $brand,
                after: $brand->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'brand'],
            );

            return $brand;
        });

        return ['brand' => $brand];
    }
}

<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Party;
use App\Models\Product;
use App\Models\TaxProfile;
use Illuminate\Support\Facades\DB;

final class DeleteTaxProfileAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, taxProfile: TaxProfile}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var TaxProfile $taxProfile */
        $taxProfile = $input['taxProfile'];
        // Both Party and Product use SoftDeletes, so only live rows block deletion.
        $blockingCount = Party::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('tax_profile_id', $taxProfile->getKey())->count()
            + Product::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('tax_profile_id', $taxProfile->getKey())->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }

        DB::transaction(function () use ($taxProfile, $actor): void {
            $taxProfile->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $taxProfile, before: $taxProfile->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'tax_profile']);
        });

        return ['deleted' => true];
    }
}

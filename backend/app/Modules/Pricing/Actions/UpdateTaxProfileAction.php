<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\TaxProfile;
use Illuminate\Support\Facades\DB;

final class UpdateTaxProfileAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{taxProfile: TaxProfile}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var TaxProfile $taxProfile */
        $taxProfile = $input['taxProfile'];
        if (array_key_exists('code', $input) && $input['code'] !== $taxProfile->code && TaxProfile::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->where('id', '!=', $taxProfile->getKey())->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }

        $before = $taxProfile->toArray();
        DB::transaction(function () use ($input, $actor, $taxProfile, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'taxProfile']));
            /** @phpstan-ignore argument.type */
            $taxProfile->update([...$payload, 'updated_by' => $actor->getKey()]);
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $taxProfile, before: $before, after: $taxProfile->fresh()?->toArray() ?? $taxProfile->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'tax_profile']);
        });

        return ['taxProfile' => $taxProfile->refresh()];
    }
}

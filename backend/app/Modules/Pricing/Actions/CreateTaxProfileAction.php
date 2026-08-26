<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\TaxProfile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CreateTaxProfileAction extends Action
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
        $code = is_string($input['code'] ?? null) ? $input['code'] : '';
        if (TaxProfile::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $code)->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $code);
        }

        $taxProfile = DB::transaction(function () use ($input, $actor, $code): TaxProfile {
            $taxProfile = TaxProfile::create([
                'uuid' => (string) Str::uuid(),
                'code' => $code,
                'name' => $input['name'],
                'rate' => $input['rate'],
                'type' => $input['type'],
                'is_compound' => $input['is_compound'] ?? false,
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
            ]);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $taxProfile, after: $taxProfile->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'tax_profile']);

            return $taxProfile;
        });

        return ['taxProfile' => $taxProfile];
    }
}

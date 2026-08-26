<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\DiscountRule;
use Illuminate\Support\Facades\DB;

final class UpdateDiscountRuleAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{discountRule: DiscountRule}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var DiscountRule $discountRule */
        $discountRule = $input['discountRule'];
        $scope = array_key_exists('scope', $input) && is_string($input['scope']) ? $input['scope'] : $discountRule->scope;

        $before = $discountRule->toArray();
        DB::transaction(function () use ($input, $actor, $discountRule, $before, $scope): void {
            $payload = array_diff_key($input, array_flip(['user', 'discountRule']));
            $payload['scope'] = $scope;
            if (array_key_exists('scope_id', $input)) {
                $payload['scope_id'] = (new CreateDiscountRuleAction($this->auditLogger))->resolveScopeId($scope, $input['scope_id'], (int) $actor->tenant_id);
            } elseif (array_key_exists('scope', $input)) {
                // Scope changed without a new target — re-resolve against the stored id is unsafe, so clear it.
                $payload['scope_id'] = null;
            }
            /** @phpstan-ignore argument.type */
            $discountRule->update([...$payload, 'updated_by' => $actor->getKey()]);
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $discountRule, before: $before, after: $discountRule->fresh()?->toArray() ?? $discountRule->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'discount_rule']);
        });

        return ['discountRule' => $discountRule->refresh()];
    }
}

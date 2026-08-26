<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\Category;
use App\Models\DiscountRule;
use App\Models\Party;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateDiscountRuleAction extends Action
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
        $scope = is_string($input['scope'] ?? null) ? $input['scope'] : 'order';
        $scopeId = $this->resolveScopeId($scope, $input['scope_id'] ?? null, (int) $actor->tenant_id);

        $discountRule = DB::transaction(function () use ($input, $actor, $scope, $scopeId): DiscountRule {
            $discountRule = DiscountRule::create([
                'uuid' => (string) Str::uuid(),
                'name' => $input['name'],
                'scope' => $scope,
                'scope_id' => $scopeId,
                'condition' => $input['condition'] ?? null,
                'discount_type' => $input['discount_type'],
                'value' => $input['value'],
                'valid_from' => $input['valid_from'] ?? null,
                'valid_to' => $input['valid_to'] ?? null,
                'priority' => $input['priority'] ?? 0,
                'is_active' => $input['is_active'] ?? true,
                'created_by' => $actor->getKey(),
            ]);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $discountRule, after: $discountRule->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'discount_rule']);

            return $discountRule;
        });

        return ['discountRule' => $discountRule];
    }

    /**
     * Resolves a scope uuid to its internal integer id for the given scope
     * type. `order` scope never carries a target, so its id is always null.
     */
    public function resolveScopeId(string $scope, mixed $uuid, int $tenantId): ?int
    {
        if ($scope === 'order' || $uuid === null) {
            return null;
        }
        $modelClass = match ($scope) {
            'product' => Product::class,
            'category' => Category::class,
            'party' => Party::class,
            default => null,
        };
        if ($modelClass === null) {
            return null;
        }
        $row = $modelClass::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages(['scope_id' => 'The selected reference is invalid.']);
        }

        return (int) $row->getKey();
    }
}

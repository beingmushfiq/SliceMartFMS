<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Models\DiscountRule;
use Illuminate\Support\Facades\DB;

final class DeleteDiscountRuleAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, discountRule: DiscountRule}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var DiscountRule $discountRule */
        $discountRule = $input['discountRule'];

        DB::transaction(function () use ($discountRule, $actor): void {
            $discountRule->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $discountRule, before: $discountRule->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'discount_rule']);
        });

        return ['deleted' => true];
    }
}

<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Party;
use App\Models\PriceList;
use Illuminate\Support\Facades\DB;

final class DeletePriceListAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, priceList: PriceList}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var PriceList $priceList */
        $priceList = $input['priceList'];
        // Party uses SoftDeletes, so only live rows block deletion.
        $blockingCount = Party::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('price_list_id', $priceList->getKey())->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }

        DB::transaction(function () use ($priceList, $actor): void {
            $priceList->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $priceList, before: $priceList->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'price_list']);
        });

        return ['deleted' => true];
    }
}

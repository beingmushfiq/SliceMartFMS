<?php

declare(strict_types=1);

namespace App\Modules\Pricing\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\PriceList;
use Illuminate\Support\Facades\DB;

final class UpdatePriceListAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{priceList: PriceList}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var PriceList $priceList */
        $priceList = $input['priceList'];
        if (array_key_exists('code', $input) && $input['code'] !== $priceList->code && PriceList::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->where('id', '!=', $priceList->getKey())->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: is_string($input['code']) ? $input['code'] : '');
        }

        $before = $priceList->toArray();
        DB::transaction(function () use ($input, $actor, $priceList, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'priceList', 'items']));
            /** @phpstan-ignore argument.type */
            $priceList->update([...$payload, 'updated_by' => $actor->getKey()]);
            if (array_key_exists('items', $input)) {
                /** @var array<int, mixed> $items */
                $items = $input['items'];
                (new CreatePriceListAction($this->auditLogger))->replaceItems($priceList, $items, (int) $actor->tenant_id);
            }
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $priceList, before: $before, after: $priceList->load('items')->toArray(), actor: $actor, context: ['module' => 'pricing', 'resource' => 'price_list']);
        });

        return ['priceList' => $priceList->load('items.product', 'items.variant')];
    }
}

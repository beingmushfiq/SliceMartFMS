<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Party;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class DeletePartyAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, party: Party}  $input
     */
    public function execute(array $input): void
    {
        $actor = $input['user'];
        $party = $input['party'];

        // Guard against deleting party in use by sales/purchase orders if tables exist
        foreach (['sales_orders' => 'customer_id', 'purchase_orders' => 'supplier_id', 'invoices' => 'customer_id'] as $table => $column) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->where('tenant_id', $actor->tenant_id)->where($column, $party->id)->count();
                if ($count > 0) {
                    throw new ResourceInUseException(
                        blockingModule: $table,
                        blockingCount: $count
                    );
                }
            }
        }

        DB::transaction(function () use ($party, $actor): void {
            $before = $party->toArray();
            $party->delete();

            $this->auditLogger->record(
                action: AuditAction::Deleted,
                auditable: $party,
                before: $before,
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'party']
            );
        });
    }
}

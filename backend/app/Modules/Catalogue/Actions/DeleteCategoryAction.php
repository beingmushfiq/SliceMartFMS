<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\ResourceInUseException;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

final class DeleteCategoryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, category: Category}  $input
     * @return array{deleted: bool}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Category $category */
        $category = $input['category'];
        $blockingCount = Category::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('parent_id', $category->getKey())->count() + Product::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('category_id', $category->getKey())->count();
        if ($blockingCount > 0) {
            throw new ResourceInUseException(blockingModule: 'catalogue', blockingCount: $blockingCount);
        }
        DB::transaction(function () use ($category, $actor): void {
            $category->delete();
            $this->auditLogger->record(action: AuditAction::Deleted, auditable: $category, before: $category->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'category']);
        });

        return ['deleted' => true];
    }
}

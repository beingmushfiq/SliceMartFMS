<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreateCategoryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, parent_id?: string|null, code: string, name: string, is_active?: bool}  $input
     * @return array{category: Category}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        if (Category::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $input['code']);
        }

        $category = DB::transaction(function () use ($input, $actor): Category {
            $parentId = $this->resolveParentId($input['parent_id'] ?? null, $actor->tenant_id);
            $category = Category::create(['uuid' => (string) Str::uuid(), 'parent_id' => $parentId, 'code' => $input['code'], 'name' => $input['name'], 'is_active' => $input['is_active'] ?? true, 'created_by' => $actor->getKey()]);
            $categoryId = $category->id;
            if ($parentId === null) {
                $path = (string) $categoryId;
            } else {
                /** @var Category $parent */
                $parent = Category::withoutGlobalScope('tenant')->findOrFail($parentId);
                $path = (string) $parent->path.'/'.(string) $categoryId;
            }
            $category->update(['path' => $path]);
            $this->auditLogger->record(action: AuditAction::Created, auditable: $category, after: $category->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'category']);

            return $category;
        });

        return ['category' => $category->refresh()];
    }

    private function resolveParentId(?string $parentUuid, ?int $tenantId): ?int
    {
        if ($parentUuid === null) {
            return null;
        }
        $parent = Category::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $parentUuid)->first();
        if ($parent === null) {
            throw ValidationException::withMessages(['parent_id' => 'The selected parent category is invalid.']);
        }

        return $parent->id;
    }
}

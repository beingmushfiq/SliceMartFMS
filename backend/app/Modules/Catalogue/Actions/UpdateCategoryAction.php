<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Category;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class UpdateCategoryAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array{user: \App\Models\User, category: Category, parent_id?: string|null, code?: string, name?: string, is_active?: bool}  $input
     * @return array{category: Category}
     */
    public function execute(array $input): array
    {
        /** @var \App\Models\User $actor */
        $actor = $input['user'];
        /** @var Category $category */
        $category = $input['category'];
        if (isset($input['code']) && $input['code'] !== $category->code && Category::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('code', $input['code'])->where('id', '!=', $category->getKey())->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $input['code']);
        }
        $before = $category->toArray();
        DB::transaction(function () use ($input, $actor, $category, $before): void {
            $payload = array_diff_key($input, array_flip(['user', 'category']));
            $reparented = array_key_exists('parent_id', $payload);
            $oldPath = (string) $category->path;
            if ($reparented) {
                $parentUuid = is_string($payload['parent_id'] ?? null) ? $payload['parent_id'] : null;
                $parentId = $this->resolveParentId($parentUuid, $actor->tenant_id);
                $parent = $parentId === null ? null : Category::withoutGlobalScope('tenant')->findOrFail($parentId);
                if ($parentId === $category->id || ($parent !== null && str_contains('/'.(string) $parent->path.'/', '/'.(string) $category->id.'/'))) {
                    throw ValidationException::withMessages(['parent_id' => 'A category cannot be moved beneath itself or one of its descendants.']);
                }
                $payload['parent_id'] = $parentId;
            }
            /** @phpstan-ignore argument.type */
            $category->update([...$payload, 'updated_by' => $actor->getKey()]);
            if ($reparented) {
                $parentPath = $category->parent_id === null ? null : Category::withoutGlobalScope('tenant')->findOrFail($category->parent_id)->path;
                $newPath = ($parentPath === null ? '' : (string) $parentPath.'/').(string) $category->id;
                $category->update(['path' => $newPath]);
                Category::withoutGlobalScope('tenant')->where('tenant_id', $actor->tenant_id)->where('path', 'like', $oldPath.'/%')->get()->each(function (Category $descendant) use ($oldPath, $newPath): void {
                    $descendant->update(['path' => $newPath.substr((string) $descendant->path, strlen($oldPath))]);
                });
            }
            $this->auditLogger->record(action: AuditAction::Updated, auditable: $category, before: $before, after: $category->fresh()?->toArray() ?? $category->toArray(), actor: $actor, context: ['module' => 'catalogue', 'resource' => 'category']);
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

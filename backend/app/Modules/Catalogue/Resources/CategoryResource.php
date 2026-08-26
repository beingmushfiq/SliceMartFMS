<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Resources;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Serialises a Category into the API_CONTRACT §15.4.2 resource shape.
 *
 * The public identifier is the `uuid`; the auto-increment `id` is never exposed
 * (API_CONTRACT §1.3).
 *
 * Optional includes (API_CONTRACT §15.4.2 notes):
 * - include=parent
 * - include=children
 *
 * Includes are shallow (one level) to avoid recursive payloads.
 *
 * @mixin Category
 */
final class CategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $includeRaw = $request->query('include', '');
        $include = is_string($includeRaw) ? array_filter(explode(',', $includeRaw)) : [];
        $includeParent = in_array('parent', $include, true);
        $includeChildren = in_array('children', $include, true);

        return [
            'id' => $this->uuid,
            'parent_id' => $this->parent?->uuid,
            'code' => $this->code,
            'name' => $this->name,
            'path' => $this->path,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Optional expansions
            'parent' => $includeParent && $this->relationLoaded('parent') && $this->parent !== null
                ? [
                    'id' => $this->parent->uuid,
                    'parent_id' => $this->parent->parent?->uuid,
                    'code' => $this->parent->code,
                    'name' => $this->parent->name,
                    'path' => $this->parent->path,
                    'is_active' => $this->parent->is_active,
                ]
                : null,
            'children' => $includeChildren && $this->relationLoaded('children')
                ? $this->children->map(static fn (Category $c) => [
                    'id' => $c->uuid,
                    'parent_id' => $c->parent?->uuid,
                    'code' => $c->code,
                    'name' => $c->name,
                    'path' => $c->path,
                    'is_active' => $c->is_active,
                ])->values()->all()
                : null,
        ];
    }
}

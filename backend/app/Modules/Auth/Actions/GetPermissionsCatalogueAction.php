<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Core\Auth\PermissionCatalogue;

/**
 * Get Permissions Catalogue Action (ADR-008, API_CONTRACT §8.5).
 */
class GetPermissionsCatalogueAction extends Action
{
    /**
     * Execute catalogue extraction.
     *
     * @param  array<string, mixed>  $input
     * @return array{permissions: list<string>}
     */
    public function execute(array $input = []): array
    {
        return [
            'permissions' => PermissionCatalogue::getAllPermissions(),
        ];
    }
}

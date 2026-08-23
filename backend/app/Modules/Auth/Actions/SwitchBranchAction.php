<?php

declare(strict_types=1);

namespace App\Modules\Auth\Actions;

use App\Core\Actions\Action;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Switch Branch Action (API_CONTRACT §8.5).
 */
class SwitchBranchAction extends Action
{
    /**
     * Execute active branch switch.
     *
     * @param  array{user: User, branch_id: int}  $input
     * @return array{user: User, active_branch_id: int}
     */
    public function execute(array $input): array
    {
        /** @var User $user */
        $user = $input['user'];
        $branchId = (int) $input['branch_id'];

        if (! $user->is_platform_admin) {
            $allowedBranches = $user->scopes()->where('scope_type', 'branch')->pluck('scope_id')->all();
            if (! empty($allowedBranches) && ! in_array($branchId, $allowedBranches, true)) {
                throw ValidationException::withMessages([
                    'branch_id' => ['The requested branch is outside your assigned branch scopes.'],
                ]);
            }
        }

        return [
            'user' => $user,
            'active_branch_id' => $branchId,
        ];
    }
}

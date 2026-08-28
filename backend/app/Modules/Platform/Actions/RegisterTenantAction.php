<?php

declare(strict_types=1);

namespace App\Modules\Platform\Actions;

use App\Core\Actions\Action;
use App\Modules\Platform\Services\TenantProvisioningService;
use Illuminate\Support\Facades\Auth;

/**
 * Action to register and provision a tenant via Master SaaS Admin.
 */
class RegisterTenantAction extends Action
{
    public function __construct(
        private readonly TenantProvisioningService $provisioningService
    ) {}

    /**
     * Execute tenant registration.
     *
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    public function execute(array $input): array
    {
        $actorId = Auth::id();

        $result = $this->provisioningService->provision($input, $actorId);

        return [
            'tenant' => [
                'id' => $result['tenant']->id,
                'uuid' => $result['tenant']->uuid,
                'name' => $result['tenant']->name,
                'slug' => $result['tenant']->slug,
                'status' => $result['tenant']->status,
                'currency_code' => $result['tenant']->currency_code,
                'timezone' => $result['tenant']->timezone,
                'created_at' => $result['tenant']->created_at?->toIso8601String(),
            ],
            'owner' => [
                'id' => $result['owner']->id,
                'uuid' => $result['owner']->uuid,
                'name' => $result['owner']->name,
                'email' => $result['owner']->email,
            ],
            'subscription' => [
                'uuid' => $result['subscription']->uuid,
                'plan_id' => $result['subscription']->plan_id,
                'status' => $result['subscription']->status,
                'starts_at' => $result['subscription']->starts_at?->toIso8601String(),
                'ends_at' => $result['subscription']->ends_at?->toIso8601String(),
                'amount' => $result['subscription']->amount,
            ],
        ];
    }
}

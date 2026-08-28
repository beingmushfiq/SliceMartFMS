<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Actions;

use App\Modules\Notifications\Models\Notification;
use Illuminate\Support\Str;

class SendNotificationAction
{
    public function execute(
        int $userId,
        string $type,
        string $titleKey,
        string $bodyKey,
        array $params = [],
        string $severity = 'info',
        ?string $actionUrl = null,
        string $channel = 'in_app'
    ): Notification {
        $tenantId = auth()->user()?->tenant_id ?? 1;

        return Notification::create([
            'tenant_id' => $tenantId,
            'uuid' => (string) Str::uuid(),
            'user_id' => $userId,
            'type' => $type,
            'channel' => $channel,
            'title_key' => $titleKey,
            'body_key' => $bodyKey,
            'params' => $params,
            'severity' => $severity,
            'action_url' => $actionUrl,
            'sent_at' => now(),
        ]);
    }
}

<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Actions;

use App\Core\Actions\Action;
use App\Core\Audit\AuditAction;
use App\Core\Audit\AuditLogger;
use App\Core\Http\Exceptions\DuplicateResourceException;
use App\Models\Party;
use App\Models\PartyAddress;
use App\Models\PartyContact;
use App\Models\PriceList;
use App\Models\TaxProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class CreatePartyAction extends Action
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    /**
     * @param  array<string, mixed>  $input
     * @return array{party: Party}
     */
    public function execute(array $input): array
    {
        /** @var User $actor */
        $actor = $input['user'];
        $tenantId = (int) $actor->tenant_id;

        $code = is_string($input['code'] ?? null) ? $input['code'] : '';
        if (Party::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('code', $code)->withTrashed()->exists()) {
            throw new DuplicateResourceException(field: 'code', value: $code);
        }

        $party = DB::transaction(function () use ($input, $actor, $tenantId): Party {
            $addresses = is_array($input['addresses'] ?? null) ? $input['addresses'] : [];
            $contacts = is_array($input['contacts'] ?? null) ? $input['contacts'] : [];

            $payload = $this->resolveReferences($input, $tenantId);
            unset($payload['user'], $payload['addresses'], $payload['contacts']);

            /** @var Party $party */
            /** @phpstan-ignore argument.type */
            $party = Party::create([
                'uuid' => (string) Str::uuid(),
                ...$payload,
                'created_by' => $actor->getKey(),
                'updated_by' => $actor->getKey(),
            ]);

            /** @var array<string, mixed> $addressData */
            foreach ($addresses as $addressData) {
                /** @phpstan-ignore argument.type */
                PartyAddress::create([
                    'uuid' => (string) Str::uuid(),
                    'party_id' => $party->id,
                    ...$addressData,
                ]);
            }

            /** @var array<string, mixed> $contactData */
            foreach ($contacts as $contactData) {
                /** @phpstan-ignore argument.type */
                PartyContact::create([
                    'uuid' => (string) Str::uuid(),
                    'party_id' => $party->id,
                    ...$contactData,
                ]);
            }

            $this->auditLogger->record(
                action: AuditAction::Created,
                auditable: $party,
                after: $party->toArray(),
                actor: $actor,
                context: ['module' => 'catalogue', 'resource' => 'party']
            );

            return $party;
        });

        return ['party' => $party->load('addresses', 'contacts', 'priceList', 'taxProfile', 'assignee')];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function resolveReferences(array $input, int $tenantId): array
    {
        if (array_key_exists('price_list_id', $input)) {
            $input['price_list_id'] = $this->resolveUuid(PriceList::class, $input['price_list_id'], $tenantId, 'price_list_id');
        }
        if (array_key_exists('tax_profile_id', $input)) {
            $input['tax_profile_id'] = $this->resolveUuid(TaxProfile::class, $input['tax_profile_id'], $tenantId, 'tax_profile_id');
        }
        if (array_key_exists('assigned_to', $input)) {
            $input['assigned_to'] = $this->resolveUuid(User::class, $input['assigned_to'], $tenantId, 'assigned_to');
        }

        return $input;
    }

    private function resolveUuid(string $modelClass, mixed $uuid, int $tenantId, string $field): ?int
    {
        if ($uuid === null || $uuid === '') {
            return null;
        }
        $row = $modelClass::withoutGlobalScope('tenant')->where('tenant_id', $tenantId)->where('uuid', $uuid)->first();
        if ($row === null) {
            throw ValidationException::withMessages([$field => 'The selected reference is invalid.']);
        }

        return (int) $row->getKey();
    }
}

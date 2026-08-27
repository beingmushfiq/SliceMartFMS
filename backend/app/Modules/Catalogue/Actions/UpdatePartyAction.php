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

final class UpdatePartyAction extends Action
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
        /** @var Party $party */
        $party = $input['party'];
        $tenantId = (int) $actor->tenant_id;

        if (array_key_exists('code', $input) && is_string($input['code']) && $input['code'] !== $party->code) {
            $duplicate = Party::withoutGlobalScope('tenant')
                ->where('tenant_id', $tenantId)
                ->where('code', $input['code'])
                ->where('id', '!=', $party->id)
                ->withTrashed()
                ->exists();
            if ($duplicate) {
                throw new DuplicateResourceException(field: 'code', value: $input['code']);
            }
        }

        $party = DB::transaction(function () use ($input, $actor, $party, $tenantId): Party {
            $before = $party->toArray();

            $addresses = array_key_exists('addresses', $input) && is_array($input['addresses']) ? $input['addresses'] : null;
            $contacts = array_key_exists('contacts', $input) && is_array($input['contacts']) ? $input['contacts'] : null;

            $payload = $this->resolveReferences($input, $tenantId);
            unset($payload['user'], $payload['party'], $payload['addresses'], $payload['contacts']);

            $payload['updated_by'] = $actor->getKey();
            /** @phpstan-ignore argument.type */
            $party->update($payload);

            // If addresses explicitly supplied, sync them
            if ($addresses !== null) {
                $party->addresses()->delete();
                /** @var array<string, mixed> $addressData */
                foreach ($addresses as $addressData) {
                    /** @phpstan-ignore argument.type */
                    PartyAddress::create([
                        'uuid' => (string) Str::uuid(),
                        'party_id' => $party->id,
                        ...$addressData,
                    ]);
                }
            }

            // If contacts explicitly supplied, sync them
            if ($contacts !== null) {
                $party->contacts()->delete();
                /** @var array<string, mixed> $contactData */
                foreach ($contacts as $contactData) {
                    /** @phpstan-ignore argument.type */
                    PartyContact::create([
                        'uuid' => (string) Str::uuid(),
                        'party_id' => $party->id,
                        ...$contactData,
                    ]);
                }
            }

            $party->refresh();

            $this->auditLogger->record(
                action: AuditAction::Updated,
                auditable: $party,
                before: $before,
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

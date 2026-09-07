<?php

declare(strict_types=1);

namespace App\Modules\Sales\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Modules\Sales\Models\CrmActivity;
use App\Modules\Sales\Models\CrmLead;
use App\Modules\Sales\Models\SalesOrder;
use App\Modules\Sales\Resources\CrmLeadResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class CrmLeadController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $tenantId = TenantContext::current()->tenantId();

        $query = CrmLead::with(['assignedUser', 'convertedParty', 'validator'])
            ->where('tenant_id', $tenantId);

        if ($request->filled('stage')) {
            $query->where('stage', (string) $request->query('stage'));
        }

        if ($request->filled('source')) {
            $query->where('source', (string) $request->query('source'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', (int) $request->query('assigned_to'));
        }

        if ($request->has('is_fake')) {
            $query->where('is_fake', filter_var($request->query('is_fake'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('q')) {
            $search = (string) $request->query('q');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('lead_number', 'like', "%{$search}%");
            });
        }

        $leads = $query->orderByDesc('id')
            ->paginate((int) $request->query('per_page', '25'));

        return CrmLeadResource::collection($leads);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $validated = $request->validate([
            'name'                => ['required', 'string', 'max:255'],
            'company_name'        => ['nullable', 'string', 'max:255'],
            'phone'               => ['nullable', 'string', 'max:64'],
            'email'               => ['nullable', 'email', 'max:255'],
            'source'              => ['nullable', 'string', 'max:32'],
            'stage'               => ['nullable', 'string', 'max:32'],
            'assigned_to'         => ['nullable', 'integer', 'exists:users,id'],
            'expected_value'      => ['nullable', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
            'notes'               => ['nullable', 'string'],
        ]);

        $lead = new CrmLead();
        $lead->tenant_id = $tenantId;
        $lead->name = $validated['name'];
        $lead->company_name = $validated['company_name'] ?? null;
        $lead->phone = $validated['phone'] ?? null;
        $lead->email = $validated['email'] ?? null;
        $lead->source = $validated['source'] ?? 'walk_in';
        $lead->stage = $validated['stage'] ?? 'new';
        $lead->assigned_to = $validated['assigned_to'] ?? null;
        $lead->expected_value = (string) ($validated['expected_value'] ?? '0.0000');
        $lead->expected_close_date = $validated['expected_close_date'] ?? null;
        $lead->notes = $validated['notes'] ?? null;
        $lead->created_by = Auth::id() ? (int) Auth::id() : null;
        $lead->save();

        return (new CrmLeadResource($lead->load(['assignedUser', 'convertedParty'])))
            ->response()
            ->setStatusCode(201);
    }

    public function show(int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::with(['assignedUser', 'convertedParty', 'validator', 'activities.assignedUser', 'orders'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return (new CrmLeadResource($lead))->response();
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'name'                => ['sometimes', 'required', 'string', 'max:255'],
            'company_name'        => ['nullable', 'string', 'max:255'],
            'phone'               => ['nullable', 'string', 'max:64'],
            'email'               => ['nullable', 'email', 'max:255'],
            'source'              => ['nullable', 'string', 'max:32'],
            'stage'               => ['nullable', 'string', 'max:32'],
            'assigned_to'         => ['nullable', 'integer', 'exists:users,id'],
            'expected_value'      => ['nullable', 'numeric', 'min:0'],
            'expected_close_date' => ['nullable', 'date'],
            'notes'               => ['nullable', 'string'],
        ]);

        $lead->fill($validated);
        $lead->updated_by = Auth::id() ? (int) Auth::id() : null;
        $lead->save();

        return (new CrmLeadResource($lead->load(['assignedUser', 'convertedParty', 'validator'])))->response();
    }

    public function updateStage(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'stage'          => ['required', 'string', 'in:new,contacted,qualified,proposal,won,lost,fake'],
            'lost_reason_id' => ['nullable', 'integer'],
            'notes'          => ['nullable', 'string'],
        ]);

        $lead->stage = $validated['stage'];
        if (isset($validated['lost_reason_id'])) {
            $lead->lost_reason_id = $validated['lost_reason_id'];
        }
        if (!empty($validated['notes'])) {
            $lead->notes = ($lead->notes ? $lead->notes . "\n" : '') . "[Stage updated to {$validated['stage']}]: " . $validated['notes'];
        }
        $lead->updated_by = Auth::id() ? (int) Auth::id() : null;
        $lead->save();

        return (new CrmLeadResource($lead->load(['assignedUser', 'convertedParty', 'validator'])))->response();
    }

    public function validateFake(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'is_fake'          => ['required', 'boolean'],
            'validation_notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $lead->is_fake = $validated['is_fake'];
        $lead->validation_notes = $validated['validation_notes'] ?? null;
        $lead->validated_by = Auth::id() ? (int) Auth::id() : null;
        $lead->validated_at = now();
        if ($validated['is_fake']) {
            $lead->stage = 'fake';
        }
        $lead->save();

        return (new CrmLeadResource($lead->load(['assignedUser', 'convertedParty', 'validator'])))->response();
    }

    public function convert(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::where('tenant_id', $tenantId)->findOrFail($id);

        return DB::transaction(function () use ($lead, $tenantId, $request) {
            // Check if party already exists by phone or create new party
            $party = null;
            if ($lead->phone) {
                $party = Party::where('tenant_id', $tenantId)
                    ->where('phone', $lead->phone)
                    ->first();
            }

            if (!$party) {
                $party = new Party();
                $party->tenant_id = $tenantId;
                $party->party_type = 'customer';
                $party->name = $lead->company_name ? "{$lead->name} ({$lead->company_name})" : $lead->name;
                $party->phone = $lead->phone;
                $party->email = $lead->email;
                $party->is_active = true;
                $party->save();
            }

            $lead->converted_party_id = $party->id;
            $lead->converted_at = now();
            $lead->stage = 'won';
            $lead->updated_by = Auth::id() ? (int) Auth::id() : null;
            $lead->save();

            return response()->json([
                'message'  => 'Lead converted successfully',
                'lead'     => new CrmLeadResource($lead->load(['assignedUser', 'convertedParty', 'validator'])),
                'party_id' => $party->id,
            ]);
        });
    }

    public function addActivity(Request $request, int $id): JsonResponse
    {
        $tenantId = TenantContext::current()->tenantId();

        $lead = CrmLead::where('tenant_id', $tenantId)->findOrFail($id);

        $validated = $request->validate([
            'type'        => ['required', 'string', 'in:call,visit,email,sms,note,task'],
            'title'       => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'due_at'      => ['nullable', 'date'],
            'outcome'     => ['nullable', 'string'],
            'completed'   => ['nullable', 'boolean'],
        ]);

        $activity = new CrmActivity();
        $activity->tenant_id = $tenantId;
        $activity->subject_type = 'lead';
        $activity->subject_id = $lead->id;
        $activity->type = $validated['type'];
        $activity->title = $validated['title'];
        $activity->description = $validated['description'] ?? null;
        $activity->due_at = $validated['due_at'] ?? null;
        $activity->outcome = $validated['outcome'] ?? null;
        $activity->assigned_to = Auth::id() ? (int) Auth::id() : null;
        $activity->created_by = Auth::id() ? (int) Auth::id() : null;
        if (!empty($validated['completed'])) {
            $activity->completed_at = now();
        }
        $activity->save();

        return response()->json([
            'message'  => 'Activity logged successfully',
            'activity' => $activity,
        ], 201);
    }
}

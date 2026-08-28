<?php

declare(strict_types=1);

namespace App\Modules\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Actions\PostJournalEntryAction;
use App\Modules\Finance\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalEntryController extends Controller
{
    public function __construct(
        private readonly PostJournalEntryAction $postJournalEntryAction
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = JournalEntry::query()->with('lines.account');

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('start_date')) {
            $query->where('entry_date', '>=', $request->query('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('entry_date', '<=', $request->query('end_date'));
        }

        $entries = $query->orderByDesc('entry_date')->orderByDesc('id')->paginate(20);

        return response()->json($entries);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_id' => 'required|integer',
            'entry_number' => 'nullable|string|max:64',
            'entry_date' => 'required|date',
            'entry_type' => 'nullable|string|in:manual,system',
            'source_module' => 'nullable|string|max:64',
            'narration' => 'nullable|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|integer',
            'lines.*.debit_amount' => 'nullable|numeric|min:0',
            'lines.*.credit_amount' => 'nullable|numeric|min:0',
            'lines.*.branch_id' => 'nullable|integer',
            'lines.*.cost_center_code' => 'nullable|string|max:64',
            'lines.*.party_id' => 'nullable|integer',
            'lines.*.narration' => 'nullable|string',
        ]);

        $userId = (int) ($request->user()?->id ?? 1);
        $entry = $this->postJournalEntryAction->execute($validated, $userId);

        return response()->json([
            'data' => $entry,
            'message' => 'Journal entry posted successfully to General Ledger.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $entry = JournalEntry::with(['lines.account', 'lines.party', 'postedBy'])->findOrFail($id);

        return response()->json([
            'data' => $entry,
        ]);
    }
}

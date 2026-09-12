<?php

declare(strict_types=1);

namespace App\Modules\Platform\Controllers;

use App\Core\Tenancy\TenantContext;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class DataBinController extends Controller
{
    /**
     * Map of supported resource types to their Model configurations.
     *
     * @var array<string, array{model: class-string, label: string, name_fields: list<string>, search_fields: list<string>}>
     */
    private const TYPE_CONFIG = [
        'products' => [
            'model' => \App\Models\Product::class,
            'label' => 'Product',
            'name_fields' => ['name', 'sku', 'barcode'],
            'search_fields' => ['name', 'sku', 'barcode'],
        ],
        'categories' => [
            'model' => \App\Models\Category::class,
            'label' => 'Product Category',
            'name_fields' => ['name', 'code'],
            'search_fields' => ['name', 'code'],
        ],
        'brands' => [
            'model' => \App\Models\Brand::class,
            'label' => 'Brand',
            'name_fields' => ['name', 'code'],
            'search_fields' => ['name', 'code'],
        ],
        'parties' => [
            'model' => \App\Models\Party::class,
            'label' => 'Customer / Supplier',
            'name_fields' => ['name', 'company_name', 'phone'],
            'search_fields' => ['name', 'company_name', 'phone', 'email'],
        ],
        'sales_orders' => [
            'model' => \App\Modules\Sales\Models\SalesOrder::class,
            'label' => 'Sales Order',
            'name_fields' => ['order_number', 'reference_number'],
            'search_fields' => ['order_number', 'reference_number', 'customer_name'],
        ],
        'invoices' => [
            'model' => \App\Modules\Sales\Models\Invoice::class,
            'label' => 'Invoice',
            'name_fields' => ['invoice_number', 'order_number'],
            'search_fields' => ['invoice_number', 'order_number'],
        ],
        'delivery_orders' => [
            'model' => \App\Modules\Sales\Models\DeliveryOrder::class,
            'label' => 'Delivery Order',
            'name_fields' => ['delivery_number', 'order_number', 'tracking_number'],
            'search_fields' => ['delivery_number', 'order_number', 'tracking_number'],
        ],
        'crm_leads' => [
            'model' => \App\Modules\Sales\Models\CrmLead::class,
            'label' => 'CRM Lead',
            'name_fields' => ['contact_name', 'company_name', 'title'],
            'search_fields' => ['contact_name', 'company_name', 'title', 'email'],
        ],
        'purchase_orders' => [
            'model' => \App\Modules\Purchasing\Models\PurchaseOrder::class,
            'label' => 'Purchase Order',
            'name_fields' => ['po_number', 'reference_number'],
            'search_fields' => ['po_number', 'reference_number'],
        ],
        'goods_receipts' => [
            'model' => \App\Modules\Purchasing\Models\GoodsReceipt::class,
            'label' => 'Goods Receipt (GRN)',
            'name_fields' => ['grn_number', 'bill_number'],
            'search_fields' => ['grn_number', 'bill_number'],
        ],
        'purchase_bills' => [
            'model' => \App\Modules\Purchasing\Models\PurchaseBill::class,
            'label' => 'Purchase Bill',
            'name_fields' => ['bill_number', 'vendor_invoice_number'],
            'search_fields' => ['bill_number', 'vendor_invoice_number'],
        ],
        'stock_transfers' => [
            'model' => \App\Modules\Inventory\Models\StockTransfer::class,
            'label' => 'Stock Transfer',
            'name_fields' => ['transfer_number', 'tracking_code'],
            'search_fields' => ['transfer_number', 'tracking_code'],
        ],
        'stock_adjustments' => [
            'model' => \App\Modules\Inventory\Models\StockAdjustment::class,
            'label' => 'Stock Adjustment',
            'name_fields' => ['adjustment_number', 'reference_no'],
            'search_fields' => ['adjustment_number', 'reference_no'],
        ],
        'production_plans' => [
            'model' => \App\Models\ProductionPlan::class,
            'label' => 'Production Plan',
            'name_fields' => ['plan_number', 'title', 'notes'],
            'search_fields' => ['plan_number', 'title'],
        ],
        'production_batches' => [
            'model' => \App\Models\ProductionBatch::class,
            'label' => 'Production Batch',
            'name_fields' => ['batch_number', 'lot_number'],
            'search_fields' => ['batch_number', 'lot_number'],
        ],
        'qc_inspections' => [
            'model' => \App\Models\QcInspection::class,
            'label' => 'QC Inspection',
            'name_fields' => ['inspection_number', 'lot_number'],
            'search_fields' => ['inspection_number', 'lot_number'],
        ],
        'assets' => [
            'model' => \App\Modules\Assets\Models\Asset::class,
            'label' => 'Fixed Asset',
            'name_fields' => ['name', 'asset_code', 'serial_number'],
            'search_fields' => ['name', 'asset_code', 'serial_number'],
        ],
        'employees' => [
            'model' => \App\Models\Employee::class,
            'label' => 'Employee',
            'name_fields' => ['first_name', 'last_name', 'employee_code', 'email'],
            'search_fields' => ['first_name', 'last_name', 'employee_code', 'email'],
        ],
        'users' => [
            'model' => \App\Models\User::class,
            'label' => 'System User',
            'name_fields' => ['name', 'email'],
            'search_fields' => ['name', 'email'],
        ],
        'coupons' => [
            'model' => \App\Models\Coupon::class,
            'label' => 'Storefront Coupon',
            'name_fields' => ['code', 'name', 'title'],
            'search_fields' => ['code', 'name', 'title'],
        ],
    ];

    /**
     * Resolve active tenant ID from context or request user fallback.
     */
    private function resolveTenantId(?Request $request = null): int
    {
        try {
            return TenantContext::current()->tenantId();
        } catch (\Throwable) {
            $user = $request?->user() ?? \Illuminate\Support\Facades\Auth::user();
            if ($user && !empty($user->tenant_id)) {
                return (int) $user->tenant_id;
            }
            $tenant = \App\Models\Tenant::first();
            if ($tenant) {
                return (int) $tenant->id;
            }
            throw new \RuntimeException('Tenant context could not be resolved.');
        }
    }

    /**
     * Get statistics of deleted items across all types.
     */
    public function stats(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);
        $counts = [];
        $total = 0;

        foreach (self::TYPE_CONFIG as $key => $config) {
            $modelClass = $config['model'];
            if (!class_exists($modelClass)) {
                $counts[$key] = 0;
                continue;
            }

            try {
                $count = $this->scopedTrashedQuery($modelClass, $tenantId)->count();
                $counts[$key] = $count;
                $total += $count;
            } catch (\Throwable) {
                $counts[$key] = 0;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'counts' => $counts,
                'types' => array_map(fn($k, $v) => [
                    'key' => $k,
                    'label' => $v['label'],
                    'count' => $counts[$k] ?? 0,
                ], array_keys(self::TYPE_CONFIG), array_values(self::TYPE_CONFIG)),
            ],
        ]);
    }

    /**
     * List deleted items with filtering, search, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);
        $requestedType = $request->query('type', 'all');
        $search = trim((string) $request->query('search', ''));
        $perPage = max(5, min(100, $request->integer('per_page', 20)));

        $typesToQuery = ($requestedType && $requestedType !== 'all' && isset(self::TYPE_CONFIG[$requestedType]))
            ? [$requestedType => self::TYPE_CONFIG[$requestedType]]
            : self::TYPE_CONFIG;

        $items = [];

        foreach ($typesToQuery as $typeKey => $config) {
            $modelClass = $config['model'];
            if (!class_exists($modelClass)) {
                continue;
            }

            try {
                $query = $this->scopedTrashedQuery($modelClass, $tenantId);

                // Filter search if provided
                if ($search !== '') {
                    $query->where(function ($q) use ($config, $search, $modelClass) {
                        $table = (new $modelClass)->getTable();
                        $first = true;
                        foreach ($config['search_fields'] as $field) {
                            if (Schema::hasColumn($table, $field)) {
                                if ($first) {
                                    $q->where($field, 'like', "%{$search}%");
                                    $first = false;
                                } else {
                                    $q->orWhere($field, 'like', "%{$search}%");
                                }
                            }
                        }
                    });
                }

                $records = $query->latest('deleted_at')->limit(100)->get();

                foreach ($records as $record) {
                    $identifier = $this->resolveIdentifier($record, $config['name_fields']);
                    $extraDetails = $this->resolveDetails($record, $typeKey);

                    $items[] = [
                        'id' => $record->getKey(),
                        'uuid' => $record->uuid ?? null,
                        'type' => $typeKey,
                        'type_label' => $config['label'],
                        'identifier' => $identifier,
                        'details' => $extraDetails,
                        'deleted_at' => $record->deleted_at?->toISOString() ?? (string) $record->deleted_at,
                        'created_at' => $record->created_at?->toISOString() ?? (string) $record->created_at,
                    ];
                }
            } catch (\Throwable) {
                // Silently skip if table or model not accessible
                continue;
            }
        }

        // Sort items by deleted_at descending
        usort($items, static function ($a, $b) {
            return strcmp((string) ($b['deleted_at'] ?? ''), (string) ($a['deleted_at'] ?? ''));
        });

        // Paginate manually
        $page = max(1, $request->integer('page', 1));
        $totalItems = count($items);
        $offset = ($page - 1) * $perPage;
        $pagedItems = array_slice($items, $offset, $perPage);

        return response()->json([
            'success' => true,
            'data' => $pagedItems,
            'meta' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalItems,
                'last_page' => (int) ceil($totalItems / max(1, $perPage)),
            ],
        ]);
    }

    /**
     * Restore a deleted resource back to the active system.
     */
    public function restore(Request $request, string $type, string $id): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);

        if (!isset(self::TYPE_CONFIG[$type])) {
            return response()->json([
                'success' => false,
                'message' => "Unsupported resource type: {$type}",
            ], 400);
        }

        $config = self::TYPE_CONFIG[$type];
        $modelClass = $config['model'];

        $record = $this->findTrashedRecord($modelClass, $tenantId, $id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => "Record not found or already restored.",
            ], 404);
        }

        $record->restore();

        $identifier = $this->resolveIdentifier($record, $config['name_fields']);

        return response()->json([
            'success' => true,
            'message' => "{$config['label']} '{$identifier}' has been successfully restored to active records.",
            'data' => [
                'id' => $record->getKey(),
                'type' => $type,
                'identifier' => $identifier,
            ],
        ]);
    }

    /**
     * Permanently purge a deleted resource (irreversible).
     */
    public function forceDelete(Request $request, string $type, string $id): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);

        if (!isset(self::TYPE_CONFIG[$type])) {
            return response()->json([
                'success' => false,
                'message' => "Unsupported resource type: {$type}",
            ], 400);
        }

        $config = self::TYPE_CONFIG[$type];
        $modelClass = $config['model'];

        $record = $this->findTrashedRecord($modelClass, $tenantId, $id);

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => "Record not found or already permanently deleted.",
            ], 404);
        }

        $identifier = $this->resolveIdentifier($record, $config['name_fields']);
        $record->forceDelete();

        return response()->json([
            'success' => true,
            'message' => "{$config['label']} '{$identifier}' has been permanently purged from the system.",
            'data' => [
                'id' => $id,
                'type' => $type,
                'identifier' => $identifier,
            ],
        ]);
    }

    /**
     * Empty the bin entirely or for a specific type.
     */
    public function empty(Request $request): JsonResponse
    {
        $tenantId = $this->resolveTenantId($request);
        $type = $request->input('type', 'all');

        $typesToPurge = ($type && $type !== 'all' && isset(self::TYPE_CONFIG[$type]))
            ? [$type => self::TYPE_CONFIG[$type]]
            : self::TYPE_CONFIG;

        $purgedCount = 0;

        foreach ($typesToPurge as $key => $config) {
            $modelClass = $config['model'];
            if (!class_exists($modelClass)) {
                continue;
            }

            try {
                $query = $this->scopedTrashedQuery($modelClass, $tenantId);
                $records = $query->get();
                foreach ($records as $record) {
                    $record->forceDelete();
                    $purgedCount++;
                }
            } catch (\Throwable) {
                continue;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Data bin emptied successfully. {$purgedCount} item(s) permanently purged.",
            'data' => [
                'purged_count' => $purgedCount,
            ],
        ]);
    }

    /**
     * Helper to get tenant-scoped onlyTrashed query.
     */
    private function scopedTrashedQuery(string $modelClass, int $tenantId)
    {
        $instance = new $modelClass;
        $table = $instance->getTable();

        $query = $modelClass::onlyTrashed();

        if (Schema::hasColumn($table, 'tenant_id')) {
            $query->where("{$table}.tenant_id", $tenantId);
        }

        return $query;
    }

    /**
     * Helper to find trashed record by either numeric ID or UUID.
     */
    private function findTrashedRecord(string $modelClass, int $tenantId, string $id)
    {
        $query = $this->scopedTrashedQuery($modelClass, $tenantId);
        $table = (new $modelClass)->getTable();

        return $query->where(function ($q) use ($table, $id) {
            $q->where("{$table}.id", $id);
            if (Schema::hasColumn($table, 'uuid')) {
                $q->orWhere("{$table}.uuid", $id);
            }
        })->first();
    }

    /**
     * Resolve human-readable identifier from candidate fields.
     *
     * @param list<string> $candidateFields
     */
    private function resolveIdentifier(object $record, array $candidateFields): string
    {
        // Special case for employees
        if (isset($record->first_name) || isset($record->last_name)) {
            $name = trim(($record->first_name ?? '') . ' ' . ($record->last_name ?? ''));
            if ($name !== '') {
                return $name . (!empty($record->employee_code) ? " ({$record->employee_code})" : '');
            }
        }

        foreach ($candidateFields as $field) {
            if (!empty($record->{$field})) {
                return (string) $record->{$field};
            }
        }

        return '#' . ($record->id ?? $record->uuid ?? 'Unknown');
    }

    /**
     * Resolve contextual summary details for presentation.
     */
    private function resolveDetails(object $record, string $type): array
    {
        $details = [];

        if (isset($record->status)) {
            $details['status'] = (string) $record->status;
        }

        if (isset($record->total_amount)) {
            $details['amount'] = (float) $record->total_amount;
        } elseif (isset($record->amount)) {
            $details['amount'] = (float) $record->amount;
        } elseif (isset($record->net_total)) {
            $details['amount'] = (float) $record->net_total;
        }

        if (isset($record->department)) {
            $details['department'] = (string) $record->department;
        }

        if (isset($record->category_name)) {
            $details['category'] = (string) $record->category_name;
        }

        return $details;
    }
}

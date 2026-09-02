<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/**
 * Tenant-scope API routes (API_CONTRACT §9.1, ARCHITECTURE §5.1).
 *
 * These routes are loaded by bootstrap/app.php as the primary `api:` route file.
 * Every route here:
 *   - Is prefixed with /api automatically by Laravel's api route loader.
 *   - Inherits the `api` middleware group (throttle, json parsing, etc.).
 *   - Additionally runs: CorrelationId (prepended to the api group in
 *     bootstrap/app.php) → auth:api → tenant.resolve → tenant.active.
 *
 * Full middleware pipeline for these routes (ARCHITECTURE §5.1):
 *   EnsureHttps → CorrelationId → Authenticate(auth:api) → ResolveTenant
 *   → EnsureTenantActive → [Authorize] → [RateLimit] → [Idempotency] → Handler
 *
 * Endpoints are registered here as modules are built. At this stage the file
 * exists and is valid PHP — no endpoints are defined until Wave 5+ modules ship.
 */
Route::middleware(['auth.jwt', 'tenant.resolve', 'tenant.active'])
    ->prefix('v1')
    ->name('tenant.')
    ->group(static function (): void {
        Route::prefix('auth')->name('auth.')->group(static function (): void {
            Route::get('me', [App\Modules\Auth\Controllers\AuthController::class, 'me'])->name('me');
            Route::get('permissions', [App\Modules\Auth\Controllers\AuthController::class, 'permissions'])->name('permissions');
            Route::post('logout-all', [App\Modules\Auth\Controllers\AuthController::class, 'logoutAll'])->name('logout-all');
            Route::post('switch-branch', [App\Modules\Auth\Controllers\AuthController::class, 'switchBranch'])->name('switch-branch');
            Route::patch('preferences', [App\Modules\Auth\Controllers\AuthController::class, 'updatePreferences'])->name('preferences');
            Route::patch('change-password', [App\Modules\Auth\Controllers\AuthController::class, 'changePassword'])->name('change-password');
        });

        // ── Catalogue: Units ──────────────────────────────────────────
        Route::prefix('units')->name('units.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\UnitController::class, 'options'])
                ->middleware('permission:catalog.unit.view')
                ->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\UnitController::class, 'index'])
                ->middleware('permission:catalog.unit.view')
                ->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\UnitController::class, 'store'])
                ->middleware('permission:catalog.unit.manage')
                ->name('store');
            Route::get('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'show'])
                ->middleware('permission:catalog.unit.view')
                ->name('show');
            Route::patch('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'update'])
                ->middleware('permission:catalog.unit.manage')
                ->name('update');
            Route::delete('{unit:uuid}', [App\Modules\Catalogue\Controllers\UnitController::class, 'destroy'])
                ->middleware('permission:catalog.unit.manage')
                ->name('destroy');
        });

        Route::prefix('brands')->name('brands.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\BrandController::class, 'options'])
                ->middleware('permission:catalog.brand.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\BrandController::class, 'index'])
                ->middleware('permission:catalog.brand.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\BrandController::class, 'store'])
                ->middleware('permission:catalog.brand.manage')->name('store');
            Route::get('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'show'])
                ->middleware('permission:catalog.brand.view')->name('show');
            Route::patch('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'update'])
                ->middleware('permission:catalog.brand.manage')->name('update');
            Route::delete('{brand:uuid}', [App\Modules\Catalogue\Controllers\BrandController::class, 'destroy'])
                ->middleware('permission:catalog.brand.manage')->name('destroy');
        });

        Route::prefix('categories')->name('categories.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\CategoryController::class, 'options'])
                ->middleware('permission:catalog.category.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\CategoryController::class, 'index'])
                ->middleware('permission:catalog.category.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\CategoryController::class, 'store'])
                ->middleware('permission:catalog.category.manage')->name('store');
            Route::get('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'show'])
                ->middleware('permission:catalog.category.view')->name('show');
            Route::patch('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'update'])
                ->middleware('permission:catalog.category.manage')->name('update');
            Route::delete('{category:uuid}', [App\Modules\Catalogue\Controllers\CategoryController::class, 'destroy'])
                ->middleware('permission:catalog.category.manage')->name('destroy');
        });

        Route::prefix('reason-codes')->name('reason-codes.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\ReasonCodeController::class, 'options'])
                ->middleware('permission:inventory.stock.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\ReasonCodeController::class, 'index'])
                ->middleware('permission:inventory.stock.view')->name('index');
        });

        Route::prefix('products')->name('products.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\ProductController::class, 'options'])
                ->middleware('permission:catalog.product.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\ProductController::class, 'index'])
                ->middleware('permission:catalog.product.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\ProductController::class, 'store'])
                ->middleware('permission:catalog.product.manage')->name('store');
            Route::get('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'show'])
                ->middleware('permission:catalog.product.view')->name('show');
            Route::patch('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'update'])
                ->middleware('permission:catalog.product.manage')->name('update');
            Route::delete('{product:uuid}', [App\Modules\Catalogue\Controllers\ProductController::class, 'destroy'])
                ->middleware('permission:catalog.product.manage')->name('destroy');
        });

        Route::prefix('bill-of-materials')->name('bill-of-materials.')->group(static function (): void {
            Route::get('/', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'index'])
                ->middleware('permission:catalog.bom.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'store'])
                ->middleware('permission:catalog.bom.manage')->name('store');
            Route::get('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'show'])
                ->middleware('permission:catalog.bom.view')->name('show');
            Route::patch('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'update'])
                ->middleware('permission:catalog.bom.manage')->name('update');
            Route::delete('{billOfMaterial:uuid}', [App\Modules\Catalogue\Controllers\BillOfMaterialController::class, 'destroy'])
                ->middleware('permission:catalog.bom.manage')->name('destroy');
        });

        Route::prefix('warehouses')->name('warehouses.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'options'])
                ->middleware('permission:inventory.warehouse.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'index'])
                ->middleware('permission:inventory.warehouse.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'store'])
                ->middleware('permission:inventory.warehouse.manage')->name('store');
            Route::get('{warehouse:uuid}', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'show'])
                ->middleware('permission:inventory.warehouse.view')->name('show');
            Route::patch('{warehouse:uuid}', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'update'])
                ->middleware('permission:inventory.warehouse.manage')->name('update');
            Route::delete('{warehouse:uuid}', [App\Modules\Catalogue\Controllers\WarehouseController::class, 'destroy'])
                ->middleware('permission:inventory.warehouse.manage')->name('destroy');

            Route::prefix('{warehouse:uuid}/locations')->name('locations.')->group(static function (): void {
                Route::get('/', [App\Modules\Catalogue\Controllers\WarehouseLocationController::class, 'index'])
                    ->middleware('permission:inventory.warehouse.view')->name('index');
                Route::post('/', [App\Modules\Catalogue\Controllers\WarehouseLocationController::class, 'store'])
                    ->middleware('permission:inventory.warehouse.manage')->name('store');
                Route::get('{location:uuid}', [App\Modules\Catalogue\Controllers\WarehouseLocationController::class, 'show'])
                    ->middleware('permission:inventory.warehouse.view')->name('show');
                Route::patch('{location:uuid}', [App\Modules\Catalogue\Controllers\WarehouseLocationController::class, 'update'])
                    ->middleware('permission:inventory.warehouse.manage')->name('update');
                Route::delete('{location:uuid}', [App\Modules\Catalogue\Controllers\WarehouseLocationController::class, 'destroy'])
                    ->middleware('permission:inventory.warehouse.manage')->name('destroy');
            });
        });

        // ── Catalogue: Parties ─────────────────────────────────────────
        Route::prefix('parties')->name('parties.')->group(static function (): void {
            Route::get('options', [App\Modules\Catalogue\Controllers\PartyController::class, 'options'])
                ->middleware('permission:catalog.party.view')->name('options');
            Route::get('/', [App\Modules\Catalogue\Controllers\PartyController::class, 'index'])
                ->middleware('permission:catalog.party.view')->name('index');
            Route::post('/', [App\Modules\Catalogue\Controllers\PartyController::class, 'store'])
                ->middleware('permission:catalog.party.manage')->name('store');
            Route::get('{party:uuid}', [App\Modules\Catalogue\Controllers\PartyController::class, 'show'])
                ->middleware('permission:catalog.party.view')->name('show');
            Route::patch('{party:uuid}', [App\Modules\Catalogue\Controllers\PartyController::class, 'update'])
                ->middleware('permission:catalog.party.manage')->name('update');
            Route::delete('{party:uuid}', [App\Modules\Catalogue\Controllers\PartyController::class, 'destroy'])
                ->middleware('permission:catalog.party.manage')->name('destroy');
        });

        // ── Pricing ───────────────────────────────────────────────────
        Route::prefix('pricing')->name('pricing.')->group(static function (): void {
            Route::prefix('price-lists')->name('price-lists.')->group(static function (): void {
                Route::get('options', [App\Modules\Pricing\Controllers\PriceListController::class, 'options'])
                    ->middleware('permission:pricing.price_list.view')->name('options');
                Route::get('/', [App\Modules\Pricing\Controllers\PriceListController::class, 'index'])
                    ->middleware('permission:pricing.price_list.view')->name('index');
                Route::post('/', [App\Modules\Pricing\Controllers\PriceListController::class, 'store'])
                    ->middleware('permission:pricing.price_list.manage')->name('store');
                Route::get('{priceList:uuid}', [App\Modules\Pricing\Controllers\PriceListController::class, 'show'])
                    ->middleware('permission:pricing.price_list.view')->name('show');
                Route::patch('{priceList:uuid}', [App\Modules\Pricing\Controllers\PriceListController::class, 'update'])
                    ->middleware('permission:pricing.price_list.manage')->name('update');
                Route::delete('{priceList:uuid}', [App\Modules\Pricing\Controllers\PriceListController::class, 'destroy'])
                    ->middleware('permission:pricing.price_list.manage')->name('destroy');
            });

            Route::prefix('discount-rules')->name('discount-rules.')->group(static function (): void {
                Route::get('/', [App\Modules\Pricing\Controllers\DiscountRuleController::class, 'index'])
                    ->middleware('permission:pricing.discount_rule.view')->name('index');
                Route::post('/', [App\Modules\Pricing\Controllers\DiscountRuleController::class, 'store'])
                    ->middleware('permission:pricing.discount_rule.manage')->name('store');
                Route::get('{discountRule:uuid}', [App\Modules\Pricing\Controllers\DiscountRuleController::class, 'show'])
                    ->middleware('permission:pricing.discount_rule.view')->name('show');
                Route::patch('{discountRule:uuid}', [App\Modules\Pricing\Controllers\DiscountRuleController::class, 'update'])
                    ->middleware('permission:pricing.discount_rule.manage')->name('update');
                Route::delete('{discountRule:uuid}', [App\Modules\Pricing\Controllers\DiscountRuleController::class, 'destroy'])
                    ->middleware('permission:pricing.discount_rule.manage')->name('destroy');
            });

            Route::prefix('tax-profiles')->name('tax-profiles.')->group(static function (): void {
                Route::get('options', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'options'])
                    ->middleware('permission:pricing.tax_profile.view')->name('options');
                Route::get('/', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'index'])
                    ->middleware('permission:pricing.tax_profile.view')->name('index');
                Route::post('/', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'store'])
                    ->middleware('permission:pricing.tax_profile.manage')->name('store');
                Route::get('{taxProfile:uuid}', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'show'])
                    ->middleware('permission:pricing.tax_profile.view')->name('show');
                Route::patch('{taxProfile:uuid}', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'update'])
                    ->middleware('permission:pricing.tax_profile.manage')->name('update');
                Route::delete('{taxProfile:uuid}', [App\Modules\Pricing\Controllers\TaxProfileController::class, 'destroy'])
                    ->middleware('permission:pricing.tax_profile.manage')->name('destroy');
            });
        });

        // ── Production ────────────────────────────────────────────────
        Route::prefix('production')->name('production.')->group(static function (): void {
            Route::prefix('plans')->name('plans.')->group(static function (): void {
                Route::get('/', [App\Modules\Production\Controllers\ProductionPlanController::class, 'index'])
                    ->middleware('permission:production.plan.view')->name('index');
                Route::post('/', [App\Modules\Production\Controllers\ProductionPlanController::class, 'store'])
                    ->middleware('permission:production.plan.create')->name('store');
                Route::get('{productionPlan:uuid}', [App\Modules\Production\Controllers\ProductionPlanController::class, 'show'])
                    ->middleware('permission:production.plan.view')->name('show');
                Route::patch('{productionPlan:uuid}', [App\Modules\Production\Controllers\ProductionPlanController::class, 'update'])
                    ->middleware('permission:production.plan.create')->name('update');
                Route::post('{productionPlan:uuid}/approve', [App\Modules\Production\Controllers\ProductionPlanController::class, 'approve'])
                    ->middleware('permission:production.plan.approve')->name('approve');
                Route::delete('{productionPlan:uuid}', [App\Modules\Production\Controllers\ProductionPlanController::class, 'destroy'])
                    ->middleware('permission:production.plan.delete')->name('destroy');
            });

            Route::prefix('batches')->name('batches.')->group(static function (): void {
                Route::get('/', [App\Modules\Production\Controllers\ProductionBatchController::class, 'index'])
                    ->middleware('permission:production.batch.view')->name('index');
                Route::post('/', [App\Modules\Production\Controllers\ProductionBatchController::class, 'store'])
                    ->middleware('permission:production.batch.create')->name('store');
                Route::get('{productionBatch:uuid}', [App\Modules\Production\Controllers\ProductionBatchController::class, 'show'])
                    ->middleware('permission:production.batch.view')->name('show');
                Route::patch('{productionBatch:uuid}', [App\Modules\Production\Controllers\ProductionBatchController::class, 'update'])
                    ->middleware('permission:production.batch.update')->name('update');
                Route::post('{productionBatch:uuid}/start', [App\Modules\Production\Controllers\ProductionBatchController::class, 'start'])
                    ->middleware('permission:production.batch.update')->name('start');
                Route::post('{productionBatch:uuid}/inputs', [App\Modules\Production\Controllers\ProductionBatchController::class, 'recordInput'])
                    ->middleware('permission:production.batch.create')->name('inputs.store');
                Route::post('{productionBatch:uuid}/outputs', [App\Modules\Production\Controllers\ProductionBatchController::class, 'recordOutput'])
                    ->middleware('permission:production.batch.create')->name('outputs.store');
                Route::post('{productionBatch:uuid}/complete', [App\Modules\Production\Controllers\ProductionBatchController::class, 'complete'])
                    ->middleware('permission:production.batch.approve')->name('complete');
                Route::post('{productionBatch:uuid}/analyze', [App\Modules\Production\Controllers\ProductionBatchController::class, 'analyze'])
                    ->middleware('permission:production.batch.view')->name('analyze');
                Route::post('{productionBatch:uuid}/close', [App\Modules\Production\Controllers\ProductionBatchController::class, 'close'])
                    ->middleware('permission:production.batch.approve')->name('close');
                Route::delete('{productionBatch:uuid}', [App\Modules\Production\Controllers\ProductionBatchController::class, 'destroy'])
                    ->middleware('permission:production.batch.delete')->name('destroy');
            });

            Route::prefix('worker-entries')->name('worker-entries.')->group(static function (): void {
                Route::get('/', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'index'])
                    ->middleware('permission:production.worker_entry.view')->name('index');
                Route::get('/summary', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'summary'])
                    ->middleware('permission:production.worker_entry.view')->name('summary');
                Route::post('/', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'store'])
                    ->middleware('permission:production.worker_entry.create')->name('store');
                Route::get('{workerProductionEntry:uuid}', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'show'])
                    ->middleware('permission:production.worker_entry.view')->name('show');
                Route::patch('{workerProductionEntry:uuid}', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'update'])
                    ->middleware('permission:production.worker_entry.update')->name('update');
                Route::post('{workerProductionEntry:uuid}/verify', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'verify'])
                    ->middleware('permission:production.worker_entry.approve')->name('verify');
                Route::delete('{workerProductionEntry:uuid}', [App\Modules\Production\Controllers\WorkerProductionEntryController::class, 'destroy'])
                    ->middleware('permission:production.worker_entry.delete')->name('destroy');
            });
        });

        // ── Quality Control (QC) & Wastage ───────────────────────────
        Route::prefix('qc')->name('qc.')->group(static function (): void {
            Route::prefix('parameters')->name('parameters.')->group(static function (): void {
                Route::get('/', [App\Modules\QC\Controllers\QcParameterController::class, 'index'])
                    ->middleware('permission:qc.parameter.view')->name('index');
                Route::post('/', [App\Modules\QC\Controllers\QcParameterController::class, 'store'])
                    ->middleware('permission:qc.parameter.manage')->name('store');
                Route::get('{qcParameter:uuid}', [App\Modules\QC\Controllers\QcParameterController::class, 'show'])
                    ->middleware('permission:qc.parameter.view')->name('show');
                Route::patch('{qcParameter:uuid}', [App\Modules\QC\Controllers\QcParameterController::class, 'update'])
                    ->middleware('permission:qc.parameter.manage')->name('update');
                Route::delete('{qcParameter:uuid}', [App\Modules\QC\Controllers\QcParameterController::class, 'destroy'])
                    ->middleware('permission:qc.parameter.manage')->name('destroy');
            });

            Route::prefix('inspections')->name('inspections.')->group(static function (): void {
                Route::get('/', [App\Modules\QC\Controllers\QcInspectionController::class, 'index'])
                    ->middleware('permission:qc.inspection.view')->name('index');
                Route::post('/', [App\Modules\QC\Controllers\QcInspectionController::class, 'store'])
                    ->middleware('permission:qc.inspection.create')->name('store');
                Route::get('{qcInspection:uuid}', [App\Modules\QC\Controllers\QcInspectionController::class, 'show'])
                    ->middleware('permission:qc.inspection.view')->name('show');
                Route::patch('{qcInspection:uuid}', [App\Modules\QC\Controllers\QcInspectionController::class, 'update'])
                    ->middleware('permission:qc.inspection.update')->name('update');
                Route::post('{qcInspection:uuid}/approve', [App\Modules\QC\Controllers\QcInspectionController::class, 'approve'])
                    ->middleware('permission:qc.inspection.approve')->name('approve');
                Route::delete('{qcInspection:uuid}', [App\Modules\QC\Controllers\QcInspectionController::class, 'destroy'])
                    ->middleware('permission:qc.inspection.delete')->name('destroy');
            });

            Route::prefix('wastage-records')->name('wastage-records.')->group(static function (): void {
                Route::get('/', [App\Modules\QC\Controllers\WastageRecordController::class, 'index'])
                    ->middleware('permission:qc.wastage.view')->name('index');
                Route::post('/', [App\Modules\QC\Controllers\WastageRecordController::class, 'store'])
                    ->middleware('permission:qc.wastage.create')->name('store');
                Route::get('{wastageRecord:uuid}', [App\Modules\QC\Controllers\WastageRecordController::class, 'show'])
                    ->middleware('permission:qc.wastage.view')->name('show');
                Route::patch('{wastageRecord:uuid}', [App\Modules\QC\Controllers\WastageRecordController::class, 'update'])
                    ->middleware('permission:qc.wastage.update')->name('update');
                Route::delete('{wastageRecord:uuid}', [App\Modules\QC\Controllers\WastageRecordController::class, 'destroy'])
                    ->middleware('permission:qc.wastage.delete')->name('destroy');
            });
        });

        // ── Inventory & Stock Operations ──────────────────────────────
        Route::prefix('inventory')->name('inventory.')->group(static function (): void {
            Route::get('movements', [App\Modules\Inventory\Controllers\StockMovementController::class, 'index'])
                ->middleware('permission:inventory.movement.view')->name('movements.index');
            Route::get('movements/{id}', [App\Modules\Inventory\Controllers\StockMovementController::class, 'show'])
                ->middleware('permission:inventory.movement.view')->name('movements.show');
            Route::get('balances', [App\Modules\Inventory\Controllers\StockMovementController::class, 'balances'])
                ->middleware('permission:inventory.stock.view')->name('balances.index');

            Route::prefix('transfers')->name('transfers.')->group(static function (): void {
                Route::get('/', [App\Modules\Inventory\Controllers\StockTransferController::class, 'index'])
                    ->middleware('permission:inventory.transfer.view')->name('index');
                Route::post('/', [App\Modules\Inventory\Controllers\StockTransferController::class, 'store'])
                    ->middleware('permission:inventory.transfer.create')->name('store');
                Route::get('{id}', [App\Modules\Inventory\Controllers\StockTransferController::class, 'show'])
                    ->middleware('permission:inventory.transfer.view')->name('show');
                Route::post('{id}/dispatch', [App\Modules\Inventory\Controllers\StockTransferController::class, 'dispatch'])
                    ->middleware('permission:inventory.transfer.approve')->name('dispatch');
                Route::post('{id}/receive', [App\Modules\Inventory\Controllers\StockTransferController::class, 'receive'])
                    ->middleware('permission:inventory.transfer.approve')->name('receive');
                Route::delete('{id}', [App\Modules\Inventory\Controllers\StockTransferController::class, 'destroy'])
                    ->middleware('permission:inventory.transfer.create')->name('destroy');
            });

            Route::prefix('adjustments')->name('adjustments.')->group(static function (): void {
                Route::get('/', [App\Modules\Inventory\Controllers\StockAdjustmentController::class, 'index'])
                    ->middleware('permission:inventory.adjustment.view')->name('index');
                Route::post('/', [App\Modules\Inventory\Controllers\StockAdjustmentController::class, 'store'])
                    ->middleware('permission:inventory.adjustment.create')->name('store');
                Route::get('{id}', [App\Modules\Inventory\Controllers\StockAdjustmentController::class, 'show'])
                    ->middleware('permission:inventory.adjustment.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Inventory\Controllers\StockAdjustmentController::class, 'approve'])
                    ->middleware('permission:inventory.adjustment.approve')->name('approve');
                Route::delete('{id}', [App\Modules\Inventory\Controllers\StockAdjustmentController::class, 'destroy'])
                    ->middleware('permission:inventory.adjustment.create')->name('destroy');
            });

            Route::prefix('counts')->name('counts.')->group(static function (): void {
                Route::get('/', [App\Modules\Inventory\Controllers\StockCountController::class, 'index'])
                    ->middleware('permission:inventory.count.view')->name('index');
                Route::post('/', [App\Modules\Inventory\Controllers\StockCountController::class, 'store'])
                    ->middleware('permission:inventory.count.create')->name('store');
                Route::get('{id}', [App\Modules\Inventory\Controllers\StockCountController::class, 'show'])
                    ->middleware('permission:inventory.count.view')->name('show');
                Route::post('{id}/reconcile', [App\Modules\Inventory\Controllers\StockCountController::class, 'reconcile'])
                    ->middleware('permission:inventory.count.approve')->name('reconcile');
                Route::delete('{id}', [App\Modules\Inventory\Controllers\StockCountController::class, 'destroy'])
                    ->middleware('permission:inventory.count.create')->name('destroy');
            });
        });

        // ── Purchasing & Procurement ──────────────────────────────────
        Route::prefix('purchasing')->name('purchasing.')->group(static function (): void {
            Route::prefix('requisitions')->name('requisitions.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\PurchaseRequisitionController::class, 'index'])
                    ->middleware('permission:purchasing.requisition.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\PurchaseRequisitionController::class, 'store'])
                    ->middleware('permission:purchasing.requisition.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\PurchaseRequisitionController::class, 'show'])
                    ->middleware('permission:purchasing.requisition.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Purchasing\Controllers\PurchaseRequisitionController::class, 'approve'])
                    ->middleware('permission:purchasing.requisition.approve')->name('approve');
                Route::delete('{id}', [App\Modules\Purchasing\Controllers\PurchaseRequisitionController::class, 'destroy'])
                    ->middleware('permission:purchasing.requisition.create')->name('destroy');
            });

            Route::prefix('orders')->name('orders.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\PurchaseOrderController::class, 'index'])
                    ->middleware('permission:purchasing.order.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\PurchaseOrderController::class, 'store'])
                    ->middleware('permission:purchasing.order.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\PurchaseOrderController::class, 'show'])
                    ->middleware('permission:purchasing.order.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Purchasing\Controllers\PurchaseOrderController::class, 'approve'])
                    ->middleware('permission:purchasing.order.approve')->name('approve');
                Route::delete('{id}', [App\Modules\Purchasing\Controllers\PurchaseOrderController::class, 'destroy'])
                    ->middleware('permission:purchasing.order.create')->name('destroy');
            });

            Route::prefix('receipts')->name('receipts.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'index'])
                    ->middleware('permission:purchasing.receipt.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'store'])
                    ->middleware('permission:purchasing.receipt.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'show'])
                    ->middleware('permission:purchasing.receipt.view')->name('show');
            });

            Route::prefix('goods-receipts')->name('goods-receipts.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'index'])
                    ->middleware('permission:purchasing.receipt.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'store'])
                    ->middleware('permission:purchasing.receipt.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\GoodsReceiptController::class, 'show'])
                    ->middleware('permission:purchasing.receipt.view')->name('show');
            });

            Route::prefix('bills')->name('bills.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\PurchaseBillController::class, 'index'])
                    ->middleware('permission:purchasing.bill.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\PurchaseBillController::class, 'store'])
                    ->middleware('permission:purchasing.bill.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\PurchaseBillController::class, 'show'])
                    ->middleware('permission:purchasing.bill.view')->name('show');
            });

            Route::prefix('returns')->name('returns.')->group(static function (): void {
                Route::get('/', [App\Modules\Purchasing\Controllers\PurchaseReturnController::class, 'index'])
                    ->middleware('permission:purchasing.return.view')->name('index');
                Route::post('/', [App\Modules\Purchasing\Controllers\PurchaseReturnController::class, 'store'])
                    ->middleware('permission:purchasing.return.create')->name('store');
                Route::get('{id}', [App\Modules\Purchasing\Controllers\PurchaseReturnController::class, 'show'])
                    ->middleware('permission:purchasing.return.view')->name('show');
            });
        });

        // ── Sales: Orders ─────────────────────────────────────────────
        Route::prefix('sales')->name('sales.')->group(static function (): void {
            Route::prefix('orders')->name('orders.')->group(static function (): void {
                Route::get('/', [App\Modules\Sales\Controllers\SalesOrderController::class, 'index'])
                    ->middleware('permission:sales.order.view')->name('index');
                Route::post('/', [App\Modules\Sales\Controllers\SalesOrderController::class, 'store'])
                    ->middleware('permission:sales.order.create')->name('store');
                Route::get('{id}', [App\Modules\Sales\Controllers\SalesOrderController::class, 'show'])
                    ->middleware('permission:sales.order.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Sales\Controllers\SalesOrderController::class, 'approve'])
                    ->middleware('permission:sales.order.approve')->name('approve');
            });

            Route::prefix('invoices')->name('invoices.')->group(static function (): void {
                Route::get('/', [App\Modules\Sales\Controllers\InvoiceController::class, 'index'])
                    ->middleware('permission:sales.invoice.view')->name('index');
                Route::post('/', [App\Modules\Sales\Controllers\InvoiceController::class, 'store'])
                    ->middleware('permission:sales.invoice.create')->name('store');
                Route::get('{id}', [App\Modules\Sales\Controllers\InvoiceController::class, 'show'])
                    ->middleware('permission:sales.invoice.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Sales\Controllers\InvoiceController::class, 'approve'])
                    ->middleware('permission:sales.invoice.approve')->name('approve');
                Route::post('{id}/void', [App\Modules\Sales\Controllers\InvoiceController::class, 'void'])
                    ->middleware('permission:sales.invoice.void')->name('void');
            });

            Route::prefix('deliveries')->name('deliveries.')->group(static function (): void {
                Route::get('/', [App\Modules\Sales\Controllers\DeliveryOrderController::class, 'index'])
                    ->middleware('permission:sales.delivery.view')->name('index');
                Route::post('/', [App\Modules\Sales\Controllers\DeliveryOrderController::class, 'store'])
                    ->middleware('permission:sales.delivery.create')->name('store');
                Route::get('{id}', [App\Modules\Sales\Controllers\DeliveryOrderController::class, 'show'])
                    ->middleware('permission:sales.delivery.view')->name('show');
                Route::post('{id}/dispatch', [App\Modules\Sales\Controllers\DeliveryOrderController::class, 'dispatch'])
                    ->middleware('permission:sales.delivery.dispatch')->name('dispatch');
            });

            Route::prefix('payments')->name('payments.')->group(static function (): void {
                Route::get('/', [App\Modules\Sales\Controllers\PaymentController::class, 'index'])
                    ->middleware('permission:sales.payment.view')->name('index');
                Route::post('/', [App\Modules\Sales\Controllers\PaymentController::class, 'store'])
                    ->middleware('permission:sales.payment.create')->name('store');
                Route::get('{id}', [App\Modules\Sales\Controllers\PaymentController::class, 'show'])
                    ->middleware('permission:sales.payment.view')->name('show');
            });

            Route::prefix('returns')->name('returns.')->group(static function (): void {
                Route::get('/', [App\Modules\Sales\Controllers\SalesReturnController::class, 'index'])
                    ->middleware('permission:sales.return.view')->name('index');
                Route::post('/', [App\Modules\Sales\Controllers\SalesReturnController::class, 'store'])
                    ->middleware('permission:sales.return.create')->name('store');
                Route::get('{id}', [App\Modules\Sales\Controllers\SalesReturnController::class, 'show'])
                    ->middleware('permission:sales.return.view')->name('show');
                Route::post('{id}/approve', [App\Modules\Sales\Controllers\SalesReturnController::class, 'approve'])
                    ->middleware('permission:sales.return.approve')->name('approve');
            });
        });

        // ── POS ───────────────────────────────────────────────────────
        Route::prefix('pos')->name('pos.')->group(static function (): void {
            Route::prefix('terminals')->name('terminals.')->group(static function (): void {
                Route::get('/', [App\Modules\Pos\Controllers\PosTerminalController::class, 'index'])
                    ->middleware('permission:pos.terminal.view')->name('index');
                Route::post('/', [App\Modules\Pos\Controllers\PosTerminalController::class, 'store'])
                    ->middleware('permission:pos.terminal.create')->name('store');
                Route::get('{id}', [App\Modules\Pos\Controllers\PosTerminalController::class, 'show'])
                    ->middleware('permission:pos.terminal.view')->name('show');
            });

            Route::prefix('sessions')->name('sessions.')->group(static function (): void {
                Route::get('/', [App\Modules\Pos\Controllers\PosSessionController::class, 'index'])
                    ->middleware('permission:pos.session.view')->name('index');
                Route::post('/', [App\Modules\Pos\Controllers\PosSessionController::class, 'open'])
                    ->middleware('permission:pos.session.open')->name('open');
                Route::get('{id}', [App\Modules\Pos\Controllers\PosSessionController::class, 'show'])
                    ->middleware('permission:pos.session.view')->name('show');
                Route::post('{id}/close', [App\Modules\Pos\Controllers\PosSessionController::class, 'close'])
                    ->middleware('permission:pos.session.close')->name('close');
            });

            Route::post('checkout', [App\Modules\Pos\Controllers\PosCheckoutController::class, 'checkout'])
                ->middleware('permission:pos.checkout')->name('checkout');
        });

        // ── Logistics & Courier Dispatch ───────────────────────────────
        Route::prefix('logistics')->name('logistics.')->group(static function (): void {
            Route::prefix('couriers')->name('couriers.')->group(static function (): void {
                Route::get('/', [App\Modules\Delivery\Controllers\CourierProviderController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Delivery\Controllers\CourierProviderController::class, 'store'])->name('store');
                Route::get('{courier}', [App\Modules\Delivery\Controllers\CourierProviderController::class, 'show'])->name('show');
                Route::patch('{courier}', [App\Modules\Delivery\Controllers\CourierProviderController::class, 'update'])->name('update');
            });

            Route::prefix('shipments')->name('shipments.')->group(static function (): void {
                Route::get('/', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'store'])->name('store');
                Route::get('{shipment}', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'show'])->name('show');
                Route::post('{shipment}/track', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'track'])->name('track');
                Route::post('{shipment}/cancel', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'cancel'])->name('cancel');
                Route::get('{shipment}/label', [App\Modules\Delivery\Controllers\CourierShipmentController::class, 'label'])->name('label');
            });

            Route::prefix('run-sheets')->name('run-sheets.')->group(static function (): void {
                Route::get('/', [App\Modules\Delivery\Controllers\RunSheetController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Delivery\Controllers\RunSheetController::class, 'store'])->name('store');
                Route::get('{runSheet}', [App\Modules\Delivery\Controllers\RunSheetController::class, 'show'])->name('show');
                Route::post('{runSheet}/complete', [App\Modules\Delivery\Controllers\RunSheetController::class, 'complete'])->name('complete');
            });

            Route::prefix('cod-reconciliations')->name('cod-reconciliations.')->group(static function (): void {
                Route::get('/', [App\Modules\Delivery\Controllers\CodReconciliationController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Delivery\Controllers\CodReconciliationController::class, 'store'])->name('store');
                Route::get('{reconciliation}', [App\Modules\Delivery\Controllers\CodReconciliationController::class, 'show'])->name('show');
            });
        });

        // ── Finance & Accounting ──────────────────────────────────────
        Route::prefix('finance')->name('finance.')->group(static function (): void {
            Route::prefix('accounts')->name('accounts.')->group(static function (): void {
                Route::get('/', [App\Modules\Finance\Controllers\ChartOfAccountController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Finance\Controllers\ChartOfAccountController::class, 'store'])->name('store');
                Route::get('{id}', [App\Modules\Finance\Controllers\ChartOfAccountController::class, 'show'])->name('show');
            });

            Route::prefix('journal-entries')->name('journal-entries.')->group(static function (): void {
                Route::get('/', [App\Modules\Finance\Controllers\JournalEntryController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Finance\Controllers\JournalEntryController::class, 'store'])->name('store');
                Route::get('{id}', [App\Modules\Finance\Controllers\JournalEntryController::class, 'show'])->name('show');
            });

            Route::prefix('bank-accounts')->name('bank-accounts.')->group(static function (): void {
                Route::get('/', [App\Modules\Finance\Controllers\BankAccountController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Finance\Controllers\BankAccountController::class, 'store'])->name('store');
            });

            Route::prefix('expenses')->name('expenses.')->group(static function (): void {
                Route::get('categories', [App\Modules\Finance\Controllers\ExpenseController::class, 'categories'])->name('categories');
                Route::post('categories', [App\Modules\Finance\Controllers\ExpenseController::class, 'storeCategory'])->name('categories.store');
                Route::get('/', [App\Modules\Finance\Controllers\ExpenseController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Finance\Controllers\ExpenseController::class, 'store'])->name('store');
                Route::get('{id}', [App\Modules\Finance\Controllers\ExpenseController::class, 'show'])->name('show');
            });

            Route::prefix('costing')->name('costing.')->group(static function (): void {
                Route::get('/', [App\Modules\Finance\Controllers\CostingController::class, 'index'])->name('index');
                Route::post('rollup', [App\Modules\Finance\Controllers\CostingController::class, 'rollup'])->name('rollup');
            });
        });

        // ── Fixed Assets & Maintenance ────────────────────────────────
        Route::prefix('assets')->name('assets.')->group(static function (): void {
            Route::get('categories', [App\Modules\Assets\Controllers\AssetController::class, 'categories'])->name('categories');
            Route::post('categories', [App\Modules\Assets\Controllers\AssetController::class, 'storeCategory'])->name('categories.store');
            Route::get('/', [App\Modules\Assets\Controllers\AssetController::class, 'index'])->name('index');
            Route::post('/', [App\Modules\Assets\Controllers\AssetController::class, 'store'])->name('store');
            Route::get('{id}', [App\Modules\Assets\Controllers\AssetController::class, 'show'])->name('show');

            Route::prefix('depreciation')->name('depreciation.')->group(static function (): void {
                Route::get('/', [App\Modules\Assets\Controllers\AssetDepreciationController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Assets\Controllers\AssetDepreciationController::class, 'store'])->name('store');
            });

            Route::prefix('maintenance-orders')->name('maintenance-orders.')->group(static function (): void {
                Route::get('/', [App\Modules\Assets\Controllers\MaintenanceOrderController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\Assets\Controllers\MaintenanceOrderController::class, 'store'])->name('store');
                Route::get('{id}', [App\Modules\Assets\Controllers\MaintenanceOrderController::class, 'show'])->name('show');
            });
        });

        // ── Human Resources & Payroll ─────────────────────────────────
        Route::prefix('hr')->name('hr.')->group(static function (): void {
            Route::get('departments', [App\Modules\HR\Controllers\EmployeeController::class, 'departments'])->name('departments');
            Route::get('designations', [App\Modules\HR\Controllers\EmployeeController::class, 'designations'])->name('designations');
            Route::get('shifts', [App\Modules\HR\Controllers\EmployeeController::class, 'shifts'])->name('shifts');

            Route::prefix('employees')->name('employees.')->group(static function (): void {
                Route::get('/', [App\Modules\HR\Controllers\EmployeeController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\HR\Controllers\EmployeeController::class, 'store'])->name('store');
                Route::get('{id}', [App\Modules\HR\Controllers\EmployeeController::class, 'show'])->name('show');
            });

            Route::prefix('attendances')->name('attendances.')->group(static function (): void {
                Route::get('/', [App\Modules\HR\Controllers\AttendanceController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\HR\Controllers\AttendanceController::class, 'store'])->name('store');
            });

            Route::prefix('leaves')->name('leaves.')->group(static function (): void {
                Route::get('types', [App\Modules\HR\Controllers\LeaveRequestController::class, 'leaveTypes'])->name('types');
                Route::get('/', [App\Modules\HR\Controllers\LeaveRequestController::class, 'index'])->name('index');
                Route::post('/', [App\Modules\HR\Controllers\LeaveRequestController::class, 'store'])->name('store');
            });

            Route::prefix('payroll')->name('payroll.')->group(static function (): void {
                Route::get('periods', [App\Modules\HR\Controllers\PayrollController::class, 'periods'])->name('periods');
                Route::post('periods', [App\Modules\HR\Controllers\PayrollController::class, 'storePeriod'])->name('periods.store');
                Route::post('periods/{id}/process', [App\Modules\HR\Controllers\PayrollController::class, 'process'])->name('periods.process');
                Route::get('payslips', [App\Modules\HR\Controllers\PayrollController::class, 'payslips'])->name('payslips');
                Route::get('payslips/{id}', [App\Modules\HR\Controllers\PayrollController::class, 'showPayslip'])->name('payslips.show');
            });
        });

        // ── Reports & RMS Engine ──────────────────────────────────────
        Route::prefix('reports')->name('reports.')->group(static function (): void {
            Route::get('/', [App\Modules\Reports\Controllers\ReportRegistryController::class, 'index'])->name('index');
            Route::get('{code}/schema', [App\Modules\Reports\Controllers\ReportDataController::class, 'schema'])->name('schema');
            Route::get('{code}/data', [App\Modules\Reports\Controllers\ReportDataController::class, 'data'])->name('data');
            Route::post('{code}/export', [App\Modules\Reports\Controllers\ReportExportController::class, 'export'])->name('export');
            Route::get('exports/{uuid}', [App\Modules\Reports\Controllers\ReportExportController::class, 'show'])->name('exports.show');
            Route::get('{code}/views', [App\Modules\Reports\Controllers\ReportSavedViewController::class, 'index'])->name('views.index');
            Route::post('{code}/views', [App\Modules\Reports\Controllers\ReportSavedViewController::class, 'store'])->name('views.store');
        });

        // ── Real-time Notifications ───────────────────────────────────
        Route::prefix('notifications')->name('notifications.')->group(static function (): void {
            Route::get('/', [App\Modules\Notifications\Controllers\NotificationController::class, 'index'])->name('index');
            Route::post('read-all', [App\Modules\Notifications\Controllers\NotificationController::class, 'markAllAsRead'])->name('read-all');
            Route::post('{id}/read', [App\Modules\Notifications\Controllers\NotificationController::class, 'markAsRead'])->name('read');
        });

        // ── Storefront CMS & Customizer ─────────────────────────────
        Route::prefix('storefront')->name('storefront.')->group(static function (): void {
            Route::get('settings', [\App\Modules\Ecommerce\Controllers\StorefrontCustomizerController::class, 'getSettings'])->name('settings.get');
            Route::put('settings', [\App\Modules\Ecommerce\Controllers\StorefrontCustomizerController::class, 'updateSettings'])->name('settings.update');
            Route::get('products', [\App\Modules\Ecommerce\Controllers\StorefrontCustomizerController::class, 'getPublishedProducts'])->name('products.index');
            Route::post('products/toggle-publish', [\App\Modules\Ecommerce\Controllers\StorefrontCustomizerController::class, 'togglePublishProduct'])->name('products.toggle');

            // Page Builder
            Route::get('cms/pages', [\App\Modules\Ecommerce\Controllers\StorefrontPageBuilderController::class, 'index'])->name('cms.pages.index');
            Route::post('cms/pages', [\App\Modules\Ecommerce\Controllers\StorefrontPageBuilderController::class, 'store'])->name('cms.pages.store');
            Route::get('cms/pages/{idOrSlug}', [\App\Modules\Ecommerce\Controllers\StorefrontPageBuilderController::class, 'show'])->name('cms.pages.show');
            Route::put('cms/pages/{id}', [\App\Modules\Ecommerce\Controllers\StorefrontPageBuilderController::class, 'update'])->name('cms.pages.update');
            Route::delete('cms/pages/{id}', [\App\Modules\Ecommerce\Controllers\StorefrontPageBuilderController::class, 'destroy'])->name('cms.pages.destroy');

            // Custom Domain & Storefront Domain Management
            Route::prefix('domains')->name('domains.')->group(static function (): void {
                Route::get('/', [\App\Modules\Ecommerce\Controllers\TenantDomainController::class, 'index'])->name('index');
                Route::post('/', [\App\Modules\Ecommerce\Controllers\TenantDomainController::class, 'store'])->name('store');
                Route::post('{id}/verify', [\App\Modules\Ecommerce\Controllers\TenantDomainController::class, 'verify'])->name('verify');
                Route::post('{id}/set-primary', [\App\Modules\Ecommerce\Controllers\TenantDomainController::class, 'setPrimary'])->name('set-primary');
                Route::delete('{id}', [\App\Modules\Ecommerce\Controllers\TenantDomainController::class, 'destroy'])->name('destroy');
            });
        });

        // ── Settings & Configuration System ─────────────────────────
        Route::prefix('settings')->name('settings.')->group(static function (): void {
            Route::get('schema', [\App\Modules\Platform\Controllers\TenantSettingsController::class, 'schema'])->name('schema');
            Route::get('{group}', [\App\Modules\Platform\Controllers\TenantSettingsController::class, 'getGroup'])->name('get');
            Route::put('{group}', [\App\Modules\Platform\Controllers\TenantSettingsController::class, 'updateGroup'])->name('update');
            Route::post('{group}/test-connection', [\App\Modules\Platform\Controllers\TenantSettingsController::class, 'testConnection'])->name('test-connection');
            Route::post('{group}/reset', [\App\Modules\Platform\Controllers\TenantSettingsController::class, 'resetGroup'])->name('reset');
        });

        // ── E-Commerce Fraud Check & Order Verification ─────────────
        Route::prefix('fraud-check')->name('fraud-check.')->group(static function (): void {
            Route::get('queue', [\App\Modules\Ecommerce\Controllers\OrderFraudVerificationController::class, 'index'])->name('queue');
            Route::get('orders/{orderId}', [\App\Modules\Ecommerce\Controllers\OrderFraudVerificationController::class, 'show'])->name('show');
            Route::post('orders/{orderId}/verify', [\App\Modules\Ecommerce\Controllers\OrderFraudVerificationController::class, 'verify'])->name('verify');
            Route::post('orders/{orderId}/hold', [\App\Modules\Ecommerce\Controllers\OrderFraudVerificationController::class, 'hold'])->name('hold');
            Route::post('orders/{orderId}/reject', [\App\Modules\Ecommerce\Controllers\OrderFraudVerificationController::class, 'reject'])->name('reject');
        });

        // ── RBAC & Role Management ──────────────────────────────────
        Route::prefix('roles')->name('roles.')->group(static function (): void {
            Route::get('/', [\App\Modules\Auth\Controllers\RoleController::class, 'index'])->name('index');
            Route::post('/', [\App\Modules\Auth\Controllers\RoleController::class, 'store'])->name('store');
            Route::get('{id}', [\App\Modules\Auth\Controllers\RoleController::class, 'show'])->name('show');
            Route::put('{id}', [\App\Modules\Auth\Controllers\RoleController::class, 'update'])->name('update');
            Route::delete('{id}', [\App\Modules\Auth\Controllers\RoleController::class, 'destroy'])->name('destroy');
        });

        Route::get('permissions', [\App\Modules\Auth\Controllers\RoleController::class, 'permissions'])->name('permissions.index');

        // ── System Audit Logging & Entity History ───────────────────
        Route::prefix('audit-logs')->name('audit-logs.')->group(static function (): void {
            Route::get('/', [App\Modules\Audit\Controllers\AuditLogController::class, 'index'])->name('index');
            Route::get('{id}', [App\Modules\Audit\Controllers\AuditLogController::class, 'show'])->name('show');
            Route::get('entity/{type}/{id}', [App\Modules\Audit\Controllers\AuditLogController::class, 'entityHistory'])->name('entity');
        });

        // ── Centralized Document Templates & Printing Infrastructure ─
        Route::prefix('documents')->name('documents.')->group(static function (): void {
            // Template Resolution (Public within tenant)
            Route::get('templates/resolve', [\App\Modules\Documents\Controllers\DocumentResolveController::class, 'resolve'])
                ->name('templates.resolve');

            // Document Templates CRUD & Versioning
            Route::prefix('templates')->name('templates.')->group(static function (): void {
                Route::get('/', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'index'])
                    ->middleware('permission:documents.template.view')
                    ->name('index');
                Route::post('/', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'store'])
                    ->middleware('permission:documents.template.create')
                    ->name('store');
                Route::get('{id}', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'show'])
                    ->middleware('permission:documents.template.view')
                    ->name('show');
                Route::put('{id}', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'update'])
                    ->middleware('permission:documents.template.update')
                    ->name('update');
                Route::delete('{id}', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'destroy'])
                    ->middleware('permission:documents.template.delete')
                    ->name('destroy');
                Route::post('{id}/set-default', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'setDefault'])
                    ->middleware('permission:documents.template.manage')
                    ->name('set-default');
                Route::post('{id}/duplicate', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'duplicate'])
                    ->middleware('permission:documents.template.create')
                    ->name('duplicate');
                Route::get('{id}/versions', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'versions'])
                    ->middleware('permission:documents.template.view')
                    ->name('versions');
                Route::post('{id}/versions/{version}/activate', [\App\Modules\Documents\Controllers\DocumentTemplateController::class, 'activateVersion'])
                    ->middleware('permission:documents.template.manage')
                    ->name('activate-version');
            });

            // Centralized Paper Sizes Registry
            Route::prefix('paper-sizes')->name('paper-sizes.')->group(static function (): void {
                Route::get('/', [\App\Modules\Documents\Controllers\PaperSizeController::class, 'index'])
                    ->name('index');
                Route::post('/', [\App\Modules\Documents\Controllers\PaperSizeController::class, 'store'])
                    ->middleware('permission:documents.paper_size.manage')
                    ->name('store');
                Route::put('{id}', [\App\Modules\Documents\Controllers\PaperSizeController::class, 'update'])
                    ->middleware('permission:documents.paper_size.manage')
                    ->name('update');
                Route::delete('{id}', [\App\Modules\Documents\Controllers\PaperSizeController::class, 'destroy'])
                    ->middleware('permission:documents.paper_size.manage')
                    ->name('destroy');
            });

            // Reusable Print Profiles
            Route::prefix('print-profiles')->name('print-profiles.')->group(static function (): void {
                Route::get('/', [\App\Modules\Documents\Controllers\PrintProfileController::class, 'index'])
                    ->name('index');
                Route::post('/', [\App\Modules\Documents\Controllers\PrintProfileController::class, 'store'])
                    ->middleware('permission:documents.print_profile.manage')
                    ->name('store');
                Route::put('{id}', [\App\Modules\Documents\Controllers\PrintProfileController::class, 'update'])
                    ->middleware('permission:documents.print_profile.manage')
                    ->name('update');
                Route::delete('{id}', [\App\Modules\Documents\Controllers\PrintProfileController::class, 'destroy'])
                    ->middleware('permission:documents.print_profile.manage')
                    ->name('destroy');
            });

            // Centralized Document Number Sequences
            Route::prefix('numbering')->name('numbering.')->group(static function (): void {
                Route::get('/', [\App\Modules\Documents\Controllers\DocumentNumberingController::class, 'index'])
                    ->name('index');
                Route::post('/', [\App\Modules\Documents\Controllers\DocumentNumberingController::class, 'store'])
                    ->middleware('permission:documents.numbering.manage')
                    ->name('store');
                Route::put('{id}', [\App\Modules\Documents\Controllers\DocumentNumberingController::class, 'update'])
                    ->middleware('permission:documents.numbering.manage')
                    ->name('update');
            });

            // Print & Reprint History Audit Log
            Route::prefix('print-history')->name('print-history.')->group(static function (): void {
                Route::get('/', [\App\Modules\Documents\Controllers\DocumentPrintHistoryController::class, 'index'])
                    ->middleware('permission:documents.history.view')
                    ->name('index');
                Route::post('/', [\App\Modules\Documents\Controllers\DocumentPrintHistoryController::class, 'store'])
                    ->middleware('permission:documents.document.print')
                    ->name('store');
            });
        });

        // ── Platform Capability & Dynamic Tenant Configuration ────────
        Route::prefix('tenant')->name('tenant.config.')->group(static function (): void {
            // Capability Manifest (cached 5 min per tenant)
            Route::get('manifest', [\App\Modules\Platform\Controllers\TenantCapabilityController::class, 'manifest'])->name('manifest');

            // Dynamic Modules Enable/Disable
            Route::get('modules', [\App\Modules\Platform\Controllers\TenantModuleController::class, 'index'])->name('modules.index');
            Route::put('modules/batch', [\App\Modules\Platform\Controllers\TenantModuleController::class, 'batchUpdate'])->name('modules.batch');
            Route::put('modules/{moduleKey}', [\App\Modules\Platform\Controllers\TenantModuleController::class, 'update'])->name('modules.update');

            // Dynamic Production Stages
            Route::get('production-stages', [\App\Modules\Platform\Controllers\TenantProductionStageController::class, 'index'])->name('production-stages.index');
            Route::post('production-stages', [\App\Modules\Platform\Controllers\TenantProductionStageController::class, 'store'])->name('production-stages.store');
            Route::post('production-stages/reorder', [\App\Modules\Platform\Controllers\TenantProductionStageController::class, 'reorder'])->name('production-stages.reorder');
            Route::put('production-stages/{id}', [\App\Modules\Platform\Controllers\TenantProductionStageController::class, 'update'])->name('production-stages.update');
            Route::delete('production-stages/{id}', [\App\Modules\Platform\Controllers\TenantProductionStageController::class, 'destroy'])->name('production-stages.destroy');

            // Custom Field Definitions
            Route::get('custom-fields', [\App\Modules\Platform\Controllers\CustomFieldDefinitionController::class, 'index'])->name('custom-fields.index');
            Route::post('custom-fields', [\App\Modules\Platform\Controllers\CustomFieldDefinitionController::class, 'store'])->name('custom-fields.store');
            Route::put('custom-fields/{id}', [\App\Modules\Platform\Controllers\CustomFieldDefinitionController::class, 'update'])->name('custom-fields.update');
            Route::delete('custom-fields/{id}', [\App\Modules\Platform\Controllers\CustomFieldDefinitionController::class, 'destroy'])->name('custom-fields.destroy');

            // Industry Profile & Terminology Overrides
            Route::post('apply-industry-profile', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'applyProfile'])->name('apply-profile');
            Route::patch('terminology', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'updateTerminology'])->name('terminology.update');

            // 10-Step Onboarding Engine
            Route::get('onboarding/state', [\App\Modules\Platform\Controllers\TenantOnboardingController::class, 'state'])->name('onboarding.state');
            Route::post('onboarding/step', [\App\Modules\Platform\Controllers\TenantOnboardingController::class, 'saveStep'])->name('onboarding.step');
            Route::post('onboarding/complete', [\App\Modules\Platform\Controllers\TenantOnboardingController::class, 'complete'])->name('onboarding.complete');
        });

        // Industry Profiles & Business Types catalog
        Route::get('industry-profiles', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'index'])->name('industry-profiles.index');
        Route::get('industry-profiles/{key}', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'show'])->name('industry-profiles.show');
        Route::get('business-types', [\App\Modules\Platform\Controllers\IndustryProfileController::class, 'businessTypes'])->name('business-types.index');
    });

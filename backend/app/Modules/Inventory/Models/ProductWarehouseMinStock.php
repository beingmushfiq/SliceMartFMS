<?php

declare(strict_types=1);

namespace App\Modules\Inventory\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductWarehouseMinStock extends Model
{
    use BelongsToTenant;

    protected $table = 'product_warehouse_min_stocks';

    protected $fillable = [
        'tenant_id',
        'product_id',
        'warehouse_id',
        'min_stock_alert',
        'reorder_quantity',
        'max_stock_level',
    ];

    protected $casts = [
        'min_stock_alert' => 'decimal:4',
        'reorder_quantity' => 'decimal:4',
        'max_stock_level' => 'decimal:4',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id');
    }
}

<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $uuid
 * @property string $employee_code
 * @property int|null $user_id
 * @property int $company_id
 * @property int|null $branch_id
 * @property int|null $factory_id
 * @property int|null $production_line_id
 * @property int|null $department_id
 * @property int|null $designation_id
 * @property int|null $reports_to_employee_id
 * @property string $first_name
 * @property string|null $last_name
 * @property string $display_name
 * @property string|null $gender
 * @property string|null $date_of_birth
 * @property string|null $national_id
 * @property string $phone
 * @property string|null $email
 * @property string|null $address_line1
 * @property string|null $address_line2
 * @property string|null $city
 * @property string|null $photo_path
 * @property string $date_of_joining
 * @property string|null $date_of_leaving
 * @property string $employment_type
 * @property string $employment_status
 * @property int|null $default_shift_id
 * @property int|null $salary_structure_id
 * @property string|null $bank_name
 * @property string|null $bank_account_number
 * @property string|null $mobile_wallet_number
 * @property int $is_active
 * @property int|null $created_by
 * @property int|null $updated_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property-read Tenant $tenant
 * @property-read User|null $user
 * @property-read \Illuminate\Database\Eloquent\Collection<int, WorkerProductionEntry> $workerProductionEntries
 */
final class Employee extends Model
{
    use BelongsToTenant;
    use SoftDeletes;

    protected $table = 'employees';

    protected $fillable = [
        'uuid',
        'employee_code',
        'user_id',
        'company_id',
        'branch_id',
        'factory_id',
        'production_line_id',
        'department_id',
        'designation_id',
        'reports_to_employee_id',
        'first_name',
        'last_name',
        'display_name',
        'gender',
        'date_of_birth',
        'national_id',
        'phone',
        'email',
        'address_line1',
        'address_line2',
        'city',
        'photo_path',
        'date_of_joining',
        'date_of_leaving',
        'employment_type',
        'employment_status',
        'default_shift_id',
        'salary_structure_id',
        'bank_name',
        'bank_account_number',
        'mobile_wallet_number',
        'is_active',
        'created_by',
        'updated_by',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return HasMany<WorkerProductionEntry, $this>
     */
    public function workerProductionEntries(): HasMany
    {
        return $this->hasMany(WorkerProductionEntry::class, 'employee_id');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'integer',
            'date_of_birth' => 'date:Y-m-d',
            'date_of_joining' => 'date:Y-m-d',
            'date_of_leaving' => 'date:Y-m-d',
        ];
    }
}

<?php

declare(strict_types=1);

namespace Tests\Feature\Tenancy;

use App\Core\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

/**
 * Minimal Eloquent model used by TenancyRuntimeTest to prove that
 * BelongsToTenant works on a concrete (non-anonymous) class.
 *
 * Using a named class eliminates PHPStan's invariance error that arises when
 * the trait's withoutTenantScope() is analysed in the context of an anonymous
 * class — with a named class, PHPStan can resolve `static` to a stable type
 * and verify Builder<static> → Builder<ScopedCompanyStub> correctly.
 *
 * @internal Only used in TenancyRuntimeTest.
 */
final class ScopedCompanyStub extends Model
{
    use BelongsToTenant;

    /** @var bool */
    public $timestamps = false;

    /** @var string */
    protected $table = 'companies';
}

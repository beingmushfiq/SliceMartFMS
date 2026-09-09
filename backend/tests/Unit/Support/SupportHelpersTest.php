<?php

declare(strict_types=1);

namespace Tests\Unit\Support;

use App\Support\DateHelper;
use App\Support\MathHelper;
use Carbon\Carbon;
use PHPUnit\Framework\TestCase;

class SupportHelpersTest extends TestCase
{
    public function test_math_helper_precision_arithmetic(): void
    {
        // 1. Exact formatting
        $this->assertSame('123.4500', MathHelper::format('123.45'));
        $this->assertSame('0.0000', MathHelper::format(0));

        // 2. Addition
        $this->assertSame('15.5500', MathHelper::add('10.25', '5.3'));

        // 3. Subtraction
        $this->assertSame('4.9500', MathHelper::sub('10.25', '5.3'));

        // 4. Multiplication
        $this->assertSame('12.5000', MathHelper::mul('5.0', '2.5'));

        // 5. Division & Division by Zero protection
        $this->assertSame('2.5000', MathHelper::div('5.0', '2.0'));
        $this->assertSame('0.0000', MathHelper::div('5.0', '0.0'));

        // 6. Percentage
        $this->assertSame('15.0000', MathHelper::percentage('100.0', '15.0'));
        $this->assertSame('11.2500', MathHelper::percentage('75.0', '15.0'));

        // 7. Unit conversion
        // 1 Roll = 50.5 Meters -> 3 Rolls = 151.5 Meters
        $this->assertSame('151.5000', MathHelper::convertUnit('3', '50.5'));

        // 8. Equality check
        $this->assertTrue(MathHelper::equals('10.0000', '10'));
        $this->assertFalse(MathHelper::equals('10.0001', '10.0000'));
    }

    public function test_date_helper_fiscal_year_bounds(): void
    {
        // July 15, 2026 -> FY 2026-2027 (starts July 1, 2026, ends June 30, 2027)
        $date = Carbon::create(2026, 7, 15);
        $bounds = DateHelper::getFiscalYearBounds($date, 7);

        $this->assertSame('FY 2026-2027', $bounds['label']);
        $this->assertSame('2026-07-01', $bounds['start']->toDateString());
        $this->assertSame('2027-06-30', $bounds['end']->toDateString());

        // March 10, 2026 -> FY 2025-2026 (starts July 1, 2025, ends June 30, 2026)
        $dateEarly = Carbon::create(2026, 3, 10);
        $boundsEarly = DateHelper::getFiscalYearBounds($dateEarly, 7);

        $this->assertSame('FY 2025-2026', $boundsEarly['label']);
        $this->assertSame('2025-07-01', $boundsEarly['start']->toDateString());
        $this->assertSame('2026-06-30', $boundsEarly['end']->toDateString());
    }

    public function test_date_helper_formatting(): void
    {
        $date = Carbon::create(2026, 9, 10, 12, 0, 0, 'Asia/Dhaka');
        $isoUtc = DateHelper::toIsoUtc($date);

        $this->assertNotNull($isoUtc);
        $this->assertStringContainsString('Z', $isoUtc);

        $this->assertSame('2026-09-10', DateHelper::toDateString($date));
        $this->assertNull(DateHelper::toDateString(null));
    }
}

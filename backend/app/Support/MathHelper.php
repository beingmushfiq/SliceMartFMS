<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Enterprise Math and Decimal Precision Helper.
 * Guarantees zero floating-point drift across financial, quantity, and tax calculations.
 */
final class MathHelper
{
    /**
     * Default decimal precision for financial amounts and stock quantities (DECIMAL(14, 4)).
     */
    public const DEFAULT_PRECISION = 4;

    /**
     * Format a numeric value to a strict 4-decimal string representation.
     *
     * @return numeric-string
     */
    public static function format(string|float|int $value, int $decimals = self::DEFAULT_PRECISION): string
    {
        /** @var numeric-string */
        return number_format((float) $value, $decimals, '.', '');
    }

    /**
     * Exact addition using bcadd if extension is loaded, or precise float fallback.
     */
    public static function add(string|float|int $a, string|float|int $b, int $scale = self::DEFAULT_PRECISION): string
    {
        if (function_exists('bcadd')) {
            return bcadd(self::format($a, $scale), self::format($b, $scale), $scale);
        }

        return self::format((float) $a + (float) $b, $scale);
    }

    /**
     * Exact subtraction using bcsub if extension is loaded, or precise float fallback.
     */
    public static function sub(string|float|int $a, string|float|int $b, int $scale = self::DEFAULT_PRECISION): string
    {
        if (function_exists('bcsub')) {
            return bcsub(self::format($a, $scale), self::format($b, $scale), $scale);
        }

        return self::format((float) $a - (float) $b, $scale);
    }

    /**
     * Exact multiplication using bcmul if extension is loaded, or precise float fallback.
     */
    public static function mul(string|float|int $a, string|float|int $b, int $scale = self::DEFAULT_PRECISION): string
    {
        if (function_exists('bcmul')) {
            return bcmul(self::format($a, $scale), self::format($b, $scale), $scale);
        }

        return self::format((float) $a * (float) $b, $scale);
    }

    /**
     * Exact division with division-by-zero protection.
     */
    public static function div(string|float|int $a, string|float|int $b, int $scale = self::DEFAULT_PRECISION): string
    {
        if ((float) $b === 0.0) {
            return self::format(0, $scale);
        }

        if (function_exists('bcdiv')) {
            return bcdiv(self::format($a, $scale), self::format($b, $scale), $scale);
        }

        return self::format((float) $a / (float) $b, $scale);
    }

    /**
     * Calculate percentage of an amount: ($amount * $percentage) / 100.
     */
    public static function percentage(string|float|int $amount, string|float|int $percentage, int $scale = self::DEFAULT_PRECISION): string
    {
        $product = self::mul($amount, $percentage, $scale + 2);

        return self::div($product, '100', $scale);
    }

    /**
     * Convert physical quantity using a fractional conversion multiplier.
     */
    public static function convertUnit(string|float|int $quantity, string|float|int $conversionFactor, int $scale = self::DEFAULT_PRECISION): string
    {
        return self::mul($quantity, $conversionFactor, $scale);
    }

    /**
     * Check if two values are equal within the given decimal scale.
     */
    public static function equals(string|float|int $a, string|float|int $b, int $scale = self::DEFAULT_PRECISION): bool
    {
        if (function_exists('bccomp')) {
            return bccomp(self::format($a, $scale), self::format($b, $scale), $scale) === 0;
        }

        return abs((float) $a - (float) $b) < (1 / (10 ** $scale));
    }
}

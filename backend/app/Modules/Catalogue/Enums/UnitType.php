<?php

declare(strict_types=1);

namespace App\Modules\Catalogue\Enums;

/**
 * Unit measurement family (API_CONTRACT §15.4.1, DATABASE_DESIGN §4).
 *
 * The `units.type` column stores this vocabulary. It is enforced in PHP by
 * this enum rather than a database CHECK constraint (see the units migration
 * docblock) so the allowed set lives in one place and drives both request
 * validation and any future typed cast.
 */
enum UnitType: string
{
    case Weight = 'weight';
    case Volume = 'volume';
    case Length = 'length';
    case Piece = 'piece';
    case Time = 'time';

    /**
     * The raw string values, for `Rule::in()` and select-box options.
     *
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $case): string => $case->value, self::cases());
    }
}

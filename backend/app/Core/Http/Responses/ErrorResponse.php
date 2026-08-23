<?php

declare(strict_types=1);

namespace App\Core\Http\Responses;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Builds the §2.3 error envelope (API_CONTRACT §2.3).
 *
 * Used by the exception handler in bootstrap/app.php to ensure every
 * error response has a consistent shape regardless of which exception was
 * thrown, and that the correlation id is always present.
 *
 * Shape:
 * {
 *   "success": false,
 *   "error": {
 *     "code":           "SCREAMING_SNAKE_CASE",
 *     "message":        "Human-readable, safe.",
 *     "details":        null | { ... },
 *     "fields":         null | { "path": ["message"] },
 *     "retryable":      bool,
 *     "correlation_id": "uuid"
 *   }
 * }
 */
final class ErrorResponse
{
    /**
     * @param  string  $code  Stable SCREAMING_SNAKE_CASE code from API_CONTRACT §3.
     * @param  string  $message  Human-readable, safe for operators (no stack traces, SQL,
     *                           class names or internal ids — ADR-025).
     * @param  int  $httpStatus  HTTP status code.
     * @param  bool  $retryable  Whether the same request may be retried unchanged.
     * @param  array<string, mixed>|null  $details  Code-specific structured context.
     * @param  array<string, array<int, string>>|null  $fields  Validation field errors
     *                                                          (only for VALIDATION_FAILED).
     */
    public static function make(
        Request $request,
        string $code,
        string $message,
        int $httpStatus,
        bool $retryable = false,
        ?array $details = null,
        ?array $fields = null,
    ): JsonResponse {
        $correlationId = $request->attributes->get('correlation_id', '');

        if (! is_string($correlationId) || $correlationId === '') {
            // The CorrelationId middleware may not have run (e.g. a very early
            // boot failure). Fall back to an empty string — still valid JSON.
            $correlationId = '';
        }

        return new JsonResponse([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
                'fields' => $fields,
                'retryable' => $retryable,
                'correlation_id' => $correlationId,
            ],
        ], $httpStatus);
    }
}

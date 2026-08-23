<?php

declare(strict_types=1);

namespace App\Core\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adopts or generates a correlation id for the request and propagates it
 * through every boundary (API_CONTRACT §7, ARCHITECTURE §7.3).
 *
 * Pipeline:
 *   Client → adopts X-Correlation-Id (or generates UUID v4)
 *          → binds into Log context for the whole request
 *          → echoes in the response header AND in every error.correlation_id
 *
 * Downstream queue jobs inherit the id through the job payload; outbound
 * provider calls forward it as a request header.
 */
final class CorrelationId
{
    public const HEADER = 'X-Correlation-Id';

    /**
     * Adopt the client-supplied id, or generate a server-side UUID v4.
     * Bind it to the log context immediately so all subsequent log entries
     * (in this request, including those from subsequent middleware) carry it.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $id = $request->header(self::HEADER);

        // Generate a server-side id if the client did not supply one, or if
        // the supplied value is not a valid UUID (prevents log injection).
        if (! is_string($id) || ! Str::isUuid($id)) {
            $id = (string) Str::uuid();
        }

        // Store on the request so subsequent middleware and the exception
        // handler can read it without re-parsing the header.
        $request->attributes->set('correlation_id', $id);

        // Bind into the log context for the entire request lifecycle.
        Log::withContext(['correlation_id' => $id]);

        /** @var Response $response */
        $response = $next($request);

        // Echo in the response regardless of success or failure (always
        // present per API_CONTRACT §1.7). The exception handler also adds this
        // header so a thrown exception before we reach $next() still carries it.
        $response->headers->set(self::HEADER, $id);

        return $response;
    }
}

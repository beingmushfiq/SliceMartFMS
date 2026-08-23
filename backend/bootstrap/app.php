<?php

declare(strict_types=1);

use App\Core\Http\Middleware\CorrelationId;
use App\Core\Http\Middleware\EnsureTenantActive;
use App\Core\Http\Middleware\ResolveTenant;
use App\Core\Http\Responses\ErrorResponse;
use App\Core\Tenancy\Exceptions\OutOfScope;
use App\Core\Tenancy\Exceptions\TenantMismatch;
use App\Core\Tenancy\Exceptions\TenantSuspended;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        // Tenant-scope routes: protected by auth:api + tenant resolution + status check.
        // Laravel registers these under /api with prefix /api (api_tenant.php carries
        // the v1 version prefix inside the file).
        api: __DIR__.'/../routes/api_tenant.php',
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        // Platform-scope and public routes are loaded in the `then:` closure so they
        // get their own middleware groups rather than inheriting the api group's chain.
        then: static function (): void {
            Illuminate\Support\Facades\Route::middleware(['api', 'correlation.id'])
                ->prefix('api')
                ->group(base_path('routes/api_platform.php'));

            Illuminate\Support\Facades\Route::middleware(['api', 'correlation.id'])
                ->prefix('api')
                ->group(base_path('routes/api_public.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register the three tenancy middleware with short aliases.
        // The full pipeline order is documented in ARCHITECTURE §5.1:
        //   EnsureHttps → CorrelationId → Authenticate → ResolveTenant
        //   → EnsureTenantActive → Authorize → RateLimit → Idempotency …
        $middleware->alias([
            'correlation.id' => CorrelationId::class,
            'tenant.resolve' => ResolveTenant::class,
            'tenant.active' => EnsureTenantActive::class,
        ]);

        // Prepend CorrelationId to the api group so the id is bound before any
        // other middleware runs — authentication failures need it in the log context.
        $middleware->prependToGroup('api', CorrelationId::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Force JSON on all /api/* requests (kept from the original skeleton).
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request): bool => $request->is('api/*') || $request->expectsJson(),
        );

        // ─────────────────────────────────────────────────────────────────────
        // Single exception → §2.3 envelope mapping (ARCHITECTURE §5.7).
        // Every branch uses ErrorResponse::make() so the shape is guaranteed
        // consistent. The order below is from most-specific to least-specific.
        //
        // Rules (ADR-025):
        //   - Stack traces are NEVER returned in production.
        //   - Every response carries correlation_id.
        //   - 500 responses log the full trace server-side with the id so
        //     support can match a user report to a log entry.
        // ─────────────────────────────────────────────────────────────────────

        // 422 VALIDATION_FAILED — field-level errors go in `fields`, not `details`.
        $exceptions->render(function (ValidationException $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'VALIDATION_FAILED',
                message: 'Please correct the highlighted fields.',
                httpStatus: 422,
                retryable: false,
                details: null,
                fields: $e->errors(),
            );
        });

        // 401 UNAUTHENTICATED
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'UNAUTHENTICATED',
                message: 'Authentication required.',
                httpStatus: 401,
                retryable: false,
            );
        });

        // 403 FORBIDDEN — generic permission denial.
        $exceptions->render(function (AuthorizationException $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'FORBIDDEN',
                message: 'You do not have permission to perform this action.',
                httpStatus: 403,
                retryable: false,
            );
        });

        // 404 NOT_FOUND — Eloquent model not found within the tenant scope.
        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'NOT_FOUND',
                message: 'The requested resource was not found.',
                httpStatus: 404,
                retryable: false,
            );
        });

        // 402 TENANT_INACTIVE — suspended or cancelled tenant.
        $exceptions->render(function (TenantSuspended $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'TENANT_INACTIVE',
                message: 'Your account is currently inactive. Please contact support or settle any outstanding balance.',
                httpStatus: 402,
                retryable: false,
            );
        });

        // 403 OUT_OF_SCOPE — permission held, but resource outside user_scopes.
        $exceptions->render(function (OutOfScope $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'OUT_OF_SCOPE',
                message: "You don't have access to this {$e->scopeType()}.",
                httpStatus: 403,
                retryable: false,
                details: [
                    'scope_type' => $e->scopeType(),
                    'scope_id' => $e->scopeId(),
                ],
            );
        });

        // 403 TENANT_MISMATCH — body tenant_id disagrees with JWT claim.
        // Already logged as a security event by ResolveTenant; we emit a generic
        // 403 to the client to avoid leaking internal tenant ids.
        $exceptions->render(function (TenantMismatch $e, Request $request) {
            return ErrorResponse::make(
                request: $request,
                code: 'TENANT_MISMATCH',
                message: 'The request references a tenant that does not match your session.',
                httpStatus: 403,
                retryable: false,
            );
        });

        // 500 INTERNAL_ERROR — catch-all for any unhandled exception.
        // The full stack trace is logged server-side with the correlation id;
        // the client receives only a safe message and the id for support lookup.
        $exceptions->render(function (Throwable $e, Request $request) {
            Illuminate\Support\Facades\Log::error('Unhandled exception.', [
                'exception' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'correlation_id' => $request->attributes->get('correlation_id'),
            ]);

            return ErrorResponse::make(
                request: $request,
                code: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred. Please try again or contact support with your reference number.',
                httpStatus: 500,
                retryable: true,
            );
        });
    })->create();

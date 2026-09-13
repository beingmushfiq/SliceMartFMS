<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Identity
    |--------------------------------------------------------------------------
    |
    | Centralized platform brand name and canonical root domains.
    | Master domain: where the control plane / platform admin runs.
    | Tenant base domain: wildcard parent domain for tenant instances.
    |
    */
    'name' => env('PLATFORM_NAME', 'DevCenterPoint'),
    'master_domain' => env('MASTER_DOMAIN', 'proerp.devcenterpoint.com'),
    'tenant_base_domain' => env('TENANT_BASE_DOMAIN', 'devcenterpoint.com'),

    /*
    |--------------------------------------------------------------------------
    | Custom JWT Authentication Configuration
    |--------------------------------------------------------------------------
    */
    'jwt_secret' => env('JWT_SECRET'),
    'jwt_ttl' => (int) env('JWT_TTL', 900), // 15 minutes
    'refresh_token_ttl' => (int) env('REFRESH_TOKEN_TTL', 1209600), // 14 days

    /*
    |--------------------------------------------------------------------------
    | Reserved Subdomains
    |--------------------------------------------------------------------------
    |
    | Subdomains that cannot be claimed or used as tenant slugs.
    |
    */
    'reserved_subdomains' => [
        'admin',
        'api',
        'app',
        'auth',
        'billing',
        'cdn',
        'control',
        'cpanel',
        'dashboard',
        'dev',
        'docs',
        'ftp',
        'mail',
        'master',
        'ns1',
        'ns2',
        'platform',
        'proerp',
        'root',
        'sentry',
        'smtp',
        'staging',
        'static',
        'status',
        'support',
        'system',
        'test',
        'webmail',
        'whm',
        'www',
    ],

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS)
    |--------------------------------------------------------------------------
    */
    'allowed_cors_origins' => array_filter(
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', 'https://proerp.devcenterpoint.com')))
    ),
];

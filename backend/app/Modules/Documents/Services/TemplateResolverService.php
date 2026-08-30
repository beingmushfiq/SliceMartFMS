<?php

declare(strict_types=1);

namespace App\Modules\Documents\Services;

use App\Core\Tenancy\TenantContext;
use App\Modules\Documents\Models\DocumentTemplate;

final class TemplateResolverService
{
    /**
     * Resolve the appropriate DocumentTemplate based on hierarchy.
     */
    public function resolve(
        string $documentType,
        ?int $templateId = null,
        ?int $branchId = null,
        ?int $companyId = null
    ): ?DocumentTemplate {
        $tenantId = TenantContext::current()->tenantId();

        // 1. Explicit template requested
        if ($templateId !== null) {
            $template = DocumentTemplate::with(['activeVersion', 'paperSize', 'printProfile'])
                ->where('tenant_id', $tenantId)
                ->where('id', $templateId)
                ->where('status', '!=', 'archived')
                ->first();

            if ($template) {
                return $template;
            }
        }

        // 2. Branch-specific override
        if ($branchId !== null) {
            $branchTemplate = DocumentTemplate::with(['activeVersion', 'paperSize', 'printProfile'])
                ->where('tenant_id', $tenantId)
                ->where('document_type', $documentType)
                ->where('branch_id', $branchId)
                ->where('status', 'active')
                ->first();

            if ($branchTemplate) {
                return $branchTemplate;
            }
        }

        // 3. Company-specific override
        if ($companyId !== null) {
            $companyTemplate = DocumentTemplate::with(['activeVersion', 'paperSize', 'printProfile'])
                ->where('tenant_id', $tenantId)
                ->where('document_type', $documentType)
                ->where('company_id', $companyId)
                ->where('status', 'active')
                ->first();

            if ($companyTemplate) {
                return $companyTemplate;
            }
        }

        // 4. Tenant default template
        $defaultTemplate = DocumentTemplate::with(['activeVersion', 'paperSize', 'printProfile'])
            ->where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->where('is_default', true)
            ->where('status', 'active')
            ->first();

        if ($defaultTemplate) {
            return $defaultTemplate;
        }

        // 5. Any active template for this document type
        return DocumentTemplate::with(['activeVersion', 'paperSize', 'printProfile'])
            ->where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->where('status', 'active')
            ->first();
    }
}

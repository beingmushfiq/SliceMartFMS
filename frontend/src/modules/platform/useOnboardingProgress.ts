import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api/client';
import { useTenantCapabilityStore } from '../../lib/capabilities/tenantCapabilityStore';
import { useAuthStore } from '../../lib/auth/authStore';

const STORAGE_SKIP_KEY = 'erp_onboarding_skipped';

export interface CompletionMilestones {
  percentage: number;
  is_completed: boolean;
  completed_milestones: string[];
  pending_milestones: string[];
}

export interface OnboardingStateResponse {
  tenant_id: number;
  name: string;
  slug: string;
  currency_code: string;
  timezone: string;
  business_type_keys: string[];
  industry_profile_key: string;
  manufacturing_type: string;
  onboarding_step: number;
  onboarding_completed: boolean;
  onboarding_draft: Record<string, unknown>;
  completion_score?: CompletionMilestones;

  company_legal_name?: string;
  tax_number?: string;
  trade_license?: string;
  address?: string;
  phone?: string;
  email?: string;
  warehouse_name?: string;
  warehouse_address?: string;
  pos_counter_name?: string;
  brand_color?: string;
  logo_url?: string;
  invoice_terms?: string;
  units?: string[];
}

export function useOnboardingProgress() {
  const navigate = useNavigate();
  const manifest = useTenantCapabilityStore((s) => s.manifest);
  const authStatus = useAuthStore((s) => s.status);
  const isAuthenticated = authStatus === 'authenticated';
  const tenant = useAuthStore((s) => s.tenant);

  const [isSkipped, setIsSkipped] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_SKIP_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const stateQuery = useQuery({
    queryKey: ['tenant', 'onboarding', 'state'],
    queryFn: async ({ signal }) => {
      const res = await api.get<{ success: boolean; data: OnboardingStateResponse }>(
        '/tenant/onboarding/state',
        { signal }
      );
      return res.data?.data;
    },
    enabled: isAuthenticated && Boolean(tenant),
    staleTime: 30_000,
  });

  const backendCompleted = stateQuery.data?.onboarding_completed ?? false;
  const manifestCompleted = manifest?.onboarding_completed ?? false;
  const isCompleted = backendCompleted || manifestCompleted;

  const completionPercentage = isCompleted
    ? 100
    : stateQuery.data?.completion_score?.percentage ??
      manifest?.onboarding_percentage ??
      0;

  const milestones: CompletionMilestones = stateQuery.data?.completion_score ?? {
    percentage: completionPercentage,
    is_completed: isCompleted,
    completed_milestones: [] as string[],
    pending_milestones: ['legal_identity', 'operational_facilities', 'standards_branding'] as string[],
  };

  const skipOnboarding = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_SKIP_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
    setIsSkipped(true);
  }, []);

  const resetSkip = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_SKIP_KEY);
    } catch {
      // Ignore storage errors
    }
    setIsSkipped(false);
  }, []);

  const resumeOnboarding = useCallback(() => {
    navigate('/onboarding');
  }, [navigate]);

  return {
    state: stateQuery.data,
    isLoading: stateQuery.isLoading,
    isCompleted,
    completionPercentage,
    milestones,
    isSkipped,
    shouldShowStartupModal: !isCompleted && !isSkipped,
    shouldShowProgressCard: !isCompleted,
    skipOnboarding,
    resetSkip,
    resumeOnboarding,
    refetchState: stateQuery.refetch,
  };
}

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useWorkspaceTab } from './useWorkspaceTab';

describe('useWorkspaceTab hook', () => {
  it('returns default tab when search param is absent', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/workspace']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useWorkspaceTab('overview', ['overview', 'settings']), { wrapper });
    expect(result.current[0]).toBe('overview');
  });

  it('reads tab from query parameters when valid', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/workspace?tab=settings']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useWorkspaceTab('overview', ['overview', 'settings']), { wrapper });
    expect(result.current[0]).toBe('settings');
  });

  it('falls back to default tab when query param is invalid', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/workspace?tab=nonexistent']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useWorkspaceTab('overview', ['overview', 'settings']), { wrapper });
    expect(result.current[0]).toBe('overview');
  });

  it('updates tab in search params when setActiveTab is called', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/workspace']}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(() => useWorkspaceTab('overview', ['overview', 'settings']), { wrapper });

    act(() => {
      result.current[1]('settings');
    });

    expect(result.current[0]).toBe('settings');
  });
});

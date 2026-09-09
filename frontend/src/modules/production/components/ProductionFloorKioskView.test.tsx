import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductionFloorKioskView } from './ProductionFloorKioskView';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('ProductionFloorKioskView', () => {
  it('renders the Factory Floor Kiosk header and live metrics', () => {
    const handleExit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ProductionFloorKioskView onExit={handleExit} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Factory Floor Operational Kiosk/i)).toBeInTheDocument();
    expect(screen.getByText('Active Batches')).toBeInTheDocument();
    expect(screen.getByText('Total Target Units')).toBeInTheDocument();
    expect(screen.getByText('Completed Units')).toBeInTheDocument();
    expect(screen.getByText('Average Floor Yield')).toBeInTheDocument();
  });

  it('triggers onExit when Exit button is clicked', () => {
    const handleExit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ProductionFloorKioskView onExit={handleExit} />
      </QueryClientProvider>
    );

    const exitBtn = screen.getByRole('button', { name: /Exit \(Esc\)/i });
    fireEvent.click(exitBtn);

    expect(handleExit).toHaveBeenCalledTimes(1);
  });

  it('triggers onExit when Escape key is pressed', () => {
    const handleExit = vi.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <ProductionFloorKioskView onExit={handleExit} />
      </QueryClientProvider>
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleExit).toHaveBeenCalledTimes(1);
  });
});

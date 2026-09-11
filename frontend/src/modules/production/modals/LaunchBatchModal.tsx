import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Factory, Sparkles, AlertCircle, Calendar, Hash } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SelectDropdown } from '../../../components/ui/Dropdown';
import { api } from '../../../lib/api/client';
import type { Product } from '../../../types/api/catalog';
import type { BillOfMaterial } from '../../../types/api/bom';
import type { ProductionBatch } from '../../../types/api/production';
import { isApiError } from '../../../lib/api/errors';

interface LaunchBatchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (batch: ProductionBatch) => void;
  initialProductId?: string;
  initialBomId?: string;
}

function generateDefaultBatchCode(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BATCH-${today}-${rand}`;
}

export function LaunchBatchModal({
  open,
  onClose,
  onSuccess,
  initialProductId,
  initialBomId,
}: LaunchBatchModalProps) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState(initialProductId ?? '');
  const [bomId, setBomId] = useState(initialBomId ?? '');
  const [targetQuantity, setTargetQuantity] = useState('100');
  const [batchNumber, setBatchNumber] = useState(generateDefaultBatchCode);
  const [scheduledStart, setScheduledStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['catalogue', 'products', 'options'],
    queryFn: ({ signal }) => api.get<Product[]>('/products', { signal }),
    enabled: open,
  });

  const { data: bomsData, isLoading: isLoadingBoms } = useQuery({
    queryKey: ['catalogue', 'boms', 'options'],
    queryFn: ({ signal }) => api.get<BillOfMaterial[]>('/bill-of-materials', { signal }),
    enabled: open,
  });

  const products = productsData?.data ?? [];
  const boms = bomsData?.data ?? [];

  // When product changes, auto-select corresponding BOM if available
  const handleProductChange = (newProductId: string) => {
    setProductId(newProductId);
    const matchingBom = boms.find((b) => String(b.product_id) === String(newProductId));
    if (matchingBom) {
      setBomId(String(matchingBom.id));
    }
  };

  const selectedProduct = products.find((p) => String(p.id) === String(productId));
  const selectedBom = boms.find((b) => String(b.id) === String(bomId));

  const launchMutation = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error('Please select which item you want to manufacture.');
      if (!targetQuantity || parseFloat(targetQuantity) <= 0) {
        throw new Error('Please enter a target quantity greater than 0.');
      }

      const payload = {
        batch_number: batchNumber || `BATCH-${Date.now()}`,
        product_id: productId,
        bill_of_material_id: bomId || undefined,
        bom_id: bomId || undefined,
        planned_quantity: targetQuantity,
        target_quantity: targetQuantity,
        batch_date: scheduledStart,
        scheduled_start: scheduledStart,
        output_unit_id: selectedBom?.output_unit_id || selectedProduct?.base_unit_id,
      };

      return api.post<ProductionBatch>('/production/batches', payload);
    },
    onSuccess: async (response) => {
      toast.success(`Production Batch ${batchNumber} started successfully!`, {
        description: 'Factory floor line is ready for material requisition and execution.',
      });
      await queryClient.invalidateQueries({ queryKey: ['production', 'batches'] });
      if (response.data && onSuccess) {
        onSuccess(response.data);
      }
      onClose();
    },
    onError: (err: unknown) => {
      if (isApiError(err)) {
        setErrorMsg(err.message || 'Failed to start batch.');
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred while launching batch.');
      }
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Start New Production Run"
      subtitle="Tell the factory floor what product to manufacture, how many units to produce, and when to start."
      size="lg"
    >
      <div className="space-y-5">
        {/* Friendly guidance card */}
        <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
          <Factory className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-default">
              One-click Shopfloor Manufacturing Launch
            </p>
            <p className="text-muted leading-relaxed">
              Starting a batch assigns a unique tracking number, calculates required raw ingredients from your recipe formula, and sends this order directly to the factory floor.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-danger-subtle border border-danger/20 flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Product Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default flex items-center gap-1">
              Item to Produce <span className="text-danger">*</span>
            </label>
            <SelectDropdown
              value={productId}
              onChange={handleProductChange}
              options={products.map((p) => ({
                value: String(p.id),
                label: `${p.name} (${p.sku})`,
              }))}
              placeholder={isLoadingProducts ? 'Loading items...' : 'Choose finished product...'}
            />
          </div>

          {/* Recipe / BOM Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default flex items-center gap-1">
              Production Recipe (Formula)
            </label>
            <SelectDropdown
              value={bomId}
              onChange={setBomId}
              options={[
                { value: '', label: 'Standard Formula (Auto-detect)' },
                ...boms.map((b) => ({
                  value: String(b.id),
                  label: `${b.name || 'Recipe'} (v${b.version || '1.0'})`,
                })),
              ]}
              placeholder={isLoadingBoms ? 'Loading recipes...' : 'Select recipe formula...'}
            />
          </div>

          {/* Target Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default flex items-center gap-1">
              Target Quantity to Produce <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={targetQuantity}
                onChange={(e) => setTargetQuantity(e.target.value)}
                placeholder="e.g. 250"
                className="w-full h-10 px-3 rounded-xl border border-default bg-surface text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted font-medium">
                {(selectedProduct as unknown as { unit?: { code?: string } })?.unit?.code || 'units'}
              </span>
            </div>
          </div>

          {/* Batch Tracking Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-default flex items-center justify-between">
              <span>Batch Tracking Code</span>
              <span className="text-[10px] text-muted font-normal">Auto-assigned</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-default bg-surface text-sm font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-default flex items-center gap-1">
              Scheduled Production Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                type="date"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-default bg-surface text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-default">
          <Button variant="secondary" onClick={onClose} disabled={launchMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => launchMutation.mutate()}
            disabled={launchMutation.isPending || !productId || !targetQuantity}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Sparkles className="size-4" />
            <span>{launchMutation.isPending ? 'Launching Run...' : 'Launch Factory Production'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}

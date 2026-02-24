import { useEffect, useState } from 'react';
import { useMasterPlanStore } from '../store/useMasterPlanStore';
import { CalculatedAreas, FeasibilityOutputs } from '../types/masterplan';
import { formatIDR, formatNumber } from '../lib/utils';
import { Info } from 'lucide-react';

// Helper component for formatted inputs
function FormattedInput({ 
  value, 
  onChange, 
  label, 
  suffix
}: { 
  value: number; 
  onChange: (val: number) => void; 
  label: string;
  suffix?: string;
}) {
  const [rawInput, setRawInput] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setRawInput(value > 0 ? value.toLocaleString('id-ID') : '');
    }
  }, [value, focused]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-neutral-500 text-sm">Rp</span>
        <input
          type="text"
          value={rawInput}
          onFocus={() => {
            setFocused(true);
            setRawInput(value > 0 ? String(Math.round(value)) : '');
          }}
          onBlur={() => {
            setFocused(false);
            setRawInput(value > 0 ? value.toLocaleString('id-ID') : '');
          }}
          onChange={(e) => {
            const rawValue = e.target.value.replace(/[^\d]/g, '');
            setRawInput(e.target.value);
            const numValue = parseFloat(rawValue);
            if (!isNaN(numValue)) {
              onChange(numValue);
            } else if (e.target.value === '') {
              onChange(0);
            }
          }}
          className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-right tabular-nums text-neutral-900 focus:border-blue-500 focus:ring-blue-500 font-sans"
          placeholder="0"
        />
        {suffix && <span className="absolute right-3 top-2 text-neutral-400 text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

export function FeasibilityTab({ areas, feasibility }: { areas: CalculatedAreas, feasibility: FeasibilityOutputs }) {
  const { scenario, updateScenario } = useMasterPlanStore();
  const inputs = scenario.feasibility;

  const handleUpdate = (key: keyof typeof inputs, value: number | string) => {
    updateScenario({ feasibility: { ...inputs, [key]: value } });
  };

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-start gap-3">
        <Info className="text-blue-500 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-medium text-blue-800">FS-lite Disclaimer</h3>
          <p className="text-xs text-blue-700 mt-1">FS = feasibility snapshot.</p>
          <p className="text-sm text-blue-700 mt-1">Early-stage assumptions; not a bankable proforma. 2D model does not optimize vertical yield.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-neutral-900">Cost & Revenue Inputs</h2>
          
          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Land & Infrastructure</h3>
            
            <FormattedInput
              label="Land Acquisition Cost (IDR/sqm)"
              value={inputs.landAcquisitionCost}
              onChange={(val) => handleUpdate('landAcquisitionCost', val)}
            />

            <FormattedInput
              label="Roads/Infra Cost Rate (IDR/sqm of roads)"
              value={inputs.roadsCostRate}
              onChange={(val) => handleUpdate('roadsCostRate', val)}
            />
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Product Model</h3>
              <select
                value={inputs.buildModel}
                onChange={(e) => handleUpdate('buildModel', e.target.value)}
                className="text-sm rounded-md border border-neutral-300 px-2 py-1 bg-neutral-50 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="land-sale">Land Sale Only</option>
                <option value="build-and-sell">Build & Sell</option>
              </select>
            </div>

            {inputs.buildModel === 'build-and-sell' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormattedInput
                    label="Res. Build Cost (IDR/sqm)"
                    value={inputs.residentialBuildCost}
                    onChange={(val) => handleUpdate('residentialBuildCost', val)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Res. Coverage (%)</label>
                    <input
                      type="number"
                      value={inputs.residentialCoverage}
                      onChange={(e) => handleUpdate('residentialCoverage', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormattedInput
                    label="Com. Build Cost (IDR/sqm)"
                    value={inputs.commercialBuildCost}
                    onChange={(val) => handleUpdate('commercialBuildCost', val)}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-neutral-700">Com. Coverage (%)</label>
                    <input
                      type="number"
                      value={inputs.commercialCoverage}
                      onChange={(e) => handleUpdate('commercialCoverage', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="pt-2">
              <FormattedInput
                label={`Residential Sale Price (IDR/sqm ${inputs.buildModel === 'land-sale' ? 'land' : 'built'})`}
                value={inputs.residentialSalePrice}
                onChange={(val) => handleUpdate('residentialSalePrice', val)}
              />
            </div>

            <FormattedInput
              label={`Commercial Sale Price (IDR/sqm ${inputs.buildModel === 'land-sale' ? 'land' : 'built'})`}
              value={inputs.commercialSalePrice}
              onChange={(val) => handleUpdate('commercialSalePrice', val)}
            />

            <FormattedInput
              label="Custom Sellable Sale Price (IDR/sqm land)"
              value={inputs.customSellableSalePrice}
              onChange={(val) => handleUpdate('customSellableSalePrice', val)}
            />
          </div>
        </div>

        {/* Outputs */}
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-neutral-900">Quick FS Summary</h2>
          
          <div className="bg-neutral-100 rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            <table className="w-full text-left text-sm text-neutral-900">
              <thead className="bg-neutral-200 text-neutral-700 font-bold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-bold">Metric</th>
                  <th className="px-6 py-4 font-bold text-right">Value (IDR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-6 py-4 font-medium">Land Acquisition</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-neutral-900">{formatIDR(feasibility.landAcquisitionCost)}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Infrastructure (Roads)</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-neutral-900">{formatIDR(feasibility.infrastructureCost)}</td>
                </tr>
                {inputs.buildModel === 'build-and-sell' && (
                  <tr>
                    <td className="px-6 py-4 font-medium">Build Cost</td>
                    <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-neutral-900">{formatIDR(feasibility.buildCost)}</td>
                  </tr>
                )}
                <tr className="bg-neutral-200/60">
                  <td className="px-6 py-4 font-bold text-neutral-800">Total Cost</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-orange-600">{formatIDR(feasibility.totalCost)}</td>
                </tr>
                <tr className="bg-neutral-200/60">
                  <td className="px-6 py-4 font-bold text-neutral-800">Total Revenue</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-blue-600">{formatIDR(feasibility.totalRevenue)}</td>
                </tr>
                <tr className={feasibility.profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}>
                  <td className="px-6 py-4 font-bold text-neutral-900 text-base">Estimated Profit</td>
                  <td className={feasibility.profit >= 0 ? 'px-6 py-4 text-right font-sans tabular-nums font-bold text-xl text-emerald-700' : 'px-6 py-4 text-right font-sans tabular-nums font-bold text-xl text-red-700'}>
                    {formatIDR(feasibility.profit)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Profit Margin</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-blue-600">{formatNumber(feasibility.profitMargin)}%</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Profit per Ha</td>
                  <td className="px-6 py-4 text-right font-sans tabular-nums font-bold text-neutral-700">{formatIDR(feasibility.profitPerHa)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

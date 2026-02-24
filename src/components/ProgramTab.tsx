import { useMemo, useState } from 'react';
import { useMasterPlanStore } from '../store/useMasterPlanStore';
import { LAND_USE_LIBRARY } from '../data/landuse_library';
import { SCALE_PRESETS } from '../data/presets';
import { CalculatedAreas } from '../types/masterplan';
import { formatNumber, cn } from '../lib/utils';
import { Lock, Unlock, AlertTriangle, Trash2, Info } from 'lucide-react';

export function ProgramTab({ areas }: { areas: CalculatedAreas }) {
  const { scenario, updateAllocation, addCustomLandUse, removeCustomLandUse, toggleAllocationLock, rebalanceToPreset } = useMasterPlanStore();
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'sellable' | 'non-sellable'>('sellable');
  const [customPercentageValue, setCustomPercentageValue] = useState('');
  const [customHaValue, setCustomHaValue] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const catalog = useMemo(() => [...LAND_USE_LIBRARY, ...scenario.customLandUses], [scenario.customLandUses]);

  const totalPercentage = scenario.allocations.reduce((sum, a) => {
    const cat = catalog.find((c) => c.id === a.categoryId);
    if ((cat?.allocationBasis ?? 'NDA') !== 'NDA') return sum;
    return sum + a.percentage;
  }, 0);
  
  // Calculate total commercial percentage for warning
  const commercialPercentage = scenario.allocations
    .filter(a => catalog.find(c => c.id === a.categoryId)?.group === 'Commercial')
    .reduce((sum, a) => sum + a.percentage, 0);

  const activeAllocations = scenario.allocations.filter(a => a.percentage > 0);

  // Calculate breakdown for summary table
  const preset = SCALE_PRESETS[scenario.presetId] ?? SCALE_PRESETS.S3;
  const roadsHa = areas.roadsHa;
  const greenHa = areas.openSpaceHa;
  const utilitiesHa = areas.utilitiesHa;
  
  const nonSellableAllocations = activeAllocations.filter(a => {
    const cat = catalog.find(c => c.id === a.categoryId);
    return !cat?.sellable;
  });

  const sellableAllocations = activeAllocations.filter(a => {
    const cat = catalog.find(c => c.id === a.categoryId);
    return cat?.sellable;
  });

  const nonSellableNdaAllocations = nonSellableAllocations.filter((a) => {
    const cat = catalog.find((c) => c.id === a.categoryId);
    return (cat?.allocationBasis ?? 'NDA') === 'NDA';
  });
  const nonSellableGsaAllocations = nonSellableAllocations.filter((a) => {
    const cat = catalog.find((c) => c.id === a.categoryId);
    return (cat?.allocationBasis ?? 'NDA') === 'GSA';
  });

  const publicFacilityHa = nonSellableNdaAllocations.reduce((sum, a) => sum + areas.allocationsHa[a.categoryId], 0);
  const sellableHa = sellableAllocations.reduce((sum, a) => sum + areas.allocationsHa[a.categoryId], 0);

  const totalNonSellableHa = areas.nca + areas.nsr + publicFacilityHa;
  const totalNonSellablePct = areas.gsa > 0 ? (totalNonSellableHa / areas.gsa) * 100 : 0;
  
  const totalSellableHa = sellableHa;
  const totalSellablePct = areas.gsa > 0 ? (totalSellableHa / areas.gsa) * 100 : 0;

  const getSliderColorClass = (group: string) => {
    switch (group) {
      case 'Residential': return 'accent-yellow-500';
      case 'Commercial': return 'accent-red-500';
      case 'Civic': return 'accent-blue-500';
      case 'Employment': return 'accent-purple-500';
      default: return 'accent-gray-500';
    }
  };

  const getGroupColorDot = (group: string) => {
    switch (group) {
      case 'Residential': return 'bg-yellow-400';
      case 'Commercial': return 'bg-red-400';
      case 'Civic': return 'bg-blue-400';
      case 'Employment': return 'bg-purple-400';
      default: return 'bg-gray-400';
    }
  };

  const handleHaInputChange = (categoryId: string, value: string) => {
    const cat = catalog.find((c) => c.id === categoryId);
    const basis = cat?.allocationBasis ?? 'NDA';
    const baseArea = basis === 'GSA' ? areas.gsa : areas.nda;
    if (baseArea <= 0) return;
    const ha = Math.max(0, parseFloat(value) || 0);
    const percentage = Math.min(100, (ha / baseArea) * 100);
    updateAllocation(categoryId, percentage);
  };

  const customBasisLabel = customType === 'sellable'
    ? 'Net Developable Area (NDA)'
    : 'Gross Site Area (GSA)';
  const customBasisArea = customType === 'sellable' ? areas.nda : areas.gsa;
  const customPercentageNumeric = Math.max(0, parseFloat(customPercentageValue) || 0);
  const customHaNumeric = Math.max(0, parseFloat(customHaValue) || 0);

  const onCustomPercentageChange = (value: string) => {
    setCustomPercentageValue(value);
    const pct = Math.max(0, parseFloat(value) || 0);
    const ha = (pct / 100) * customBasisArea;
    setCustomHaValue(Number.isFinite(ha) ? ha.toFixed(2) : '');
    setCustomError(null);
  };

  const onCustomHaChange = (value: string) => {
    setCustomHaValue(value);
    const ha = Math.max(0, parseFloat(value) || 0);
    const pct = customBasisArea > 0 ? (ha / customBasisArea) * 100 : 0;
    setCustomPercentageValue(Number.isFinite(pct) ? pct.toFixed(2) : '');
    setCustomError(null);
  };

  const handleAddCustom = () => {
    const percentage = customPercentageNumeric;

    if (!customName.trim()) {
      setCustomError('Name is required.');
      return;
    }
    if (percentage < 0 || percentage > 100) {
      setCustomError('Total allocation cannot exceed 100%.');
      return;
    }

    const result = addCustomLandUse({
      name: customName,
      type: customType,
      group: 'Other',
      category: customType === 'sellable' ? 'Other (Sellable)' : 'Other (Non-sellable)',
      percentage,
    });
    if (!result.ok) {
      setCustomError(result.error || 'Failed to add custom land use.');
      return;
    }
    setCustomName('');
    setCustomPercentageValue('');
    setCustomHaValue('');
    setCustomError(null);
  };
  const customPreviewText = `= ${formatNumber(customHaNumeric, 2)} ha (${formatNumber(customPercentageNumeric, 1)}%)`;

  const groupBands: Record<string, { min: number; max: number }> = {
    Residential: { min: 50, max: 70 },
    Commercial: { min: 10, max: 20 },
    Civic: { min: 2, max: 8 },
    Special: { min: 0, max: 8 },
    Employment: { min: 0, max: 15 },
    Industrial: { min: 0, max: 20 },
  };

  const groupTotals = scenario.allocations.reduce<Record<string, number>>((acc, alloc) => {
    const cat = catalog.find((c) => c.id === alloc.categoryId);
    if ((cat?.allocationBasis ?? 'NDA') !== 'NDA') return acc;
    const group = cat?.group;
    if (!group) return acc;
    acc[group] = (acc[group] || 0) + alloc.percentage;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Controls Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Allocation Controls</h2>
            <p className="text-sm text-neutral-600">Adjust percentages to distribute the Net Developable Area ({formatNumber(areas.nda)} ha)</p>
          </div>
          <div className="text-right">
            <button
              onClick={rebalanceToPreset}
              title="Fix to bands (keeps locked items)"
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-sm font-medium rounded-lg transition-colors"
            >
              Rebalance to Preset
            </button>
            <p className="text-[11px] text-neutral-500 mt-1">Fix to bands (keeps locked items)</p>
          </div>
        </div>

        {commercialPercentage > 25 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Absorption / Frontage Capacity Risk</h3>
              <p className="text-sm text-orange-700 mt-1">Commercial allocation is {formatNumber(commercialPercentage)}% (exceeds 25% threshold).</p>
            </div>
          </div>
        )}
        {areas.nsrPercentage < preset.nsrMin && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Infrastructure / Public Realm Risk</h3>
              <p className="text-sm text-orange-700 mt-1">Non-Sellable Reserve (NSR) is {formatNumber(areas.nsrPercentage)}%, below preset minimum {preset.nsrMin}%.</p>
            </div>
          </div>
        )}
        {areas.ncaPercentage > 35 && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertTriangle className="text-orange-500 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-medium text-orange-800">Constraint-Heavy Site Warning</h3>
              <p className="text-sm text-orange-700 mt-1">Constraint Allowance (NCA) is {formatNumber(areas.ncaPercentage)}%. Consider a different product strategy.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-sm max-h-[520px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-sans uppercase tracking-wider text-xs sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 font-medium w-[44%]">Land Use</th>
                <th className="px-4 py-2 font-medium w-[14%]">Group</th>
                <th className="px-4 py-2 font-medium w-[36%]">Allocation (% of Net Developable Area (NDA) / ha)</th>
                <th className="px-4 py-2 font-medium text-center w-[64px]">Lock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {scenario.allocations.map((alloc) => {
                const cat = catalog.find(c => c.id === alloc.categoryId);
                if (!cat) return null;

                const isOutsideBand = alloc.percentage < cat.defaultBand.min || alloc.percentage > cat.defaultBand.max;
                const basis = cat.allocationBasis ?? 'NDA';
                const groupBand = groupBands[cat.group];
                const groupTotal = groupTotals[cat.group] || 0;
                const isGroupOutOfBand = groupBand ? (groupTotal < groupBand.min || groupTotal > groupBand.max) : false;
                const showNonstandard = (alloc.percentage > 0 && isOutsideBand) || (alloc.percentage > 0 && isGroupOutOfBand);

                return (
                  <tr key={alloc.categoryId} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", getGroupColorDot(cat.group))}></div>
                        <span className="font-medium text-neutral-900">{cat.label}</span>
                        {cat.isCustom && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                            Custom
                          </span>
                        )}
                        {showNonstandard && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800">
                            Nonstandard
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">{cat.customType === 'non-sellable' ? 'Non-sellable' : cat.group}</td>
                    <td className="px-4 py-2.5">
                      <div className="space-y-1.5 min-w-[220px]">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          value={alloc.percentage}
                          onChange={(e) => updateAllocation(alloc.categoryId, parseFloat(e.target.value))}
                          disabled={alloc.locked}
                          className={cn(
                            "w-full h-1.5 rounded-lg appearance-none cursor-pointer",
                            alloc.locked ? "bg-neutral-200" : getSliderColorClass(cat.group)
                          )}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-sans tabular-nums w-20 text-right text-neutral-700">{formatNumber(alloc.percentage)}%</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={areas.allocationsHa[alloc.categoryId]?.toFixed(1) ?? '0.0'}
                              onChange={(e) => handleHaInputChange(alloc.categoryId, e.target.value)}
                              disabled={alloc.locked || (basis === 'NDA' ? areas.nda <= 0 : areas.gsa <= 0)}
                              className="w-[88px] rounded-md border border-neutral-300 px-2 pr-7 py-1 text-right tabular-nums text-xs text-neutral-700 focus:border-blue-500 focus:ring-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400"
                            />
                            <span className="absolute right-2 top-1 text-[10px] text-neutral-500">ha</span>
                          </div>
                        </div>
                        {cat.isCustom && (
                          <p className="text-[10px] text-neutral-500 text-right">
                            % of {basis === 'NDA' ? 'Net Developable Area (NDA)' : 'Gross Site Area (GSA)'}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleAllocationLock(alloc.categoryId)}
                          className="p-1.5 rounded-md hover:bg-neutral-200 text-neutral-500 transition-colors"
                        >
                          {alloc.locked ? <Lock size={16} className="text-neutral-800" /> : <Unlock size={16} />}
                        </button>
                        {cat.isCustom && (
                          <button
                            onClick={() => removeCustomLandUse(alloc.categoryId)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                            title="Delete custom land use"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tbody className="border-t border-neutral-200 bg-neutral-50/80">
              <tr>
                <td colSpan={4} className="px-4 py-3">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-neutral-800">Custom Land Use</h3>
                    <div className="hidden lg:flex items-end gap-3">
                      <div className="w-[420px] max-w-[460px]">
                        <label className="text-xs text-neutral-600 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={customName}
                          onChange={(e) => {
                            setCustomName(e.target.value);
                            setCustomError(null);
                          }}
                          placeholder="e.g., Transit-oriented retail"
                          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                      <div className="min-w-[200px] w-[200px]">
                        <label className="text-xs text-neutral-600 mb-1 block">Type</label>
                        <select
                          value={customType}
                          onChange={(e) => {
                            const nextType = e.target.value as 'sellable' | 'non-sellable';
                            setCustomType(nextType);
                            const pct = Math.max(0, parseFloat(customPercentageValue || '0') || 0);
                            const nextBase = nextType === 'sellable' ? areas.nda : areas.gsa;
                            const nextHa = (pct / 100) * nextBase;
                            setCustomHaValue(Number.isFinite(nextHa) ? nextHa.toFixed(2) : '');
                            setCustomError(null);
                          }}
                          className="w-full h-9 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 whitespace-nowrap focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="sellable">Sellable</option>
                          <option value="non-sellable">Non-sellable</option>
                        </select>
                      </div>
                      <div className="w-[92px]">
                        <label className="text-xs text-neutral-600 mb-1 flex items-center gap-1">
                          %
                          <span title="Sellable % is of NDA. Non-sellable % is of GSA." className="inline-flex text-neutral-500">
                            <Info size={11} />
                          </span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={customPercentageValue}
                            onChange={(e) => onCustomPercentageChange(e.target.value)}
                            className="w-[92px] h-9 rounded-md border border-neutral-300 pl-2 pr-5 py-2 text-right tabular-nums text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="0.0"
                          />
                          <span className="absolute right-2 top-2 text-xs text-neutral-500">%</span>
                        </div>
                      </div>
                      <div className="w-[92px]">
                        <label className="text-xs text-neutral-600 mb-1 block">ha</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={customHaValue}
                            onChange={(e) => onCustomHaChange(e.target.value)}
                            className="w-[92px] h-9 rounded-md border border-neutral-300 pl-2 pr-7 py-2 text-right tabular-nums text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                          <span className="absolute right-2 top-2 text-xs text-neutral-500">ha</span>
                        </div>
                      </div>
                      <div className="w-[84px]">
                        <button
                          onClick={handleAddCustom}
                          className="w-[84px] h-9 px-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <div className="lg:hidden space-y-3">
                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div className="col-span-1">
                          <label className="text-xs text-neutral-600 mb-1 block">Name</label>
                          <input
                            type="text"
                            value={customName}
                            onChange={(e) => {
                              setCustomName(e.target.value);
                              setCustomError(null);
                            }}
                            placeholder="e.g., Transit-oriented retail"
                            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="text-xs text-neutral-600 mb-1 block">Type</label>
                          <select
                            value={customType}
                            onChange={(e) => {
                              const nextType = e.target.value as 'sellable' | 'non-sellable';
                              setCustomType(nextType);
                              const pct = Math.max(0, parseFloat(customPercentageValue || '0') || 0);
                              const nextBase = nextType === 'sellable' ? areas.nda : areas.gsa;
                              const nextHa = (pct / 100) * nextBase;
                              setCustomHaValue(Number.isFinite(nextHa) ? nextHa.toFixed(2) : '');
                              setCustomError(null);
                            }}
                            className="w-full h-9 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="sellable">Sellable</option>
                            <option value="non-sellable">Non-sellable</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="text-xs text-neutral-600 mb-1 flex items-center gap-1">
                            %
                            <span title="Sellable % is of NDA. Non-sellable % is of GSA." className="inline-flex text-neutral-500">
                              <Info size={11} />
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={customPercentageValue}
                              onChange={(e) => onCustomPercentageChange(e.target.value)}
                              className="w-full h-9 rounded-md border border-neutral-300 pl-2 pr-5 py-2 text-right tabular-nums text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                            <span className="absolute right-2 top-2 text-xs text-neutral-500">%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-neutral-600 mb-1 block">ha</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={customHaValue}
                              onChange={(e) => onCustomHaChange(e.target.value)}
                              className="w-full h-9 rounded-md border border-neutral-300 pl-2 pr-7 py-2 text-right tabular-nums text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                            <span className="absolute right-2 top-2 text-xs text-neutral-500">ha</span>
                          </div>
                        </div>
                        <div>
                          <button
                            onClick={handleAddCustom}
                            className="w-full h-9 px-3 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                    {customError && <p className="text-xs text-red-600 mt-2">{customError}</p>}
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-neutral-50 border-t border-neutral-200 font-medium">
              <tr>
                <td colSpan={2} className="px-4 py-2.5 text-neutral-900">Total Allocation</td>
                <td className="px-4 py-2.5 font-sans tabular-nums text-neutral-900 text-right pr-2">
                  <span className={cn(Math.abs(totalPercentage - 100) > 0.1 ? "text-orange-600" : "text-blue-600")}>
                    {formatNumber(totalPercentage)}%
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Summary Table Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-neutral-900 uppercase tracking-wide">Development Summary</h2>
          <p className="text-xs text-neutral-600">% shown as % of Gross Site Area (GSA)</p>
        </div>
        <div className="bg-white border border-neutral-300 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-neutral-100 text-neutral-900 font-bold uppercase tracking-wider text-xs border-b border-dashed border-neutral-300">
              <tr>
                <th className="px-6 py-3 border-r border-dashed border-neutral-300 w-[58%]">Item</th>
                <th className="px-6 py-3 border-r border-dashed border-neutral-300 text-center w-[22%]">Area (ha)</th>
                <th className="px-6 py-3 text-center w-[20%]">%</th>
              </tr>
            </thead>
            <tbody>
              {/* Efficiency Row */}
              <tr className="border-b border-dashed border-neutral-300 font-bold bg-neutral-50/50">
                <td className="px-6 py-3 border-r border-dashed border-neutral-300 uppercase">Efficiency</td>
                <td className="px-6 py-3 border-r border-dashed border-neutral-300 text-center tabular-nums">{formatNumber(areas.sraEfficiency)}%</td>
                <td className="px-6 py-3 text-center tabular-nums"></td>
              </tr>

              {/* Non-Sellable Section */}
              <tr className="bg-neutral-200 text-neutral-900 font-bold border-b border-dashed border-neutral-300">
                <td className="px-6 py-3 border-r border-dashed border-neutral-300">Non-Sellable Area</td>
                <td className="px-6 py-3 border-r border-dashed border-neutral-300 text-center tabular-nums">{formatNumber(totalNonSellableHa, areas.gsa < 10 ? 2 : 1)}</td>
                <td className="px-6 py-3 text-center tabular-nums">{formatNumber(totalNonSellablePct)}%</td>
              </tr>
              
              <tr className="border-b border-dashed border-neutral-300">
                <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">Roads & Infrastructure</td>
                <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(roadsHa, areas.gsa < 10 ? 2 : 1)}</td>
                <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(areas.gsa > 0 ? (roadsHa / areas.gsa) * 100 : 0)}%</td>
              </tr>
              <tr className="border-b border-dashed border-neutral-300">
                <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">Green Area</td>
                <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(greenHa, areas.gsa < 10 ? 2 : 1)}</td>
                <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(areas.gsa > 0 ? (greenHa / areas.gsa) * 100 : 0)}%</td>
              </tr>
              {utilitiesHa > 0.1 && (
                <tr className="border-b border-dashed border-neutral-300">
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">Utilities & Other Reserves</td>
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(utilitiesHa, areas.gsa < 10 ? 2 : 1)}</td>
                  <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(areas.gsa > 0 ? (utilitiesHa / areas.gsa) * 100 : 0)}%</td>
                </tr>
              )}
              {nonSellableGsaAllocations.map((alloc) => {
                const cat = catalog.find((c) => c.id === alloc.categoryId);
                const ha = areas.allocationsHa[alloc.categoryId] || 0;
                const pctOfGsa = areas.gsa > 0 ? (ha / areas.gsa) * 100 : 0;
                return (
                  <tr key={alloc.categoryId} className="border-b border-dashed border-neutral-300">
                    <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">{cat?.label}</td>
                    <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(ha, areas.gsa < 10 ? 2 : 1)}</td>
                    <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(pctOfGsa)}%</td>
                  </tr>
                );
              })}
              {areas.nca > 0 && (
                <tr className="border-b border-dashed border-neutral-300">
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">Constraint Allowance (NCA)</td>
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(areas.nca, areas.gsa < 10 ? 2 : 1)}</td>
                  <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(areas.ncaPercentage)}%</td>
                </tr>
              )}
              {publicFacilityHa > 0 && (
                <tr className="border-b border-dashed border-neutral-300">
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">Public Facility</td>
                  <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(publicFacilityHa, areas.gsa < 10 ? 2 : 1)}</td>
                  <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(areas.gsa > 0 ? (publicFacilityHa / areas.gsa) * 100 : 0)}%</td>
                </tr>
              )}

              {/* Sellable Section */}
              <tr className="bg-blue-50 text-neutral-900 font-bold border-b border-dashed border-blue-100">
                <td className="px-6 py-3 border-r border-dashed border-blue-100">Sellable Area</td>
                <td className="px-6 py-3 border-r border-dashed border-blue-100 text-center tabular-nums">{formatNumber(totalSellableHa, areas.gsa < 10 ? 2 : 1)}</td>
                <td className="px-6 py-3 text-center tabular-nums">{formatNumber(totalSellablePct)}%</td>
              </tr>

              {sellableAllocations.map((alloc) => {
                const cat = catalog.find(c => c.id === alloc.categoryId);
                const ha = areas.allocationsHa[alloc.categoryId];
                const pctOfGsa = areas.gsa > 0 ? (ha / areas.gsa) * 100 : 0;
                
                return (
                  <tr key={alloc.categoryId} className="border-b border-dashed border-neutral-300">
                    <td className="px-6 py-2 border-r border-dashed border-neutral-300 pl-12 text-neutral-600">{cat?.label}</td>
                    <td className="px-6 py-2 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums">{formatNumber(ha, areas.gsa < 10 ? 2 : 1)}</td>
                    <td className="px-6 py-2 text-center font-sans tabular-nums text-neutral-500">{formatNumber(pctOfGsa)}%</td>
                  </tr>
                );
              })}

              {/* Footer */}
              <tr className="bg-neutral-100 font-bold border-t-2 border-neutral-300">
                <td className="px-6 py-4 border-r border-dashed border-neutral-300 uppercase text-right pr-8">Total Site Area</td>
                <td className="px-6 py-4 border-r border-dashed border-neutral-300 text-center font-sans tabular-nums text-lg">{formatNumber(areas.gsa, areas.gsa < 10 ? 2 : 1)}</td>
                <td className="px-6 py-4 text-center font-sans tabular-nums text-lg">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

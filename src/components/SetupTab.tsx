import { useMasterPlanStore } from '../store/useMasterPlanStore';
import { ROW_SETS, SCALE_PRESETS, TDI_VALUES } from '../data/presets';
import { CalculatedAreas, RowSetId, TDI, ScalePresetId } from '../types/masterplan';
import { formatNumber } from '../lib/utils';

export function SetupTab({ areas }: { areas: CalculatedAreas }) {
  const { scenario, updateScenario } = useMasterPlanStore();
  const selectedPreset = SCALE_PRESETS[scenario.presetId] ?? SCALE_PRESETS.S3;
  const selectedRowSetId = scenario.rowSetId ?? 'A';
  const isNcaHigh = areas.ncaPercentage > 35;
  const isNsrLow = areas.nsrPercentage < selectedPreset.nsrMin;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-neutral-900">Site Parameters</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          
          <div className="flex flex-col gap-2">
            <label htmlFor="projectName" className="text-sm font-medium text-neutral-700">Project Name</label>
            <input
              id="projectName"
              type="text"
              value={scenario.name}
              onChange={(e) => updateScenario({ name: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter project name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="gsa" className="text-sm font-medium text-neutral-700">Gross Site Area (ha)</label>
            <input
              id="gsa"
              type="number"
              min="0"
              step="0.1"
              value={scenario.gsa}
              onChange={(e) => updateScenario({ gsa: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-neutral-600">Total boundary area of the masterplan.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="tdi" className="text-sm font-medium text-neutral-700">Topography Difficulty Index (TDI)</label>
            <select
              id="tdi"
              value={scenario.tdi}
              onChange={(e) => updateScenario({ tdi: parseInt(e.target.value) as TDI })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
            >
              {(Object.entries(TDI_VALUES) as [string, { label: string; ncaTarget: number }][]).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-600">Constraint proxy. Not a true slope analysis.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="preset" className="text-sm font-medium text-neutral-700">Scale Preset</label>
            <select
              id="preset"
              value={selectedPreset.id}
              onChange={(e) => updateScenario({ presetId: e.target.value as ScalePresetId })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.values(SCALE_PRESETS).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-600">{selectedPreset.description}</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="rowSet" className="text-sm font-medium text-neutral-700">Right of Way (RoW) Width Set</label>
            <select
              id="rowSet"
              value={selectedRowSetId}
              onChange={(e) => updateScenario({ rowSetId: e.target.value as RowSetId })}
              className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries(ROW_SETS).map(([id, rowSet]) => (
                <option key={id} value={id}>
                  {rowSet.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-600">Applied as a multiplier to roads share (2D proxy, no geometry).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="ncaOverride" className="text-sm font-medium text-neutral-700">Constraint Allowance (NCA) Override (%)</label>
              <div className="relative">
                <input
                  id="ncaOverride"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenario.ncaOverridePercentage ?? ''}
                  onChange={(e) =>
                    updateScenario({
                      ncaOverridePercentage: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-4 pr-8 py-2 text-right tabular-nums text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 5"
                />
                <span className="absolute right-3 top-2 text-neutral-500 text-sm">%</span>
              </div>
              <p className="text-xs text-neutral-600">Leave blank to use Topography Difficulty Index (TDI) default.</p>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="nsrOverride" className="text-sm font-medium text-neutral-700">Non-Sellable Reserve (NSR) Override (%)</label>
              <div className="relative">
                <input
                  id="nsrOverride"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenario.nsrOverridePercentage ?? ''}
                  onChange={(e) =>
                    updateScenario({
                      nsrOverridePercentage: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-4 pr-8 py-2 text-right tabular-nums text-neutral-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 40"
                />
                <span className="absolute right-3 top-2 text-neutral-500 text-sm">%</span>
              </div>
              <p className="text-xs text-neutral-600">Leave blank to use scale preset Non-Sellable Reserve (NSR) target.</p>
            </div>
          </div>
        </div>
        <aside className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-4 h-fit">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Live Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Gross Site Area (GSA)</p>
              <p className="text-sm font-semibold tabular-nums text-neutral-800">{formatNumber(areas.gsa)} ha</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Constraint Allowance (NCA)</p>
              <p className="text-sm font-semibold tabular-nums text-neutral-800">{formatNumber(areas.ncaPercentage)}%</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Non-Sellable Reserve (NSR)</p>
              <p className="text-sm font-semibold tabular-nums text-neutral-800">{formatNumber(areas.nsrPercentage)}%</p>
            </div>
            <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Net Developable Area (NDA)</p>
              <p className="text-sm font-semibold tabular-nums text-neutral-800">{formatNumber(areas.ndaPercentage)}%</p>
            </div>
            <div className="col-span-2 bg-white rounded-lg border border-neutral-200 px-3 py-2">
              <p className="text-[11px] text-neutral-600 uppercase tracking-wide">Sellable Efficiency (SRA/GSA)</p>
              <p className="text-sm font-semibold tabular-nums text-neutral-800">{formatNumber(areas.sraEfficiency)}%</p>
            </div>
          </div>
          <div className="text-xs text-neutral-700 space-y-1">
            <p><span className="font-medium">Preset Non-Sellable Reserve (NSR) band:</span> {selectedPreset.nsrMin}% - {selectedPreset.nsrMax}%</p>
            <p><span className="font-medium">Roads / Right of Way (RoW) target:</span> {selectedPreset.roadsTarget}%</p>
            <p><span className="font-medium">Open space target:</span> {selectedPreset.openSpaceTarget}%</p>
          </div>
          {(isNcaHigh || isNsrLow) && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800 space-y-1">
              {isNcaHigh && <p>Constraint Allowance (NCA) is above 35%. Constraint-heavy site warning.</p>}
              {isNsrLow && <p>Non-Sellable Reserve (NSR) is below preset minimum. Infrastructure/public realm risk.</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

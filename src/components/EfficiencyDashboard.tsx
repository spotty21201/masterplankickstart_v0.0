import { CalculatedAreas } from '../types/masterplan';
import { formatNumber } from '../lib/utils';
import { Info } from 'lucide-react';

const KPI_DEFINITIONS: Record<string, string> = {
  gsa: 'Gross Site Area (GSA): Total site area within boundary.',
  nca: 'Constraint Allowance (NCA): Site constraint reserve from topography proxy.',
  nsr: 'Non-Sellable Reserve (NSR): Roads, open space, and other public realm reserves.',
  nda: 'Net Developable Area (NDA) = Gross Site Area (GSA) - Constraint Allowance (NCA) - Non-Sellable Reserve (NSR).',
  sra: 'Sellable / Revenue Area (SRA): Sum of sellable allocations. Sellable Efficiency = SRA/GSA.',
};

function KpiLabel({ text, definition }: { text: string; definition: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-[11px] uppercase tracking-wide text-neutral-600">{text}</p>
      <span title={definition} className="text-neutral-500 inline-flex">
        <Info size={12} />
      </span>
    </div>
  );
}

export function EfficiencyDashboard({ areas }: { areas: CalculatedAreas }) {
  return (
    <div className="bg-white border-b border-neutral-200 px-5 py-3 flex-none shadow-sm z-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
          <KpiLabel text="Gross Site Area (GSA)" definition={KPI_DEFINITIONS.gsa} />
          <p className="text-sm font-semibold text-neutral-800">{formatNumber(areas.gsa)} ha</p>
        </div>
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
          <KpiLabel text="Constraint Allowance (NCA)" definition={KPI_DEFINITIONS.nca} />
          <p className="text-sm font-semibold text-neutral-800">{formatNumber(areas.ncaPercentage)}%</p>
        </div>
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
          <KpiLabel text="Non-Sellable Reserve (NSR)" definition={KPI_DEFINITIONS.nsr} />
          <p className="text-sm font-semibold text-neutral-800">{formatNumber(areas.nsrPercentage)}%</p>
        </div>
        <div className="rounded-lg bg-neutral-50 border border-neutral-200 px-3 py-2">
          <KpiLabel text="Net Developable Area (NDA)" definition={KPI_DEFINITIONS.nda} />
          <p className="text-sm font-semibold text-neutral-800">{formatNumber(areas.ndaPercentage)}%</p>
        </div>
        <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2">
          <KpiLabel text="Sellable Efficiency (SRA/GSA)" definition={KPI_DEFINITIONS.sra} />
          <p className="text-sm font-semibold text-orange-700">{formatNumber(areas.sraEfficiency)}%</p>
        </div>
      </div>
      <div className="flex justify-between items-center mb-1.5">
        <h2 className="text-sm font-bold text-neutral-500 uppercase tracking-wider font-sans">Efficiency Dashboard</h2>
        <span className="text-sm font-bold text-orange-600 font-sans">Efficiency: {formatNumber(areas.sraEfficiency)}%</span>
      </div>
      <div className="h-9 w-full flex rounded-lg overflow-hidden bg-neutral-200 relative shadow-inner">
        <div 
          className="h-full bg-neutral-400 flex items-center justify-center text-xs text-white font-medium font-sans" 
          style={{ width: `${areas.nsrPercentage}%` }}
        >
          {areas.nsrPercentage > 8 && `Reserve ${formatNumber(areas.nsrPercentage)}%`}
        </div>
        <div 
          className="h-full bg-orange-500 flex items-center justify-center text-xs text-white font-medium font-sans" 
          style={{ width: `${areas.sraEfficiency}%` }}
        >
          {areas.sraEfficiency > 8 && `Sellable ${formatNumber(areas.sraEfficiency)}%`}
        </div>
        <div 
          className="h-full bg-neutral-800 flex items-center justify-center text-xs text-white font-medium font-sans" 
          style={{ width: `${areas.ncaPercentage}%` }}
        >
          {areas.ncaPercentage > 8 && 'Constraint'}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[11px] text-neutral-600 font-sans font-medium">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-neutral-400"></div>Non Sellable Area</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div>Sellable Area</div>
      </div>
    </div>
  );
}

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { CalculatedAreas, FeasibilityOutputs, Scenario } from '../types/masterplan';
import { LAND_USE_LIBRARY } from '../data/landuse_library';
import { ROW_SETS, SCALE_PRESETS, TDI_VALUES } from '../data/presets';

function safeFileName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'masterplan_kickstart';
  return trimmed.replace(/\s+/g, '_').replace(/[^\w-]/g, '');
}

export function exportToCSV(scenario: Scenario, areas: CalculatedAreas, feasibility: FeasibilityOutputs) {
  const catalog = [...LAND_USE_LIBRARY, ...scenario.customLandUses];
  const activeAllocations = scenario.allocations.filter((alloc) => {
    const areaHa = areas.allocationsHa[alloc.categoryId] ?? 0;
    return alloc.percentage > 0 && areaHa > 0;
  });
  const rows = [
    ['MasterPlan Kickstart Export'],
    ['Scenario Name', scenario.name],
    ['Version', scenario.version],
    ['Gross Site Area (GSA) (ha)', areas.gsa],
    ['Constraint Allowance (NCA) (%)', areas.ncaPercentage],
    ['Constraint Allowance (NCA) (ha)', areas.nca],
    ['Non-Sellable Reserve (NSR) (%)', areas.nsrPercentage],
    ['Non-Sellable Reserve (NSR) (ha)', areas.nsr],
    ['Net Developable Area (NDA) (ha)', areas.nda],
    ['Sellable / Revenue Area (SRA) (ha)', areas.sra],
    ['Sellable Efficiency (SRA/GSA) (%)', areas.sraEfficiency],
    [],
    ['Land Use', 'Group', 'Percentage of Net Developable Area (NDA)', 'Area (ha)', 'Sellable'],
  ];

  activeAllocations.forEach(alloc => {
    const cat = catalog.find(c => c.id === alloc.categoryId);
    if (cat) {
      rows.push([
        cat.label,
        cat.group,
        alloc.percentage.toString(),
        areas.allocationsHa[alloc.categoryId].toString(),
        cat.sellable ? 'Yes' : 'No'
      ]);
    }
  });

  rows.push([]);
  rows.push(['Feasibility Summary']);
  rows.push(['Total Cost (IDR)', feasibility.totalCost.toString()]);
  rows.push(['Total Revenue (IDR)', feasibility.totalRevenue.toString()]);
  rows.push(['Profit (IDR)', feasibility.profit.toString()]);
  rows.push(['Profit Margin (%)', feasibility.profitMargin.toString()]);
  rows.push([]);
  rows.push(['Definitions']);
  rows.push(['Gross Site Area (GSA)', 'Total boundary area']);
  rows.push(['Constraint Allowance (NCA)', 'Constraint reserve from topography proxy']);
  rows.push(['Non-Sellable Reserve (NSR)', 'Roads, open space, and other public realm']);
  rows.push(['Net Developable Area (NDA)', 'NDA = GSA - NCA - NSR']);
  rows.push(['Sellable / Revenue Area (SRA)', 'Sum of sellable allocations']);
  rows.push(['Sellable Efficiency (SRA/GSA)', 'SRA divided by GSA']);

  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${safeFileName(scenario.name)}_export.csv`);
}

export function exportToXLSX(scenario: Scenario, areas: CalculatedAreas, feasibility: FeasibilityOutputs) {
  const wb = XLSX.utils.book_new();
  const catalog = [...LAND_USE_LIBRARY, ...scenario.customLandUses];
  const activeAllocations = scenario.allocations.filter((alloc) => {
    const areaHa = areas.allocationsHa[alloc.categoryId] ?? 0;
    return alloc.percentage > 0 && areaHa > 0;
  });
  const preset = SCALE_PRESETS[scenario.presetId] ?? SCALE_PRESETS.S3;
  const rowSet = ROW_SETS[scenario.rowSetId] ?? ROW_SETS.A;
  const tdi = TDI_VALUES[scenario.tdi];

  const developmentSummaryData: (string | number)[][] = [
    ['Land Use', 'Group', 'Sellable', '% of Net Developable Area (NDA)', 'Area (ha)', '% of Gross Site Area (GSA)'],
  ];

  activeAllocations.forEach(alloc => {
    const cat = catalog.find(c => c.id === alloc.categoryId);
    if (cat) {
      const areaHa = areas.allocationsHa[alloc.categoryId] ?? 0;
      developmentSummaryData.push([
        cat.label,
        cat.group,
        cat.sellable ? 'Yes' : 'No',
        alloc.percentage,
        areaHa,
        areas.gsa > 0 ? (areaHa / areas.gsa) * 100 : 0,
      ]);
    }
  });
  const wsDevelopmentSummary = XLSX.utils.aoa_to_sheet(developmentSummaryData);
  XLSX.utils.book_append_sheet(wb, wsDevelopmentSummary, 'Development Summary');

  const efficiencyDefinitionsData: (string | number)[][] = [
    ['Metric', 'Value', 'Unit'],
    ['Gross Site Area (GSA)', areas.gsa, 'ha'],
    ['Constraint Allowance (NCA)', areas.nca, 'ha'],
    ['Constraint Allowance (NCA) Percentage', areas.ncaPercentage, '%'],
    ['Non-Sellable Reserve (NSR)', areas.nsr, 'ha'],
    ['Non-Sellable Reserve (NSR) Percentage', areas.nsrPercentage, '%'],
    ['Net Developable Area (NDA)', areas.nda, 'ha'],
    ['Net Developable Area (NDA) Percentage', areas.ndaPercentage, '%'],
    ['Sellable / Revenue Area (SRA)', areas.sra, 'ha'],
    ['Sellable Efficiency (SRA/GSA)', areas.sraEfficiency, '%'],
    [],
    ['Basis Definition', 'Description', ''],
    ['Gross Site Area (GSA)', 'Gross Site Area (GSA): total site area', ''],
    ['Constraint Allowance (NCA)', 'Constraint Allowance (NCA): proxy from Topography Difficulty Index (TDI) or override', ''],
    ['Non-Sellable Reserve (NSR)', 'Public realm and non-sellable reserve from preset/override', ''],
    ['Net Developable Area (NDA)', 'Net Developable Area (NDA) = Gross Site Area (GSA) - Constraint Allowance (NCA) - Non-Sellable Reserve (NSR)', ''],
    ['Sellable / Revenue Area (SRA)', 'Sum of sellable allocations within Net Developable Area (NDA)', ''],
  ];
  const wsEfficiencyBasis = XLSX.utils.aoa_to_sheet(efficiencyDefinitionsData);
  XLSX.utils.book_append_sheet(wb, wsEfficiencyBasis, 'Efficiency + Basis Definitions');

  const feasibilityData = [
    ['Metric', 'Value (IDR)'],
    ['Land Acquisition Cost', feasibility.landAcquisitionCost],
    ['Infrastructure Cost', feasibility.infrastructureCost],
    ['Build Cost', feasibility.buildCost],
    ['Total Cost', feasibility.totalCost],
    ['Total Revenue', feasibility.totalRevenue],
    ['Profit', feasibility.profit],
    ['Profit Margin (%)', feasibility.profitMargin],
    ['Profit per Ha', feasibility.profitPerHa],
  ];
  const wsFeasibility = XLSX.utils.aoa_to_sheet(feasibilityData);
  XLSX.utils.book_append_sheet(wb, wsFeasibility, 'Feasibility Summary');

  const assumptionsData: (string | number | null)[][] = [
    ['Input', 'Value', 'Notes'],
    ['Project Name', scenario.name, ''],
    ['Scale Preset', `${preset.id} - ${preset.label}`, ''],
    ['Topography Difficulty Index', `${scenario.tdi} - ${tdi.label}`, 'Constraint proxy only'],
    ['Right of Way (RoW) Set', `${scenario.rowSetId} - ${rowSet.label}`, 'Multiplier for roads share'],
    ['Constraint Allowance (NCA) Override (%)', scenario.ncaOverridePercentage, 'Blank means Topography Difficulty Index (TDI) default'],
    ['Non-Sellable Reserve (NSR) Override (%)', scenario.nsrOverridePercentage, 'Blank means preset default'],
    [],
    ['Land Acquisition Cost (IDR/sqm)', scenario.feasibility.landAcquisitionCost, ''],
    ['Roads Cost Rate (IDR/sqm roads)', scenario.feasibility.roadsCostRate, ''],
    ['Build Model', scenario.feasibility.buildModel, 'land-sale or build-and-sell'],
    ['Residential Build Cost (IDR/sqm)', scenario.feasibility.residentialBuildCost, ''],
    ['Commercial Build Cost (IDR/sqm)', scenario.feasibility.commercialBuildCost, ''],
    ['Residential Coverage (%)', scenario.feasibility.residentialCoverage, ''],
    ['Commercial Coverage (%)', scenario.feasibility.commercialCoverage, ''],
    ['Residential Sale Price (IDR/sqm)', scenario.feasibility.residentialSalePrice, ''],
    ['Commercial Sale Price (IDR/sqm)', scenario.feasibility.commercialSalePrice, ''],
    ['Custom Sellable Sale Price (IDR/sqm)', scenario.feasibility.customSellableSalePrice, ''],
  ];
  const wsAssumptions = XLSX.utils.aoa_to_sheet(assumptionsData);
  XLSX.utils.book_append_sheet(wb, wsAssumptions, 'Assumptions');

  const definitionsData: (string | number)[][] = [
    ['Acronym', 'Full Term', 'Formula / Definition'],
    ['GSA', 'Gross Site Area', 'Total site area within boundary'],
    ['NCA', 'Constraint Allowance', 'Constraint reserve from topography proxy'],
    ['NSR', 'Non-Sellable Reserve', 'Roads, open space, and public realm reserve'],
    ['NDA', 'Net Developable Area', 'NDA = GSA - NCA - NSR'],
    ['SRA', 'Sellable / Revenue Area', 'Sum of sellable allocations within NDA'],
    ['SRA/GSA', 'Sellable Efficiency', 'SRA divided by GSA'],
  ];
  const wsDefinitions = XLSX.utils.aoa_to_sheet(definitionsData);
  XLSX.utils.book_append_sheet(wb, wsDefinitions, 'Definitions');

  const metadataData = [
    ['Property', 'Value'],
    ['App Version', scenario.version],
    ['Library Version', 'v1'],
    ['Preset Version', scenario.presetId],
    ['Scenario ID', scenario.id],
    ['Timestamp', new Date().toISOString()],
  ];
  const wsMetadata = XLSX.utils.aoa_to_sheet(metadataData);
  XLSX.utils.book_append_sheet(wb, wsMetadata, 'Metadata');

  XLSX.writeFile(wb, `${safeFileName(scenario.name)}_export.xlsx`);
}

export function exportToJSON(scenario: Scenario) {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scenario, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `${safeFileName(scenario.name)}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

export async function importFromJSON(file: File): Promise<Scenario> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid JSON structure.');
  }
  return parsed as Scenario;
}

export function exportToPDF(scenario: Scenario, areas: CalculatedAreas, feasibility: FeasibilityOutputs) {
  const catalog = [...LAND_USE_LIBRARY, ...scenario.customLandUses];
  const activeAllocations = scenario.allocations.filter((alloc) => {
    const areaHa = areas.allocationsHa[alloc.categoryId] ?? 0;
    return alloc.percentage > 0 && areaHa > 0;
  });

  const rows = activeAllocations
    .map((alloc) => {
      const cat = catalog.find((c) => c.id === alloc.categoryId);
      if (!cat) return '';
      const ha = areas.allocationsHa[alloc.categoryId] ?? 0;
      return `<tr>
        <td>${cat.label}</td>
        <td>${cat.group}</td>
        <td style="text-align:right">${alloc.percentage.toFixed(1)}%</td>
        <td style="text-align:right">${ha.toFixed(2)}</td>
      </tr>`;
    })
    .join('');
  const rowsHtml = rows || `<tr><td colspan="4" style="text-align:center;color:#6b7280;">No allocated land uses.</td></tr>`;

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${scenario.name} - MasterPlan Kickstart</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
        h1 { margin: 0 0 6px; font-size: 20px; }
        .meta { color: #4b5563; font-size: 12px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; }
        .card h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; }
        th { background: #f3f4f6; text-align: left; }
        .right { text-align: right; }
        .summary th:nth-child(3), .summary td:nth-child(3),
        .summary th:nth-child(4), .summary td:nth-child(4) { text-align: right; }
        .summary-footer td {
          background: #f8fafc;
          font-weight: 700;
          border-top: 2px solid #cbd5e1;
        }
        .summary-note {
          font-size: 11px;
          color: #6b7280;
          margin: 2px 0 8px;
        }
        .defs { font-size: 11px; color: #4b5563; }
        .defs th, .defs td { padding: 3px 5px; border-color: #eceff3; font-size: 10px; }
        .defs th { background: #f8fafc; color: #475569; font-size: 10px; }
      </style>
    </head>
    <body>
      <h1>MasterPlan Kickstart - ${scenario.name}</h1>
      <div class="meta">Generated ${new Date().toLocaleString('en-US')} | FS-lite (non-bankable)</div>
      <div class="grid">
        <div class="card">
          <h3>Efficiency</h3>
          <table>
            <tr><td>Gross Site Area (GSA)</td><td class="right">${areas.gsa.toFixed(2)} ha</td></tr>
            <tr><td>Constraint Allowance (NCA)</td><td class="right">${areas.nca.toFixed(2)} ha (${areas.ncaPercentage.toFixed(1)}%)</td></tr>
            <tr><td>Non-Sellable Reserve (NSR)</td><td class="right">${areas.nsr.toFixed(2)} ha (${areas.nsrPercentage.toFixed(1)}%)</td></tr>
            <tr><td>Net Developable Area (NDA)</td><td class="right">${areas.nda.toFixed(2)} ha (${areas.ndaPercentage.toFixed(1)}%)</td></tr>
            <tr><td>Sellable / Revenue Area (SRA)</td><td class="right">${areas.sra.toFixed(2)} ha</td></tr>
            <tr><td>Sellable Efficiency (SRA/GSA)</td><td class="right">${areas.sraEfficiency.toFixed(1)}%</td></tr>
          </table>
        </div>
        <div class="card">
          <h3>Feasibility Summary (IDR)</h3>
          <table>
            <tr><td>Total Cost</td><td class="right">${Math.round(feasibility.totalCost).toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Revenue</td><td class="right">${Math.round(feasibility.totalRevenue).toLocaleString('id-ID')}</td></tr>
            <tr><td>Profit</td><td class="right">${Math.round(feasibility.profit).toLocaleString('id-ID')}</td></tr>
            <tr><td>Margin</td><td class="right">${feasibility.profitMargin.toFixed(1)}%</td></tr>
          </table>
        </div>
      </div>
      <h3 style="font-size: 12px; text-transform: uppercase; color: #6b7280;">Development Summary</h3>
      <div class="summary-note">% column shown as % of Net Developable Area (NDA).</div>
      <table class="summary">
        <thead>
          <tr>
            <th>Land Use</th>
            <th>Group</th>
            <th>% of Net Developable Area (NDA)</th>
            <th>Area (ha)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="summary-footer">
            <td>TOTAL SITE AREA</td>
            <td style="text-align:center">—</td>
            <td>100.0% (of GSA)</td>
            <td>${areas.gsa.toFixed(1)}</td>
          </tr>
        </tbody>
      </table>
      <h3 style="font-size: 13px; font-weight: 600; color: #64748b; margin-top: 14px;">Definitions</h3>
      <table class="defs">
        <thead>
          <tr>
            <th>Acronym</th>
            <th>Formula / Definition</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>GSA</td><td>Gross Site Area: total site area within boundary.</td></tr>
          <tr><td>NCA</td><td>Constraint Allowance: reserve from topography proxy.</td></tr>
          <tr><td>NSR</td><td>Non-Sellable Reserve: roads, open space, and public realm reserve.</td></tr>
          <tr><td>NDA</td><td>NDA = GSA - NCA - NSR.</td></tr>
          <tr><td>SRA</td><td>Sellable / Revenue Area: sum of sellable allocations within NDA.</td></tr>
          <tr><td>SRA/GSA</td><td>Sellable Efficiency: SRA divided by GSA.</td></tr>
        </tbody>
      </table>
    </body>
  </html>`;

  const printWindow = window.open('', '_blank', 'width=1024,height=768');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

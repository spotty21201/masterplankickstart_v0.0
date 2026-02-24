export type TDI = 0 | 1 | 2 | 3 | 4;

export type ScalePresetId = 'S1' | 'S2' | 'S3' | 'S4';
export type RowSetId = 'A' | 'B' | 'C';

export interface ScalePreset {
  id: ScalePresetId;
  label: string;
  description: string;
  nsrMin: number;
  nsrMax: number;
  nsrTarget: number;
  openSpaceTarget: number;
  roadsTarget: number;
}

export interface LandUseCategory {
  id: string;
  label: string;
  group: 'Residential' | 'Commercial' | 'Civic' | 'Special' | 'Employment' | 'Industrial' | 'Mixed-use' | 'Other';
  sellable: boolean;
  isCustom?: boolean;
  customType?: 'sellable' | 'non-sellable';
  customCategory?: string;
  allocationBasis?: 'NDA' | 'GSA';
  defaultBand: {
    min: number;
    max: number;
    target: number;
  };
}

export interface Allocation {
  categoryId: string;
  percentage: number; // Percentage of NDA
  locked: boolean;
}

export interface FeasibilityInputs {
  landAcquisitionCost: number; // IDR/sqm
  roadsCostRate: number; // IDR/sqm of roads land
  residentialSalePrice: number; // IDR/sqm land
  commercialSalePrice: number; // IDR/sqm land
  customSellableSalePrice: number; // IDR/sqm land
  buildModel: 'land-sale' | 'build-and-sell';
  residentialBuildCost: number; // IDR/sqm built
  commercialBuildCost: number; // IDR/sqm built
  residentialCoverage: number; // %
  commercialCoverage: number; // %
}

export interface Scenario {
  id: string;
  name: string;
  gsa: number; // Gross Site Area in ha
  tdi: TDI;
  presetId: ScalePresetId;
  rowSetId: RowSetId;
  ncaOverridePercentage: number | null;
  nsrOverridePercentage: number | null;
  customLandUses: LandUseCategory[];
  allocations: Allocation[];
  feasibility: FeasibilityInputs;
  version: string;
  timestamp: string;
}

export interface CalculatedAreas {
  gsa: number;
  nca: number; // Non-Constructible Allowance
  nsr: number; // Non-Sellable Reserve
  nda: number; // Net Developable Area
  sra: number; // Sellable/Revenue Area
  ncaPercentage: number;
  nsrPercentage: number;
  ndaPercentage: number;
  sraEfficiency: number; // SRA / GSA
  roadsHa: number;
  openSpaceHa: number;
  utilitiesHa: number;
  allocationsHa: Record<string, number>;
}

export interface FeasibilityOutputs {
  landAcquisitionCost: number;
  infrastructureCost: number;
  buildCost: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  profitMargin: number;
  profitPerHa: number;
}

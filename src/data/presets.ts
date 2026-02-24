import { RowSetId, ScalePreset, TDI } from '../types/masterplan';

export const SCALE_PRESETS: Record<string, ScalePreset> = {
  S1: {
    id: 'S1',
    label: 'Small site (5–20 ha) / urban edge',
    description: 'Non-Sellable Reserve (NSR): 20–30%, Open space: 6–12%, Roads/RoW: 12–18%',
    nsrMin: 20,
    nsrMax: 30,
    nsrTarget: 25,
    openSpaceTarget: 9,
    roadsTarget: 15,
  },
  S2: {
    id: 'S2',
    label: 'Medium (20–50 ha) / peri-urban',
    description: 'Non-Sellable Reserve (NSR): 28–38%, Open space: 8–15%, Roads/RoW: 16–24%',
    nsrMin: 28,
    nsrMax: 38,
    nsrTarget: 33,
    openSpaceTarget: 12,
    roadsTarget: 20,
  },
  S3: {
    id: 'S3',
    label: 'Large (50–150 ha) / new district',
    description: 'Non-Sellable Reserve (NSR): 35–45%, Open space: 10–18%, Roads/RoW: 20–30%',
    nsrMin: 35,
    nsrMax: 45,
    nsrTarget: 40,
    openSpaceTarget: 14,
    roadsTarget: 25,
  },
  S4: {
    id: 'S4',
    label: 'Very large (150+ ha) / new town',
    description: 'Non-Sellable Reserve (NSR): 40–50%, Open space: 12–20%, Roads/RoW: 22–32%',
    nsrMin: 40,
    nsrMax: 50,
    nsrTarget: 45,
    openSpaceTarget: 16,
    roadsTarget: 27,
  },
};

export const TDI_VALUES: Record<TDI, { label: string; ncaTarget: number }> = {
  0: { label: 'Flat / easy (0-3%)', ncaTarget: 1.5 },
  1: { label: 'Gentle (3-7%)', ncaTarget: 5 },
  2: { label: 'Rolling (7-12%)', ncaTarget: 9.5 },
  3: { label: 'Steep (12-20%)', ncaTarget: 16 },
  4: { label: 'Very steep / fragile (20-35%)', ncaTarget: 27.5 },
};

export const ROW_SETS: Record<RowSetId, { id: RowSetId; label: string; primary_m: number; secondary_m: number; roadsMultiplier: number }> = {
  A: {
    id: 'A',
    label: 'RoW Set A (Primary 24m, Secondary 16m)',
    primary_m: 24,
    secondary_m: 16,
    roadsMultiplier: 1,
  },
  B: {
    id: 'B',
    label: 'RoW Set B (Primary 30m, Secondary 20m)',
    primary_m: 30,
    secondary_m: 20,
    roadsMultiplier: 1.25,
  },
  C: {
    id: 'C',
    label: 'RoW Set C (Primary 24m, Secondary 8m)',
    primary_m: 24,
    secondary_m: 8,
    roadsMultiplier: 0.8,
  },
};

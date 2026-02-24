import { LAND_USE_LIBRARY } from '../data/landuse_library';
import { ROW_SETS, SCALE_PRESETS, TDI_VALUES } from '../data/presets';
import { Allocation, CalculatedAreas, FeasibilityInputs, FeasibilityOutputs, LandUseCategory, Scenario } from '../types/masterplan';

function getCatalog(customLandUses: LandUseCategory[] = []): LandUseCategory[] {
  return [...LAND_USE_LIBRARY, ...customLandUses];
}

/**
 * Largest Remainder Method to ensure percentages sum to exactly 100
 * Operates on numbers multiplied by 10 to preserve 1 decimal place.
 */
export function largestRemainderRounding(values: number[], targetSum: number = 100): number[] {
  const scaledValues = values.map((v) => v * 10);
  const scaledTarget = targetSum * 10;

  const floored = scaledValues.map((n) => Math.floor(n));
  const remainders = scaledValues.map((n, i) => ({ index: i, remainder: n - floored[i] }));
  
  const currentSum = floored.reduce((a, b) => a + b, 0);
  let diff = Math.round(scaledTarget - currentSum);

  remainders.sort((a, b) => b.remainder - a.remainder);

  let i = 0;
  while (diff > 0) {
    floored[remainders[i % remainders.length].index]++;
    diff--;
    i++;
  }

  return floored.map((v) => v / 10);
}

export function calculateAreas(scenario: Scenario): CalculatedAreas {
  const gsa = scenario.gsa || 0;
  const catalog = getCatalog(scenario.customLandUses);
  const preset = SCALE_PRESETS[scenario.presetId] ?? SCALE_PRESETS.S3;
  const rowSet = ROW_SETS[scenario.rowSetId] ?? ROW_SETS.A;
  const ncaPercentage = scenario.ncaOverridePercentage ?? TDI_VALUES[scenario.tdi].ncaTarget;
  const nsrPercentage = scenario.nsrOverridePercentage ?? preset.nsrTarget;

  const nca = (gsa * ncaPercentage) / 100;
  const baseNsr = (gsa * nsrPercentage) / 100;
  const customNonSellableReserve = scenario.allocations.reduce((sum, alloc) => {
    const category = catalog.find((c) => c.id === alloc.categoryId);
    if (!category || category.sellable || (category.allocationBasis ?? 'NDA') !== 'GSA') return sum;
    return sum + (gsa * alloc.percentage) / 100;
  }, 0);
  const nsr = baseNsr + customNonSellableReserve;
  const nda = Math.max(0, gsa - nca - nsr);
  const ndaPercentage = gsa > 0 ? (nda / gsa) * 100 : 0;

  let roadsHa = (gsa * preset.roadsTarget * rowSet.roadsMultiplier) / 100;
  let openSpaceHa = (gsa * preset.openSpaceTarget) / 100;
  if (roadsHa + openSpaceHa > baseNsr && baseNsr > 0) {
    const scale = baseNsr / (roadsHa + openSpaceHa);
    roadsHa *= scale;
    openSpaceHa *= scale;
  }
  const utilitiesHa = Math.max(0, baseNsr - roadsHa - openSpaceHa) + customNonSellableReserve;

  let sra = 0;
  const allocationsHa: Record<string, number> = {};

  scenario.allocations.forEach((alloc) => {
    const category = catalog.find((c) => c.id === alloc.categoryId);
    const basis = category?.allocationBasis ?? 'NDA';
    const ha = basis === 'GSA' ? (gsa * alloc.percentage) / 100 : (nda * alloc.percentage) / 100;
    allocationsHa[alloc.categoryId] = ha;

    if (category?.sellable) {
      sra += ha;
    }
  });

  const sraEfficiency = gsa > 0 ? (sra / gsa) * 100 : 0;

  return {
    gsa,
    nca,
    nsr,
    nda,
    sra,
    ncaPercentage,
    nsrPercentage,
    ndaPercentage,
    sraEfficiency,
    roadsHa,
    openSpaceHa,
    utilitiesHa,
    allocationsHa,
  };
}

export function calculateFeasibility(
  inputs: FeasibilityInputs,
  areas: CalculatedAreas,
  customLandUses: LandUseCategory[] = []
): FeasibilityOutputs {
  const catalog = getCatalog(customLandUses);
  const gsaSqm = areas.gsa * 10000;
  const roadsSqm = areas.roadsHa * 10000;

  const landAcquisitionCost = gsaSqm * inputs.landAcquisitionCost;
  const infrastructureCost = roadsSqm * inputs.roadsCostRate;

  let buildCost = 0;
  let totalRevenue = 0;

  let resAreaHa = 0;
  let comAreaHa = 0;
  let customSellableAreaHa = 0;

  Object.entries(areas.allocationsHa).forEach(([id, ha]) => {
    const cat = catalog.find((c) => c.id === id);
    if (cat?.group === 'Residential') resAreaHa += ha;
    if (cat?.group === 'Commercial') comAreaHa += ha;
    if (cat?.sellable && cat?.group !== 'Residential' && cat?.group !== 'Commercial') {
      customSellableAreaHa += ha;
    }
  });

  const resAreaSqm = resAreaHa * 10000;
  const comAreaSqm = comAreaHa * 10000;
  const customSellableAreaSqm = customSellableAreaHa * 10000;

  if (inputs.buildModel === 'build-and-sell') {
    const resBuiltSqm = resAreaSqm * (inputs.residentialCoverage / 100);
    const comBuiltSqm = comAreaSqm * (inputs.commercialCoverage / 100);

    buildCost = (resBuiltSqm * inputs.residentialBuildCost) + (comBuiltSqm * inputs.commercialBuildCost);
    totalRevenue = (resBuiltSqm * inputs.residentialSalePrice) + (comBuiltSqm * inputs.commercialSalePrice) + (customSellableAreaSqm * inputs.customSellableSalePrice);
  } else {
    // land-sale model
    totalRevenue = (resAreaSqm * inputs.residentialSalePrice) + (comAreaSqm * inputs.commercialSalePrice) + (customSellableAreaSqm * inputs.customSellableSalePrice);
  }

  const totalCost = landAcquisitionCost + infrastructureCost + buildCost;
  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const profitPerHa = areas.gsa > 0 ? profit / areas.gsa : 0;

  return {
    landAcquisitionCost,
    infrastructureCost,
    buildCost,
    totalCost,
    totalRevenue,
    profit,
    profitMargin,
    profitPerHa,
  };
}

export function rebalanceAllocations(allocations: Allocation[], customLandUses: LandUseCategory[] = []): Allocation[] {
  const catalog = getCatalog(customLandUses);
  const ndaAllocations = allocations.filter((a) => {
    const cat = catalog.find((c) => c.id === a.categoryId);
    return (cat?.allocationBasis ?? 'NDA') === 'NDA';
  });
  const lockedSum = ndaAllocations.filter(a => a.locked).reduce((sum, a) => sum + a.percentage, 0);
  const unlocked = ndaAllocations.filter(a => !a.locked);
  
  if (unlocked.length === 0 || lockedSum >= 100) {
    return allocations;
  }

  const remaining = 100 - lockedSum;
  const unlockedTargetSum = unlocked.reduce((sum, a) => {
    const cat = catalog.find(c => c.id === a.categoryId);
    return sum + (cat?.defaultBand.target || 0);
  }, 0);

  const newUnlockedPercentages = unlocked.map(a => {
    const cat = catalog.find(c => c.id === a.categoryId);
    const target = cat?.defaultBand.target || 0;
    return unlockedTargetSum > 0 ? (target / unlockedTargetSum) * remaining : remaining / unlocked.length;
  });

  const rounded = largestRemainderRounding(newUnlockedPercentages, remaining);

  const result = [...allocations];
  let roundedIdx = 0;
  result.forEach((a, i) => {
    const cat = catalog.find((c) => c.id === a.categoryId);
    if ((cat?.allocationBasis ?? 'NDA') !== 'NDA' || a.locked) return;
    result[i] = { ...a, percentage: rounded[roundedIdx] };
    roundedIdx++;
  });
  return result;
}

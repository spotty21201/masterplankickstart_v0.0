import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Allocation, FeasibilityInputs, LandUseCategory, Scenario } from '../types/masterplan';
import { LAND_USE_LIBRARY } from '../data/landuse_library';
import { largestRemainderRounding, rebalanceAllocations } from '../lib/engine';

interface MasterPlanState {
  scenario: Scenario;
  updateScenario: (updates: Partial<Scenario>) => void;
  replaceScenario: (scenario: Scenario) => void;
  updateAllocation: (categoryId: string, percentage: number) => void;
  addCustomLandUse: (input: {
    name: string;
    type: 'sellable' | 'non-sellable';
    group: LandUseCategory['group'];
    category: string;
    percentage: number;
  }) => { ok: boolean; error?: string };
  removeCustomLandUse: (categoryId: string) => void;
  toggleAllocationLock: (categoryId: string) => void;
  rebalanceToPreset: () => void;
  resetScenario: () => void;
}

const defaultAllocations: Allocation[] = LAND_USE_LIBRARY.map(cat => ({
  categoryId: cat.id,
  percentage: cat.id === 'res_landed' ? 100 : 0,
  locked: false,
}));

const defaultFeasibility: FeasibilityInputs = {
  landAcquisitionCost: 1000000,
  roadsCostRate: 500000,
  residentialSalePrice: 5000000,
  commercialSalePrice: 8000000,
  customSellableSalePrice: 6000000,
  buildModel: 'land-sale',
  residentialBuildCost: 3000000,
  commercialBuildCost: 4000000,
  residentialCoverage: 60,
  commercialCoverage: 70,
};

const defaultScenario: Scenario = {
  id: 'default',
  name: 'Untitled Scenario',
  gsa: 100,
  tdi: 1,
  presetId: 'S3',
  rowSetId: 'A',
  ncaOverridePercentage: null,
  nsrOverridePercentage: null,
  customLandUses: [],
  allocations: defaultAllocations,
  feasibility: defaultFeasibility,
  version: '0.0',
  timestamp: new Date().toISOString(),
};

export const useMasterPlanStore = create<MasterPlanState>()(
  persist(
    (set, get) => ({
      scenario: defaultScenario,
      updateScenario: (updates) => set((state) => ({
        scenario: { ...state.scenario, ...updates, timestamp: new Date().toISOString() }
      })),
      replaceScenario: (scenario) => set({
        scenario: {
          ...defaultScenario,
          ...scenario,
          feasibility: { ...defaultFeasibility, ...scenario.feasibility },
          customLandUses: (scenario.customLandUses || []).map((c) => ({
            ...c,
            customType: c.customType || (c.sellable ? 'sellable' : 'non-sellable'),
            allocationBasis: c.allocationBasis || (c.sellable ? 'NDA' : 'GSA'),
          })),
          id: scenario.id || crypto.randomUUID(),
          timestamp: new Date().toISOString(),
        }
      }),
      updateAllocation: (categoryId, percentage) => {
        const { scenario } = get();
        const catalog = [...LAND_USE_LIBRARY, ...scenario.customLandUses];
        const allocations = [...scenario.allocations];
        const targetIdx = allocations.findIndex(a => a.categoryId === categoryId);
        
        if (targetIdx === -1) return;
        const targetCategory = catalog.find((c) => c.id === categoryId);
        const targetBasis = targetCategory?.allocationBasis ?? 'NDA';
        
        const oldPercentage = allocations[targetIdx].percentage;
        const diff = percentage - oldPercentage;
        
        allocations[targetIdx] = { ...allocations[targetIdx], percentage: Math.max(0, Math.min(100, percentage)) };

        // GSA-based allocations are independent and should not rebalance NDA table percentages.
        if (targetBasis === 'GSA') {
          set({ scenario: { ...scenario, allocations, timestamp: new Date().toISOString() } });
          return;
        }
        
        // Distribute diff among unlocked others
        const unlockedOthers = allocations.filter((a, i) => {
          if (i === targetIdx || a.locked) return false;
          const cat = catalog.find((c) => c.id === a.categoryId);
          return (cat?.allocationBasis ?? 'NDA') === 'NDA';
        });
        if (unlockedOthers.length > 0) {
          const totalUnlocked = unlockedOthers.reduce((sum, a) => sum + a.percentage, 0);
          
          unlockedOthers.forEach(a => {
            const idx = allocations.findIndex(x => x.categoryId === a.categoryId);
            const share = totalUnlocked > 0 ? a.percentage / totalUnlocked : 1 / unlockedOthers.length;
            allocations[idx] = { ...a, percentage: Math.max(0, a.percentage - (diff * share)) };
          });
          
          // Fix rounding errors
          const ndaIndexes = allocations
            .map((a, i) => ({ i, cat: catalog.find((c) => c.id === a.categoryId) }))
            .filter(({ cat }) => (cat?.allocationBasis ?? 'NDA') === 'NDA')
            .map(({ i }) => i);
          const ndaPercentages = ndaIndexes.map((i) => allocations[i].percentage);
          const rounded = largestRemainderRounding(ndaPercentages, 100);
          rounded.forEach((val, idx) => {
            allocations[ndaIndexes[idx]].percentage = val;
          });
        }
        
        set({ scenario: { ...scenario, allocations, timestamp: new Date().toISOString() } });
      },
      addCustomLandUse: ({ name, type, group, category, percentage }) => {
        const { scenario } = get();
        const trimmed = name.trim();
        if (!trimmed) {
          return { ok: false, error: 'Name is required.' };
        }
        if (percentage < 0 || percentage > 100) {
          return { ok: false, error: 'Allocation must be between 0 and 100%.' };
        }
        const catalog = [...LAND_USE_LIBRARY, ...scenario.customLandUses];
        const reducible = scenario.allocations
          .filter((a) => {
            const cat = catalog.find((c) => c.id === a.categoryId);
            return !a.locked && (cat?.allocationBasis ?? 'NDA') === 'NDA';
          })
          .reduce((sum, a) => sum + a.percentage, 0);
        if (type === 'sellable' && percentage > reducible) {
          return { ok: false, error: 'Total allocation cannot exceed 100%. Unlock or reduce existing rows first.' };
        }

        const allLabels = [...LAND_USE_LIBRARY, ...scenario.customLandUses].map((c) => c.label.toLowerCase());
        let finalLabel = trimmed;
        if (allLabels.includes(trimmed.toLowerCase())) {
          let idx = 2;
          while (allLabels.includes(`${trimmed} (${idx})`.toLowerCase())) {
            idx++;
          }
          finalLabel = `${trimmed} (${idx})`;
        }

        const newId = `custom_${crypto.randomUUID()}`;
        const customCategory: LandUseCategory = {
          id: newId,
          label: finalLabel,
          group,
          sellable: type === 'sellable',
          isCustom: true,
          customType: type,
          customCategory: category,
          allocationBasis: type === 'sellable' ? 'NDA' : 'GSA',
          defaultBand: { min: 0, max: 100, target: 0 },
        };

        const allocations = [...scenario.allocations, { categoryId: newId, percentage: 0, locked: false }];
        const updatedScenario: Scenario = {
          ...scenario,
          customLandUses: [...scenario.customLandUses, customCategory],
          allocations,
          timestamp: new Date().toISOString(),
        };
        set({ scenario: updatedScenario });

        if (percentage > 0) {
          get().updateAllocation(newId, percentage);
        }
        return { ok: true };
      },
      removeCustomLandUse: (categoryId) => {
        const { scenario } = get();
        const customLandUses = scenario.customLandUses.filter((c) => c.id !== categoryId);
        const allocations = scenario.allocations.filter((a) => a.categoryId !== categoryId);
        set({
          scenario: {
            ...scenario,
            customLandUses,
            allocations,
            timestamp: new Date().toISOString(),
          }
        });
      },
      toggleAllocationLock: (categoryId) => {
        const { scenario } = get();
        const allocations = scenario.allocations.map(a => 
          a.categoryId === categoryId ? { ...a, locked: !a.locked } : a
        );
        set({ scenario: { ...scenario, allocations, timestamp: new Date().toISOString() } });
      },
      rebalanceToPreset: () => {
        const { scenario } = get();
        const allocations = rebalanceAllocations(scenario.allocations, scenario.customLandUses);
        set({ scenario: { ...scenario, allocations, timestamp: new Date().toISOString() } });
      },
      resetScenario: () => set({ scenario: { ...defaultScenario, id: crypto.randomUUID() } }),
    }),
    {
      name: 'masterplan-storage',
      version: 1,
      migrate: (persistedState) => {
        const state = persistedState as { scenario?: Partial<Scenario> };
        const scenario = { ...defaultScenario, ...state?.scenario };
        scenario.feasibility = { ...defaultFeasibility, ...(state?.scenario?.feasibility || {}) };
        scenario.customLandUses = (scenario.customLandUses || []).map((c) => ({
          ...c,
          customType: c.customType || (c.sellable ? 'sellable' : 'non-sellable'),
          allocationBasis: c.allocationBasis || (c.sellable ? 'NDA' : 'GSA'),
        }));
        return { scenario };
      },
    }
  )
);

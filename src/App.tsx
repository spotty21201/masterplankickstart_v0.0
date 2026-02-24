import { useEffect, useRef, useState } from 'react';
import { useMasterPlanStore } from './store/useMasterPlanStore';
import { calculateAreas, calculateFeasibility } from './lib/engine';
import { exportToCSV, exportToXLSX, exportToJSON, exportToPDF, importFromJSON } from './lib/export';
import { EfficiencyDashboard } from './components/EfficiencyDashboard';
import { SetupTab } from './components/SetupTab';
import { ProgramTab } from './components/ProgramTab';
import { FeasibilityTab } from './components/FeasibilityTab';
import { Download, FileSpreadsheet, FileJson, RefreshCw, LayoutDashboard, Upload } from 'lucide-react';
import { cn } from './lib/utils';

type Tab = 'setup' | 'program' | 'feasibility';

function resolveTabFromUrl(): Tab {
  if (typeof window === 'undefined') return 'setup';
  const hash = window.location.hash.toLowerCase();
  const href = window.location.href.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const tabParam = search.get('tab')?.toLowerCase();

  if (tabParam === 'program' || tabParam === 'feasibility' || tabParam === 'setup') {
    return tabParam;
  }
  if (hash.includes('feasibility') || href.includes('quick%20fs') || href.includes('quick-fs')) {
    return 'feasibility';
  }
  if (hash.includes('program') || hash.includes('development-summary') || href.includes('program') || href.includes('development%20summary')) {
    return 'program';
  }
  return 'setup';
}

function writeTabToHash(tab: Tab) {
  const desiredHash = `#${tab}`;
  if (window.location.hash === desiredHash) return;
  window.history.replaceState(null, '', desiredHash);
}

export default function App() {
  const { scenario, replaceScenario, resetScenario } = useMasterPlanStore();
  const [activeTab, setActiveTab] = useState<Tab>(() => resolveTabFromUrl());
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onHashChange = () => setActiveTab(resolveTabFromUrl());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    writeTabToHash(activeTab);
  }, [activeTab]);

  // Derived state
  const areas = calculateAreas(scenario);
  const feasibility = calculateFeasibility(scenario.feasibility, areas, scenario.customLandUses);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'setup', label: '1. Project Setup' },
    { id: 'program', label: '2. Program + Development Summary' },
    { id: 'feasibility', label: '3. Quick FS' },
  ];

  return (
    <div className="min-h-screen bg-topo text-neutral-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/50 backdrop-blur-md border-b border-neutral-200/50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-sm">
              <LayoutDashboard className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-neutral-900">MasterPlan Kickstart</h1>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500 font-sans">Release {scenario.version}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={resetScenario}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <RefreshCw size={16} />
              Reset
            </button>
            
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
              >
                <Download size={16} />
                Export
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 z-20">
                  <button
                    onClick={() => { exportToXLSX(scenario, areas, feasibility); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    Export to XLSX
                  </button>
                  <button
                    onClick={() => { exportToCSV(scenario, areas, feasibility); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <FileSpreadsheet size={16} className="text-blue-600" />
                    Export to CSV
                  </button>
                  <button
                    onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Download size={16} className="text-red-600" />
                    Print Current View
                  </button>
                  <button
                    onClick={() => { exportToPDF(scenario, areas, feasibility); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Download size={16} className="text-red-600" />
                    Export Summary PDF
                  </button>
                  <div className="border-t border-neutral-100 my-1"></div>
                  <button
                    onClick={() => { exportToJSON(scenario); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <FileJson size={16} className="text-neutral-600" />
                    Save JSON
                  </button>
                  <button
                    onClick={() => { importInputRef.current?.click(); setIsExportMenuOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Upload size={16} className="text-neutral-600" />
                    Load JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-6 space-y-6">
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const imported = await importFromJSON(file);
              replaceScenario(imported);
            } catch {
              window.alert('Failed to load JSON scenario. Please check file format.');
            } finally {
              e.target.value = '';
            }
          }}
        />
        
        {/* Efficiency Dashboard Strip */}
        <EfficiencyDashboard areas={areas} />

        {/* Main Workspace */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 min-h-[600px] flex flex-col">
          
          {/* Tabs Navigation */}
          <div className="flex border-b border-neutral-200 px-6 pt-4 gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  writeTabToHash(tab.id);
                }}
                className={cn(
                  "pb-4 text-sm font-medium transition-colors relative",
                  activeTab === tab.id ? "text-blue-600" : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8 flex-1">
            {activeTab === 'setup' && <SetupTab areas={areas} />}
            {activeTab === 'program' && <ProgramTab areas={areas} />}
            {activeTab === 'feasibility' && <FeasibilityTab areas={areas} feasibility={feasibility} />}
          </div>

        </div>
      </main>
    </div>
  );
}

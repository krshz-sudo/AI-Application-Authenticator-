import React from 'react';
import {
  Upload,
  GitBranch,
  FileCheck2,
  ClipboardList,
  Network,
  History,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { ScenarioId, ScreenId } from '../types';
import { SCENARIO_META } from '../mock/tools';

interface NavbarProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  selectedScenario: ScenarioId;
  onQuickSwitchScenario: (scenario: ScenarioId) => void;
  isPipelineRunning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  onSelectScreen,
  selectedScenario,
  onQuickSwitchScenario,
  isPipelineRunning,
}) => {
  const navItems: { id: ScreenId; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: '1. Upload', icon: <Upload className="w-4 h-4" /> },
    { id: 'pipeline', label: '2. Pipeline', icon: <GitBranch className="w-4 h-4" /> },
    {
      id: 'review',
      label: '3. Review Dashboard',
      icon: <FileCheck2 className="w-4 h-4" />,
    },
    {
      id: 'report',
      label: '4. Final Report',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'architecture',
      label: '5. Architecture',
      icon: <Network className="w-4 h-4" />,
    },
    { id: 'history', label: '6. History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-[#0B1F3A] text-white sticky top-0 z-40 shadow-lg border-b border-slate-800 no-print">
      {/* Subtle tiny saffron accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#14B8A6] to-[#0B1F3A]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Left: Brand & SIH badge */}
          <div className="flex items-center justify-between gap-3">
            <div
              onClick={() => onSelectScreen('upload')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/15 border border-[#14B8A6]/40 flex items-center justify-center text-[#14B8A6] group-hover:bg-[#14B8A6]/25 transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                    Oryan Forge
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/40">
                    SIH 2026 • PS 26261
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/40">
                    SIMULATED PROTOTYPE
                  </span>
                </div>
                <p className="text-xs text-slate-300 hidden sm:block">
                  AI-Powered Application Validation, Document Authentication &amp; Regulatory
                  Compliance Verification
                </p>
              </div>
            </div>
          </div>

          {/* Right: Instant Scenario Selector Bar */}
          <div className="flex items-center gap-2 flex-wrap bg-[#071527]/90 px-3 py-1.5 rounded-lg border border-slate-700/80">
            <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
              Simulate Outcome:
            </span>
            <select
              aria-label="Simulate outcome scenario"
              value={selectedScenario}
              disabled={isPipelineRunning}
              onChange={(e) => onQuickSwitchScenario(e.target.value as ScenarioId)}
              className="bg-[#0B1F3A] text-white text-xs font-medium px-2.5 py-1.5 rounded border border-slate-600 focus:outline-none focus:border-[#14B8A6] cursor-pointer disabled:opacity-50"
            >
              {(['A', 'B', 'C', 'D', 'E'] as ScenarioId[]).map((id) => (
                <option key={id} value={id}>
                  {SCENARIO_META[id].shortLabel}
                </option>
              ))}
            </select>
            <div className="hidden xl:flex items-center gap-1 ml-1">
              {(['A', 'B', 'C', 'D', 'E'] as ScenarioId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={isPipelineRunning}
                  onClick={() => onQuickSwitchScenario(id)}
                  title={SCENARIO_META[id].title}
                  className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-all ${
                    selectedScenario === id
                      ? 'bg-[#14B8A6] text-[#0B1F3A] shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Row */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 pt-1 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const active = activeScreen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScreen(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-[#14B8A6] text-[#0B1F3A] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

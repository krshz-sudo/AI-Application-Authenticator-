import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Play,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { ScenarioId } from '../types';
import { SCENARIO_META, buildInitialScenarioFields } from '../mock/tools';
import { DocumentSpecimen } from './DocumentSpecimen';

interface UploadScreenProps {
  selectedScenario: ScenarioId;
  onSelectScenario: (scenario: ScenarioId) => void;
  onStartVerification: (
    scenario: ScenarioId,
    customFile?: { name: string; type: string; size: string }
  ) => void;
  onGoToReviewDirectly: (scenario: ScenarioId) => void;
}

export const UploadScreen: React.FC<UploadScreenProps> = ({
  selectedScenario,
  onSelectScenario,
  onStartVerification,
  onGoToReviewDirectly,
}) => {
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    type: string;
    size: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentMeta = SCENARIO_META[selectedScenario];
  const previewFields = buildInitialScenarioFields(selectedScenario);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    setUploadedFile({
      name: file.name,
      type: file.type || 'application/pdf',
      size: `${sizeMB === '0.00' ? '0.45' : sizeMB} MB`,
    });
  };

  const scenarioIcons: Record<ScenarioId, React.ReactNode> = {
    A: <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />,
    B: <AlertCircle className="w-5 h-5 text-[#DC2626]" />,
    C: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
    D: <AlertCircle className="w-5 h-5 text-[#DC2626]" />,
    E: <HelpCircle className="w-5 h-5 text-[#6366F1]" />,
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#0B1F3A] via-[#102A4C] to-[#0B1F3A] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#14B8A6]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FF9933]" />
            <span>SMART INDIA HACKATHON 2026 • PROBLEM STATEMENT 26261 • ORYAN FORGE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            AI-Powered Application Validation, Document Authentication &amp; Regulatory
            Compliance Verification
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Upload a dossier or choose a deterministic simulation scenario below. The
            system executes a strict 4-stage sequential pipeline:{' '}
            <strong className="text-white">
              1. Document OCR &rarr; 2. Template Validation Gate &rarr; 3. GAN
              Authenticity Risk Analysis &rarr; 4. RAG Corpus Compliance
            </strong>
            .
          </p>
        </div>
      </div>

      {/* Main Grid: Left (Dropzone + Scenario Selector) | Right (Specimen Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dropzone & Demo Scenario Selector */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Drag-and-Drop Document Input */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h2 className="font-bold text-base text-slate-900">
                  Document Input (PDF / JPG / PNG)
                </h2>
              </div>
              <span className="text-[11px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">
                SIMULATED INPUT
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#14B8A6] bg-[#14B8A6]/10'
                  : 'border-slate-300 hover:border-[#14B8A6] bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
              />
              <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A]/5 text-[#0B1F3A] flex items-center justify-center mx-auto mb-3">
                <UploadCloud className="w-6 h-6 text-[#14B8A6]" />
              </div>
              <p className="text-sm font-semibold text-slate-800">
                {uploadedFile
                  ? `Selected File: ${uploadedFile.name} (${uploadedFile.size})`
                  : 'Drag & drop an application PDF, JPG, or PNG here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {uploadedFile
                  ? 'Custom file attached — will be evaluated using the selected Simulate Outcome scenario below.'
                  : `Default active specimen: ${currentMeta.defaultFileName} (1.38 MB)`}
              </p>
              {uploadedFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                  className="mt-2 text-xs text-red-600 underline"
                >
                  Reset to default scenario specimen
                </button>
              )}
            </div>

            {/* Simulate Outcome Dropdown + Primary CTA */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label
                    htmlFor="upload-scenario-select"
                    className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF9933]" />
                    Simulate Outcome (Dropdown)
                  </label>
                  <p className="text-xs text-slate-500">
                    Controls which branch of the sequential pipeline is demonstrated
                  </p>
                </div>
                <select
                  id="upload-scenario-select"
                  value={selectedScenario}
                  onChange={(e) => onSelectScenario(e.target.value as ScenarioId)}
                  className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-semibold text-xs sm:text-sm focus:outline-none focus:border-[#14B8A6]"
                >
                  {(['A', 'B', 'C', 'D', 'E'] as ScenarioId[]).map((id) => (
                    <option key={id} value={id}>
                      {SCENARIO_META[id].shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onStartVerification(selectedScenario, uploadedFile || undefined)
                  }
                  className="flex-1 px-5 py-3 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-4 h-4 text-[#14B8A6] fill-[#14B8A6]" />
                  <span>Run Verification Pipeline ({selectedScenario})</span>
                </button>
                <button
                  type="button"
                  onClick={() => onGoToReviewDirectly(selectedScenario)}
                  className="px-4 py-3 rounded-xl bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#0B1F3A] border border-[#14B8A6]/40 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Inspect in Review Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: One-Click Demo Scenario Selector Cards (A - E) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#0B1F3A] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-bold text-base text-slate-900">
                  Demo Scenario Selector (Click Any Branch)
                </h2>
              </div>
              <span className="text-xs text-slate-500">5 Pre-Configured Outcomes</span>
            </div>

            <div className="space-y-2.5">
              {(['D', 'A', 'B', 'C', 'E'] as ScenarioId[]).map((id) => {
                const meta = SCENARIO_META[id];
                const isSelected = selectedScenario === id;
                return (
                  <div
                    key={id}
                    onClick={() => onSelectScenario(id)}
                    className={`rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0B1F3A] bg-[#0B1F3A]/[0.03] shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{scenarioIcons[id]}</div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {meta.shortLabel}
                            </span>
                            {id === 'D' && (
                              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#FF9933]/20 text-[#9A3412] border border-[#FF9933]/40">
                                MAIN DEMO SCENARIO
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectScenario(id);
                          onStartVerification(id, uploadedFile || undefined);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 text-[#14B8A6] fill-[#14B8A6]" />
                        <span>Run {id}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Document Specimen Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#14B8A6]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Specimen Preview ({currentMeta.shortLabel})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                7 Target Fields
              </span>
            </div>

            <DocumentSpecimen
              fileName={uploadedFile?.name || currentMeta.defaultFileName}
              scenarioId={selectedScenario}
              fields={previewFields}
              highlightedField={null}
              showBoundingBoxes={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

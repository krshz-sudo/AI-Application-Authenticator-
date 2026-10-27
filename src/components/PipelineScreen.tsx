import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scan,
  ShieldAlert,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  SkipForward,
  Terminal,
  Server,
  HardDrive,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RotateCcw,
  FileText,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  AgentActivityLog,
  ApiLogEntry,
  FieldKey,
  ScenarioId,
  SqlLogEntry,
  StageState,
  VerificationRun,
} from '../types';
import { PipelineProgressUpdate } from '../mock/orchestrator';
import { VECTOR_DB_LABEL } from '../mock/vectorStore';
import { SCENARIO_META } from '../mock/tools';
import { DocumentSpecimen } from './DocumentSpecimen';
import { FieldValidationCard } from './FieldValidationCard';

interface PipelineScreenProps {
  run: VerificationRun;
  progress: PipelineProgressUpdate | null;
  isRunning: boolean;
  agentLogs: AgentActivityLog[];
  apiLogs: ApiLogEntry[];
  sqlLogs: SqlLogEntry[];
  onRerunScenario: (scenario: ScenarioId) => void;
  onGoToReview: () => void;
  onGoToReport: () => void;
  onReverifyField: (key: FieldKey, newValue: string) => Promise<void>;
  onOpenPdfSnippet: (ruleId: string) => void;
  onToggleMarkForReview: (key: FieldKey) => void;
}

export const PipelineScreen: React.FC<PipelineScreenProps> = ({
  run,
  progress,
  isRunning,
  agentLogs,
  apiLogs,
  sqlLogs,
  onRerunScenario,
  onGoToReview,
  onGoToReport,
  onReverifyField,
  onOpenPdfSnippet,
  onToggleMarkForReview,
}) => {
  const [apiPanelOpen, setApiPanelOpen] = useState(true);
  const [highlightedField, setHighlightedField] = useState<FieldKey | null>(null);

  const activeRun = progress?.partialRun || run;
  const stages = activeRun.stages;

  const getStageBadge = (state: StageState) => {
    switch (state) {
      case 'running':
        return {
          border: 'border-[#14B8A6] ring-4 ring-[#14B8A6]/20',
          bg: 'bg-[#14B8A6]/15',
          text: 'text-[#0F766E]',
          label: 'RUNNING...',
          icon: <Scan className="w-4 h-4 animate-spin text-[#14B8A6]" />,
        };
      case 'passed':
        return {
          border: 'border-[#16A34A]',
          bg: 'bg-[#16A34A]/10',
          text: 'text-[#16A34A]',
          label: 'PASSED',
          icon: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
        };
      case 'failed':
        return {
          border: 'border-[#DC2626]',
          bg: 'bg-[#DC2626]/10',
          text: 'text-[#DC2626]',
          label: 'FAILED',
          icon: <XCircle className="w-4 h-4 text-[#DC2626]" />,
        };
      case 'flagged':
        return {
          border: 'border-[#F59E0B]',
          bg: 'bg-[#F59E0B]/15',
          text: 'text-amber-800',
          label: 'FLAGGED',
          icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
        };
      case 'needs_review':
        return {
          border: 'border-[#6366F1]',
          bg: 'bg-[#6366F1]/15',
          text: 'text-[#6366F1]',
          label: 'REQUIRES HUMAN REVIEW',
          icon: <HelpCircle className="w-4 h-4 text-[#6366F1]" />,
        };
      case 'skipped':
        return {
          border: 'border-slate-300 border-dashed',
          bg: 'bg-slate-100',
          text: 'text-slate-500',
          label: 'SKIPPED',
          icon: <SkipForward className="w-4 h-4 text-slate-400" />,
        };
      default:
        return {
          border: 'border-slate-200',
          bg: 'bg-white',
          text: 'text-slate-400',
          label: 'WAITING',
          icon: <div className="w-3 h-3 rounded-full bg-slate-300" />,
        };
    }
  };

  const renderDecisionDiamond = (
    question: string,
    decision: 'YES' | 'NO' | 'REVIEW' | 'PENDING' | 'SKIPPED'
  ) => {
    const colorClass =
      decision === 'YES'
        ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A]'
        : decision === 'NO'
        ? 'border-[#DC2626] bg-red-50 text-[#DC2626]'
        : decision === 'REVIEW'
        ? 'border-[#F59E0B] bg-amber-50 text-amber-800'
        : 'border-slate-300 bg-slate-100 text-slate-500';

    return (
      <div className="flex flex-col items-center justify-center px-1 py-2 shrink-0">
        <div
          className={`w-11 h-11 rotate-45 rounded-lg border-2 flex items-center justify-center shadow-sm transition-all ${colorClass}`}
          title={question}
        >
          <span className="-rotate-45 text-[10px] font-mono font-bold">
            {decision === 'PENDING' ? '?' : decision === 'SKIPPED' ? '—' : decision}
          </span>
        </div>
        <p className="text-[10px] font-medium text-slate-600 text-center max-w-[120px] mt-2 leading-tight">
          {question}
        </p>
      </div>
    );
  };

  const d1 =
    stages.template.decisionPassed === true
      ? 'YES'
      : stages.template.decisionPassed === false
      ? 'NO'
      : 'PENDING';

  const d2 =
    stages.authenticity.state === 'skipped'
      ? 'SKIPPED'
      : stages.authenticity.decisionPassed === true
      ? 'YES'
      : stages.authenticity.decisionPassed === false
      ? 'NO'
      : 'PENDING';

  const d3 =
    stages.compliance.state === 'skipped'
      ? 'SKIPPED'
      : stages.compliance.decisionState === 'YES'
      ? 'YES'
      : stages.compliance.decisionState === 'NO'
      ? 'NO'
      : stages.compliance.decisionState === 'INSUFFICIENT_EVIDENCE'
      ? 'REVIEW'
      : 'PENDING';

  return (
    <div className="space-y-6">
      {/* Top Status & Quick Scenario Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0B1F3A] text-[#14B8A6]">
              STRICT SEQUENTIAL PIPELINE
            </span>
            <span className="text-xs font-mono font-semibold text-slate-500">
              Run ID: {activeRun.id} • {activeRun.fileName}
            </span>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              ORCHESTRATOR: SIMULATED
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900">
            {SCENARIO_META[activeRun.scenarioId].shortLabel}:{' '}
            {SCENARIO_META[activeRun.scenarioId].title}
          </h1>
          <p className="text-xs text-slate-600">
            {isRunning && progress
              ? progress.subStepText
              : activeRun.statusBannerText}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => onRerunScenario(activeRun.scenarioId)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-[#14B8A6] fill-[#14B8A6]" />
            <span>Re-run Animation</span>
          </button>
          <button
            type="button"
            onClick={onGoToReview}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Review Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#14B8A6]" />
          </button>
          <button
            type="button"
            onClick={onGoToReport}
            className="px-3.5 py-2 rounded-xl bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#0B1F3A] border border-[#14B8A6]/40 font-semibold text-xs"
          >
            Final Report
          </button>
        </div>
      </div>

      {/* Horizontal Stepper with 4 Stages and 3 Decision Diamonds */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
        <div className="min-w-[920px] flex items-center justify-between gap-2">
          {/* STAGE 1: Document Input + OCR */}
          {(() => {
            const st = getStageBadge(stages.ocr.state);
            return (
              <div
                className={`flex-1 rounded-xl border-2 p-3.5 transition-all ${st.border} ${st.bg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    STAGE 1 • ocrTool
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 font-bold flex items-center gap-1">
                    {st.icon}
                    <span className={st.text}>{st.label}</span>
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  1. Document Input + OCR
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Extracted {stages.ocr.fieldsExtractedCount}/7 fields
                </p>
              </div>
            );
          })()}

          {/* Decision Diamond 1 */}
          {renderDecisionDiamond(
            'Does the document match the required template?',
            d1
          )}

          {/* STAGE 2: Template Validation Gate */}
          {(() => {
            const st = getStageBadge(stages.template.state);
            return (
              <div
                className={`flex-1 rounded-xl border-2 p-3.5 transition-all ${st.border} ${st.bg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    STAGE 2 • templateTool
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 font-bold flex items-center gap-1">
                    {st.icon}
                    <span className={st.text}>{st.label}</span>
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  2. Template Validation Gate
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {stages.template.state === 'failed'
                    ? 'TEMPLATE VALIDATION FAILED'
                    : 'Mandatory fields & syntax'}
                </p>
              </div>
            );
          })()}

          {/* Decision Diamond 2 */}
          {renderDecisionDiamond('Does the authenticity check pass?', d2)}

          {/* STAGE 3: Authenticity Analysis */}
          {(() => {
            const st = getStageBadge(stages.authenticity.state);
            return (
              <div
                className={`flex-1 rounded-xl border-2 p-3.5 transition-all ${st.border} ${st.bg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    STAGE 3 • authenticityTool
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 font-bold flex items-center gap-1">
                    {st.icon}
                    <span className={st.text}>{st.label}</span>
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  3. Authenticity Analysis (GAN)
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {stages.authenticity.state === 'skipped'
                    ? 'Skipped (Halted at Gate 2)'
                    : stages.authenticity.result?.riskScoreNormalized ||
                      'Visual risk indicator check'}
                </p>
              </div>
            );
          })()}

          {/* Decision Diamond 3 */}
          {renderDecisionDiamond(
            'Does the application satisfy applicable compliance requirements?',
            d3
          )}

          {/* STAGE 4: RAG Regulatory Compliance */}
          {(() => {
            const st = getStageBadge(stages.compliance.state);
            return (
              <div
                className={`flex-1 rounded-xl border-2 p-3.5 transition-all ${st.border} ${st.bg}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500">
                    STAGE 4 • ragRetrieve + compliance
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 font-bold flex items-center gap-1">
                    {st.icon}
                    <span className={st.text}>{st.label}</span>
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">
                  4. RAG Regulatory Compliance
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  {stages.compliance.state === 'skipped'
                    ? 'Skipped (Halted earlier)'
                    : stages.compliance.result?.status || 'ChromaDB + Rule Check'}
                </p>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Content Grid: Left 8 Cols (Stage Deep-Dive & Fields) | Right 4 Cols (Agent Activity, API Log, Fake PostgreSQL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Stage Deep-Dive */}
        <div className="lg:col-span-8 space-y-6">
          {/* Scenario B Special Gate Halt Callout ("TEMPLATE VALIDATION FAILED" + "Correct and Resubmit") */}
          {stages.template.state === 'failed' && (
            <div className="rounded-2xl border-2 border-[#DC2626] bg-red-50/90 p-5 space-y-4 shadow-sm">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-3">
                  <XCircle className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-red-950">
                        TEMPLATE VALIDATION FAILED — Pipeline Stopped at Stage 2 Gate
                      </h3>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-200 text-red-900">
                        STAGE 3 &amp; 4 SKIPPED
                      </span>
                    </div>
                    <p className="text-xs text-red-800 mt-1">
                      {stages.template.summary}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoToReview}
                  className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Correct and Resubmit</span>
                </button>
              </div>
            </div>
          )}

          {/* Stage 3 Authenticity Analysis Detail Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="font-bold text-base text-slate-900">
                  Stage 3: Authenticity Analysis (Proposed GAN-Based Approach)
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                  SIMULATED
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">
                {stages.authenticity.state === 'skipped'
                  ? 'Status: SKIPPED'
                  : `Risk Indicator: ${
                      stages.authenticity.result?.riskScoreNormalized || 'Evaluating...'
                    }`}
              </span>
            </div>

            {stages.authenticity.state === 'skipped' ? (
              <p className="text-xs text-slate-500 italic">
                Skipped because the document did not pass the Stage 2 Template
                Validation Gate.
              </p>
            ) : stages.authenticity.result ? (
              <div className="space-y-3">
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    stages.authenticity.result.passed
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <p className="font-bold mb-1">
                    LLM Visual Forensics Summary ({stages.authenticity.result.status}):
                  </p>
                  <p>{stages.authenticity.result.llmExplanation}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stages.authenticity.result.indicators.map((ind) => (
                    <div
                      key={ind.id}
                      className={`p-3 rounded-xl border text-xs ${
                        ind.severity === 'high' || ind.severity === 'elevated'
                          ? 'border-amber-400 bg-amber-50/70'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-900">{ind.label}</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            ind.severity === 'high'
                              ? 'bg-amber-600 text-white'
                              : ind.severity === 'elevated'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {ind.severity} risk indicator
                        </span>
                      </div>
                      <p className="text-slate-600">{ind.finding}</p>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <strong>Methodology Note:</strong> GAN-based analysis is a risk
                  indicator, not proof of forgery, and is different from cryptographic
                  signature validation.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Waiting for Stage 3...</p>
            )}
          </div>

          {/* Stage 4 RAG Regulatory Compliance Detail Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#14B8A6]" />
                <h3 className="font-bold text-base text-slate-900">
                  Stage 4: RAG Regulatory Compliance &amp; {VECTOR_DB_LABEL}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                  SIMULATED
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-[#0F766E]">
                20 Corpus Entries • Top-3 Retrieval
              </span>
            </div>

            {stages.compliance.state === 'skipped' ? (
              <p className="text-xs text-slate-500 italic">
                Skipped because the pipeline halted at an earlier gate.
              </p>
            ) : stages.compliance.result ? (
              <div className="space-y-4">
                {/* 4-step RAG Sub-pipeline Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { step: '1. Build Query', done: true },
                    { step: '2. Embed (1536-d)', done: true },
                    { step: '3. ChromaDB Top-3', done: true },
                    { step: '4. LLM + Rules Eval', done: true },
                  ].map((s) => (
                    <div
                      key={s.step}
                      className="px-3 py-2 rounded-lg bg-[#0B1F3A] text-white font-mono text-[11px] flex items-center justify-between"
                    >
                      <span>{s.step}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#14B8A6]" />
                    </div>
                  ))}
                </div>

                {/* Query & Embedding Box */}
                <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 font-mono text-xs space-y-1.5">
                  <div>
                    <span className="text-[#14B8A6] font-bold">Constructed Query: </span>
                    <span>{stages.compliance.result.queryBuilt}</span>
                  </div>
                  <div>
                    <span className="text-[#FF9933] font-bold">Embedding Vector: </span>
                    <span className="text-slate-400">
                      {stages.compliance.result.embeddingVectorPreview}
                    </span>
                  </div>
                </div>

                {/* Top-3 Retrieved Passages from Vector DB (ChromaDB, demo) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Semantic Retrieval — Top-3 Passages from {VECTOR_DB_LABEL}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Click any passage to open PDF snippet
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {stages.compliance.result.retrievedPassages.map((p, idx) => (
                      <div
                        key={p.ruleId}
                        onClick={() => onOpenPdfSnippet(p.ruleId)}
                        className="p-3 rounded-xl border border-slate-200 hover:border-[#14B8A6] bg-slate-50/70 hover:bg-white cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[#0B1F3A] flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-[#14B8A6]" />
                              Top-{idx + 1}: {p.fileName} (p.{p.page}, {p.section})
                            </span>
                            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#0B1F3A] text-[#14B8A6]">
                              Rule {p.ruleId}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-[#0F766E] border border-teal-200">
                            Similarity: {p.similarityScore.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deterministic Checks (Shown Separately from Semantic Retrieval!) */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Deterministic Checks (Date, Format &amp; Mandatory Fields —
                      Separate from Vector Retrieval)
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      DETERMINISTIC ENGINE
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {stages.compliance.result.deterministicChecks.map((chk) => (
                      <div
                        key={chk.id}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          chk.passed
                            ? 'border-emerald-200 bg-emerald-50/50 text-emerald-950'
                            : 'border-red-200 bg-red-50/60 text-red-950'
                        }`}
                      >
                        {chk.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="font-bold">{chk.fieldLabel}</div>
                          <div className="text-[11px] opacity-80">
                            {chk.checkDescription}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <strong>Accuracy Note:</strong> Vector similarity only retrieves
                  evidence. The compliance decision uses the retrieved rule text plus
                  deterministic checks.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Running RAG retrieval and deterministic evaluation...
              </p>
            )}
          </div>

          {/* Document Preview + Extracted Fields side-by-side inside Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <DocumentSpecimen
              fileName={activeRun.fileName}
              scenarioId={activeRun.scenarioId}
              fields={activeRun.fields}
              highlightedField={highlightedField}
              onSelectField={setHighlightedField}
              isScanning={isRunning && progress?.stepIndex === 1}
              authenticityResult={stages.authenticity.result}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                  Extracted &amp; Validated Fields ({activeRun.fields.length}/7)
                </h3>
                <span className="text-xs text-slate-500">
                  Click red (i) for rule popover
                </span>
              </div>
              {activeRun.fields.map((field) => (
                <FieldValidationCard
                  key={field.key}
                  field={field}
                  isHighlighted={highlightedField === field.key}
                  onHoverField={setHighlightedField}
                  onReverifyField={onReverifyField}
                  onOpenPdfSnippet={onOpenPdfSnippet}
                  onToggleMarkForReview={onToggleMarkForReview}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Live Simulated Telemetry Side Panels */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. Agent Activity Log Panel */}
          <div className="bg-[#0B1F3A] text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="px-4 py-3 bg-[#071527] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#14B8A6]" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Agent Activity Log
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#14B8A6]/20 text-[#14B8A6] border border-[#14B8A6]/30">
                SIMULATED
              </span>
            </div>
            <div className="p-3 max-h-72 overflow-y-auto custom-scrollbar space-y-2 font-mono text-xs">
              {agentLogs.length === 0 ? (
                <p className="text-slate-400 text-xs p-2">No agent calls logged yet.</p>
              ) : (
                agentLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="text-[#14B8A6] font-semibold">
                        {log.agent} &rarr; {log.tool}()
                      </span>
                      <span>
                        {log.timestamp}{' '}
                        {log.durationMs > 0 ? `(${log.durationMs}ms)` : ''}
                      </span>
                    </div>
                    <div className="font-sans font-semibold text-white text-xs">
                      {log.action}
                    </div>
                    <div className="font-sans text-[11px] text-slate-300 leading-snug">
                      {log.detail}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* 2. Collapsible API Log Panel (src/mock/api.ts) */}
          <div className="bg-[#0B1F3A] text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setApiPanelOpen(!apiPanelOpen)}
              className="w-full px-4 py-3 bg-[#071527] border-b border-slate-800 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-[#FF9933]" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  HTTP / JSON API Log (src/mock/api.ts)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/30">
                  SIMULATED
                </span>
                {apiPanelOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {apiPanelOpen && (
              <div className="p-3 max-h-80 overflow-y-auto custom-scrollbar space-y-2.5 font-mono text-[11px]">
                {apiLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">
                        <span className="text-[#14B8A6]">{entry.method}</span>{' '}
                        {entry.endpoint}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          entry.statusCode === 200
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        HTTP {entry.statusCode} • {entry.latencyMs}ms
                      </span>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">Req: </span>
                      <code className="text-slate-300 break-all">
                        {JSON.stringify(entry.requestJson)}
                      </code>
                    </div>
                    <div className="text-slate-400">
                      <span className="text-slate-500">Res: </span>
                      <code className="text-[#14B8A6] break-all">
                        {JSON.stringify(entry.responseJson)}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Mini Fake PostgreSQL Log Panel (src/mock/postgres.ts) */}
          <div className="bg-[#0B1F3A] text-white rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
            <div className="px-4 py-3 bg-[#071527] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Fake PostgreSQL Log (Relational)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                SIMULATED SQL
              </span>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[11px]">
              {sqlLogs.map((sql) => (
                <div
                  key={sql.id}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-sky-400 font-bold">
                      {sql.operation} &bull; {sql.table}
                    </span>
                    <span>{sql.timestamp}</span>
                  </div>
                  <div className="text-slate-200 break-all leading-relaxed">
                    {sql.sql}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

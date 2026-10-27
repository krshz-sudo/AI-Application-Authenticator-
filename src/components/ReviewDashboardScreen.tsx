import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  SkipForward,
  FileCheck,
  Send,
  ArrowUpRight,
  Sparkles,
  RotateCcw,
  ClipboardList,
  Info,
} from 'lucide-react';
import {
  FieldKey,
  OverallStatus,
  ScenarioId,
  StageState,
  VerificationRun,
} from '../types';
import { SCENARIO_META } from '../mock/tools';
import { DocumentSpecimen } from './DocumentSpecimen';
import { FieldValidationCard } from './FieldValidationCard';

interface ReviewDashboardScreenProps {
  run: VerificationRun;
  onReverifyField: (key: FieldKey, newValue: string) => Promise<void>;
  onReverifyMultipleFields: (
    updates: Partial<Record<FieldKey, string>>
  ) => Promise<void>;
  onOpenPdfSnippet: (ruleId: string) => void;
  onToggleMarkForReview: (key: FieldKey) => void;
  onUpdateReviewerNotes: (notes: string) => void;
  onRecordReviewerDecision: (
    decision: 'APPROVED' | 'CORRECTION_REQUESTED' | 'ESCALATED'
  ) => Promise<void>;
  onSwitchScenario: (scenario: ScenarioId) => void;
  onGoToReport: () => void;
}

export const ReviewDashboardScreen: React.FC<ReviewDashboardScreenProps> = ({
  run,
  onReverifyField,
  onReverifyMultipleFields,
  onOpenPdfSnippet,
  onToggleMarkForReview,
  onUpdateReviewerNotes,
  onRecordReviewerDecision,
  onSwitchScenario,
  onGoToReport,
}) => {
  const [highlightedField, setHighlightedField] = useState<FieldKey | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [isBatchFixing, setIsBatchFixing] = useState(false);

  const wrongFields = run.fields.filter((f) => f.status === 'wrong');
  const firstWrongKey = wrongFields[0]?.key;

  const overallBadge = (status: OverallStatus) => {
    switch (status) {
      case 'PASSED':
        return {
          bg: 'bg-[#16A34A] text-white',
          banner: 'border-[#16A34A] bg-emerald-50 text-emerald-950',
          icon: <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />,
        };
      case 'FAILED':
        return {
          bg: 'bg-[#DC2626] text-white',
          banner: 'border-[#DC2626] bg-red-50 text-red-950',
          icon: <XCircle className="w-5 h-5 text-[#DC2626]" />,
        };
      case 'FLAGGED':
        return {
          bg: 'bg-[#F59E0B] text-white',
          banner: 'border-[#F59E0B] bg-amber-50 text-amber-950',
          icon: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
        };
      case 'REQUIRES HUMAN REVIEW':
        return {
          bg: 'bg-[#6366F1] text-white',
          banner: 'border-[#6366F1] bg-indigo-50 text-indigo-950',
          icon: <HelpCircle className="w-5 h-5 text-[#6366F1]" />,
        };
    }
  };

  const renderStagePill = (label: string, state: StageState, detail: string) => {
    const map: Record<
      StageState,
      { color: string; icon: React.ReactNode; text: string }
    > = {
      passed: {
        color: 'border-emerald-300 bg-emerald-50 text-emerald-900',
        icon: <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />,
        text: 'PASSED',
      },
      failed: {
        color: 'border-red-300 bg-red-50 text-red-900',
        icon: <XCircle className="w-4 h-4 text-[#DC2626]" />,
        text: 'FAILED',
      },
      flagged: {
        color: 'border-amber-300 bg-amber-50 text-amber-900',
        icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
        text: 'FLAGGED',
      },
      needs_review: {
        color: 'border-indigo-300 bg-indigo-50 text-indigo-900',
        icon: <HelpCircle className="w-4 h-4 text-[#6366F1]" />,
        text: 'REQUIRES REVIEW',
      },
      skipped: {
        color: 'border-slate-300 bg-slate-100 text-slate-500',
        icon: <SkipForward className="w-4 h-4 text-slate-400" />,
        text: 'SKIPPED',
      },
      running: {
        color: 'border-teal-300 bg-teal-50 text-teal-900',
        icon: <RotateCcw className="w-4 h-4 animate-spin text-[#14B8A6]" />,
        text: 'RUNNING',
      },
      idle: {
        color: 'border-slate-200 bg-slate-50 text-slate-400',
        icon: null,
        text: 'IDLE',
      },
    };
    const item = map[state];

    return (
      <div
        className={`flex-1 rounded-xl border p-3 flex items-center justify-between gap-2 ${item.color}`}
      >
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
            {label}
          </div>
          <div className="text-xs font-medium mt-0.5">{detail}</div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/90 border border-current/15 font-mono text-xs font-bold shrink-0">
          {item.icon}
          <span>{item.text}</span>
        </span>
      </div>
    );
  };

  const handleAutoFixAll = async () => {
    if (wrongFields.length === 0) return;
    setIsBatchFixing(true);
    try {
      const updates: Partial<Record<FieldKey, string>> = {};
      wrongFields.forEach((f) => {
        if (f.expectedValue) {
          updates[f.key] = f.expectedValue.split(' (')[0].trim();
        }
      });
      await onReverifyMultipleFields(updates);
    } finally {
      setIsBatchFixing(false);
    }
  };

  const handleDecisionClick = async (
    decision: 'APPROVED' | 'CORRECTION_REQUESTED' | 'ESCALATED'
  ) => {
    await onRecordReviewerDecision(decision);
    const labelMap = {
      APPROVED: 'Application Approved and logged to PostgreSQL audit_log.',
      CORRECTION_REQUESTED:
        'Correction Request dispatched and logged to PostgreSQL audit_log.',
      ESCALATED:
        'Application Escalated to Senior Regulatory Officer and logged to PostgreSQL audit_log.',
    };
    setDecisionFeedback(labelMap[decision]);
    setTimeout(() => setDecisionFeedback(null), 5000);
  };

  const ob = overallBadge(run.overallStatus);

  return (
    <div className="space-y-6">
      {/* Top Overall Status Banner & Quick Scenario Switcher */}
      <div
        className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${ob.banner}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">{ob.icon}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${ob.bg}`}
              >
                OVERALL STATUS: {run.overallStatus}
              </span>
              <span className="text-xs font-mono font-semibold opacity-80">
                App ID: {run.applicationId} • Run: {run.id}
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/80 border border-slate-300 text-slate-700">
                {SCENARIO_META[run.scenarioId].shortLabel}
              </span>
            </div>
            <p className="text-sm font-semibold mt-1.5">{run.statusBannerText}</p>
            {run.overallStatus === 'PASSED' && (
              <p className="text-xs font-medium text-emerald-800 mt-0.5">
                Verification Statement: Application is{' '}
                <strong>verified within the scope of checks performed</strong>.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {(['A', 'B', 'C', 'D', 'E'] as ScenarioId[]).map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => onSwitchScenario(sc)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                run.scenarioId === sc
                  ? 'bg-[#0B1F3A] text-[#14B8A6] border-[#0B1F3A]'
                  : 'bg-white/90 text-slate-700 border-slate-300 hover:bg-white'
              }`}
              title={SCENARIO_META[sc].title}
            >
              Scenario {sc}
            </button>
          ))}
          <button
            type="button"
            onClick={onGoToReport}
            className="px-3.5 py-1.5 rounded-lg bg-[#0B1F3A] text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <ClipboardList className="w-3.5 h-3.5 text-[#14B8A6]" />
            <span>View Final Report</span>
          </button>
        </div>
      </div>

      {/* Stage-Summary Bar (Template / Authenticity / Compliance) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Stage-Summary Bar (Sequential Pipeline Outcomes)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            All stages simulated in browser
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {renderStagePill(
            '1. Template Gate',
            run.stages.template.state,
            run.stages.template.state === 'failed'
              ? 'TEMPLATE VALIDATION FAILED'
              : 'Form A-1 schema & mandatory fields'
          )}
          {renderStagePill(
            '2. Authenticity (GAN)',
            run.stages.authenticity.state,
            run.stages.authenticity.state === 'skipped'
              ? 'Skipped (Halted at Template Gate)'
              : run.stages.authenticity.result?.riskScoreNormalized || 'Low risk indicator'
          )}
          {renderStagePill(
            '3. RAG Compliance',
            run.stages.compliance.state,
            run.stages.compliance.state === 'skipped'
              ? 'Skipped (Halted at earlier gate)'
              : run.stages.compliance.result?.status || 'Evaluated against 20 corpus rules'
          )}
        </div>
      </div>

      {/* Main Two-Column Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Document Preview with Highlight Boxes */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <DocumentSpecimen
            fileName={run.fileName}
            scenarioId={run.scenarioId}
            fields={run.fields}
            highlightedField={highlightedField}
            onSelectField={setHighlightedField}
            authenticityResult={run.stages.authenticity.result}
            showBoundingBoxes={true}
          />

          {/* Authenticity Flag Callout on Left when Scenario C */}
          {run.stages.authenticity.state === 'flagged' &&
            run.stages.authenticity.result && (
              <div className="rounded-2xl border-2 border-[#F59E0B] bg-amber-50 p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
                    Visual Authenticity Risk Indicator
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                    {run.stages.authenticity.result.riskScoreNormalized}
                  </span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  {run.stages.authenticity.result.llmExplanation}
                </p>
                <p className="text-[11px] font-medium text-amber-800 border-t border-amber-200 pt-2">
                  Note: GAN-based analysis is a risk indicator, not proof of forgery,
                  and is different from cryptographic signature validation.
                </p>
              </div>
            )}
        </div>

        {/* RIGHT COLUMN (7 cols): Field Cards + Reviewer Notes + Decision Actions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Header above Field Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Extracted Fields &amp; Regulatory Validation ({run.fields.length} Fields)
              </h2>
              <p className="text-xs text-slate-500">
                Green tick = compliant. Red (i) = click or hover for rule citation, PDF
                snippet &amp; inline edit.
              </p>
            </div>

            {wrongFields.length > 0 && (
              <button
                type="button"
                disabled={isBatchFixing}
                onClick={handleAutoFixAll}
                className="px-3.5 py-2 rounded-xl bg-[#14B8A6] text-[#0B1F3A] hover:bg-[#0D9488] hover:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isBatchFixing
                    ? 'Re-verifying All...'
                    : `Auto-Fix All Wrong Fields (${wrongFields.length})`}
                </span>
              </button>
            )}
          </div>

          {/* List of 7 Validated Field Cards */}
          <div className="space-y-3.5">
            {run.fields.map((field) => (
              <FieldValidationCard
                key={field.key}
                field={field}
                isHighlighted={highlightedField === field.key}
                onHoverField={setHighlightedField}
                onReverifyField={onReverifyField}
                onOpenPdfSnippet={onOpenPdfSnippet}
                onToggleMarkForReview={onToggleMarkForReview}
                defaultOpenPopover={field.key === firstWrongKey}
              />
            ))}
          </div>

          {/* Reviewer Notes & Officer Action Bar ("Approve", "Request Correction", "Escalate") */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Human-in-the-Loop Reviewer Notes &amp; Sign-Off
              </h3>
              {run.reviewerDecision && (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#0B1F3A] text-[#14B8A6]">
                  Recorded Decision: {run.reviewerDecision}
                </span>
              )}
            </div>

            <textarea
              rows={3}
              value={run.reviewerNotes}
              onChange={(e) => onUpdateReviewerNotes(e.target.value)}
              placeholder="Enter reviewing officer observations, regulatory override justification, or correction instructions..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
            />

            {decisionFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  {decisionFeedback}
                </span>
                <button
                  type="button"
                  onClick={onGoToReport}
                  className="underline font-bold text-[#0B1F3A]"
                >
                  Open Final Report &rarr;
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDecisionClick('APPROVED')}
                  className="px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-green-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecisionClick('CORRECTION_REQUESTED')}
                  className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {run.stages.template.state === 'failed'
                      ? 'Correct and Resubmit'
                      : 'Request Correction'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDecisionClick('ESCALATED')}
                  className="px-4 py-2.5 rounded-xl bg-[#6366F1] hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Escalate</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#14B8A6]" />
                <span>Writes to simulated PostgreSQL audit_log</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

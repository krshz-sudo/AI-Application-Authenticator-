import React from 'react';
import {
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Clock,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { OverallStatus, VerificationRun } from '../types';

interface ReportScreenProps {
  run: VerificationRun;
  onOpenPdfSnippet: (ruleId: string) => void;
  onBackToReview: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  run,
  onOpenPdfSnippet,
  onBackToReview,
}) => {
  const handleDownloadJson = () => {
    const payload = {
      reportMetadata: {
        prototype: 'SIH 2026 | PS 26261 | Oryan Forge (SIMULATED)',
        generatedAt: new Date().toISOString(),
        scopeStatement:
          run.overallStatus === 'PASSED'
            ? 'Verified within the scope of checks performed.'
            : 'Requires remediation or human review prior to clearance.',
      },
      verificationRun: run,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${run.applicationId}_Verification_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const statusConfig: Record<
    OverallStatus,
    {
      bg: string;
      border: string;
      badge: string;
      icon: React.ReactNode;
      scopeCopy: string;
    }
  > = {
    PASSED: {
      bg: 'bg-emerald-50/90',
      border: 'border-[#16A34A]',
      badge: 'bg-[#16A34A] text-white',
      icon: <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />,
      scopeCopy:
        'Application and supporting certificate are verified within the scope of checks performed.',
    },
    FAILED: {
      bg: 'bg-red-50/90',
      border: 'border-[#DC2626]',
      badge: 'bg-[#DC2626] text-white',
      icon: <XCircle className="w-7 h-7 text-[#DC2626]" />,
      scopeCopy:
        'Application failed automated validation due to mandatory template or regulatory compliance rule violations cited below.',
    },
    FLAGGED: {
      bg: 'bg-amber-50/90',
      border: 'border-[#F59E0B]',
      badge: 'bg-[#F59E0B] text-white',
      icon: <AlertTriangle className="w-7 h-7 text-[#F59E0B]" />,
      scopeCopy:
        'Flagged due to elevated visual authenticity risk indicator. GAN-based analysis is a risk indicator, not proof of forgery.',
    },
    'REQUIRES HUMAN REVIEW': {
      bg: 'bg-indigo-50/90',
      border: 'border-[#6366F1]',
      badge: 'bg-[#6366F1] text-white',
      icon: <HelpCircle className="w-7 h-7 text-[#6366F1]" />,
      scopeCopy:
        'No matching rule found in the reference documents for one or more specialized fields. Escalated for human administrative determination.',
    },
  };

  const st = statusConfig[run.overallStatus];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <button
          type="button"
          onClick={onBackToReview}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Review Dashboard</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4 text-[#14B8A6]" />
            <span>Download JSON</span>
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#14B8A6]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Certificate Report Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Report Header */}
        <div className="bg-[#0B1F3A] text-white p-6 sm:p-8 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#14B8A6]" />
                <span className="text-xs font-mono uppercase tracking-wider text-[#14B8A6]">
                  ORYAN FORGE • SIH 2026 (PS 26261) • VERIFICATION REPORT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-[#FF9933]">
                  SIMULATED
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">
                Final Compliance &amp; Authenticity Audit Dossier
              </h1>
              <p className="text-xs text-slate-300 font-mono">
                Verification Run: {run.id} &bull; Application ID: {run.applicationId}{' '}
                &bull; Document: {run.fileName}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-300 space-y-0.5">
              <div>Created: {new Date(run.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(run.updatedAt).toLocaleString()}</div>
              <div>Scenario: {run.scenarioId}</div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* 1. Four-State Final Outcome Banner */}
          <div
            className={`rounded-2xl border-2 p-5 flex items-start gap-4 ${st.bg} ${st.border}`}
          >
            <div className="shrink-0 mt-0.5">{st.icon}</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-md ${st.badge}`}
                >
                  FINAL REPORT STATUS: {run.overallStatus}
                </span>
                {run.reviewerDecision && (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#0B1F3A] text-white">
                    OFFICER SIGN-OFF: {run.reviewerDecision}
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-900">
                {run.statusBannerText}
              </p>
              <p className="text-xs text-slate-700">{st.scopeCopy}</p>
            </div>
          </div>

          {/* 2. Stage-by-Stage Execution Summary */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              1. Sequential Pipeline Stage Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Stage 1 • OCR
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  Status: {run.stages.ocr.state.toUpperCase()}
                </div>
                <p className="text-slate-600 mt-1">{run.stages.ocr.summary}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Stage 2 • Template Gate
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  Status: {run.stages.template.state.toUpperCase()}
                </div>
                <p className="text-slate-600 mt-1">{run.stages.template.summary}</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Stage 3 • GAN Authenticity
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  Status: {run.stages.authenticity.state.toUpperCase()}
                </div>
                <p className="text-slate-600 mt-1">
                  {run.stages.authenticity.state === 'skipped'
                    ? 'Skipped (Halted at Stage 2 Gate)'
                    : run.stages.authenticity.result?.riskScoreNormalized}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="font-mono text-[10px] uppercase text-slate-500">
                  Stage 4 • RAG Compliance
                </div>
                <div className="font-bold text-slate-900 mt-0.5">
                  Status: {run.stages.compliance.state.toUpperCase()}
                </div>
                <p className="text-slate-600 mt-1">
                  {run.stages.compliance.state === 'skipped'
                    ? 'Skipped (Halted at earlier gate)'
                    : run.stages.compliance.result?.status}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Per-Field Validation Findings with Citations */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              2. Per-Field Validation Findings &amp; Regulatory Citations
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-3 px-4 font-bold">Field Label</th>
                    <th className="py-3 px-4 font-bold">Extracted / Current Value</th>
                    <th className="py-3 px-4 font-bold">Validation Status</th>
                    <th className="py-3 px-4 font-bold">
                      Regulatory Citation &amp; Finding
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {run.fields.map((f) => (
                    <tr key={f.key} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {f.label}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {f.extractedValue}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                            f.status === 'correct'
                              ? 'bg-emerald-100 text-emerald-800'
                              : f.status === 'wrong'
                              ? 'bg-red-100 text-red-800'
                              : f.status === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 space-y-1">
                        <p>{f.inlineCaption}</p>
                        {f.popover && (
                          <button
                            type="button"
                            onClick={() => onOpenPdfSnippet(f.popover!.corpusRuleId)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#0F766E] hover:underline no-print"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{f.popover.sourceChipLabel}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Reviewer Notes */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              3. Reviewing Officer Notes
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
              {run.reviewerNotes ? (
                <p className="leading-relaxed">{run.reviewerNotes}</p>
              ) : (
                <p className="italic text-slate-400">
                  No additional manual reviewer notes recorded for this run.
                </p>
              )}
            </div>
          </div>

          {/* 5. Audit Timeline */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              4. Immutable Audit Timeline (PostgreSQL audit_log)
            </h2>
            <div className="space-y-2">
              {run.auditTimeline.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">
                        {ev.action}{' '}
                        <span className="font-normal text-slate-500">
                          by {ev.actor}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{ev.detail}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">
                    {ev.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

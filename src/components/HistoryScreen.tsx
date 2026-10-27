import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ClipboardList,
  HardDrive,
  RefreshCw,
  Search,
} from 'lucide-react';
import { OverallStatus, SqlLogEntry, VerificationRun } from '../types';
import { SCENARIO_META } from '../mock/tools';

interface HistoryScreenProps {
  runs: VerificationRun[];
  sqlLogs: SqlLogEntry[];
  activeRunId: string;
  onSelectRunForReview: (run: VerificationRun) => void;
  onSelectRunForReport: (run: VerificationRun) => void;
  onRefreshFromApi: () => Promise<void>;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  runs,
  sqlLogs,
  activeRunId,
  onSelectRunForReview,
  onSelectRunForReport,
  onRefreshFromApi,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshFromApi();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredRuns = runs.filter((r) => {
    const matchesStatus =
      statusFilter === 'ALL' || r.overallStatus === statusFilter;
    const matchesSearch =
      !searchTerm.trim() ||
      r.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fields.some((f) =>
        f.extractedValue.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  });

  const renderStatusPill = (status: OverallStatus) => {
    switch (status) {
      case 'PASSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-[#16A34A] font-mono text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            PASSED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-100 text-[#DC2626] font-mono text-xs font-bold">
            <XCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-mono text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            FLAGGED
          </span>
        );
      case 'REQUIRES HUMAN REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-100 text-[#6366F1] font-mono text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            REQUIRES HUMAN REVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#14B8A6]" />
            <span className="text-xs font-mono font-bold uppercase text-[#0F766E]">
              RELATIONAL VERIFICATION ARCHIVE (src/mock/postgres.ts)
            </span>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-900 border border-sky-300">
              SIMULATED POSTGRESQL
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Past Verifications &amp; Audit Records ({runs.length})
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Backed by simulated PostgreSQL tables (<code className="font-mono">applications</code>,{' '}
            <code className="font-mono">verification_results</code>,{' '}
            <code className="font-mono">audit_log</code>). Click any row to inspect its
            Review Dashboard or Final Report.
          </p>
        </div>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={handleRefresh}
          className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#14B8A6] ${
              isRefreshing ? 'animate-spin' : ''
            }`}
          />
          <span>GET /api/applications</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Application ID, Applicant Name (e.g., RAHULKUMAR), or File Name..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:border-[#14B8A6]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600">Status:</span>
          <select
            aria-label="Filter history by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800"
          >
            <option value="ALL">All Statuses ({runs.length})</option>
            <option value="PASSED">PASSED</option>
            <option value="FAILED">FAILED</option>
            <option value="FLAGGED">FLAGGED</option>
            <option value="REQUIRES HUMAN REVIEW">REQUIRES HUMAN REVIEW</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold">Run ID / App ID</th>
                <th className="py-3.5 px-4 font-bold">Applicant Name</th>
                <th className="py-3.5 px-4 font-bold">Scenario Branch</th>
                <th className="py-3.5 px-4 font-bold">Overall Status</th>
                <th className="py-3.5 px-4 font-bold">Field Findings</th>
                <th className="py-3.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRuns.map((r) => {
                const applicant =
                  r.fields.find((f) => f.key === 'applicantName')
                    ?.extractedValue || '—';
                const wrongCount = r.fields.filter(
                  (f) => f.status === 'wrong'
                ).length;
                const isCurrent = r.id === activeRunId;

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      isCurrent ? 'bg-teal-50/40' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{r.applicationId}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#14B8A6] text-[#0B1F3A] font-sans font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {r.id} &bull; {r.fileName}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {applicant}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800">
                        {SCENARIO_META[r.scenarioId].shortLabel}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {renderStatusPill(r.overallStatus)}
                    </td>

                    <td className="py-3.5 px-4">
                      {wrongCount > 0 ? (
                        <span className="text-[#DC2626] font-semibold">
                          {wrongCount} violation(s) cited
                        </span>
                      ) : (
                        <span className="text-[#16A34A] font-semibold">
                          7/7 fields compliant
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => onSelectRunForReview(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white hover:bg-slate-800 font-semibold text-xs transition-colors"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#14B8A6]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectRunForReport(r)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs transition-colors"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>Report</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Fake PostgreSQL Query Log */}
      <div className="bg-[#0B1F3A] text-white rounded-2xl border border-slate-800 p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <h2 className="font-bold text-xs uppercase tracking-wider">
              Simulated PostgreSQL Transaction Log (applications, verification_results,
              audit_log)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
            SIMULATED SQL
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar font-mono text-xs">
          {sqlLogs.map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-x-2">
                <span className="text-sky-400 font-bold">[{entry.operation}]</span>
                <span className="text-slate-200">{entry.sql}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {entry.rowsAffected} row(s) • {entry.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

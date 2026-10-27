import React from 'react';
import { FileText, X, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import { CorpusEntry } from '../types';
import { MOCK_CORPUS } from '../mock/corpus';

interface PdfSnippetModalProps {
  ruleId: string | null;
  onClose: () => void;
}

export const PdfSnippetModal: React.FC<PdfSnippetModalProps> = ({
  ruleId,
  onClose,
}) => {
  if (!ruleId) return null;

  const entry: CorpusEntry =
    MOCK_CORPUS.find((e) => e.ruleId === ruleId) || MOCK_CORPUS[0];

  const neighborEntries = MOCK_CORPUS.filter(
    (e) => e.docName === entry.docName && e.ruleId !== entry.ruleId
  ).slice(0, 2);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="bg-[#0B1F3A] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/20 border border-[#14B8A6]/40 flex items-center justify-center text-[#14B8A6]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base">
                  {entry.fileName}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FF9933]/20 text-[#FF9933] border border-[#FF9933]/40">
                  DEMO DATA • SIMULATED PDF
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {entry.docName} — Page {entry.page} • {entry.section} (
                {entry.sectionTitle})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close PDF snippet modal"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Simulated PDF Page Body */}
        <div className="p-6 bg-slate-100 max-h-[75vh] overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-inner font-serif text-slate-800 space-y-5">
            {/* Fake PDF Page Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs font-sans text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-slate-600">
                {entry.docName}
              </span>
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Page {entry.page} of 28
              </span>
            </div>

            {/* Prior context paragraph */}
            <div className="text-xs text-slate-400 leading-relaxed select-none">
              <p className="font-sans font-semibold text-slate-400 mb-1">
                Preceding Regulatory Context
              </p>
              <p>
                All automated and officer-assisted verification workflows must validate
                extracted metadata fields against the canonical formatting and temporal
                bounds defined in this section prior to issuing a compliance clearance.
              </p>
            </div>

            {/* Highlighted Retrieved Passage */}
            <div className="relative rounded-xl border-2 border-[#14B8A6] bg-[#14B8A6]/10 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-2 font-sans">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1F3A] bg-[#14B8A6]/30 px-2.5 py-0.5 rounded-md">
                  <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                  Retrieved Corpus Passage • Rule ID: {entry.ruleId}
                </span>
                <span className="text-xs font-mono font-semibold text-[#0F766E]">
                  {entry.section} • Page {entry.page}
                </span>
              </div>
              <p className="text-sm sm:text-base font-sans font-medium text-slate-900 leading-relaxed bg-yellow-100/80 px-2.5 py-2 rounded border border-yellow-300">
                {entry.text}
              </p>
            </div>

            {/* Related passages in same document */}
            {neighborEntries.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 font-sans">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Adjacent Clauses in {entry.docName}
                </p>
                {neighborEntries.map((n) => (
                  <div
                    key={n.ruleId}
                    className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200"
                  >
                    <span className="font-mono font-semibold text-slate-700">
                      [{n.ruleId}, p.{n.page}]
                    </span>{' '}
                    {n.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6]" />
            Source verified from <code className="font-mono">src/mock/corpus.ts</code>{' '}
            (20-entry demo corpus)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0B1F3A] text-white font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Snippet
          </button>
        </div>
      </div>
    </div>
  );
};

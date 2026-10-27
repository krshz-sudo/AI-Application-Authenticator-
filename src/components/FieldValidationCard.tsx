import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Info,
  AlertTriangle,
  HelpCircle,
  Edit3,
  RotateCcw,
  FileText,
  Flag,
  Sparkles,
  X,
} from 'lucide-react';
import { FieldKey, FieldValidationDetail } from '../types';

interface FieldValidationCardProps {
  field: FieldValidationDetail;
  isHighlighted: boolean;
  onHoverField: (key: FieldKey | null) => void;
  onReverifyField: (key: FieldKey, newValue: string) => Promise<void>;
  onOpenPdfSnippet: (ruleId: string) => void;
  onToggleMarkForReview: (key: FieldKey) => void;
  defaultOpenPopover?: boolean;
}

export const FieldValidationCard: React.FC<FieldValidationCardProps> = ({
  field,
  isHighlighted,
  onHoverField,
  onReverifyField,
  onOpenPdfSnippet,
  onToggleMarkForReview,
  defaultOpenPopover = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(defaultOpenPopover);
  const [isPopoverPinned, setIsPopoverPinned] = useState(defaultOpenPopover);
  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(field.extractedValue);
  const [isReverifying, setIsReverifying] = useState(false);
  const [justTurnedGreen, setJustTurnedGreen] = useState(false);

  useEffect(() => {
    setDraftValue(field.extractedValue);
  }, [field.extractedValue]);

  useEffect(() => {
    if (defaultOpenPopover && field.status === 'wrong') {
      setIsPopoverOpen(true);
      setIsPopoverPinned(true);
    }
  }, [defaultOpenPopover, field.status]);

  useEffect(() => {
    if (field.wasEditedAndVerified && field.status === 'correct') {
      setJustTurnedGreen(true);
      const timer = setTimeout(() => setJustTurnedGreen(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [field.wasEditedAndVerified, field.status]);

  const handleStartEdit = () => {
    setIsEditing(true);
    setIsPopoverOpen(false);
    setIsPopoverPinned(false);
  };

  const handleApplySuggested = () => {
    if (field.expectedValue) {
      // Strip parenthetical note if present, e.g. "15/03/2028 (Must be active...)" -> "15/03/2028"
      const cleanExpected = field.expectedValue.split(' (')[0].trim();
      setDraftValue(cleanExpected);
    }
  };

  const handleReverifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReverifying(true);
    try {
      await onReverifyField(field.key, draftValue);
      setIsEditing(false);
    } finally {
      setIsReverifying(false);
    }
  };

  // Determine styling based on field.status
  const statusStyles = {
    correct: {
      cardBorder: 'border-[#16A34A]',
      cardBg: 'bg-[#16A34A]/[0.06]',
      inputBorder: 'border-[#16A34A]/50 bg-white text-slate-900',
      badgeBg: 'bg-[#16A34A]/15 text-[#16A34A] border-[#16A34A]/30',
      captionColor: 'text-[#15803D]',
      labelText: 'VALIDATED',
    },
    wrong: {
      cardBorder: 'border-[#DC2626]',
      cardBg: 'bg-[#DC2626]/[0.06]',
      inputBorder: 'border-[#DC2626]/60 bg-red-50/70 text-red-950',
      badgeBg: 'bg-[#DC2626]/15 text-[#DC2626] border-[#DC2626]/30',
      captionColor: 'text-[#DC2626]',
      labelText: 'NON-COMPLIANT',
    },
    warning: {
      cardBorder: 'border-[#F59E0B]',
      cardBg: 'bg-[#F59E0B]/[0.08]',
      inputBorder: 'border-[#F59E0B]/60 bg-amber-50/60 text-amber-950',
      badgeBg: 'bg-[#F59E0B]/20 text-amber-800 border-[#F59E0B]/40',
      captionColor: 'text-amber-800',
      labelText: 'WARNING',
    },
    needs_review: {
      cardBorder: 'border-[#6366F1]',
      cardBg: 'bg-[#6366F1]/[0.08]',
      inputBorder: 'border-[#6366F1]/60 bg-indigo-50/60 text-indigo-950',
      badgeBg: 'bg-[#6366F1]/15 text-[#6366F1] border-[#6366F1]/30',
      captionColor: 'text-[#4F46E5]',
      labelText: 'NEEDS REVIEW',
    },
  }[field.status];

  return (
    <motion.div
      onMouseEnter={() => onHoverField(field.key)}
      onMouseLeave={() => onHoverField(null)}
      animate={
        justTurnedGreen
          ? {
              boxShadow: [
                '0 0 0 0px rgba(22, 163, 74, 0)',
                '0 0 0 6px rgba(22, 163, 74, 0.28)',
                '0 0 0 0px rgba(22, 163, 74, 0)',
              ],
            }
          : undefined
      }
      transition={{ duration: 1.1 }}
      className={`relative rounded-xl border-2 p-4 transition-all ${
        statusStyles.cardBorder
      } ${statusStyles.cardBg} ${
        isHighlighted ? 'ring-2 ring-[#0B1F3A] shadow-md' : 'shadow-sm'
      }`}
    >
      {/* Top Row: Field Label + Status Badge + Action Icons */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {field.label}
          </label>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${statusStyles.badgeBg}`}
          >
            {statusStyles.labelText}
          </span>
          {field.wasEditedAndVerified && field.status === 'correct' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Re-verified
            </span>
          )}
          {field.markedForReview && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-600 text-white flex items-center gap-1">
              <Flag className="w-3 h-3" />
              Marked for Review
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="text-xs font-medium text-slate-600 hover:text-[#0B1F3A] px-2 py-1 rounded hover:bg-white/80 border border-transparent hover:border-slate-300 flex items-center gap-1 transition-colors"
              title={`Edit ${field.label}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}

          {/* Status Icon (Green Tick / Red (i) Info Icon / Warning / Needs Review) */}
          {field.status === 'correct' && (
            <motion.div
              key={`tick-${field.extractedValue}`}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: [0.4, 1.25, 1], opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-7 h-7 rounded-full bg-[#16A34A] text-white flex items-center justify-center shadow-sm"
              title="Field complies with regulatory guidelines"
            >
              <CheckCircle2 className="w-4 h-4" />
            </motion.div>
          )}

          {field.status === 'wrong' && (
            <div
              className="relative"
              onMouseEnter={() => setIsPopoverOpen(true)}
              onMouseLeave={() => {
                if (!isPopoverPinned) setIsPopoverOpen(false);
              }}
            >
              <button
                type="button"
                aria-label={`View compliance violation details for ${field.label}`}
                onClick={() => {
                  const next = !isPopoverPinned;
                  setIsPopoverPinned(next);
                  setIsPopoverOpen(next);
                }}
                className="w-7 h-7 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-transform hover:scale-105"
                title="Click or hover for regulatory rule citation"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          )}

          {field.status === 'warning' && (
            <div
              className="w-7 h-7 rounded-full bg-[#F59E0B] text-white flex items-center justify-center shadow-sm"
              title="Uncertain evidence — requires human review"
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          )}

          {field.status === 'needs_review' && (
            <div
              className="w-7 h-7 rounded-full bg-[#6366F1] text-white flex items-center justify-center shadow-sm"
              title="No matching rule found — requires human review"
            >
              <HelpCircle className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Field Input Box / Inline Editor */}
      {!isEditing ? (
        <div
          onClick={() => {
            if (field.status === 'wrong') {
              setIsPopoverOpen((prev) => !prev);
              setIsPopoverPinned((prev) => !prev);
            }
          }}
          className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-sm font-semibold flex items-center justify-between gap-2 ${
            statusStyles.inputBorder
          } ${field.status === 'wrong' ? 'cursor-pointer' : ''}`}
        >
          <span className="break-all">{field.extractedValue}</span>
          {field.status === 'wrong' && (
            <span className="text-[11px] font-sans font-medium text-[#DC2626] shrink-0 underline decoration-dotted">
              {isPopoverOpen ? 'Hide details' : 'Why is this wrong? (i)'}
            </span>
          )}
        </div>
      ) : (
        <form onSubmit={handleReverifySubmit} className="space-y-2.5 bg-white p-3 rounded-lg border border-slate-300 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Edit {field.label} Value:
            </span>
            {field.expectedValue && (
              <button
                type="button"
                onClick={handleApplySuggested}
                className="text-xs font-semibold text-[#0F766E] bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 px-2.5 py-1 rounded border border-[#14B8A6]/30 transition-colors"
              >
                Use Expected: &ldquo;{field.expectedValue.split(' (')[0]}&rdquo;
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#14B8A6] focus:ring-2 focus:ring-[#14B8A6]/20"
              placeholder={`Enter valid ${field.label}`}
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                disabled={isReverifying}
                className="px-3.5 py-2 rounded-lg bg-[#14B8A6] text-[#0B1F3A] font-bold text-xs hover:bg-[#0D9488] hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 ${isReverifying ? 'animate-spin' : ''}`}
                />
                <span>{isReverifying ? 'Re-verifying...' : 'Re-verify'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setDraftValue(field.extractedValue);
                }}
                className="px-2.5 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Inline One-Line Reason / Caption */}
      <p
        className={`mt-2 text-xs font-medium leading-snug ${statusStyles.captionColor}`}
      >
        {field.inlineCaption}
      </p>

      {/* EXACT POPOVER STRUCTURE FOR WRONG FIELDS */}
      <AnimatePresence>
        {field.status === 'wrong' && field.popover && isPopoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="mt-3 rounded-xl bg-white border-2 border-[#DC2626] shadow-xl p-4 text-slate-800 space-y-3 z-30 relative"
          >
            <div className="flex items-start justify-between gap-2 border-b border-red-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center shrink-0">
                  <Info className="w-4 h-4" />
                </span>
                <h4 className="font-bold text-sm text-[#DC2626]">
                  {field.popover.title}
                </h4>
              </div>
              <button
                type="button"
                aria-label="Close explanation popover"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setIsPopoverPinned(false);
                }}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                <span className="text-[11px] font-semibold uppercase text-red-700 block mb-0.5">
                  Extracted value:
                </span>
                <span className="font-mono font-bold text-red-950 text-sm">
                  {field.popover.extractedValue}
                </span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                <span className="text-[11px] font-semibold uppercase text-emerald-700 block mb-0.5">
                  Expected:
                </span>
                <span className="font-mono font-bold text-emerald-950 text-sm">
                  {field.popover.expectedValue}
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="font-bold text-slate-700">Why: </span>
              <p className="text-slate-700 leading-relaxed">
                {field.popover.why}
              </p>
            </div>

            {/* Source Chip (clicking opens fake PDF-snippet modal) */}
            <div className="pt-0.5">
              <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                Source Citation (Click to inspect PDF snippet):
              </span>
              <button
                type="button"
                onClick={() => onOpenPdfSnippet(field.popover!.corpusRuleId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-[#14B8A6] hover:bg-slate-800 font-mono text-xs font-semibold shadow-sm transition-colors text-left"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>{field.popover.sourceChipLabel}</span>
              </button>
            </div>

            <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              <span className="font-bold text-slate-800">Suggested fix: </span>
              <span className="text-slate-700">{field.popover.suggestedFix}</span>
            </div>

            {/* Required Buttons: "Edit field" and "Mark for review" */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-3.5 py-1.5 rounded-lg bg-[#0B1F3A] text-white hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit field</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleMarkForReview(field.key)}
                className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  field.markedForReview
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {field.markedForReview ? 'Marked for review' : 'Mark for review'}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

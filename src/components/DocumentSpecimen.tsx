import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Stamp,
} from 'lucide-react';
import {
  AuthenticityResult,
  FieldKey,
  FieldValidationDetail,
  ScenarioId,
} from '../types';

interface DocumentSpecimenProps {
  fileName: string;
  scenarioId: ScenarioId;
  fields: FieldValidationDetail[];
  highlightedField: FieldKey | null;
  onSelectField?: (key: FieldKey | null) => void;
  isScanning?: boolean;
  authenticityResult?: AuthenticityResult;
  showBoundingBoxes?: boolean;
}

export const DocumentSpecimen: React.FC<DocumentSpecimenProps> = ({
  fileName,
  scenarioId,
  fields,
  highlightedField,
  onSelectField,
  isScanning = false,
  authenticityResult,
  showBoundingBoxes = true,
}) => {
  const getField = (key: FieldKey) => fields.find((f) => f.key === key);

  const renderFieldBox = (key: FieldKey, label: string, fallbackVal: string) => {
    const f = getField(key);
    const val = f ? f.extractedValue : fallbackVal;
    const status = f?.status || 'correct';
    const isActive = highlightedField === key;

    const boxColor = !showBoundingBoxes
      ? 'border-slate-300 bg-slate-50/70'
      : status === 'correct'
      ? 'border-[#16A34A] bg-[#16A34A]/10'
      : status === 'wrong'
      ? 'border-[#DC2626] bg-[#DC2626]/15'
      : status === 'warning'
      ? 'border-[#F59E0B] bg-[#F59E0B]/15'
      : 'border-[#6366F1] bg-[#6366F1]/15';

    return (
      <div
        key={key}
        onMouseEnter={() => onSelectField?.(key)}
        onMouseLeave={() => onSelectField?.(null)}
        onClick={() => onSelectField?.(key)}
        className={`relative rounded-lg border-2 p-2.5 transition-all cursor-pointer ${boxColor} ${
          isActive ? 'ring-2 ring-[#0B1F3A] scale-[1.01] shadow-md z-10' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </span>
          {showBoundingBoxes && f && (
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                status === 'correct'
                  ? 'bg-[#16A34A] text-white'
                  : status === 'wrong'
                  ? 'bg-[#DC2626] text-white'
                  : status === 'warning'
                  ? 'bg-[#F59E0B] text-white'
                  : 'bg-[#6366F1] text-white'
              }`}
            >
              {status === 'correct'
                ? 'OK'
                : status === 'wrong'
                ? 'RULE VIOLATION'
                : 'REVIEW'}
            </span>
          )}
        </div>
        <div
          className={`font-mono text-xs sm:text-sm font-bold break-words ${
            status === 'wrong' && showBoundingBoxes
              ? 'text-red-900'
              : 'text-slate-900'
          }`}
        >
          {val}
        </div>
      </div>
    );
  };

  const photoFlagged =
    scenarioId === 'C' || (authenticityResult && !authenticityResult.passed);

  return (
    <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl">
      {/* Document Toolbar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs text-slate-300">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-[#14B8A6] shrink-0" />
          <span className="font-mono font-medium truncate text-white">
            {fileName}
          </span>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-[#14B8A6] border border-slate-700 shrink-0">
            SIMULATED SPECIMEN
          </span>
        </div>
        {isScanning && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#14B8A6] animate-pulse">
            <Scan className="w-3.5 h-3.5" />
            OCR Scanning...
          </span>
        )}
      </div>

      {/* Simulated Paper Document Page */}
      <div className="relative bg-white rounded-xl border-2 border-slate-300 shadow-inner p-5 sm:p-6 text-slate-900 overflow-hidden">
        {/* Animated OCR Laser Scan Line */}
        {isScanning && (
          <motion.div
            initial={{ top: '2%' }}
            animate={{ top: ['4%', '94%', '4%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#14B8A6] to-transparent shadow-[0_0_16px_4px_rgba(20,184,166,0.65)] z-30 pointer-events-none"
          />
        )}

        {/* Document Header (No government logos per instructions) */}
        <div className="border-b-2 border-[#0B1F3A] pb-3 mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-[#0B1F3A] text-white">
                FORM A-1 • STATUTORY COMPLIANCE DOSSIER
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                REV 2024.4
              </span>
            </div>
            <h4 className="font-bold text-sm sm:text-base text-[#0B1F3A] mt-1.5">
              APPLICATION &amp; REGULATORY COMPLIANCE CERTIFICATE
            </h4>
            <p className="text-[11px] text-slate-500">
              Standardized Verification Dossier — Subject to Template, Authenticity &amp;
              Corpus Rules
            </p>
          </div>
          <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
            <div>DOC-TYPE: FORM-A1</div>
            <div>SCHEMA: v2.4</div>
          </div>
        </div>

        {/* Row 1: Application Number & Certificate Number */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {renderFieldBox(
            'applicationNumber',
            '1. Application Number',
            'APP-2026-783920'
          )}
          {renderFieldBox(
            'certificateNumber',
            '2. Certificate Number',
            'MH20219042'
          )}
        </div>

        {/* Row 2: Left (Applicant Name + DOB) | Right (Applicant Portrait Box) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="sm:col-span-2 space-y-3">
            {renderFieldBox('applicantName', '3. Applicant Name', 'RAHULKUMAR')}
            {renderFieldBox('dateOfBirth', '4. Date of Birth', '22/07/1997')}
          </div>

          {/* Portrait Region with GAN Risk Indicator Highlight when applicable */}
          <div
            className={`relative rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center transition-all ${
              photoFlagged
                ? 'border-[#F59E0B] bg-amber-50/90 ring-4 ring-amber-400/30'
                : 'border-slate-300 bg-slate-50'
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-1.5 border ${
                photoFlagged
                  ? 'bg-amber-200/70 border-amber-500 text-amber-900'
                  : 'bg-slate-200 border-slate-300 text-slate-600'
              }`}
            >
              <UserCheck className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-600">
              Applicant Portrait
            </span>
            {photoFlagged ? (
              <div className="mt-1.5 px-2 py-1 rounded bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>GAN Risk Indicator (0.78)</span>
              </div>
            ) : (
              <span className="mt-1 text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Patch Uniform (0.12)
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Address */}
        <div className="mb-3">
          {renderFieldBox(
            'address',
            '5. Registered Postal Address (6-Digit PIN Mandatory)',
            'Plot 19, Sector 14, Vashi, Navi Mumbai, Maharashtra - 400703'
          )}
        </div>

        {/* Row 4: Valid From & Valid Until */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {renderFieldBox('validFrom', '6. Valid From', '16/03/2021')}
          {renderFieldBox('validUntil', '7. Valid Until', '15/03/2024')}
        </div>

        {/* Bottom Document Seal & Attestation */}
        <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Declaration:</span> All
            particulars stated above are subject to automated rule verification.
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[10px] font-semibold ${
              photoFlagged
                ? 'border-amber-500 bg-amber-50 text-amber-800'
                : 'border-slate-300 bg-slate-50 text-slate-600'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>ISSUING SEAL REGION</span>
          </div>
        </div>
      </div>

      {/* Legend under Document Preview */}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
            Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
            Rule Violation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            Risk Indicator / Warning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
            Human Review
          </span>
        </div>
        <span className="text-slate-400 font-mono">
          Hover or click any box to highlight field
        </span>
      </div>
    </div>
  );
};

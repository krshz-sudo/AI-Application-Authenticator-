import React from 'react';
import { Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B1F3A] text-slate-300 border-t border-slate-800 mt-auto no-print">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 mb-4 border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <Info className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">Visual Authenticity Scope:</strong> GAN-based
              analysis is a risk indicator, not proof of forgery, and is different from
              cryptographic signature validation.
            </p>
          </div>
          <div className="flex items-start gap-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <Info className="w-4 h-4 text-[#FF9933] shrink-0 mt-0.5" />
            <p>
              <strong className="text-white">RAG Compliance Scope:</strong> Vector
              similarity only retrieves evidence. The compliance decision uses the
              retrieved rule text plus deterministic checks.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <p className="font-mono font-medium text-slate-200">
            Prototype simulation | SIH 2026 | PS 26261 | Oryan Forge
          </p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              All Backend, OCR, GAN, ChromaDB &amp; PostgreSQL Modules: SIMULATED IN BROWSER
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

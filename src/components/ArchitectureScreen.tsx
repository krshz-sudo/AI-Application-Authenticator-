import React, { useState } from 'react';
import {
  Network,
  Database,
  HardDrive,
  FileCode2,
  BookOpen,
  FileText,
} from 'lucide-react';
import { MOCK_CORPUS } from '../mock/corpus';

interface ArchitectureScreenProps {
  onOpenPdfSnippet: (ruleId: string) => void;
}

export const ArchitectureScreen: React.FC<ArchitectureScreenProps> = ({
  onOpenPdfSnippet,
}) => {
  const [selectedDocFilter, setSelectedDocFilter] = useState<string>('ALL');

  const docNames = Array.from(new Set(MOCK_CORPUS.map((c) => c.docName)));
  const filteredCorpus =
    selectedDocFilter === 'ALL'
      ? MOCK_CORPUS
      : MOCK_CORPUS.filter((c) => c.docName === selectedDocFilter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-[#14B8A6]" />
            <span className="text-xs font-mono font-bold uppercase text-[#0F766E]">
              SYSTEM ARCHITECTURE &amp; DATA TOPOLOGY
            </span>
            <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              SIMULATED IN THIS PROTOTYPE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Agentic Verification Pipeline &amp; Dual-Store Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Relational PostgreSQL (structured application &amp; audit data) is kept
            strictly separate from the Vector DB (ChromaDB / Pinecone / FAISS semantic
            regulatory corpus).
          </p>
        </div>

        {/* Arrow Legend */}
        <div className="flex items-center gap-5 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium shrink-0">
          <div className="flex items-center gap-2">
            <svg width="36" height="12" className="shrink-0">
              <line
                x1="0"
                y1="6"
                x2="30"
                y2="6"
                stroke="#0B1F3A"
                strokeWidth="2.5"
              />
              <polygon points="28,2 36,6 28,10" fill="#0B1F3A" />
            </svg>
            <span className="text-slate-800 font-semibold">
              Solid Arrow = Control Flow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="36" height="12" className="shrink-0">
              <line
                x1="0"
                y1="6"
                x2="30"
                y2="6"
                stroke="#14B8A6"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />
              <polygon points="28,2 36,6 28,10" fill="#14B8A6" />
            </svg>
            <span className="text-slate-800 font-semibold">
              Dashed Arrow = Data Flow
            </span>
          </div>
        </div>
      </div>

      {/* Main SVG Architecture Diagram */}
      <div className="bg-[#0B1F3A] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl overflow-x-auto">
        <div className="min-w-[1040px]">
          <svg
            viewBox="0 0 1120 620"
            className="w-full h-auto select-none"
            role="img"
            aria-label="System Architecture Diagram showing Frontend, HTTP JSON API, Orchestration Agent, Tools, Vector DB, and PostgreSQL"
          >
            <defs>
              <marker
                id="arrow-solid"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="5"
                orient="auto"
              >
                <path d="M0,1 L9,5 L0,9 Z" fill="#F8FAFC" />
              </marker>
              <marker
                id="arrow-dashed"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="5"
                orient="auto"
              >
                <path d="M0,1 L9,5 L0,9 Z" fill="#14B8A6" />
              </marker>
              <marker
                id="arrow-saffron"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="5"
                orient="auto"
              >
                <path d="M0,1 L9,5 L0,9 Z" fill="#FF9933" />
              </marker>
            </defs>

            {/* Background Grid Subtle Box */}
            <rect
              x="10"
              y="10"
              width="1100"
              height="600"
              rx="16"
              fill="#071527"
              stroke="#1E293B"
              strokeWidth="2"
            />

            {/* Top Banner inside SVG */}
            <text
              x="35"
              y="42"
              fill="#94A3B8"
              fontSize="12"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              SIH 2026 • PS 26261 • TEAM ORYAN FORGE — EVERY COMPONENT LABELED
              &quot;SIMULATED IN THIS PROTOTYPE&quot;
            </text>

            {/* 1. FRONTEND LAYER */}
            <rect
              x="35"
              y="70"
              width="210"
              height="190"
              rx="12"
              fill="#102A4C"
              stroke="#14B8A6"
              strokeWidth="2"
            />
            <rect
              x="48"
              y="82"
              width="184"
              height="20"
              rx="4"
              fill="#14B8A6"
              fillOpacity="0.2"
            />
            <text
              x="140"
              y="96"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              SIMULATED IN THIS PROTOTYPE
            </text>
            <text
              x="140"
              y="122"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="15"
              fontWeight="700"
            >
              1. React Frontend UI
            </text>
            <text
              x="140"
              y="144"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • Document Dropzone &amp; Specimen
            </text>
            <text
              x="140"
              y="164"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • 4-Stage Pipeline Stepper
            </text>
            <text
              x="140"
              y="184"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • Field Cards: Green Tick / Red (i)
            </text>
            <text
              x="140"
              y="204"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • Inline Edit &amp; Re-Verify Loop
            </text>
            <text
              x="140"
              y="224"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • PDF Snippet Citation Modal
            </text>

            {/* Arrows Frontend <-> HTTP/JSON API */}
            <line
              x1="245"
              y1="145"
              x2="310"
              y2="145"
              stroke="#F8FAFC"
              strokeWidth="2.5"
              markerEnd="url(#arrow-solid)"
            />
            <text
              x="278"
              y="136"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              Control
            </text>
            <line
              x1="310"
              y1="185"
              x2="245"
              y2="185"
              stroke="#14B8A6"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              markerEnd="url(#arrow-dashed)"
            />
            <text
              x="278"
              y="202"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              JSON DTO
            </text>

            {/* 2. HTTP / JSON API LAYER */}
            <rect
              x="315"
              y="70"
              width="215"
              height="190"
              rx="12"
              fill="#102A4C"
              stroke="#FF9933"
              strokeWidth="2"
            />
            <rect
              x="328"
              y="82"
              width="188"
              height="20"
              rx="4"
              fill="#FF9933"
              fillOpacity="0.2"
            />
            <text
              x="422"
              y="96"
              textAnchor="middle"
              fill="#FF9933"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              SIMULATED IN THIS PROTOTYPE
            </text>
            <text
              x="422"
              y="122"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="15"
              fontWeight="700"
            >
              2. HTTP / JSON API
            </text>
            <text
              x="422"
              y="140"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              src/mock/api.ts
            </text>
            <text
              x="422"
              y="165"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              POST /api/verify
            </text>
            <text
              x="422"
              y="185"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              GET /api/applications
            </text>
            <text
              x="422"
              y="205"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
            >
              GET /api/applications/:id
            </text>
            <text
              x="422"
              y="230"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              Status 200 / 422 + Latency Log
            </text>

            {/* Arrows API <-> Orchestration Agent */}
            <line
              x1="530"
              y1="145"
              x2="600"
              y2="145"
              stroke="#F8FAFC"
              strokeWidth="2.5"
              markerEnd="url(#arrow-solid)"
            />
            <text
              x="565"
              y="136"
              textAnchor="middle"
              fill="#E2E8F0"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              Invoke
            </text>
            <line
              x1="600"
              y1="185"
              x2="530"
              y2="185"
              stroke="#14B8A6"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              markerEnd="url(#arrow-dashed)"
            />
            <text
              x="565"
              y="202"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              Result
            </text>

            {/* 3. ORCHESTRATION AGENT */}
            <rect
              x="605"
              y="70"
              width="475"
              height="190"
              rx="12"
              fill="#102A4C"
              stroke="#14B8A6"
              strokeWidth="2.5"
            />
            <rect
              x="620"
              y="82"
              width="210"
              height="20"
              rx="4"
              fill="#14B8A6"
              fillOpacity="0.2"
            />
            <text
              x="725"
              y="96"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              SIMULATED IN THIS PROTOTYPE
            </text>
            <text
              x="842"
              y="122"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="16"
              fontWeight="700"
            >
              3. Orchestration Agent (src/mock/orchestrator.ts)
            </text>
            <text
              x="842"
              y="144"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              Enforces Strict Sequential Pipeline Execution &amp; Decision Diamond
              Routing:
            </text>
            <text
              x="842"
              y="170"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
            >
              [1. OCR] &rarr; &lt;Gate 1&gt; &rarr; [2. Template] &rarr; &lt;Gate
              2&gt; &rarr; [3. GAN Auth] &rarr; &lt;Gate 3&gt; &rarr; [4. RAG]
            </text>
            <text
              x="842"
              y="196"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • Halts &amp; marks downstream stages &quot;Skipped&quot; if Template
              Validation fails
            </text>
            <text
              x="842"
              y="218"
              textAnchor="middle"
              fill="#CBD5E1"
              fontSize="11"
            >
              • Streams live tool telemetry to the Agent Activity panel
            </text>

            {/* Control Flow Arrows from Orchestrator down to the 6 Tools */}
            {[115, 290, 465, 640, 815, 990].map((xPos, i) => (
              <g key={i}>
                <line
                  x1={660 + i * 72}
                  y1="260"
                  x2={xPos}
                  y2="320"
                  stroke="#F8FAFC"
                  strokeWidth="2"
                  markerEnd="url(#arrow-solid)"
                />
              </g>
            ))}

            {/* 4. TOOLS ROW (src/mock/tools.ts) */}
            {[
              {
                x: 35,
                title: 'ocrTool',
                sub: 'Stage 1: Layout OCR',
                desc: 'Extracts 7 Form A-1 fields',
              },
              {
                x: 210,
                title: 'templateTool',
                sub: 'Stage 2: Gate Check',
                desc: 'Mandatory fields & syntax',
              },
              {
                x: 385,
                title: 'authenticityTool',
                sub: 'Stage 3: GAN Screening',
                desc: 'Visual risk indicator only',
              },
              {
                x: 560,
                title: 'ragRetrieveTool',
                sub: 'Stage 4a: Vector Top-3',
                desc: 'Queries ChromaDB embeddings',
              },
              {
                x: 735,
                title: 'complianceTool + LLM',
                sub: 'Stage 4b: Rule + Explain',
                desc: 'Deterministic + corpus rules',
              },
              {
                x: 910,
                title: 'dbTool',
                sub: 'Persistence Adapter',
                desc: 'Writes SQL to Postgres',
              },
            ].map((t) => (
              <g key={t.title}>
                <rect
                  x={t.x}
                  y="325"
                  width="165"
                  height="115"
                  rx="10"
                  fill="#0F2542"
                  stroke="#334155"
                  strokeWidth="2"
                />
                <text
                  x={t.x + 82}
                  y="344"
                  textAnchor="middle"
                  fill="#FF9933"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  SIMULATED TOOL
                </text>
                <text
                  x={t.x + 82}
                  y="366"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="12.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="700"
                >
                  {t.title}
                </text>
                <text
                  x={t.x + 82}
                  y="386"
                  textAnchor="middle"
                  fill="#14B8A6"
                  fontSize="10.5"
                  fontWeight="600"
                >
                  {t.sub}
                </text>
                <text
                  x={t.x + 82}
                  y="406"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                >
                  {t.desc}
                </text>
                <text
                  x={t.x + 82}
                  y="426"
                  textAnchor="middle"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  src/mock/tools.ts
                </text>
              </g>
            ))}

            {/* 5. SEPARATE DATA STORES AT BOTTOM: Left = Vector DB (ChromaDB/Pinecone/FAISS) | Right = PostgreSQL (Relational) */}
            {/* Dashed Data Flow Arrows between ragRetrieveTool <-> Vector DB */}
            <line
              x1="625"
              y1="440"
              x2="370"
              y2="485"
              stroke="#14B8A6"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              markerEnd="url(#arrow-dashed)"
            />
            <text
              x="360"
              y="462"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Top-3 Passages (0.91 / 0.84 / 0.79)
            </text>

            {/* Dashed Data Flow Arrows between dbTool <-> PostgreSQL */}
            <line
              x1="990"
              y1="440"
              x2="860"
              y2="485"
              stroke="#FF9933"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              markerEnd="url(#arrow-saffron)"
            />
            <text
              x="1015"
              y="468"
              textAnchor="middle"
              fill="#FF9933"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              SQL INSERT / UPDATE
            </text>

            {/* Store A: Vector DB (ChromaDB / Pinecone / FAISS) */}
            <rect
              x="35"
              y="488"
              width="495"
              height="102"
              rx="12"
              fill="#0A2E36"
              stroke="#14B8A6"
              strokeWidth="2.5"
            />
            <text
              x="55"
              y="512"
              fill="#14B8A6"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              VECTOR DB (ChromaDB, demo — Pinecone / FAISS compatible) • SIMULATED
            </text>
            <text x="55" y="534" fill="#FFFFFF" fontSize="13" fontWeight="700">
              Unstructured Regulatory Reference Corpus (src/mock/vectorStore.ts &amp;
              corpus.ts)
            </text>
            <text x="55" y="554" fill="#CBD5E1" fontSize="11">
              • 20 Hardcoded Reference PDF Clauses (APP-4.2, DOB-2.1, CERT-5.3,
              CERT-1.4, ADDR-3.1, etc.)
            </text>
            <text x="55" y="574" fill="#94A3B8" fontSize="10.5">
              • Returns Top-3 semantic matches; never used for relational transaction
              storage
            </text>

            {/* Clear Separation Divider Badge */}
            <rect
              x="542"
              y="515"
              width="56"
              height="48"
              rx="8"
              fill="#1E293B"
              stroke="#475569"
            />
            <text
              x="570"
              y="536"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              STRICT
            </text>
            <text
              x="570"
              y="550"
              textAnchor="middle"
              fill="#14B8A6"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              SPLIT
            </text>

            {/* Store B: Relational PostgreSQL */}
            <rect
              x="610"
              y="488"
              width="470"
              height="102"
              rx="12"
              fill="#172554"
              stroke="#38BDF8"
              strokeWidth="2.5"
            />
            <text
              x="630"
              y="512"
              fill="#38BDF8"
              fontSize="11"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="700"
            >
              RELATIONAL POSTGRESQL (Structured Data Store) • SIMULATED
            </text>
            <text x="630" y="534" fill="#FFFFFF" fontSize="13" fontWeight="700">
              Transactional Tables (src/mock/postgres.ts)
            </text>
            <text x="630" y="554" fill="#CBD5E1" fontSize="11">
              • Tables: applications | verification_results | audit_log
            </text>
            <text x="630" y="574" fill="#94A3B8" fontSize="10.5">
              • Stores structured field states, officer decisions, and immutable audit
              trails
            </text>
          </svg>
        </div>
      </div>

      {/* Simulated Modules Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4 text-[#14B8A6]" />
              src/mock/orchestrator.ts &amp; tools.ts
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              SIMULATED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Implements <code className="font-mono">ocrTool</code>,{' '}
            <code className="font-mono">templateTool</code>,{' '}
            <code className="font-mono">authenticityTool</code>,{' '}
            <code className="font-mono">ragRetrieveTool</code>,{' '}
            <code className="font-mono">complianceTool</code>,{' '}
            <code className="font-mono">llmExplainTool</code>, and{' '}
            <code className="font-mono">dbTool</code> with 600–1200 ms async latency.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#14B8A6]" />
              src/mock/vectorStore.ts
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              SIMULATED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Simulated ChromaDB collection containing 20 regulatory PDF passages.
            Returns top-3 relevant passages with similarity scores (0.91 / 0.84 / 0.79)
            to ground compliance citations.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[#0B1F3A] flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-[#14B8A6]" />
              src/mock/postgres.ts
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              SIMULATED
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            In-memory relational tables (<code className="font-mono">applications</code>
            , <code className="font-mono">verification_results</code>,{' '}
            <code className="font-mono">audit_log</code>) mirrored to{' '}
            <code className="font-mono">localStorage</code> with live SQL statement
            logging.
          </p>
        </div>
      </div>

      {/* Reference Corpus Browser (All 20 DEMO DATA Entries) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#14B8A6]" />
              <h2 className="font-bold text-base text-slate-900">
                Mock Reference Corpus Inspector (20 Entries in src/mock/corpus.ts)
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#FF9933]/20 text-[#9A3412] border border-[#FF9933]/40">
                DEMO DATA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every compliance error in the application strictly cites one of these 20
              rules. Click any entry to preview its simulated PDF page.
            </p>
          </div>

          <select
            aria-label="Filter reference corpus by document"
            value={selectedDocFilter}
            onChange={(e) => setSelectedDocFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-slate-50"
          >
            <option value="ALL">All Reference Documents (20 Rules)</option>
            {docNames.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCorpus.map((entry) => (
            <div
              key={entry.ruleId}
              onClick={() => onOpenPdfSnippet(entry.ruleId)}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-[#14B8A6] bg-slate-50/60 hover:bg-white cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0B1F3A] text-[#14B8A6]">
                  Rule {entry.ruleId}
                </span>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-[#14B8A6]" />
                  {entry.fileName} • p.{entry.page}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900">
                {entry.docName} — {entry.section} ({entry.sectionTitle})
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {entry.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

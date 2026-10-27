# AI-Powered Application Validation, Document Authentication & Regulatory Compliance Verification

**Smart India Hackathon 2026 • Problem Statement 26261 • Team Oryan Forge**

> **PROTOTYPE SIMULATION NOTICE:** This is a frontend-only interactive prototype built with React, Vite, TypeScript, Tailwind CSS, Framer Motion, and Lucide Icons. All backend endpoints, orchestration agents, OCR, GAN visual authenticity screening, ChromaDB vector retrieval, and PostgreSQL relational tables are simulated in the browser (`src/mock/*`).

---

## Quick Start

```bash
npm install
npm run dev
```

---

## Project Structure

- `src/mock/corpus.ts` — 20 hardcoded reference guideline passages (`DEMO DATA`), including `APP-4.2`, `DOB-2.1`, `CERT-5.3`, `CERT-1.4`, `ADDR-3.1`, and 15 additional rules.
- `src/mock/vectorStore.ts` — Simulated `Vector DB (ChromaDB, demo)` returning pre-assigned top-3 passages with similarity scores (`0.91` / `0.84` / `0.79`).
- `src/mock/postgres.ts` — Simulated relational PostgreSQL tables (`applications`, `verification_results`, `audit_log`) backed by an in-memory store mirrored to `localStorage` with live SQL logging.
- `src/mock/tools.ts` — Simulated pipeline tools (`ocrTool`, `templateTool`, `authenticityTool`, `ragRetrieveTool`, `complianceTool`, `llmExplainTool`, `dbTool`) with 600–1200 ms async latency.
- `src/mock/orchestrator.ts` — Sequential Orchestration Agent executing stages in strict order and streaming logs to the **Agent Activity** panel.
- `src/mock/api.ts` — Simulated HTTP/JSON endpoints (`POST /api/verify`, `GET /api/applications`, `GET /api/applications/:id`) logging requests, responses, HTTP status codes (`200`/`422`), and latency to the collapsible **API Log** panel.

---

## 5 Built-in Demo Scenarios (A–E)

1. **Scenario A — All Fields Correct:** Every extracted field passes validation with green ticks (`PASSED`).
2. **Scenario B — Template Gate Failure:** Missing Certificate Number (`CERT-1.4`) and invalid Date of Birth format (`DOB-2.1`). Pipeline stops at the Template Validation Gate (`TEMPLATE VALIDATION FAILED`); downstream stages are marked `Skipped`.
3. **Scenario C — Authenticity Flagged:** GAN-based visual risk indicator highlights the applicant portrait boundary (`FLAGGED / REQUIRES REVIEW`). Uses strict risk-indicator phrasing, never "proof of forgery".
4. **Scenario D — Compliance Failure (Main Demo Scenario):** `Applicant Name` (`RAHULKUMAR`, violates `APP-4.2`) and `Valid Until` (`15/03/2024`, violates `CERT-5.3`) render with red borders and `(i)` popovers while all other 5 fields pass with green ticks. Edit inline and click **Re-verify** to animate red-to-green transitions and update overall status to `PASSED`.
5. **Scenario E — Ambiguous Evidence:** Cross-border deputation enclave address and provisional extension have no matching rule in the corpus (`REQUIRES HUMAN REVIEW`).

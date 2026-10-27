import {
  AgentActivityLog,
  FieldKey,
  FieldValidationDetail,
  OverallStatus,
  PipelineStagesSummary,
  ScenarioId,
  VerificationRun,
} from '../types';
import {
  authenticityTool,
  buildInitialScenarioFields,
  complianceTool,
  dbTool,
  evaluateSingleField,
  ocrTool,
  ragRetrieveTool,
  SCENARIO_META,
  templateTool,
} from './tools';
import { VECTOR_DB_LABEL } from './vectorStore';

type ActivityListener = (logs: AgentActivityLog[]) => void;
const activityListeners: Set<ActivityListener> = new Set();
let activityLogs: AgentActivityLog[] = [];

function nowTimeStr(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export function emitAgentActivity(
  entry: Omit<AgentActivityLog, 'id' | 'timestamp'>
): AgentActivityLog {
  const full: AgentActivityLog = {
    ...entry,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimeStr(),
  };
  activityLogs = [full, ...activityLogs].slice(0, 80);
  activityListeners.forEach((cb) => cb(activityLogs));
  return full;
}

export function subscribeAgentActivity(cb: ActivityListener): () => void {
  activityListeners.add(cb);
  cb(activityLogs);
  return () => {
    activityListeners.delete(cb);
  };
}

export function clearAgentActivity(): void {
  activityLogs = [];
  activityListeners.forEach((cb) => cb(activityLogs));
}

export interface PipelineProgressUpdate {
  stepIndex: number; // 1=OCR, 2=Template, 3=Authenticity, 4=RAG, 5=Completed
  subStepText: string;
  extractedFieldsCount: number;
  ragPhase?: 'idle' | 'query' | 'embed' | 'search' | 'evaluate' | 'done';
  partialRun: VerificationRun;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Orchestration Agent (SIMULATED)
 * Strictly executes the 4 sequential stages + DB persistence and notifies UI listeners.
 */
export async function runOrchestrationPipeline(
  scenarioId: ScenarioId,
  fileInfo: { name?: string; type?: string; size?: string },
  onProgress?: (update: PipelineProgressUpdate) => void
): Promise<VerificationRun> {
  const meta = SCENARIO_META[scenarioId];
  const runId = `VER-2026-${Math.floor(10000 + Math.random() * 89999)}`;
  const appId = `APP-2026-${Math.floor(100000 + Math.random() * 899999)}`;
  const nowIso = new Date().toISOString();

  const initialStages: PipelineStagesSummary = {
    ocr: {
      state: 'running',
      fieldsExtractedCount: 0,
      summary: 'Scanning document and extracting Form A-1 metadata...',
    },
    template: {
      state: 'idle',
      decisionPassed: null,
      summary: 'Waiting for OCR completion...',
      failedFields: [],
    },
    authenticity: {
      state: 'idle',
      decisionPassed: null,
    },
    compliance: {
      state: 'idle',
      decisionState: null,
    },
  };

  const draftRun: VerificationRun = {
    id: runId,
    applicationId: appId,
    scenarioId,
    scenarioTitle: meta.title,
    fileName: fileInfo.name || meta.defaultFileName,
    fileType: fileInfo.type || 'application/pdf',
    fileSize: fileInfo.size || '1.42 MB',
    createdAt: nowIso,
    updatedAt: nowIso,
    overallStatus: 'PASSED',
    statusBannerText: 'Verification pipeline in progress...',
    fields: [],
    stages: initialStages,
    reviewerNotes: '',
    auditTimeline: [
      {
        id: `aud-${Date.now()}-1`,
        timestamp: nowTimeStr(),
        actor: 'Orchestration Agent (Simulated)',
        action: 'Pipeline Initiated',
        detail: `Received document "${fileInfo.name || meta.defaultFileName}" under ${meta.shortLabel}.`,
        status: 'info',
      },
    ],
  };

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'ocrTool',
    stage: 'ocr',
    action: 'Starting Stage 1: Document Input + OCR',
    detail: `Scanning "${draftRun.fileName}" and locating 7 Form A-1 bounding boxes.`,
    durationMs: 0,
    status: 'info',
  });

  onProgress?.({
    stepIndex: 1,
    subStepText: 'Scanning document layout & running optical character recognition...',
    extractedFieldsCount: 0,
    ragPhase: 'idle',
    partialRun: structuredClone(draftRun),
  });

  // STAGE 1: OCR
  const ocrRes = await ocrTool(scenarioId);
  // Reveal fields one by one quickly for visual polish
  for (let i = 1; i <= ocrRes.fields.length; i++) {
    await delay(110);
    draftRun.fields = ocrRes.fields.slice(0, i);
    draftRun.stages.ocr.fieldsExtractedCount = i;
    onProgress?.({
      stepIndex: 1,
      subStepText: `Extracted field ${i} of ${ocrRes.fields.length}: ${ocrRes.fields[i - 1].label}`,
      extractedFieldsCount: i,
      ragPhase: 'idle',
      partialRun: structuredClone(draftRun),
    });
  }

  draftRun.stages.ocr.state = 'passed';
  draftRun.stages.ocr.summary = `Extracted ${ocrRes.fields.length} structured fields from "${draftRun.fileName}".`;

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'ocrTool',
    stage: 'ocr',
    action: 'OCR Extraction Completed',
    detail: `Extracted 7 fields (${ocrRes.fields.map((f) => f.label).join(', ')}).`,
    durationMs: ocrRes.latencyMs,
    status: 'success',
  });

  draftRun.auditTimeline.push({
    id: `aud-${Date.now()}-ocr`,
    timestamp: nowTimeStr(),
    actor: 'ocrTool (Simulated)',
    action: '7 Metadata Fields Extracted',
    detail: `Completed layout bounding-box OCR in ${ocrRes.latencyMs} ms.`,
    status: 'success',
  });

  // STAGE 2: TEMPLATE VALIDATION GATE
  draftRun.stages.template.state = 'running';
  draftRun.stages.template.summary =
    'Evaluating Decision Gate: Does the document match the required template?';
  onProgress?.({
    stepIndex: 2,
    subStepText: 'Evaluating Template Validation Gate (mandatory fields & syntax)...',
    extractedFieldsCount: 7,
    ragPhase: 'idle',
    partialRun: structuredClone(draftRun),
  });

  const tplRes = await templateTool(scenarioId, draftRun.fields);

  if (!tplRes.passed) {
    draftRun.stages.template.state = 'failed';
    draftRun.stages.template.decisionPassed = false;
    draftRun.stages.template.summary = tplRes.summary;
    draftRun.stages.template.failedFields = tplRes.failedFields;

    // Downstream stages MUST show "Skipped"
    draftRun.stages.authenticity.state = 'skipped';
    draftRun.stages.authenticity.decisionPassed = null;
    draftRun.stages.compliance.state = 'skipped';
    draftRun.stages.compliance.decisionState = null;

    draftRun.overallStatus = 'FAILED';
    draftRun.statusBannerText =
      'TEMPLATE VALIDATION FAILED — Document halted at Template Gate. Downstream Authenticity and RAG Compliance stages were skipped.';

    emitAgentActivity({
      agent: 'OrchestratorAgent',
      tool: 'templateTool',
      stage: 'template',
      action: 'Template Gate Decision: NO (HALT)',
      detail: tplRes.summary,
      durationMs: tplRes.latencyMs,
      status: 'error',
    });

    draftRun.auditTimeline.push({
      id: `aud-${Date.now()}-tpl-fail`,
      timestamp: nowTimeStr(),
      actor: 'templateTool (Simulated)',
      action: 'Template Validation Gate: FAILED',
      detail: tplRes.summary,
      status: 'error',
    });

    await dbTool('insert', draftRun, 'Template validation gate failed');
    onProgress?.({
      stepIndex: 5,
      subStepText: 'Pipeline halted at Template Gate. Report ready.',
      extractedFieldsCount: 7,
      ragPhase: 'idle',
      partialRun: structuredClone(draftRun),
    });
    return draftRun;
  }

  draftRun.stages.template.state = 'passed';
  draftRun.stages.template.decisionPassed = true;
  draftRun.stages.template.summary = tplRes.summary;

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'templateTool',
    stage: 'template',
    action: 'Template Gate Decision: YES (Continue)',
    detail: tplRes.summary,
    durationMs: tplRes.latencyMs,
    status: 'success',
  });

  draftRun.auditTimeline.push({
    id: `aud-${Date.now()}-tpl-ok`,
    timestamp: nowTimeStr(),
    actor: 'templateTool (Simulated)',
    action: 'Template Validation Gate: PASSED',
    detail: tplRes.summary,
    status: 'success',
  });

  // STAGE 3: AUTHENTICITY ANALYSIS (Proposed GAN-based approach)
  draftRun.stages.authenticity.state = 'running';
  onProgress?.({
    stepIndex: 3,
    subStepText:
      'Running GAN-based visual risk indicator analysis on portrait and seal patches...',
    extractedFieldsCount: 7,
    ragPhase: 'idle',
    partialRun: structuredClone(draftRun),
  });

  const authRes = await authenticityTool(scenarioId);
  draftRun.stages.authenticity.result = authRes.result;

  if (!authRes.result.passed) {
    draftRun.stages.authenticity.state = 'flagged';
    draftRun.stages.authenticity.decisionPassed = false;
    // Decision diamond NO -> FLAGGED / REQUIRES REVIEW
    draftRun.stages.compliance.state = 'skipped';
    draftRun.stages.compliance.decisionState = null;
    draftRun.overallStatus = 'FLAGGED';
    draftRun.statusBannerText =
      'FLAGGED / REQUIRES REVIEW — Visual risk indicator detected in applicant portrait region (GAN-based analysis is a risk indicator, not proof of forgery).';

    emitAgentActivity({
      agent: 'OrchestratorAgent',
      tool: 'authenticityTool',
      stage: 'authenticity',
      action: 'Authenticity Gate Decision: NO (FLAGGED / REQUIRES REVIEW)',
      detail: `Risk indicator: ${authRes.result.riskScoreNormalized}. Portrait patch boundary anomaly flagged for human inspection.`,
      durationMs: authRes.latencyMs,
      status: 'warning',
    });

    draftRun.auditTimeline.push({
      id: `aud-${Date.now()}-auth-flag`,
      timestamp: nowTimeStr(),
      actor: 'authenticityTool (Simulated)',
      action: 'Authenticity Analysis: FLAGGED / REQUIRES REVIEW',
      detail: authRes.result.llmExplanation,
      status: 'warning',
    });

    await dbTool('insert', draftRun, 'Authenticity risk indicator flagged');
    onProgress?.({
      stepIndex: 5,
      subStepText: 'Authenticity risk indicator flagged for human review.',
      extractedFieldsCount: 7,
      ragPhase: 'idle',
      partialRun: structuredClone(draftRun),
    });
    return draftRun;
  }

  draftRun.stages.authenticity.state = 'passed';
  draftRun.stages.authenticity.decisionPassed = true;

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'authenticityTool',
    stage: 'authenticity',
    action: 'Authenticity Gate Decision: YES (Continue)',
    detail: `Visual screening passed (${authRes.result.riskScoreNormalized}). Proceeding to RAG Regulatory Compliance.`,
    durationMs: authRes.latencyMs,
    status: 'success',
  });

  draftRun.auditTimeline.push({
    id: `aud-${Date.now()}-auth-ok`,
    timestamp: nowTimeStr(),
    actor: 'authenticityTool (Simulated)',
    action: 'Authenticity Analysis: PASSED',
    detail: `Risk level: ${authRes.result.riskScoreNormalized}.`,
    status: 'success',
  });

  // STAGE 4: RAG REGULATORY COMPLIANCE
  draftRun.stages.compliance.state = 'running';

  // Animate sub-steps: 1. build query -> 2. embed -> 3. search vector DB -> 4. LLM evaluate
  onProgress?.({
    stepIndex: 4,
    subStepText: 'Step 4.1: Constructing semantic compliance query from extracted fields...',
    extractedFieldsCount: 7,
    ragPhase: 'query',
    partialRun: structuredClone(draftRun),
  });
  await delay(280);

  onProgress?.({
    stepIndex: 4,
    subStepText: 'Step 4.2: Generating 1536-d query embedding vector...',
    extractedFieldsCount: 7,
    ragPhase: 'embed',
    partialRun: structuredClone(draftRun),
  });
  await delay(280);

  onProgress?.({
    stepIndex: 4,
    subStepText: `Step 4.3: Querying ${VECTOR_DB_LABEL} for top-3 regulatory clauses...`,
    extractedFieldsCount: 7,
    ragPhase: 'search',
    partialRun: structuredClone(draftRun),
  });

  const vectorRes = await ragRetrieveTool(scenarioId);

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'ragRetrieveTool',
    stage: 'compliance',
    action: `Retrieved Top-3 Passages from ${VECTOR_DB_LABEL}`,
    detail: `Matched rules ${vectorRes.topK
      .map((p) => `${p.ruleId} (${p.similarityScore.toFixed(2)})`)
      .join(', ')}.`,
    durationMs: vectorRes.latencyMs,
    status: 'info',
  });

  onProgress?.({
    stepIndex: 4,
    subStepText:
      'Step 4.4: Running deterministic field checks & LLM regulatory evaluation...',
    extractedFieldsCount: 7,
    ragPhase: 'evaluate',
    partialRun: structuredClone(draftRun),
  });

  const compRes = await complianceTool(scenarioId, draftRun.fields, vectorRes);
  draftRun.stages.compliance.result = compRes.complianceResult;
  draftRun.stages.compliance.decisionState = compRes.decisionState;

  if (compRes.decisionState === 'NO') {
    draftRun.stages.compliance.state = 'failed';
    draftRun.overallStatus = 'FAILED';
    draftRun.statusBannerText =
      'NON-COMPLIANT / REQUIRES CORRECTION — Regulatory compliance violations identified with cited corpus rules.';

    emitAgentActivity({
      agent: 'OrchestratorAgent',
      tool: 'complianceTool',
      stage: 'compliance',
      action: 'Compliance Gate Decision: NO (NON-COMPLIANT)',
      detail: compRes.complianceResult.llmEvaluationSummary,
      durationMs: compRes.latencyMs,
      status: 'error',
    });

    draftRun.auditTimeline.push({
      id: `aud-${Date.now()}-comp-no`,
      timestamp: nowTimeStr(),
      actor: 'complianceTool + llmExplainTool (Simulated)',
      action: 'Regulatory Compliance: NON-COMPLIANT / REQUIRES CORRECTION',
      detail: compRes.complianceResult.llmEvaluationSummary,
      status: 'error',
    });
  } else if (compRes.decisionState === 'INSUFFICIENT_EVIDENCE') {
    draftRun.stages.compliance.state = 'needs_review';
    draftRun.overallStatus = 'REQUIRES HUMAN REVIEW';
    draftRun.statusBannerText =
      'REQUIRES HUMAN REVIEW — No matching rule found in the reference documents for special jurisdiction/provisional extension.';

    emitAgentActivity({
      agent: 'OrchestratorAgent',
      tool: 'complianceTool',
      stage: 'compliance',
      action: 'Compliance Gate Decision: INSUFFICIENT EVIDENCE (HUMAN REVIEW)',
      detail: compRes.complianceResult.llmEvaluationSummary,
      durationMs: compRes.latencyMs,
      status: 'warning',
    });

    draftRun.auditTimeline.push({
      id: `aud-${Date.now()}-comp-rev`,
      timestamp: nowTimeStr(),
      actor: 'complianceTool (Simulated)',
      action: 'Regulatory Compliance: REQUIRES HUMAN REVIEW',
      detail:
        'No matching rule found in the reference documents. Escalated to reviewing officer.',
      status: 'warning',
    });
  } else {
    draftRun.stages.compliance.state = 'passed';
    draftRun.overallStatus = 'PASSED';
    draftRun.statusBannerText =
      'PASSED — Verified within the scope of checks performed.';

    emitAgentActivity({
      agent: 'OrchestratorAgent',
      tool: 'complianceTool',
      stage: 'compliance',
      action: 'Compliance Gate Decision: YES (PASSED)',
      detail: 'All fields comply with cited rules; verified within the scope of checks performed.',
      durationMs: compRes.latencyMs,
      status: 'success',
    });

    draftRun.auditTimeline.push({
      id: `aud-${Date.now()}-comp-yes`,
      timestamp: nowTimeStr(),
      actor: 'complianceTool (Simulated)',
      action: 'Regulatory Compliance: PASSED',
      detail: 'Verified within the scope of checks performed.',
      status: 'success',
    });
  }

  // Persist to Fake PostgreSQL
  await dbTool('insert', draftRun, 'Initial pipeline execution completed');

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'dbTool',
    stage: 'db',
    action: 'Persisted Verification Run to PostgreSQL (Simulated)',
    detail: `Inserted records into applications, verification_results, and audit_log for ${draftRun.applicationId}.`,
    durationMs: 620,
    status: 'info',
  });

  onProgress?.({
    stepIndex: 5,
    subStepText: 'Verification pipeline completed.',
    extractedFieldsCount: 7,
    ragPhase: 'done',
    partialRun: structuredClone(draftRun),
  });

  return draftRun;
}

/**
 * Re-verifies a single edited field or full set of fields inline.
 * Updates field status (e.g. red -> green), recalculates stage & overall status,
 * and logs to Agent Activity + Fake PostgreSQL.
 */
export async function reverifyEditedFields(
  currentRun: VerificationRun,
  updatedValues: Partial<Record<FieldKey, string>>
): Promise<VerificationRun> {
  await delay(750);

  const updatedFields: FieldValidationDetail[] = currentRun.fields.map((field) => {
    if (updatedValues[field.key] !== undefined) {
      const nextVal = updatedValues[field.key]!;
      const reEvaluated = evaluateSingleField(field.key, nextVal);
      return {
        ...reEvaluated,
        wasEditedAndVerified:
          reEvaluated.status === 'correct' &&
          (field.status === 'wrong' || field.wasEditedAndVerified),
      };
    }
    return field;
  });

  const nextRun: VerificationRun = structuredClone(currentRun);
  nextRun.fields = updatedFields;
  nextRun.updatedAt = new Date().toISOString();

  const templateKeys: FieldKey[] = [
    'certificateNumber',
    'dateOfBirth',
    'applicationNumber',
  ];
  const failedTemplateFields = updatedFields
    .filter((f) => templateKeys.includes(f.key) && f.status === 'wrong')
    .map((f) => f.key);

  if (failedTemplateFields.length > 0) {
    nextRun.stages.template.state = 'failed';
    nextRun.stages.template.decisionPassed = false;
    nextRun.stages.template.failedFields = failedTemplateFields;
    nextRun.stages.template.summary =
      'TEMPLATE VALIDATION FAILED: Mandatory template fields still require correction.';
    nextRun.overallStatus = 'FAILED';
    nextRun.statusBannerText =
      'TEMPLATE VALIDATION FAILED — Mandatory template fields still require correction.';
  } else {
    nextRun.stages.template.state = 'passed';
    nextRun.stages.template.decisionPassed = true;
    nextRun.stages.template.failedFields = [];
    nextRun.stages.template.summary =
      'Form A-1 layout anchor points, mandatory field boxes, and date/serial structural syntax verified.';

    if (nextRun.stages.authenticity.state === 'skipped') {
      const authRes = await authenticityTool('A');
      nextRun.stages.authenticity.state = 'passed';
      nextRun.stages.authenticity.decisionPassed = true;
      nextRun.stages.authenticity.result = authRes.result;
    }

    if (nextRun.stages.authenticity.state === 'flagged') {
      nextRun.overallStatus = 'FLAGGED';
      nextRun.statusBannerText =
        'FLAGGED / REQUIRES REVIEW — Visual risk indicator remains active on document portrait region.';
    } else {
      const hasWrong = updatedFields.some((f) => f.status === 'wrong');
      const hasNeedsReview = updatedFields.some(
        (f) => f.status === 'needs_review' || f.status === 'warning'
      );

      if (!nextRun.stages.compliance.result) {
        const vectorRes = await ragRetrieveTool(nextRun.scenarioId);
        const compRes = await complianceTool('A', updatedFields, vectorRes);
        nextRun.stages.compliance.result = compRes.complianceResult;
      } else {
        nextRun.stages.compliance.result.deterministicChecks = updatedFields.map(
          (f) => ({
            id: `det-${f.key}`,
            fieldLabel: f.label,
            checkDescription: 'Deterministic syntax & regulatory boundary check',
            passed: f.status === 'correct',
            detail: f.inlineCaption,
          })
        );
      }

      if (!hasWrong && !hasNeedsReview) {
        nextRun.stages.compliance.state = 'passed';
        nextRun.stages.compliance.decisionState = 'YES';
        if (nextRun.stages.compliance.result) {
          nextRun.stages.compliance.result.status = 'PASSED';
          nextRun.stages.compliance.result.llmEvaluationSummary =
            'All 7 extracted fields satisfy deterministic syntax checks and align with the top-3 retrieved regulatory guidelines (APP-4.2, CERT-5.3, ADDR-3.1). Application is verified within the scope of checks performed.';
        }
        nextRun.overallStatus = 'PASSED';
        nextRun.statusBannerText =
          'PASSED — All corrected fields re-verified. Verified within the scope of checks performed.';
      } else if (hasNeedsReview && !hasWrong) {
        nextRun.stages.compliance.state = 'needs_review';
        nextRun.stages.compliance.decisionState = 'INSUFFICIENT_EVIDENCE';
        if (nextRun.stages.compliance.result) {
          nextRun.stages.compliance.result.status = 'REQUIRES HUMAN REVIEW';
        }
        nextRun.overallStatus = 'REQUIRES HUMAN REVIEW';
        nextRun.statusBannerText =
          'REQUIRES HUMAN REVIEW — Ambiguous regulatory evidence requires human officer sign-off.';
      } else {
        nextRun.stages.compliance.state = 'failed';
        nextRun.stages.compliance.decisionState = 'NO';
        if (nextRun.stages.compliance.result) {
          nextRun.stages.compliance.result.status =
            'NON-COMPLIANT / REQUIRES CORRECTION';
        }
        nextRun.overallStatus = 'FAILED';
        nextRun.statusBannerText =
          'NON-COMPLIANT / REQUIRES CORRECTION — One or more fields still violate regulatory rules.';
      }
    }
  }

  const changedFieldLabels = Object.keys(updatedValues).join(', ');

  emitAgentActivity({
    agent: 'OrchestratorAgent',
    tool: 'complianceTool',
    stage: 'compliance',
    action: `Re-verified Edited Field(s): ${changedFieldLabels}`,
    detail: `Updated status: ${nextRun.overallStatus}. ${nextRun.statusBannerText}`,
    durationMs: 750,
    status: nextRun.overallStatus === 'PASSED' ? 'success' : 'info',
  });

  nextRun.auditTimeline.unshift({
    id: `aud-${Date.now()}-reverify`,
    timestamp: nowTimeStr(),
    actor: 'Reviewing Officer + complianceTool',
    action: `Inline Edit & Re-Verification (${changedFieldLabels})`,
    detail: `Re-ran deterministic and rule compliance validation. Overall status is now ${nextRun.overallStatus}.`,
    status: nextRun.overallStatus === 'PASSED' ? 'success' : 'info',
  });

  await dbTool('update', nextRun, `Re-verified fields: ${changedFieldLabels}`);
  return nextRun;
}

/**
 * Synchronously builds the 5 pre-populated seed runs (D first as main demo, then A, B, C, E)
 * so the app starts with rich data in History and Review Dashboard immediately.
 */
export function buildSeedVerificationRuns(): VerificationRun[] {
  const scenarios: ScenarioId[] = ['D', 'A', 'B', 'C', 'E'];

  return scenarios.map((scId, idx) => {
    const meta = SCENARIO_META[scId];
    const fields = buildInitialScenarioFields(scId);
    const createdDate = new Date(Date.now() - idx * 3600_000 * 4).toISOString();

    let overallStatus: OverallStatus = 'PASSED';
    let statusBannerText = 'PASSED — Verified within the scope of checks performed.';

    const stages: PipelineStagesSummary = {
      ocr: {
        state: 'passed',
        fieldsExtractedCount: 7,
        summary: `Extracted 7 structured fields from "${meta.defaultFileName}".`,
      },
      template: {
        state: 'passed',
        decisionPassed: true,
        summary:
          'Form A-1 layout anchor points, mandatory field boxes, and date/serial structural syntax verified.',
        failedFields: [],
      },
      authenticity: {
        state: 'passed',
        decisionPassed: true,
        result: {
          passed: true,
          status: 'PASSED',
          riskLevel: 'Low Risk Indicator',
          riskScoreNormalized: '0.12 (Low Risk Indicator)',
          llmExplanation:
            'Simulated GAN visual screening found uniform substrate noise texture, consistent portrait border blending, and aligned glyph baselines. Note: GAN-based analysis is a risk indicator, not proof of forgery, and is different from cryptographic signature validation.',
          indicators: [
            {
              id: 'ind-1',
              label: 'Portrait Patch Boundary Residual',
              finding: 'Uniform compression noise across photograph boundary.',
              severity: 'low',
            },
            {
              id: 'ind-2',
              label: 'Typography & Baseline Uniformity',
              finding: 'Consistent glyph kerning and baseline alignment.',
              severity: 'low',
            },
          ],
        },
      },
      compliance: {
        state: 'passed',
        decisionState: 'YES',
        result: {
          status: 'PASSED',
          queryBuilt:
            'applicant_name format uppercase space AND certificate valid_until expiry check AND address 6-digit PIN code',
          embeddingVectorPreview:
            '[-0.0241, 0.0819, -0.0412, 0.1104, 0.0093, ... 1536 dims]',
          retrievedPassages: [
            {
              docName: 'Application Submission Guidelines 2024',
              fileName: 'Application_Submission_Guidelines_2024.pdf',
              page: 12,
              section: 'Section 4.2',
              sectionTitle: 'Applicant Name Format',
              ruleId: 'APP-4.2',
              text: 'Rule APP-4.2 (Section 4.2, Applicant Name Format): The Applicant Name field must be entered in Latin uppercase characters and must contain at least a given name and a surname separated by a single whitespace character (e.g., "RAHUL KUMAR").',
              similarityScore: 0.91,
            },
            {
              docName: 'Certificate Validity Regulations',
              fileName: 'Certificate_Validity_Regulations.pdf',
              page: 19,
              section: 'Section 5.3',
              sectionTitle: 'Active Validity Window at Submission',
              ruleId: 'CERT-5.3',
              text: 'Rule CERT-5.3 (Section 5.3, Certificate Expiry Prohibition): The supporting certificate must remain valid on the date of application verification. Certificate validity cannot be expired at the time of application.',
              similarityScore: 0.84,
            },
            {
              docName: 'Address Standardization Guidelines',
              fileName: 'Address_Standardization_Guidelines.pdf',
              page: 9,
              section: 'Section 3.1',
              sectionTitle: 'Mandatory Postal PIN Code Requirement',
              ruleId: 'ADDR-3.1',
              text: 'Rule ADDR-3.1 (Section 3.1, Postal Address Structure): The residential or correspondence address field must specify street/locality, city/district, state, and a valid 6-digit Indian Postal Index Number (PIN code).',
              similarityScore: 0.79,
            },
          ],
          deterministicChecks: fields.map((f) => ({
            id: `det-seed-${f.key}`,
            fieldLabel: f.label,
            checkDescription: 'Deterministic syntax & regulatory boundary check',
            passed: f.status === 'correct',
            detail: f.inlineCaption,
          })),
          llmEvaluationSummary:
            'Evaluated extracted metadata against retrieved regulatory corpus clauses and deterministic checks.',
        },
      },
    };

    if (scId === 'B') {
      overallStatus = 'FAILED';
      statusBannerText =
        'TEMPLATE VALIDATION FAILED — Document halted at Template Gate due to missing Certificate Number (CERT-1.4) and invalid Date of Birth format (DOB-2.1).';
      stages.template.state = 'failed';
      stages.template.decisionPassed = false;
      stages.template.failedFields = ['certificateNumber', 'dateOfBirth'];
      stages.template.summary =
        'TEMPLATE VALIDATION FAILED: Missing mandatory Certificate Number and non-DD/MM/YYYY Date of Birth.';
      stages.authenticity.state = 'skipped';
      stages.authenticity.decisionPassed = null;
      stages.authenticity.result = undefined;
      stages.compliance.state = 'skipped';
      stages.compliance.decisionState = null;
      stages.compliance.result = undefined;
    } else if (scId === 'C') {
      overallStatus = 'FLAGGED';
      statusBannerText =
        'FLAGGED / REQUIRES REVIEW — Elevated risk indicator on applicant photograph patch (GAN-based analysis is a risk indicator, not proof of forgery).';
      stages.authenticity.state = 'flagged';
      stages.authenticity.decisionPassed = false;
      stages.authenticity.result = {
        passed: false,
        status: 'FLAGGED / REQUIRES REVIEW',
        riskLevel: 'Elevated Risk Indicator',
        riskScoreNormalized: '0.78 (Elevated Risk Indicator)',
        llmExplanation:
          'Simulated GAN discriminator patch analysis identified localized high-frequency compression residuals along the applicant portrait border (top-right quadrant). Note: GAN-based analysis is a risk indicator, not proof of forgery, and is different from cryptographic signature validation.',
        indicators: [
          {
            id: 'ind-photo',
            label: 'Portrait Patch Boundary Residual',
            finding:
              'Localized spatial frequency shift detected around applicant photograph frame (Rule AUTH-2.2 risk indicator).',
            severity: 'high',
            regionBbox: { top: 31, left: 66, width: 25, height: 24 },
          },
          {
            id: 'ind-seal',
            label: 'Embossed Stamp Edge Continuity',
            finding:
              'Secondary compression boundary near lower-right emblem overlap; flagged as visual risk indicator.',
            severity: 'elevated',
            regionBbox: { top: 83, left: 64, width: 26, height: 12 },
          },
        ],
      };
      stages.compliance.state = 'skipped';
      stages.compliance.decisionState = null;
      stages.compliance.result = undefined;
    } else if (scId === 'D') {
      overallStatus = 'FAILED';
      statusBannerText =
        'NON-COMPLIANT / REQUIRES CORRECTION — Applicant Name ("RAHULKUMAR", Rule APP-4.2) and Valid Until ("15/03/2024", Rule CERT-5.3) violate regulatory guidelines.';
      stages.compliance.state = 'failed';
      stages.compliance.decisionState = 'NO';
      if (stages.compliance.result) {
        stages.compliance.result.status = 'NON-COMPLIANT / REQUIRES CORRECTION';
        stages.compliance.result.llmEvaluationSummary =
          'Combined deterministic validation and retrieved regulatory text indicate non-compliance on 2 fields: Applicant Name (RAHULKUMAR) violates Section 4.2 (Rule APP-4.2) and Valid Until (15/03/2024) violates Section 5.3 (Rule CERT-5.3).';
      }
    } else if (scId === 'E') {
      overallStatus = 'REQUIRES HUMAN REVIEW';
      statusBannerText =
        'REQUIRES HUMAN REVIEW — No matching rule found in the reference documents for special deputation enclave address and provisional validity extension.';
      stages.compliance.state = 'needs_review';
      stages.compliance.decisionState = 'INSUFFICIENT_EVIDENCE';
      if (stages.compliance.result) {
        stages.compliance.result.status = 'REQUIRES HUMAN REVIEW';
        stages.compliance.result.llmEvaluationSummary =
          'No matching rule found in the reference documents covering cross-border deputation enclave addresses or 90-day provisional extensions (Rule AUD-2.5). Escalated for human review.';
      }
    }

    return {
      id: `VER-2026-9010${idx + 1}`,
      applicationId: fields.find((f) => f.key === 'applicationNumber')?.extractedValue || `APP-2026-10000${idx}`,
      scenarioId: scId,
      scenarioTitle: meta.title,
      fileName: meta.defaultFileName,
      fileType: 'application/pdf',
      fileSize: '1.38 MB',
      createdAt: createdDate,
      updatedAt: createdDate,
      overallStatus,
      statusBannerText,
      fields,
      stages,
      reviewerNotes:
        scId === 'D'
          ? 'Main Demo Scenario: Hover or click the red (i) icons on Applicant Name ("RAHULKUMAR") or Valid Until ("15/03/2024") to inspect rule citations, or edit inline and click Re-verify.'
          : '',
      auditTimeline: [
        {
          id: `seed-aud-1-${scId}`,
          timestamp: '19:15:04',
          actor: 'Orchestration Agent (Simulated)',
          action: `Executed Sequential Pipeline (${meta.shortLabel})`,
          detail: statusBannerText,
          status:
            overallStatus === 'PASSED'
              ? 'success'
              : overallStatus === 'FAILED'
              ? 'error'
              : 'warning',
        },
      ],
    };
  });
}

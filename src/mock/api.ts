import {
  ApiLogEntry,
  FieldKey,
  ScenarioId,
  VerificationRun,
} from '../types';
import {
  PipelineProgressUpdate,
  reverifyEditedFields,
  runOrchestrationPipeline,
} from './orchestrator';
import { pgSelectAllRuns, pgSelectRunById } from './postgres';

type ApiLogListener = (logs: ApiLogEntry[]) => void;
const apiListeners: Set<ApiLogListener> = new Set();
let apiLogs: ApiLogEntry[] = [
  {
    id: 'api-seed-init',
    timestamp: '19:15:02',
    method: 'POST',
    endpoint: '/api/verify',
    statusCode: 422,
    latencyMs: 2410,
    requestJson: {
      scenario: 'D',
      fileName: 'Form_A1_Rahul_Kumar_Submission.pdf',
      pipelineOrder: ['OCR', 'TEMPLATE_GATE', 'GAN_AUTHENTICITY', 'RAG_COMPLIANCE'],
    },
    responseJson: {
      runId: 'VER-2026-90101',
      overallStatus: 'FAILED',
      nonCompliantFields: ['applicantName (APP-4.2)', 'validUntil (CERT-5.3)'],
      simulated: true,
    },
  },
];

function nowTimeStr(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function recordApiLog(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>): ApiLogEntry {
  const full: ApiLogEntry = {
    ...entry,
    id: `api-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimeStr(),
  };
  apiLogs = [full, ...apiLogs].slice(0, 50);
  apiListeners.forEach((cb) => cb(apiLogs));
  return full;
}

export function subscribeApiLogs(cb: ApiLogListener): () => void {
  apiListeners.add(cb);
  cb(apiLogs);
  return () => {
    apiListeners.delete(cb);
  };
}

export function clearApiLogs(): void {
  apiLogs = [];
  apiListeners.forEach((cb) => cb(apiLogs));
}

/**
 * Fake HTTP Endpoint: POST /api/verify
 */
export async function apiPostVerify(
  scenarioId: ScenarioId,
  fileInfo: { name?: string; type?: string; size?: string },
  onProgress?: (update: PipelineProgressUpdate) => void
): Promise<VerificationRun> {
  const start = performance.now();
  const run = await runOrchestrationPipeline(scenarioId, fileInfo, onProgress);
  const latencyMs = Math.round(performance.now() - start);
  const statusCode: 200 | 422 = run.overallStatus === 'FAILED' ? 422 : 200;

  recordApiLog({
    method: 'POST',
    endpoint: '/api/verify',
    statusCode,
    latencyMs,
    requestJson: {
      scenarioId,
      fileName: run.fileName,
      fileType: run.fileType,
      fileSize: run.fileSize,
      strictSequentialPipeline: true,
    },
    responseJson: {
      runId: run.id,
      applicationId: run.applicationId,
      overallStatus: run.overallStatus,
      stages: {
        ocr: run.stages.ocr.state,
        template: run.stages.template.state,
        authenticity: run.stages.authenticity.state,
        compliance: run.stages.compliance.state,
      },
      invalidFields: run.fields
        .filter((f) => f.status !== 'correct')
        .map((f) => ({ key: f.key, value: f.extractedValue, status: f.status })),
    },
  });

  return run;
}

/**
 * Fake HTTP Endpoint: POST /api/verify (re-verification of edited field)
 */
export async function apiPostReverifyField(
  currentRun: VerificationRun,
  updatedValues: Partial<Record<FieldKey, string>>
): Promise<VerificationRun> {
  const start = performance.now();
  const updatedRun = await reverifyEditedFields(currentRun, updatedValues);
  const latencyMs = Math.round(performance.now() - start);
  const statusCode: 200 | 422 = updatedRun.overallStatus === 'FAILED' ? 422 : 200;

  recordApiLog({
    method: 'POST',
    endpoint: '/api/verify',
    statusCode,
    latencyMs,
    requestJson: {
      action: 'REVERIFY_INLINE_EDIT',
      runId: currentRun.id,
      applicationId: currentRun.applicationId,
      updatedFields: updatedValues,
    },
    responseJson: {
      runId: updatedRun.id,
      overallStatus: updatedRun.overallStatus,
      statusBannerText: updatedRun.statusBannerText,
      remainingIssues: updatedRun.fields.filter((f) => f.status !== 'correct').length,
    },
  });

  return updatedRun;
}

/**
 * Fake HTTP Endpoint: GET /api/applications
 */
export async function apiGetApplications(): Promise<VerificationRun[]> {
  const start = performance.now();
  const runs = await pgSelectAllRuns();
  const latencyMs = Math.round(performance.now() - start);

  recordApiLog({
    method: 'GET',
    endpoint: '/api/applications',
    statusCode: 200,
    latencyMs,
    requestJson: { limit: 20, sort: 'updated_at:desc' },
    responseJson: {
      count: runs.length,
      applications: runs.map((r) => ({
        runId: r.id,
        applicationId: r.applicationId,
        scenario: r.scenarioId,
        overallStatus: r.overallStatus,
      })),
    },
  });

  return runs;
}

/**
 * Fake HTTP Endpoint: GET /api/applications/:id
 */
export async function apiGetApplicationById(
  id: string
): Promise<VerificationRun | undefined> {
  const start = performance.now();
  const found = await pgSelectRunById(id);
  const latencyMs = Math.round(performance.now() - start);

  recordApiLog({
    method: 'GET',
    endpoint: `/api/applications/${id}`,
    statusCode: found ? 200 : 422,
    latencyMs,
    requestJson: { id },
    responseJson: found
      ? {
          runId: found.id,
          applicationId: found.applicationId,
          overallStatus: found.overallStatus,
          fieldsCount: found.fields.length,
        }
      : { error: 'Application not found' },
  });

  return found;
}

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E';

export type ScreenId =
  | 'upload'
  | 'pipeline'
  | 'review'
  | 'report'
  | 'architecture'
  | 'history';

export type FieldStatus = 'correct' | 'wrong' | 'warning' | 'needs_review';

export type OverallStatus =
  | 'PASSED'
  | 'FAILED'
  | 'FLAGGED'
  | 'REQUIRES HUMAN REVIEW';

export type StageState =
  | 'idle'
  | 'running'
  | 'passed'
  | 'failed'
  | 'flagged'
  | 'needs_review'
  | 'skipped';

export type FieldKey =
  | 'applicantName'
  | 'dateOfBirth'
  | 'address'
  | 'applicationNumber'
  | 'certificateNumber'
  | 'validFrom'
  | 'validUntil';

export interface CorpusEntry {
  docName: string;
  fileName: string;
  page: number;
  section: string;
  sectionTitle: string;
  ruleId: string;
  text: string;
}

export interface RetrievedPassage extends CorpusEntry {
  similarityScore: number;
}

export interface FieldValidationDetail {
  key: FieldKey;
  label: string;
  extractedValue: string;
  expectedValue?: string;
  status: FieldStatus;
  /**
   * For 'correct' fields: e.g. "Complies with Guideline 3.2, Section 4, page 12"
   * For 'wrong' fields: MUST follow "<Field> is <problem> due to <Section X.Y> of <Guideline/Rule document name>, page N (Rule ID ...)"
   * For 'warning' / 'needs_review': "No matching rule found in the reference documents. Requires human review."
   */
  inlineCaption: string;
  popover?: {
    title: string;
    extractedValue: string;
    expectedValue: string;
    why: string;
    sourceChipLabel: string;
    corpusRuleId: string;
    suggestedFix: string;
  };
  markedForReview?: boolean;
  wasEditedAndVerified?: boolean;
  /** Normalized bounding box % on the document preview */
  bbox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface AuthenticityIndicator {
  id: string;
  label: string;
  finding: string;
  severity: 'low' | 'elevated' | 'high';
  regionBbox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface AuthenticityResult {
  passed: boolean;
  status: 'PASSED' | 'FLAGGED / REQUIRES REVIEW';
  riskLevel: 'Low Risk Indicator' | 'Elevated Risk Indicator';
  riskScoreNormalized: string; // e.g. "0.14 (Low)" or "0.78 (Elevated Risk Indicator)"
  llmExplanation: string;
  indicators: AuthenticityIndicator[];
}

export interface DeterministicCheck {
  id: string;
  fieldLabel: string;
  checkDescription: string;
  passed: boolean;
  detail: string;
}

export interface RagComplianceResult {
  status: 'PASSED' | 'NON-COMPLIANT / REQUIRES CORRECTION' | 'REQUIRES HUMAN REVIEW';
  queryBuilt: string;
  embeddingVectorPreview: string;
  retrievedPassages: RetrievedPassage[];
  deterministicChecks: DeterministicCheck[];
  llmEvaluationSummary: string;
}

export interface PipelineStagesSummary {
  ocr: {
    state: StageState;
    fieldsExtractedCount: number;
    summary: string;
  };
  template: {
    state: StageState;
    decisionPassed: boolean | null;
    summary: string;
    failedFields: FieldKey[];
  };
  authenticity: {
    state: StageState;
    decisionPassed: boolean | null;
    result?: AuthenticityResult;
  };
  compliance: {
    state: StageState;
    decisionState: 'YES' | 'NO' | 'INSUFFICIENT_EVIDENCE' | null;
    result?: RagComplianceResult;
  };
}

export interface AgentActivityLog {
  id: string;
  timestamp: string;
  agent: string;
  tool: string;
  stage: 'ocr' | 'template' | 'authenticity' | 'compliance' | 'db' | 'orchestrator';
  action: string;
  detail: string;
  durationMs: number;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  method: 'POST' | 'GET';
  endpoint: string;
  statusCode: 200 | 422;
  latencyMs: number;
  requestJson: Record<string, unknown>;
  responseJson: Record<string, unknown>;
}

export interface SqlLogEntry {
  id: string;
  timestamp: string;
  table: 'applications' | 'verification_results' | 'audit_log';
  operation: 'INSERT' | 'UPDATE' | 'SELECT';
  sql: string;
  rowsAffected: number;
}

export interface AuditTimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface VerificationRun {
  id: string;
  applicationId: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  createdAt: string;
  updatedAt: string;
  overallStatus: OverallStatus;
  statusBannerText: string;
  fields: FieldValidationDetail[];
  stages: PipelineStagesSummary;
  reviewerNotes: string;
  reviewerDecision?: 'APPROVED' | 'CORRECTION_REQUESTED' | 'ESCALATED';
  auditTimeline: AuditTimelineEvent[];
}

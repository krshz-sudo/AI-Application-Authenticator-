import {
  AuthenticityResult,
  DeterministicCheck,
  FieldKey,
  FieldValidationDetail,
  RagComplianceResult,
  ScenarioId,
  VerificationRun,
} from '../types';
import { searchVectorStore, VectorSearchResult } from './vectorStore';
import { pgInsertVerificationRun, pgUpdateVerificationRun } from './postgres';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const FIELD_BBOXES: Record<
  FieldKey,
  { top: number; left: number; width: number; height: number }
> = {
  applicationNumber: { top: 21, left: 8, width: 41, height: 8.5 },
  certificateNumber: { top: 21, left: 52, width: 40, height: 8.5 },
  applicantName: { top: 34, left: 8, width: 54, height: 9 },
  dateOfBirth: { top: 46, left: 8, width: 54, height: 9 },
  address: { top: 58, left: 8, width: 84, height: 11 },
  validFrom: { top: 73, left: 8, width: 41, height: 9 },
  validUntil: { top: 73, left: 52, width: 40, height: 9 },
};

export const SCENARIO_META: Record<
  ScenarioId,
  {
    id: ScenarioId;
    shortLabel: string;
    title: string;
    description: string;
    defaultFileName: string;
    badgeColor: string;
  }
> = {
  A: {
    id: 'A',
    shortLabel: 'Scenario A — All Correct',
    title: 'All Fields Correct (All Stages Pass)',
    description:
      'Every extracted field satisfies template and regulatory rules. All 4 pipeline stages pass with green ticks.',
    defaultFileName: 'Form_A1_Ananya_Sharma_Compliant.pdf',
    badgeColor: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  },
  B: {
    id: 'B',
    shortLabel: 'Scenario B — Template Gate Failure',
    title: 'Template Failure (Missing Cert No. & Wrong Date Format)',
    description:
      'Missing Certificate Number and YYYY-MM-DD Date of Birth. Pipeline halts at the Template Validation Gate; later stages are Skipped.',
    defaultFileName: 'Form_A1_Vikram_Rao_TemplateError.pdf',
    badgeColor: 'bg-red-500/15 text-red-700 border-red-500/30',
  },
  C: {
    id: 'C',
    shortLabel: 'Scenario C — Authenticity Flagged',
    title: 'Authenticity Flagged (Photo Region Risk Indicator)',
    description:
      'GAN-based visual screening detects a boundary residual risk indicator on the portrait patch and flags for human review.',
    defaultFileName: 'Form_A1_Suresh_Menon_PhotoFlag.pdf',
    badgeColor: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
  },
  D: {
    id: 'D',
    shortLabel: 'Scenario D — Compliance Failure (Main Demo)',
    title: 'Compliance Failure ("RAHULKUMAR" & Expired Certificate)',
    description:
      'Main Demo Scenario: Applicant Name "RAHULKUMAR" violates Rule APP-4.2 and Valid Until "15/03/2024" violates Rule CERT-5.3. Edit inline & Re-verify to turn green.',
    defaultFileName: 'Form_A1_Rahul_Kumar_Submission.pdf',
    badgeColor: 'bg-rose-500/15 text-rose-700 border-rose-500/30',
  },
  E: {
    id: 'E',
    shortLabel: 'Scenario E — Ambiguous Evidence (Human Review)',
    title: 'Ambiguous Evidence — Requires Human Review',
    description:
      'Cross-border deputation enclave address and provisional extension have no matching rule in the reference corpus.',
    defaultFileName: 'Form_A1_Tenzin_Dorji_SpecialEnclave.pdf',
    badgeColor: 'bg-indigo-500/15 text-indigo-700 border-indigo-500/30',
  },
};

/**
 * Evaluates a single field deterministically against the mock corpus rules.
 * Ensures every error message strictly follows:
 * "<Field> is <problem> due to <Section X.Y> of <Guideline/Rule document name>, page N (Rule ID ...)"
 */
export function evaluateSingleField(
  key: FieldKey,
  rawValue: string
): FieldValidationDetail {
  const val = rawValue.trim();
  const bbox = FIELD_BBOXES[key];

  switch (key) {
    case 'applicantName': {
      const words = val.split(/\s+/).filter(Boolean);
      const isUppercase = val === val.toUpperCase() && /^[A-Z\s]+$/.test(val);
      if (words.length >= 2 && isUppercase) {
        return {
          key,
          label: 'Applicant Name',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Guideline 3.2, Section 4.2, page 12 (Rule ID APP-4.2)',
          bbox,
        };
      }
      const suggestedExpected =
        val.toUpperCase() === 'RAHULKUMAR'
          ? 'RAHUL KUMAR'
          : words.length < 2 && val.length > 5
          ? `${val.slice(0, 5).toUpperCase()} ${val.slice(5).toUpperCase()}`
          : 'RAHUL KUMAR';

      return {
        key,
        label: 'Applicant Name',
        extractedValue: val || '[EMPTY]',
        expectedValue: suggestedExpected,
        status: 'wrong',
        inlineCaption:
          'Applicant Name is formatted without a space between given name and surname due to Section 4.2 of Application Submission Guidelines 2024, page 12 (Rule ID APP-4.2)',
        popover: {
          title: 'Name format is incorrect',
          extractedValue: val || '[EMPTY]',
          expectedValue: suggestedExpected,
          why: "Name format is invalid as per Section 4.2 (Applicant Name Format) of 'Application Submission Guidelines 2024', page 12, Rule ID APP-4.2. The name must contain given name and surname separated by a space.",
          sourceChipLabel:
            '[Application_Submission_Guidelines_2024.pdf, p.12, Rule APP-4.2]',
          corpusRuleId: 'APP-4.2',
          suggestedFix: 'Insert a space between the given name and surname.',
        },
        bbox,
      };
    }

    case 'dateOfBirth': {
      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
      if (ddmmyyyy) {
        return {
          key,
          label: 'Date of Birth',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Identity Document Format Rules, Section 2.1, page 6 (Rule ID DOB-2.1)',
          bbox,
        };
      }
      return {
        key,
        label: 'Date of Birth',
        extractedValue: val || '[MISSING]',
        expectedValue: '14/05/1998',
        status: 'wrong',
        inlineCaption:
          'Date of Birth is not formatted in DD/MM/YYYY syntax due to Section 2.1 of Identity Document Format Rules, page 6 (Rule ID DOB-2.1)',
        popover: {
          title: 'Date of Birth format is incorrect',
          extractedValue: val || '[MISSING]',
          expectedValue: '14/05/1998',
          why: "Date of Birth format is invalid as per Section 2.1 (Standard Date of Birth Representation) of 'Identity Document Format Rules', page 6, Rule ID DOB-2.1. Dates must use DD/MM/YYYY format with forward slashes.",
          sourceChipLabel: '[Identity_Document_Format_Rules.pdf, p.6, Rule DOB-2.1]',
          corpusRuleId: 'DOB-2.1',
          suggestedFix: 'Convert the date to DD/MM/YYYY format (e.g., 14/05/1998).',
        },
        bbox,
      };
    }

    case 'address': {
      if (
        val.toLowerCase().includes('enclave') ||
        val.toLowerCase().includes('deputation') ||
        val.toLowerCase().includes('transit zone')
      ) {
        return {
          key,
          label: 'Address',
          extractedValue: val,
          status: 'needs_review',
          inlineCaption:
            'No matching rule found in the reference documents. Requires human review.',
          bbox,
        };
      }
      const hasPin = /\b\d{6}\b/.test(val);
      if (hasPin && val.length >= 15) {
        return {
          key,
          label: 'Address',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Address Standardization Guidelines, Section 3.1, page 9 (Rule ID ADDR-3.1)',
          bbox,
        };
      }
      return {
        key,
        label: 'Address',
        extractedValue: val || '[MISSING]',
        expectedValue: `${val || 'Plot 19, Sector 14, Navi Mumbai'} - 400703`,
        status: 'wrong',
        inlineCaption:
          'Address is missing a mandatory 6-digit postal PIN code due to Section 3.1 of Address Standardization Guidelines, page 9 (Rule ID ADDR-3.1)',
        popover: {
          title: 'Address is missing 6-digit PIN code',
          extractedValue: val || '[MISSING]',
          expectedValue: 'Plot 19, Sector 14, Vashi, Navi Mumbai, Maharashtra - 400703',
          why: "Address format is incomplete as per Section 3.1 (Mandatory Postal PIN Code Requirement) of 'Address Standardization Guidelines', page 9, Rule ID ADDR-3.1. Every address must include a valid 6-digit PIN code.",
          sourceChipLabel:
            '[Address_Standardization_Guidelines.pdf, p.9, Rule ADDR-3.1]',
          corpusRuleId: 'ADDR-3.1',
          suggestedFix: 'Append a valid 6-digit postal PIN code to the address.',
        },
        bbox,
      };
    }

    case 'applicationNumber': {
      const validAppNo = /^APP-\d{4}-\d{6}$/.test(val);
      if (validAppNo) {
        return {
          key,
          label: 'Application Number',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Application Submission Guidelines 2024, Section 1.1, page 5 (Rule ID APP-1.1)',
          bbox,
        };
      }
      return {
        key,
        label: 'Application Number',
        extractedValue: val || '[MISSING]',
        expectedValue: 'APP-2026-783920',
        status: 'wrong',
        inlineCaption:
          'Application Number is malformed due to Section 1.1 of Application Submission Guidelines 2024, page 5 (Rule ID APP-1.1)',
        popover: {
          title: 'Application Number format is invalid',
          extractedValue: val || '[MISSING]',
          expectedValue: 'APP-2026-783920',
          why: "Application Number is invalid as per Section 1.1 (Application Reference Number Structure) of 'Application Submission Guidelines 2024', page 5, Rule ID APP-1.1. Must follow APP-YYYY-NNNNNN.",
          sourceChipLabel:
            '[Application_Submission_Guidelines_2024.pdf, p.5, Rule APP-1.1]',
          corpusRuleId: 'APP-1.1',
          suggestedFix: 'Format Application Number as APP-2026-NNNNNN.',
        },
        bbox,
      };
    }

    case 'certificateNumber': {
      const validCert = /^[A-Z]{2}-?\d{8}$/.test(val);
      if (validCert) {
        return {
          key,
          label: 'Certificate Number',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Certificate Validity Regulations, Section 1.4, page 4 (Rule ID CERT-1.4)',
          bbox,
        };
      }
      return {
        key,
        label: 'Certificate Number',
        extractedValue: val || '[MISSING]',
        expectedValue: 'IN20264819',
        status: 'wrong',
        inlineCaption:
          'Certificate Number is missing or malformed due to Section 1.4 of Certificate Validity Regulations, page 4 (Rule ID CERT-1.4)',
        popover: {
          title: 'Certificate Number is missing or invalid',
          extractedValue: val || '[MISSING]',
          expectedValue: 'IN20264819',
          why: "Certificate Number is non-compliant as per Section 1.4 (Certificate Serial Number Syntax) of 'Certificate Validity Regulations', page 4, Rule ID CERT-1.4. Must consist of 2 uppercase letters followed by 8 digits.",
          sourceChipLabel:
            '[Certificate_Validity_Regulations.pdf, p.4, Rule CERT-1.4]',
          corpusRuleId: 'CERT-1.4',
          suggestedFix:
            'Enter the 2-letter + 8-digit Certificate Number (e.g., IN20264819).',
        },
        bbox,
      };
    }

    case 'validFrom': {
      const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
      if (ddmmyyyy) {
        return {
          key,
          label: 'Valid From',
          extractedValue: val,
          status: 'correct',
          inlineCaption:
            'Complies with Certificate Validity Regulations, Section 5.1, page 17 (Rule ID CERT-5.1)',
          bbox,
        };
      }
      return {
        key,
        label: 'Valid From',
        extractedValue: val || '[MISSING]',
        expectedValue: '16/03/2024',
        status: 'wrong',
        inlineCaption:
          'Valid From is not formatted as DD/MM/YYYY due to Section 5.1 of Certificate Validity Regulations, page 17 (Rule ID CERT-5.1)',
        popover: {
          title: 'Valid From date format is invalid',
          extractedValue: val || '[MISSING]',
          expectedValue: '16/03/2024',
          why: "Valid From date is invalid as per Section 5.1 (Certificate Issuance & Valid From Chronology) of 'Certificate Validity Regulations', page 17, Rule ID CERT-5.1.",
          sourceChipLabel:
            '[Certificate_Validity_Regulations.pdf, p.17, Rule CERT-5.1]',
          corpusRuleId: 'CERT-5.1',
          suggestedFix: 'Enter Valid From date in DD/MM/YYYY format.',
        },
        bbox,
      };
    }

    case 'validUntil': {
      if (val.toUpperCase().includes('PROVISIONAL')) {
        return {
          key,
          label: 'Valid Until',
          extractedValue: val,
          status: 'warning',
          inlineCaption:
            'No matching rule found in the reference documents. Requires human review.',
          bbox,
        };
      }
      const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(val);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        // Verification date is Oct 2026
        const isFuture =
          year > 2026 || (year === 2026 && (month > 10 || (month === 10 && day > 27)));
        if (isFuture) {
          return {
            key,
            label: 'Valid Until',
            extractedValue: val,
            status: 'correct',
            inlineCaption:
              'Complies with Certificate Validity Regulations, Section 5.3, page 19 (Rule ID CERT-5.3)',
            bbox,
          };
        }
      }
      return {
        key,
        label: 'Valid Until',
        extractedValue: val || '[MISSING]',
        expectedValue: '15/03/2028',
        status: 'wrong',
        inlineCaption:
          'Valid Until is expired at the time of application due to Section 5.3 of Certificate Validity Regulations, page 19 (Rule ID CERT-5.3)',
        popover: {
          title: 'Certificate validity has expired',
          extractedValue: val || '[MISSING]',
          expectedValue: '15/03/2028 (Must be active on verification date)',
          why: "Certificate validity is non-compliant as per Section 5.3 (Active Validity Window at Submission) of 'Certificate Validity Regulations', page 19, Rule ID CERT-5.3. Certificate validity cannot be expired at the time of application.",
          sourceChipLabel:
            '[Certificate_Validity_Regulations.pdf, p.19, Rule CERT-5.3]',
          corpusRuleId: 'CERT-5.3',
          suggestedFix:
            'Provide a renewed certificate with a future Valid Until date (e.g., 15/03/2028).',
        },
        bbox,
      };
    }
  }
}

export function buildInitialScenarioFields(
  scenarioId: ScenarioId
): FieldValidationDetail[] {
  const rawByScenario: Record<ScenarioId, Record<FieldKey, string>> = {
    A: {
      applicantName: 'ANANYA SHARMA',
      dateOfBirth: '14/08/1999',
      address: '42 Residency Road, Ashok Nagar, Bengaluru, Karnataka - 560001',
      applicationNumber: 'APP-2026-409182',
      certificateNumber: 'IN20258841',
      validFrom: '01/12/2024',
      validUntil: '30/11/2028',
    },
    B: {
      applicantName: 'VIKRAM ADITYA RAO',
      dateOfBirth: '1998-05-14',
      address: '18 Civil Lines, MG Marg, Prayagraj, Uttar Pradesh - 211001',
      applicationNumber: 'APP-2026-512094',
      certificateNumber: '[MISSING]',
      validFrom: '10/01/2025',
      validUntil: '09/01/2029',
    },
    C: {
      applicantName: 'SURESH MENON',
      dateOfBirth: '03/11/1995',
      address: '7B Marine Drive, Ernakulam, Kochi, Kerala - 682011',
      applicationNumber: 'APP-2026-619305',
      certificateNumber: 'KL20247719',
      validFrom: '15/06/2024',
      validUntil: '14/06/2028',
    },
    D: {
      applicantName: 'RAHULKUMAR',
      dateOfBirth: '22/07/1997',
      address: 'Plot 19, Sector 14, Vashi, Navi Mumbai, Maharashtra - 400703',
      applicationNumber: 'APP-2026-783920',
      certificateNumber: 'MH20219042',
      validFrom: '16/03/2021',
      validUntil: '15/03/2024',
    },
    E: {
      applicantName: 'TENZIN DORJI',
      dateOfBirth: '09/04/1996',
      address:
        'Unit 4B, Indo-Bhutan Border Liaison Enclave, Phuentsholing Transit Zone (Special Deputation)',
      applicationNumber: 'APP-2026-890411',
      certificateNumber: 'BT20251108',
      validFrom: '01/09/2025',
      validUntil: 'PROVISIONAL-90D-EXTENSION',
    },
  };

  const orderedKeys: FieldKey[] = [
    'applicantName',
    'dateOfBirth',
    'address',
    'applicationNumber',
    'certificateNumber',
    'validFrom',
    'validUntil',
  ];

  const raw = rawByScenario[scenarioId];
  return orderedKeys.map((k) => evaluateSingleField(k, raw[k]));
}

/**
 * 1. ocrTool (SIMULATED)
 */
export async function ocrTool(scenarioId: ScenarioId): Promise<{
  fields: FieldValidationDetail[];
  latencyMs: number;
}> {
  const latencyMs = 740 + Math.floor(Math.random() * 220);
  await delay(latencyMs);
  return {
    fields: buildInitialScenarioFields(scenarioId),
    latencyMs,
  };
}

/**
 * 2. templateTool (SIMULATED)
 * Checks structural template compliance (mandatory fields present + DD/MM/YYYY structural dates + Cert No syntax).
 */
export async function templateTool(
  scenarioId: ScenarioId,
  fields: FieldValidationDetail[]
): Promise<{
  passed: boolean;
  failedFields: FieldKey[];
  summary: string;
  latencyMs: number;
}> {
  const latencyMs = 680 + Math.floor(Math.random() * 200);
  await delay(latencyMs);

  const templateKeys: FieldKey[] = [
    'certificateNumber',
    'dateOfBirth',
    'applicationNumber',
  ];
  const failedFields = fields
    .filter((f) => templateKeys.includes(f.key) && f.status === 'wrong')
    .map((f) => f.key);

  if (scenarioId === 'B' || failedFields.length > 0) {
    return {
      passed: false,
      failedFields,
      summary:
        'TEMPLATE VALIDATION FAILED: Mandatory schema gate halted pipeline due to missing Certificate Number (Rule CERT-1.4) and non-standard Date of Birth syntax (Rule DOB-2.1). Downstream stages skipped.',
      latencyMs,
    };
  }

  return {
    passed: true,
    failedFields: [],
    summary:
      'Form A-1 layout anchor points, mandatory field boxes, and date/serial structural syntax verified.',
    latencyMs,
  };
}

/**
 * 3. authenticityTool (SIMULATED GAN-based risk indicator screening)
 */
export async function authenticityTool(scenarioId: ScenarioId): Promise<{
  result: AuthenticityResult;
  latencyMs: number;
}> {
  const latencyMs = 780 + Math.floor(Math.random() * 240);
  await delay(latencyMs);

  if (scenarioId === 'C') {
    return {
      latencyMs,
      result: {
        passed: false,
        status: 'FLAGGED / REQUIRES REVIEW',
        riskLevel: 'Elevated Risk Indicator',
        riskScoreNormalized: '0.78 (Elevated Risk Indicator)',
        llmExplanation:
          'Simulated GAN discriminator patch analysis identified localized high-frequency compression residuals along the applicant portrait border (top-right quadrant) and minor substrate luminance discontinuity around the embossed seal overlap. Note: GAN-based analysis is a risk indicator, not proof of forgery, and is different from cryptographic signature validation. Human officer review is required.',
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
              'Secondary compression boundary near lower-right emblem overlap; flagged as visual risk indicator for manual inspection.',
            severity: 'elevated',
            regionBbox: { top: 83, left: 64, width: 26, height: 12 },
          },
          {
            id: 'ind-font',
            label: 'Typography & Baseline Uniformity',
            finding:
              'Glyph kerning and baseline horizontal alignment across text fields remain consistent with Form A-1 reference.',
            severity: 'low',
          },
        ],
      },
    };
  }

  return {
    latencyMs,
    result: {
      passed: true,
      status: 'PASSED',
      riskLevel: 'Low Risk Indicator',
      riskScoreNormalized: '0.12 (Low Risk Indicator)',
      llmExplanation:
        'Simulated GAN visual screening found uniform substrate noise texture, consistent portrait border blending, and aligned glyph baselines across all extracted regions. Note: GAN-based analysis is a risk indicator, not proof of forgery, and is different from cryptographic signature validation.',
      indicators: [
        {
          id: 'ind-photo-ok',
          label: 'Portrait Patch Boundary Residual',
          finding:
            'Uniform compression noise across photograph boundary and surrounding paper background.',
          severity: 'low',
        },
        {
          id: 'ind-font-ok',
          label: 'Typography & Baseline Uniformity',
          finding:
            'Consistent glyph kerning and baseline alignment across all 7 form fields.',
          severity: 'low',
        },
      ],
    },
  };
}

/**
 * 4. ragRetrieveTool (SIMULATED ChromaDB vector search)
 */
export async function ragRetrieveTool(
  scenarioId: ScenarioId,
  customQuery?: string
): Promise<VectorSearchResult> {
  return searchVectorStore(scenarioId, customQuery);
}

/**
 * 5. complianceTool & 6. llmExplainTool (SIMULATED)
 */
export async function complianceTool(
  scenarioId: ScenarioId,
  fields: FieldValidationDetail[],
  vectorResult: VectorSearchResult
): Promise<{
  decisionState: 'YES' | 'NO' | 'INSUFFICIENT_EVIDENCE';
  complianceResult: RagComplianceResult;
  latencyMs: number;
}> {
  const latencyMs = 760 + Math.floor(Math.random() * 240);
  await delay(latencyMs);

  const deterministicChecks: DeterministicCheck[] = fields.map((f) => ({
    id: `det-${f.key}`,
    fieldLabel: f.label,
    checkDescription:
      f.key === 'applicantName'
        ? 'Uppercase multi-token name with whitespace separator'
        : f.key === 'validUntil'
        ? 'Valid Until date > current verification date (Oct 2026)'
        : f.key === 'address'
        ? 'Contains 6-digit domestic PIN code and >= 15 chars'
        : f.key === 'certificateNumber'
        ? 'Regex ^[A-Z]{2}-?\\d{8}$ mandatory check'
        : 'Format & mandatory presence check',
    passed: f.status === 'correct',
    detail: f.inlineCaption,
  }));

  const hasWrong = fields.some((f) => f.status === 'wrong');
  const hasNeedsReview = fields.some(
    (f) => f.status === 'needs_review' || f.status === 'warning'
  );

  const llmSummary = await llmExplainTool(scenarioId, fields);

  if (hasWrong) {
    return {
      decisionState: 'NO',
      latencyMs,
      complianceResult: {
        status: 'NON-COMPLIANT / REQUIRES CORRECTION',
        queryBuilt: vectorResult.queryText,
        embeddingVectorPreview: vectorResult.embeddingPreview,
        retrievedPassages: vectorResult.topK,
        deterministicChecks,
        llmEvaluationSummary: llmSummary,
      },
    };
  }

  if (hasNeedsReview || scenarioId === 'E') {
    return {
      decisionState: 'INSUFFICIENT_EVIDENCE',
      latencyMs,
      complianceResult: {
        status: 'REQUIRES HUMAN REVIEW',
        queryBuilt: vectorResult.queryText,
        embeddingVectorPreview: vectorResult.embeddingPreview,
        retrievedPassages: vectorResult.topK,
        deterministicChecks,
        llmEvaluationSummary: llmSummary,
      },
    };
  }

  return {
    decisionState: 'YES',
    latencyMs,
    complianceResult: {
      status: 'PASSED',
      queryBuilt: vectorResult.queryText,
      embeddingVectorPreview: vectorResult.embeddingPreview,
      retrievedPassages: vectorResult.topK,
      deterministicChecks,
      llmEvaluationSummary: llmSummary,
    },
  };
}

/**
 * 6. llmExplainTool (SIMULATED)
 */
export async function llmExplainTool(
  scenarioId: ScenarioId,
  fields: FieldValidationDetail[]
): Promise<string> {
  await delay(300);
  const wrongFields = fields.filter((f) => f.status === 'wrong');
  const reviewFields = fields.filter(
    (f) => f.status === 'needs_review' || f.status === 'warning'
  );

  if (wrongFields.length > 0) {
    const reasons = wrongFields.map((f) => `${f.label} (${f.extractedValue})`).join(', ');
    return `Combined deterministic validation and retrieved regulatory text indicate non-compliance on ${wrongFields.length} field(s): ${reasons}. Vector similarity retrieved relevant clauses (APP-4.2, CERT-5.3), and rule evaluation confirmed violations requiring applicant correction or inline officer remediation.`;
  }

  if (reviewFields.length > 0 || scenarioId === 'E') {
    return `Semantic retrieval against the 20-document reference corpus yielded no definitive rule governing cross-border deputation enclave addresses or 90-day provisional extensions (Rule AUD-2.5). Automated decision withheld; escalated to human reviewer.`;
  }

  return `All 7 extracted fields satisfy deterministic syntax checks and align with the top-3 retrieved regulatory guidelines (APP-4.2, CERT-5.3, ADDR-3.1). Application is verified within the scope of checks performed.`;
}

/**
 * 7. dbTool (SIMULATED PostgreSQL persistence)
 */
export async function dbTool(
  action: 'insert' | 'update',
  run: VerificationRun,
  auditNote = 'Automated pipeline completion'
): Promise<VerificationRun> {
  if (action === 'insert') {
    return pgInsertVerificationRun(run);
  }
  return pgUpdateVerificationRun(run, auditNote);
}

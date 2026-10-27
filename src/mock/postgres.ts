import { SqlLogEntry, VerificationRun } from '../types';

const STORAGE_KEY_RUNS = 'oryan_forge_sih2026_runs_v1';
const STORAGE_KEY_SQL = 'oryan_forge_sih2026_sql_v1';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SqlListener = (logs: SqlLogEntry[]) => void;
const listeners: Set<SqlListener> = new Set();

let sqlLogs: SqlLogEntry[] = [];
let runsStore: VerificationRun[] = [];

function nowTimeStr(): string {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

function emitSql(entry: Omit<SqlLogEntry, 'id' | 'timestamp'>): SqlLogEntry {
  const full: SqlLogEntry = {
    ...entry,
    id: `sql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowTimeStr(),
  };
  sqlLogs = [full, ...sqlLogs].slice(0, 60);
  try {
    localStorage.setItem(STORAGE_KEY_SQL, JSON.stringify(sqlLogs));
  } catch {
    // ignore storage quota errors
  }
  listeners.forEach((cb) => cb(sqlLogs));
  return full;
}

export function subscribeSqlLogs(cb: SqlListener): () => void {
  listeners.add(cb);
  cb(sqlLogs);
  return () => {
    listeners.delete(cb);
  };
}

export function getSqlLogs(): SqlLogEntry[] {
  return sqlLogs;
}

export function clearSqlLogs(): void {
  sqlLogs = [];
  listeners.forEach((cb) => cb(sqlLogs));
}

export function initPostgresStore(seedRuns: VerificationRun[]): void {
  try {
    const rawRuns = localStorage.getItem(STORAGE_KEY_RUNS);
    if (rawRuns) {
      const parsed = JSON.parse(rawRuns);
      if (Array.isArray(parsed) && parsed.length > 0) {
        runsStore = parsed;
      } else {
        runsStore = seedRuns;
        localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runsStore));
      }
    } else {
      runsStore = seedRuns;
      localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runsStore));
    }
  } catch {
    runsStore = seedRuns;
  }

  if (sqlLogs.length === 0) {
    emitSql({
      table: 'applications',
      operation: 'SELECT',
      sql: `SELECT a.id, a.file_name, v.overall_status FROM applications a JOIN verification_results v ON a.id = v.application_id ORDER BY a.created_at DESC LIMIT 20;`,
      rowsAffected: runsStore.length,
    });
  }
}

export async function pgInsertVerificationRun(run: VerificationRun): Promise<VerificationRun> {
  await delay(620);

  emitSql({
    table: 'applications',
    operation: 'INSERT',
    sql: `INSERT INTO applications (id, file_name, scenario_code, created_at) VALUES ('${run.applicationId}', '${run.fileName}', '${run.scenarioId}', '${run.createdAt}');`,
    rowsAffected: 1,
  });

  emitSql({
    table: 'verification_results',
    operation: 'INSERT',
    sql: `INSERT INTO verification_results (run_id, application_id, overall_status, fields_json, stages_json) VALUES ('${run.id}', '${run.applicationId}', '${run.overallStatus}', '<JSONB ${run.fields.length} fields>', '<JSONB stages>');`,
    rowsAffected: 1,
  });

  emitSql({
    table: 'audit_log',
    operation: 'INSERT',
    sql: `INSERT INTO audit_log (application_id, actor, action, status, created_at) VALUES ('${run.applicationId}', 'OrchestratorAgent', 'PIPELINE_COMPLETED_${run.overallStatus.replace(/\s+/g, '_')}', 'recorded', NOW());`,
    rowsAffected: 1,
  });

  runsStore = [run, ...runsStore.filter((r) => r.id !== run.id)];
  try {
    localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runsStore));
  } catch {
    // ignore
  }
  return run;
}

export async function pgUpdateVerificationRun(
  run: VerificationRun,
  auditReason: string
): Promise<VerificationRun> {
  await delay(640);

  emitSql({
    table: 'verification_results',
    operation: 'UPDATE',
    sql: `UPDATE verification_results SET overall_status = '${run.overallStatus}', fields_json = '<JSONB updated>', reviewer_notes = '${(run.reviewerNotes || '').replace(/'/g, "''").slice(0, 40)}', updated_at = NOW() WHERE run_id = '${run.id}';`,
    rowsAffected: 1,
  });

  emitSql({
    table: 'audit_log',
    operation: 'INSERT',
    sql: `INSERT INTO audit_log (application_id, actor, action, detail, created_at) VALUES ('${run.applicationId}', 'HumanReviewer', 'FIELD_REVERIFIED_OR_DECISION', '${auditReason.replace(/'/g, "''")}', NOW());`,
    rowsAffected: 1,
  });

  runsStore = runsStore.map((r) => (r.id === run.id ? run : r));
  if (!runsStore.some((r) => r.id === run.id)) {
    runsStore = [run, ...runsStore];
  }
  try {
    localStorage.setItem(STORAGE_KEY_RUNS, JSON.stringify(runsStore));
  } catch {
    // ignore
  }
  return run;
}

export async function pgSelectAllRuns(): Promise<VerificationRun[]> {
  await delay(600);
  emitSql({
    table: 'verification_results',
    operation: 'SELECT',
    sql: `SELECT * FROM applications INNER JOIN verification_results USING (application_id) ORDER BY updated_at DESC;`,
    rowsAffected: runsStore.length,
  });
  return [...runsStore];
}

export function getRunsSnapshotSync(): VerificationRun[] {
  return [...runsStore];
}

export async function pgSelectRunById(id: string): Promise<VerificationRun | undefined> {
  await delay(600);
  const found = runsStore.find((r) => r.id === id || r.applicationId === id);
  emitSql({
    table: 'verification_results',
    operation: 'SELECT',
    sql: `SELECT * FROM verification_results WHERE run_id = '${id}' LIMIT 1;`,
    rowsAffected: found ? 1 : 0,
  });
  return found;
}

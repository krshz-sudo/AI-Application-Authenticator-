import React, { useState, useEffect, useMemo } from 'react';
import {
  AgentActivityLog,
  ApiLogEntry,
  FieldKey,
  ScenarioId,
  ScreenId,
  SqlLogEntry,
  VerificationRun,
} from './types';
import {
  buildSeedVerificationRuns,
  PipelineProgressUpdate,
  subscribeAgentActivity,
} from './mock/orchestrator';
import {
  getRunsSnapshotSync,
  initPostgresStore,
  subscribeSqlLogs,
} from './mock/postgres';
import {
  apiGetApplications,
  apiPostReverifyField,
  apiPostVerify,
  subscribeApiLogs,
} from './mock/api';
import { dbTool } from './mock/tools';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { UploadScreen } from './components/UploadScreen';
import { PipelineScreen } from './components/PipelineScreen';
import { ReviewDashboardScreen } from './components/ReviewDashboardScreen';
import { ReportScreen } from './components/ReportScreen';
import { ArchitectureScreen } from './components/ArchitectureScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { PdfSnippetModal } from './components/PdfSnippetModal';

export const App: React.FC = () => {
  const seedRuns = useMemo(() => buildSeedVerificationRuns(), []);

  const [runs, setRuns] = useState<VerificationRun[]>(() => {
    initPostgresStore(seedRuns);
    const snap = getRunsSnapshotSync();
    return snap.length > 0 ? snap : seedRuns;
  });

  const [activeScreen, setActiveScreen] = useState<ScreenId>('upload');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('D');
  const [activeRun, setActiveRun] = useState<VerificationRun>(
    () => runs.find((r) => r.scenarioId === 'D') || seedRuns[0]
  );

  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] =
    useState<PipelineProgressUpdate | null>(null);

  const [agentLogs, setAgentLogs] = useState<AgentActivityLog[]>([]);
  const [apiLogs, setApiLogs] = useState<ApiLogEntry[]>([]);
  const [sqlLogs, setSqlLogs] = useState<SqlLogEntry[]>([]);

  const [pdfModalRuleId, setPdfModalRuleId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAgent = subscribeAgentActivity(setAgentLogs);
    const unsubApi = subscribeApiLogs(setApiLogs);
    const unsubSql = subscribeSqlLogs(setSqlLogs);
    return () => {
      unsubAgent();
      unsubApi();
      unsubSql();
    };
  }, []);

  const handleStartVerification = async (
    scenario: ScenarioId,
    customFile?: { name: string; type: string; size: string }
  ) => {
    setSelectedScenario(scenario);
    setActiveScreen('pipeline');
    setIsPipelineRunning(true);
    try {
      const completedRun = await apiPostVerify(
        scenario,
        customFile || {},
        (update) => {
          setPipelineProgress(update);
        }
      );
      setActiveRun(completedRun);
      setRuns(getRunsSnapshotSync());
    } finally {
      setIsPipelineRunning(false);
      setPipelineProgress(null);
    }
  };

  const handleSwitchScenarioInstant = (scenario: ScenarioId) => {
    setSelectedScenario(scenario);
    // Find existing seed or fresh run for this scenario so switching is instant on Review/Report screens
    const freshSeed =
      buildSeedVerificationRuns().find((r) => r.scenarioId === scenario) ||
      seedRuns[0];
    setActiveRun(freshSeed);
  };

  const handleGoToReviewDirectly = (scenario: ScenarioId) => {
    handleSwitchScenarioInstant(scenario);
    setActiveScreen('review');
  };

  const handleReverifySingleField = async (key: FieldKey, newValue: string) => {
    const updatedRun = await apiPostReverifyField(activeRun, { [key]: newValue });
    setActiveRun(updatedRun);
    setRuns(getRunsSnapshotSync());
  };

  const handleReverifyMultipleFields = async (
    updates: Partial<Record<FieldKey, string>>
  ) => {
    const updatedRun = await apiPostReverifyField(activeRun, updates);
    setActiveRun(updatedRun);
    setRuns(getRunsSnapshotSync());
  };

  const handleToggleMarkForReview = (key: FieldKey) => {
    const nextRun: VerificationRun = {
      ...activeRun,
      fields: activeRun.fields.map((f) =>
        f.key === key ? { ...f, markedForReview: !f.markedForReview } : f
      ),
    };
    setActiveRun(nextRun);
  };

  const handleUpdateReviewerNotes = (notes: string) => {
    setActiveRun((prev) => ({
      ...prev,
      reviewerNotes: notes,
    }));
  };

  const handleRecordReviewerDecision = async (
    decision: 'APPROVED' | 'CORRECTION_REQUESTED' | 'ESCALATED'
  ) => {
    const nextRun: VerificationRun = {
      ...activeRun,
      reviewerDecision: decision,
      updatedAt: new Date().toISOString(),
      auditTimeline: [
        {
          id: `aud-dec-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          actor: 'Human Reviewing Officer',
          action: `Officer Decision: ${decision}`,
          detail:
            activeRun.reviewerNotes ||
            `Recorded formal officer sign-off (${decision}).`,
          status:
            decision === 'APPROVED'
              ? 'success'
              : decision === 'CORRECTION_REQUESTED'
              ? 'error'
              : 'warning',
        },
        ...activeRun.auditTimeline,
      ],
    };
    await dbTool('update', nextRun, `Officer decision: ${decision}`);
    setActiveRun(nextRun);
    setRuns(getRunsSnapshotSync());
  };

  const handleRefreshHistory = async () => {
    const fetched = await apiGetApplications();
    setRuns(fetched);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Navbar
        activeScreen={activeScreen}
        onSelectScreen={setActiveScreen}
        selectedScenario={selectedScenario}
        onQuickSwitchScenario={(sc) => {
          if (activeScreen === 'pipeline') {
            handleStartVerification(sc);
          } else {
            handleSwitchScenarioInstant(sc);
          }
        }}
        isPipelineRunning={isPipelineRunning}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeScreen === 'upload' && (
          <UploadScreen
            selectedScenario={selectedScenario}
            onSelectScenario={handleSwitchScenarioInstant}
            onStartVerification={handleStartVerification}
            onGoToReviewDirectly={handleGoToReviewDirectly}
          />
        )}

        {activeScreen === 'pipeline' && (
          <PipelineScreen
            run={activeRun}
            progress={pipelineProgress}
            isRunning={isPipelineRunning}
            agentLogs={agentLogs}
            apiLogs={apiLogs}
            sqlLogs={sqlLogs}
            onRerunScenario={(sc) => handleStartVerification(sc)}
            onGoToReview={() => setActiveScreen('review')}
            onGoToReport={() => setActiveScreen('report')}
            onReverifyField={handleReverifySingleField}
            onOpenPdfSnippet={(ruleId) => setPdfModalRuleId(ruleId)}
            onToggleMarkForReview={handleToggleMarkForReview}
          />
        )}

        {activeScreen === 'review' && (
          <ReviewDashboardScreen
            run={activeRun}
            onReverifyField={handleReverifySingleField}
            onReverifyMultipleFields={handleReverifyMultipleFields}
            onOpenPdfSnippet={(ruleId) => setPdfModalRuleId(ruleId)}
            onToggleMarkForReview={handleToggleMarkForReview}
            onUpdateReviewerNotes={handleUpdateReviewerNotes}
            onRecordReviewerDecision={handleRecordReviewerDecision}
            onSwitchScenario={handleSwitchScenarioInstant}
            onGoToReport={() => setActiveScreen('report')}
          />
        )}

        {activeScreen === 'report' && (
          <ReportScreen
            run={activeRun}
            onOpenPdfSnippet={(ruleId) => setPdfModalRuleId(ruleId)}
            onBackToReview={() => setActiveScreen('review')}
          />
        )}

        {activeScreen === 'architecture' && (
          <ArchitectureScreen
            onOpenPdfSnippet={(ruleId) => setPdfModalRuleId(ruleId)}
          />
        )}

        {activeScreen === 'history' && (
          <HistoryScreen
            runs={runs}
            sqlLogs={sqlLogs}
            activeRunId={activeRun.id}
            onSelectRunForReview={(r) => {
              setActiveRun(r);
              setSelectedScenario(r.scenarioId);
              setActiveScreen('review');
            }}
            onSelectRunForReport={(r) => {
              setActiveRun(r);
              setSelectedScenario(r.scenarioId);
              setActiveScreen('report');
            }}
            onRefreshFromApi={handleRefreshHistory}
          />
        )}
      </main>

      <Footer />

      {/* Global Fake PDF-Snippet Citation Modal */}
      <PdfSnippetModal
        ruleId={pdfModalRuleId}
        onClose={() => setPdfModalRuleId(null)}
      />
    </div>
  );
};

export default App;

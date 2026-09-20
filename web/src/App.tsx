import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Skills from './pages/Skills';
import Agents from './pages/Agents';
import Datasets from './pages/Datasets';
import EvalRuns from './pages/EvalRuns';
import Annotations from './pages/Annotations';
import Reports from './pages/Reports';
import Pipelines from './pages/Pipelines';
import Leaderboard from './pages/Leaderboard';
import Observability from './pages/Observability';
import Settings from './pages/Settings';
// Eval Core
import MatrixEval from './pages/MatrixEval';
import RedTeam from './pages/RedTeam';
import RAGEval from './pages/RAGEval';
import ConversationEval from './pages/ConversationEval';
import Traces from './pages/Traces';
// Advanced Eval
import MultimodalEval from './pages/MultimodalEval';
import LLMJudge from './pages/LLMJudge';
import Guardrails from './pages/Guardrails';
import ABTests from './pages/ABTests';
import PromptOptimize from './pages/PromptOptimize';
import CostTracking from './pages/CostTracking';
import Benchmark from './pages/Benchmark';
import EloRating from './pages/EloRating';
import Regression from './pages/Regression';
import Snapshots from './pages/Snapshots';
import SemanticCache from './pages/SemanticCache';
import Templates from './pages/Templates';
// Ops
import Webhooks from './pages/Webhooks';
import Scheduler from './pages/Scheduler';
import OnlineEval from './pages/OnlineEval';
import SyntheticData from './pages/SyntheticData';
import Workflows from './pages/Workflows';
import DataLineage from './pages/DataLineage';
import ModelComparison from './pages/ModelComparison';
import AlertRules from './pages/AlertRules';
import Permissions from './pages/Permissions';
import DataSampling from './pages/DataSampling';
import DataQuality from './pages/DataQuality';
import TaskOrchestration from './pages/TaskOrchestration';
// Platform
import ConfigPage from './pages/ConfigPage';
import SearchPage from './pages/SearchPage';
import Tenants from './pages/Tenants';
import EvalCache from './pages/EvalCache';
import PromptVersion from './pages/PromptVersion';
import Replay from './pages/Replay';
import Experiments from './pages/Experiments';
import Anonymization from './pages/Anonymization';
import RateLimiting from './pages/RateLimiting';
import DataAugmentation from './pages/DataAugmentation';
import Multilingual from './pages/Multilingual';
import ReportGen from './pages/ReportGen';
import DataVersioning from './pages/DataVersioning';
import MetricAttribution from './pages/MetricAttribution';
import Scenarios from './pages/Scenarios';
import ResultExplanation from './pages/ResultExplanation';
import Distillation from './pages/Distillation';
import Federated from './pages/Federated';
import ModelRegistry from './pages/ModelRegistry';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="skills" element={<Skills />} />
        <Route path="agents" element={<Agents />} />
        <Route path="datasets" element={<Datasets />} />
        <Route path="eval-runs" element={<EvalRuns />} />
        <Route path="annotations" element={<Annotations />} />
        <Route path="reports" element={<Reports />} />
        <Route path="pipelines" element={<Pipelines />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="observability" element={<Observability />} />
        <Route path="settings" element={<Settings />} />
        {/* Eval Core */}
        <Route path="matrix" element={<MatrixEval />} />
        <Route path="redteam" element={<RedTeam />} />
        <Route path="rag" element={<RAGEval />} />
        <Route path="conversation" element={<ConversationEval />} />
        <Route path="traces" element={<Traces />} />
        {/* Advanced Eval */}
        <Route path="multimodal" element={<MultimodalEval />} />
        <Route path="llm-judge" element={<LLMJudge />} />
        <Route path="guardrails" element={<Guardrails />} />
        <Route path="ab-tests" element={<ABTests />} />
        <Route path="prompt-optimize" element={<PromptOptimize />} />
        <Route path="cost-tracking" element={<CostTracking />} />
        <Route path="benchmark" element={<Benchmark />} />
        <Route path="elo-rating" element={<EloRating />} />
        <Route path="regression" element={<Regression />} />
        <Route path="snapshots" element={<Snapshots />} />
        <Route path="semantic-cache" element={<SemanticCache />} />
        <Route path="templates" element={<Templates />} />
        {/* Ops */}
        <Route path="webhooks" element={<Webhooks />} />
        <Route path="scheduler" element={<Scheduler />} />
        <Route path="online-eval" element={<OnlineEval />} />
        <Route path="synthetic-data" element={<SyntheticData />} />
        <Route path="workflows" element={<Workflows />} />
        <Route path="data-lineage" element={<DataLineage />} />
        <Route path="model-comparison" element={<ModelComparison />} />
        <Route path="alert-rules" element={<AlertRules />} />
        <Route path="permissions" element={<Permissions />} />
        <Route path="data-sampling" element={<DataSampling />} />
        <Route path="data-quality" element={<DataQuality />} />
        <Route path="task-orchestration" element={<TaskOrchestration />} />
        {/* Platform */}
        <Route path="config" element={<ConfigPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="eval-cache" element={<EvalCache />} />
        <Route path="prompt-version" element={<PromptVersion />} />
        <Route path="replay" element={<Replay />} />
        <Route path="experiments" element={<Experiments />} />
        <Route path="anonymization" element={<Anonymization />} />
        <Route path="rate-limiting" element={<RateLimiting />} />
        <Route path="data-augmentation" element={<DataAugmentation />} />
        <Route path="multilingual" element={<Multilingual />} />
        <Route path="report-gen" element={<ReportGen />} />
        <Route path="data-versioning" element={<DataVersioning />} />
        <Route path="metric-attribution" element={<MetricAttribution />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="result-explanation" element={<ResultExplanation />} />
        <Route path="distillation" element={<Distillation />} />
        <Route path="federated" element={<Federated />} />
        <Route path="model-registry" element={<ModelRegistry />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

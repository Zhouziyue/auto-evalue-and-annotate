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
      </Route>
    </Routes>
  );
}

export default App;

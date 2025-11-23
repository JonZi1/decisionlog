import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewDecision } from './pages/NewDecision';
import { DecisionsList } from './pages/DecisionsList';
import { DecisionDetail } from './pages/DecisionDetail';
import { Settings } from './pages/Settings';
import { Categories } from './pages/Categories';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/new" element={<NewDecision />} />
          <Route path="/decisions" element={<DecisionsList />} />
          <Route path="/decision/:id" element={<DecisionDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

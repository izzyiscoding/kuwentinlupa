import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Footer, Masthead } from './components/Chrome';
import ScrollToTop from './components/ScrollToTop';
import { configProblems } from './config';
import { useLang } from './lib/lang';
import { usePortal } from './lib/portal-context';
import About from './pages/About';
import Analysis from './pages/Analysis';
import Barangay from './pages/Barangay';
import Enacted from './pages/Enacted';
import Home from './pages/Home';
import Project from './pages/Project';
import Projects from './pages/Projects';

/** The list used to live at /#projects (with its filters); send those links to /projects. */
function HomeOrList() {
  const { hash, search } = useLocation();
  if (hash === '#projects' || search) return <Navigate to={{ pathname: '/projects', search }} replace />;
  if (hash === '#offices') return <Navigate to="/analysis#offices" replace />;
  return <Home />;
}

export default function App() {
  const { config } = usePortal();
  const { t } = useLang();
  const problems = import.meta.env.DEV ? configProblems(config) : [];
  return (
    <>
      <ScrollToTop />
      <Masthead />
      {problems.length > 0 && (
        <div className="page config-warning" role="alert">
          <strong>portal.config.ts needs attention</strong> (shown in development only):
          <ul>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomeOrList />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:dataset/:id" element={<Project />} />
        <Route path="/barangay/:slug" element={<Barangay />} />
        {/* Offices and their districts are a section of /analysis; old links land there. */}
        <Route path="/districts" element={<Navigate to="/analysis#offices" replace />} />
        <Route path="/gaa" element={<Enacted />} />
        <Route path="/about" element={<About />} />
        <Route
          path="*"
          element={
            <main className="page main">
              <p className="state">{t('This page does not exist.', 'Walang ganitong pahina.')} <Link to="/">{t('Back to the overview', 'Bumalik sa buod')}</Link></p>
            </main>
          }
        />
      </Routes>
      <Footer />
    </>
  );
}

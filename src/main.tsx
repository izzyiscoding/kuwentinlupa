import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import PortalProvider from './components/PortalProvider';
import LanguageProvider from './components/LanguageProvider';
import './styles/theme.css';
import './styles/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PortalProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </PortalProvider>
    </BrowserRouter>
  </StrictMode>,
);

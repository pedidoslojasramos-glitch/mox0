import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RamoxProvider } from './services/RamoxContextComponent';
import { ErrorBoundary } from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RamoxProvider>
        <App />
      </RamoxProvider>
    </ErrorBoundary>
  </StrictMode>,
);

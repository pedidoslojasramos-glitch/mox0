import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RamoxProvider } from './services/RamoxContextComponent';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RamoxProvider>
      <App />
    </RamoxProvider>
  </StrictMode>,
);

import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DemoPublisher } from './DemoPublisher';
import { RootApp } from './RootApp';
import './styles.css';
import { titalTheme } from './theme';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Tital web root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={titalTheme}>
      <CssBaseline />
      <RootApp />
      <DemoPublisher />
    </ThemeProvider>
  </StrictMode>
);

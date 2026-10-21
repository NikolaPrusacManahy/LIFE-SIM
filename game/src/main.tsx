import { createRoot } from 'react-dom/client';
import { App } from './App';
import { installZoom } from './ui/layout';
import { loadSettings } from './ui/settingsStore';
import './ui/theme.css';

installZoom();
loadSettings();
createRoot(document.getElementById('root')!).render(<App />);

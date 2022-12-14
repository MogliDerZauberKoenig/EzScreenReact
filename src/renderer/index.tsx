import { createRoot } from 'react-dom/client';
import App from './App';
import Area from './Area/Area';

const container = document.getElementById('root')!;
const root = createRoot(container);

let splitter = '#\\';
  
if (window.location.href.includes('%23/')) splitter = '%23/';

const view = window.location.href.split(splitter)[window.location.href.split(splitter).length - 1];

if(view === 'Main')
  root.render(<App />);
else
  root.render(<Area />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

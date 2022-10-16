import { createRoot } from 'react-dom/client';
import Area from './Area';

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<Area />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);

/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, shell, ipcMain, screen, globalShortcut, dialog, Notification, clipboard } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import screenshot from 'screenshot-desktop';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import axios from 'axios';
import FormData from 'form-data';
import Jimp from 'jimp';

const urls = {
  upload: 'http://37.228.132.183/ezscreen/upload.php',
  update: 'http://37.228.132.183/ezscreen/update.php',
  login: 'http://37.228.132.183/ezscreen/login.php',
  addUploadTime: 'http://37.228.132.183/ezscreen/addUploadTime.php',
  delete: 'http://37.228.132.183/ezscreen/delete.php',
  createGuest: 'http://37.228.132.183/ezscreen/createGuest.php',
};

let config = {
  account: {
    username: '',
    password: '',
  },
};

let mainWindow: BrowserWindow | null = null;
let cropWindow: BrowserWindow | null = null;

const port = process.env.PORT || 1212;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 700,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      devTools: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.removeMenu();

  mainWindow.loadURL(resolveHtmlPath('index.html#/Main'));
  /*mainWindow.loadURL(
    isDebug
      ? `http://localhost:${port}?Main`
      : `file://${path.join(__dirname, '../build/index.html?Main')}`
  );*/

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  // menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  console.log('feed');
  console.log(autoUpdater.currentVersion.version);

  // new AppUpdater();
  autoUpdater.checkForUpdates();
};

/**
 * Add event listeners...
 */

autoUpdater.on('update-available', (_event, releaseNotes, releaseName) => {
  new Notification({
    title: 'EzScreen Update',
    body: 'Neues Update wird heruntergeladen',
  }).show();
});

autoUpdater.on('update-downloaded', (_event, releaseNotes, releaseName) => {
  new Notification({
    title: 'EzScreen Update',
    body: 'Neues Update wird installiert',
  }).show();

  autoUpdater.quitAndInstall();
});

function checkConfig() {
  if (!checkFileExistsSync(`${app.getPath("userData")}/config.json`)) {
    saveConfig();
  }

  loadConfig();
}

function loadConfig() {
  config = JSON.parse(fs.readFileSync(`${app.getPath("userData")}/config.json`));
}

function saveConfig() {
  fs.writeFileSync(`${app.getPath("userData")}/config.json`, JSON.stringify(config, null, 4));
}

function checkFileExistsSync(filepath) {
  let flag = true;
  try {
    fs.accessSync(filepath, fs.constants.F_OK);
  } catch (e) {
    flag = false;
  }
  return flag;
}

function checkLoginStatus() {
  const formData = new FormData();
  formData.append('username', config.account.username);
  formData.append('password', config.account.password);

  log.debug('Checking Login Status');

  // eslint-disable-next-line prettier/prettier
  axios.post(urls.login, formData, { headers: formData.getHeaders() }).then((res) => {
    console.log(res.data);
    log.debug(res.data);
    if(!res.data.status) {
      createGuest();
    }
  }).catch((err) => {
    console.log(err);
    log.error(err);
  });
}

function createGuest() {
  axios.post(urls.createGuest, null).then((res) => {
    if (res.data.status) {
      config.account.username = res.data.username;
      config.account.password = res.data.password;
      saveConfig();

      checkLoginStatus();
    }
  }).catch((err) => {

  });
}

function createCompleteMonitorScreenshot() {
  log.debug('creating screenshot');

  let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  let displayId = 0;
  let displays = screen.getAllDisplays();
  for (let i = 0; i < displays.length; i++) {
    if (displays[i].id === display.id) {
      displayId = i;
    }
  }



  screenshot
    .listDisplays()
    .then((displays) => {
      console.log(displays);
      log.debug(displays);
      screenshot({ screen: displays[displayId].id, format: 'png' })
        .then((img) => {
          log.debug('screenshot created');
          fs.writeFile('test.png', img, function (err) {
            if (err) {
              mainWindow.webContents.send('log', err);
              log.error(err);
              throw err;
            }

            log.debug('screenshot saved');

            uploadImageFromBuffer(img);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
      log.error(err);
    });
}

const openArea = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  console.log('creating crop window');
  cropWindow = new BrowserWindow({
    show: true,
    width: 800,
    height: 700,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    minimizable: false,
    maximizable: false,
    resizable: false,
    icon: getAssetPath('icon.png'),
    opacity: 0.5,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  cropWindow.on('closed', () => {
    updatingArea = false;
  });

  cropWindow.removeMenu();
  cropWindow.loadURL(resolveHtmlPath('index.html#/Area'));

  cropWindow.show();

  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());

  cropWindow.setBounds(display.bounds);

  updateArea();

  console.log(display);
};

let updatingArea = false;
let currentDisplayId = 0;
const updateArea = async () => {
  if (updatingArea) return;
  updatingArea = true;

  while (updatingArea) {
    const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const displays = screen.getAllDisplays();
    for (let i = 0; i < displays.length; i++) {
      if (displays[i].id === display.id) {
        if (i !== currentDisplayId) {
          currentDisplayId = i;
          console.log('display changed');
          cropWindow?.setBounds(display.bounds);
        }

        break;
      }
    }

    // eslint-disable-next-line no-await-in-loop
    await wait(500);
  }
};

const wait = (time: number | undefined) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

const vectorToBounds = (
  vec1: { x: number; y: number },
  vec2: { x: number; y: number }
) => {
  // eslint-disable-next-line prefer-const
  let bounds = {
    x: vec1.x,
    y: vec1.y,
    width: vec2.x - vec1.x,
    height: vec2.y - vec1.y,
  };

  // create normal bounds
  if (bounds.width < 0) {
    bounds.width *= -1;
    bounds.x -= bounds.width;
  }

  if (bounds.height < 0) {
    bounds.height *= -1;
    bounds.y -= bounds.height;
  }

  return bounds;
};

function uploadImageFromBuffer(img) {
  const formData = new FormData();
  formData.append('file', img, 'upload.png');
  formData.append('username', config.account.username);
  formData.append('password', config.account.password);

  axios.post(urls.upload, formData, { headers: formData.getHeaders() }).then((res) => {
    console.log(res.data);
    if(res.data.status) {
      clipboard.writeText(res.data.url);
      mainWindow.webContents.send('screenshot_uploaded');
    }
  }).catch((err) => {
    console.log(err);
  });
}

ipcMain.on('screenshot_create', async (event, arg) => {
  createCompleteMonitorScreenshot();
});

ipcMain.on('version_current', (event, arg) => {
  event.reply('version_current', autoUpdater.currentVersion.version);
});

ipcMain.on('config_username', (event, arg) => {
  event.reply('config_username', config.account.username);
});

ipcMain.on('crop_create', (event, arg) => {
  updatingArea = false;
  if (cropWindow !== null) {
    console.log('quit crop window');
    cropWindow?.close();
  }

  let display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  let displayId = 0;
  let displays = screen.getAllDisplays();
  for (let i = 0; i < displays.length; i++) {
    if (displays[i].id === display.id) {
      displayId = i;
    }
  }

  console.log(arg);

  // eslint-disable-next-line prefer-const
  let bounds = vectorToBounds(
    { x: arg.areaStart.current.x, y: arg.areaStart.current.y },
    { x: arg.areaEnd.current.x, y: arg.areaEnd.current.y }
  );

  screenshot
    .listDisplays()
    .then((displays) => {
      screenshot({ screen: displays[displayId].id, format: 'png' })
        .then((img) => {
          Jimp.read(img).then(image => {
            image.crop(bounds.x, bounds.y, bounds.width, bounds.height);

            image.write('test.png', function() { });
            image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
              uploadImageFromBuffer(buffer);
            });
          }).catch((err) => {
            console.log(err);
          })
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((err) => {
      console.log(err);
      log.error(err);
    });
});

ipcMain.on('crop_quit', (event, arg) => {

  updatingArea = false;
  if (cropWindow !== null) {
    console.log('quit crop window');
    cropWindow?.close();
  }
});

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    updatingArea = false;
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    // register global shortcuts
    const completeMonitorScreenshot = globalShortcut.register('CommandOrControl+Shift+X', () => {
        createCompleteMonitorScreenshot();
    });

    const areaScreenshot = globalShortcut.register('CommandOrControl+Shift+Y', () => {
      openArea();
    });

    checkConfig();
    checkLoginStatus();

    console.log(app.getPath('userData'));

    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });

    app.on('before-quit', () => {
      updatingArea = false;
    });
  })
  .catch(console.log);

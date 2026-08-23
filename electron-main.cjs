const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { app, BrowserWindow } = require('electron');
const { fork } = require('child_process');

let mainWindow;
let serverProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'AI Budget Tracker',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the web app that our local server will be hosting
  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Start the background Express server
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '3000'
    }
  });

  // Give the server a couple seconds to boot up before opening the window
  setTimeout(createWindow, 3500);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  // Ensure we kill the express server process when the electron app closes
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

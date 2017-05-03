const {electron, app, ipcMain, BrowserWindow} = require('electron');
const config = require('config');
const path = require('path');
const url = require('url');
const io = require("socket.io-client");
const log = require('./app/js/logger').default;
const socketEndpoint = config.get('socket-endpoint');
const socket = new io(socketEndpoint);
const Queue = require('./app/js/queue');
const Status = require('./app/js/status');

let mainWindow = null;
let queue = new Queue();
let status = Status.Waiting;

app.on('ready', initialize);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') { app.quit(); }
})

app.on('activate', function () {
  if (mainWindow === null) { initialize(); }
})

socket.on('connect', () => {   
  log.info(`Electron client socket connection made: ${socketEndpoint}`);   
});

// Message from MediaPlayerManager
socket.on('message', (payload) => {
  
  switch (payload.method) {
    case 'play':
    {
      if (status === Status.Waiting) {
        status = Status.Playing;
        mainWindow.webContents.send('message', payload.arg);
        log.info(`electron main: play`);
      } else {
        queue.enqueue(payload.arg);
        log.info(`electron main: play queued`);
      }
      
      break;
    }
    default: {
    }
  }
});

ipcMain.on('play-complete', (event, arg) => {  
  
  // Update playback status
  status = Status.Waiting;

  // Dequeue item for playback
  let item = queue.dequeue();

  // Play item if available, otherwise do nothing
  if (item) {
    mainWindow.webContents.send('message', item);
    log.info(`electron main: play-complete, playing from queue`);
  } else {
    log.info(`electron main: play-complete, queue empty`);
  }
  
  // Play complete message to media player
  socket.emit('message', "electron main: play-complete");  
});

function initialize() {
  createWindow();
}

function createWindow() {
    try {

        // Get current view config 
        let currentView = config.get('views').filter((item) => {
          return (item.name === config.get('currentView'));
        })[0];

        // Initialize Browser window (render thread)
        mainWindow = new BrowserWindow({ width: currentView.windowWidth, height: currentView.windowHeight, frame: false, fullscreenable: false, backgroundColor: '#000' });
        mainWindow.setSize(currentView.windowWidth, currentView.windowHeight);
        mainWindow.setPosition(currentView.positionX, currentView.positionY);
        mainWindow.setMovable(false);
        mainWindow.setResizable(false);
        mainWindow.setAlwaysOnTop(currentView.isAlwaysOnTop);
        mainWindow.loadURL(`file://${__dirname}/app/html/${currentView.name}.html`);

        // Insert CSS to hide cursor (optional)
        if (currentView.hideCursor == true) {
            mainWindow.webContents.insertCSS('*{cursor: none !important;}');
            mainWindow.webContents.executeJavaScript('document.documentElement.style.cursor = "none"; var allElements = document.getElementsByTagName("*"); for(var i=0;i<allElements.length;i++){ allElements[i].style.cursor = "none";  }');
        }

        // Log window creation
        log.info(`Loading client view: ${currentView.name}, width: ${currentView.windowWidth}, height: ${currentView.windowHeight}, xPos: ${currentView.positionX}, yPos: ${currentView.positionY}`);

        // Handle window closed event
        mainWindow.on('closed', () => { mainWindow = null; });

        // Allow debugging
        if (config.get('openDevTools') === 'true') {
          mainWindow.openDevTools();
        }
    } catch (error) {
        log.error(error);
    }
}

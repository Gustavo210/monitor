const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow = null;
let dialogCallback = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    show: false,
    frame: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("dialog.html");

  mainWindow.on("closed", () => {
    if (dialogCallback) {
      dialogCallback(false);
      dialogCallback = null;
    }
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});

ipcMain.on("sync-response", (event, response) => {
  if (dialogCallback) {
    dialogCallback(response);
    dialogCallback = null;
  }
  if (mainWindow) {
    mainWindow.hide();
  }
});

function showSyncDialog() {
  return new Promise((resolve) => {
    dialogCallback = resolve;
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

function executeSync() {
  console.log("Executing database sync...");
  // Add your sync command here
}

module.exports = {
  showSyncDialog,
  executeSync,
};

const { app, BrowserWindow, ipcMain } = require("electron");
const childProcess = require("child_process");
const config = require("./config");
const fileManager = require("./fileManager");

// Disable GPU acceleration
app.disableHardwareAcceleration();

let mainWindow = null;
let dialogCallback = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 200,
    show: false,
    frame: true,
    autoHideMenuBar: true,
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

function showSyncDialog() {
  return new Promise((resolve) => {
    dialogCallback = resolve;
    if (mainWindow) {
      mainWindow.show();
    } else {
      createWindow();
      mainWindow.once("ready-to-show", () => {
        mainWindow.show();
      });
    }
  });
}

function executeSync() {
  console.log("Executing database sync...");
  childProcess.execSync("alacritty -e  $HOME/scripts/banco/banco-normal.sh");
}

async function monitorFile() {
  let lastKnownModification = fileManager.loadLastModification();

  console.log("Monitoring SQL file for changes...");
  console.log(
    `Last known modification: ${new Date(
      lastKnownModification
    ).toLocaleString()}`
  );
  setInterval(async () => {
    try {
      const currentModification = fileManager.getFileModificationTime();

      if (!lastKnownModification) {
        lastKnownModification = currentModification;
        fileManager.saveLastModification(currentModification);
        return;
      }

      if (currentModification > lastKnownModification) {
        if (fileManager.isFileLocked()) {
          console.log(
            "File is currently locked (data being inserted). Skipping notification."
          );
          return;
        }

        const shouldSync = await showSyncDialog();
        if (shouldSync) {
          executeSync();
        }

        console.log(
          `File was modified at ${new Date(
            currentModification
          ).toLocaleString()}`
        );
        lastKnownModification = currentModification;
        fileManager.saveLastModification(currentModification);
      }
    } catch (err) {
      console.error("Error during monitoring:", err);
    }
  }, config.CHECK_INTERVAL);
}

app.on("ready", () => {
  createWindow();
  monitorFile();
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

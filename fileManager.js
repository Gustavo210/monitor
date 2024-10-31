const fs = require("fs");
const config = require("./config");

function loadLastModification() {
  try {
    if (fs.existsSync(config.CONFIG_FILE)) {
      const data = fs.readFileSync(config.CONFIG_FILE, "utf8");
      return JSON.parse(data).lastModification;
    }
  } catch (err) {
    console.error("Error reading config file:", err);
  }
  return null;
}

function saveLastModification(timestamp) {
  try {
    fs.writeFileSync(
      config.CONFIG_FILE,
      JSON.stringify({ lastModification: timestamp })
    );
  } catch (err) {
    console.error("Error saving config file:", err);
  }
}

function isFileLocked() {
  try {
    // Try to open the file in read-write mode
    const fd = fs.openSync(config.SQL_FILE, "r+");
    // If successful, close it immediately
    fs.closeSync(fd);
    return false;
  } catch (err) {
    // If we get EBUSY or EACCES, the file is locked
    if (err.code === "EBUSY" || err.code === "EACCES") {
      return true;
    }
    // For other errors, throw them
    throw err;
  }
}

function getFileModificationTime() {
  try {
    const stats = fs.statSync(config.SQL_FILE);
    return stats.mtimeMs;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error("SQL file not found. Please check the path.");
    }
    throw err;
  }
}

module.exports = {
  loadLastModification,
  saveLastModification,
  getFileModificationTime,
  isFileLocked,
};

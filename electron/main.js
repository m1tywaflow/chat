// const {
//   app,
//   BrowserWindow,
//   Tray,
//   Menu,
//   nativeImage,
//   ipcMain,
//   screen,
// } = require("electron");
// import { session } from "electron";
// const path = require("path");

// app.disableHardwareAcceleration();

// let mainWindow;
// let tray;
// let notificationWindow = null;

// let unreadCount = 0;

// const isDev = !app.isPackaged;

// const APP_URL = isDev
//   ? "http://localhost:3000"
//   : "https://chat-vert-nu-34.vercel.app/";

// const APP_ICON = path.join(__dirname, "icons/icon.png");
// const TRAY_ICON = path.join(__dirname, "icons/tray.png");
// const TRAY_ICON_UNREAD = path.join(__dirname, "icons/tray-unread.png");

// const NOTIF_WIDTH = 380;
// const NOTIF_HEIGHT = 100;
// const NOTIF_MARGIN = 16;
// const MOUSE_POLL_INTERVAL = 50;

// function updateTrayIcon() {
//   if (!tray) return;

//   const icon =
//     unreadCount > 0
//       ? nativeImage.createFromPath(TRAY_ICON_UNREAD)
//       : nativeImage.createFromPath(TRAY_ICON);

//   tray.setImage(icon);
//   tray.setToolTip(unreadCount > 0 ? `Chat • ${unreadCount} unread` : "Chat");
// }

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     minWidth: 900,
//     minHeight: 600,
//     backgroundColor: "#0d0b14",
//     icon: APP_ICON,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });

//   mainWindow.loadURL(APP_URL).catch((err) => {
//     console.error("[loadURL] failed to start load:", err);
//   });

//   mainWindow.webContents.on(
//     "did-fail-load",
//     (_e, errorCode, errorDescription, validatedURL) => {
//       console.error(
//         "[did-fail-load]",
//         errorCode,
//         errorDescription,
//         validatedURL
//       );
//     }
//   );

//   mainWindow.webContents.on("render-process-gone", (_e, details) => {
//     console.error("[render-process-gone]", details);
//   });

//   mainWindow.webContents.on("unresponsive", () => {
//     console.error("[renderer] became unresponsive");
//   });

//   function broadcastVisibility() {
//     if (!mainWindow || mainWindow.isDestroyed()) return;
//     if (!mainWindow.webContents || mainWindow.webContents.isDestroyed()) return;
//     const visible = mainWindow.isVisible() && mainWindow.isFocused();
//     mainWindow.webContents.send("window-visibility-changed", visible);
//   }

//   mainWindow.on("show", broadcastVisibility);
//   mainWindow.on("hide", broadcastVisibility);
//   mainWindow.on("focus", broadcastVisibility);
//   mainWindow.on("blur", broadcastVisibility);
//   mainWindow.webContents.once("did-finish-load", broadcastVisibility);

//   mainWindow.on("close", (e) => {
//     if (!app.isQuiting) {
//       e.preventDefault();
//       mainWindow.hide();
//     }
//   });

//   mainWindow.on("focus", () => {
//     unreadCount = 0;
//     updateTrayIcon();
//     mainWindow.flashFrame(false);
//   });
// }

// session.defaultSession.setPermissionRequestHandler(
//   (webContents, permission, callback) => {
//     if (permission === "media") {
//       callback(true);
//       return;
//     }
//     callback(false);
//   }
// );

// function getActiveDisplay() {
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     return screen.getDisplayMatching(mainWindow.getBounds());
//   }
//   return screen.getPrimaryDisplay();
// }

// function positionNotificationWindow() {
//   if (!notificationWindow || notificationWindow.isDestroyed()) return;

//   const display = getActiveDisplay();
//   const area = display.workArea;

//   notificationWindow.setBounds({
//     x: Math.round(area.x + area.width - NOTIF_WIDTH - NOTIF_MARGIN),
//     y: Math.round(area.y + area.height - NOTIF_HEIGHT - NOTIF_MARGIN),
//     width: NOTIF_WIDTH,
//     height: NOTIF_HEIGHT,
//   });
// }

// function createNotificationWindow() {
//   notificationWindow = new BrowserWindow({
//     width: NOTIF_WIDTH,
//     height: NOTIF_HEIGHT,
//     frame: false,
//     transparent: true,
//     resizable: false,
//     alwaysOnTop: true,
//     skipTaskbar: true,
//     show: false,
//     hasShadow: false,
//     focusable: false,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });

//   notificationWindow.setIgnoreMouseEvents(true, { forward: true });

//   notificationWindow.loadURL(APP_URL + "/notification").catch((err) => {
//     console.error("[notificationWindow loadURL] failed:", err);
//   });

//   notificationWindow.webContents.on(
//     "did-fail-load",
//     (_e, errorCode, errorDescription, validatedURL) => {
//       console.error(
//         "[notification did-fail-load]",
//         errorCode,
//         errorDescription,
//         validatedURL
//       );
//     }
//   );

//   notificationWindow.on("closed", () => {
//     stopMousePolling();
//     notificationWindow = null;
//   });
// }

// function createTray() {
//   tray = new Tray(nativeImage.createFromPath(TRAY_ICON));
//   tray.setToolTip("Chat");

//   tray.setContextMenu(
//     Menu.buildFromTemplate([
//       {
//         label: "Open",
//         click() {
//           mainWindow.show();
//           mainWindow.focus();
//         },
//       },
//       { type: "separator" },
//       {
//         label: "Quit",
//         click() {
//           app.isQuiting = true;
//           app.quit();
//         },
//       },
//     ])
//   );

//   tray.on("click", () => {
//     if (mainWindow.isVisible()) {
//       mainWindow.hide();
//     } else {
//       mainWindow.show();
//       mainWindow.focus();
//     }
//   });
// }

// let mousePollInterval = null;

// function startMousePolling() {
//   if (mousePollInterval) return;

//   mousePollInterval = setInterval(() => {
//     if (!notificationWindow || notificationWindow.isDestroyed()) {
//       stopMousePolling();
//       return;
//     }

//     const cursor = screen.getCursorScreenPoint();
//     const bounds = notificationWindow.getBounds();

//     const isInside =
//       cursor.x >= bounds.x &&
//       cursor.x <= bounds.x + bounds.width &&
//       cursor.y >= bounds.y &&
//       cursor.y <= bounds.y + bounds.height;

//     notificationWindow.setIgnoreMouseEvents(!isInside, { forward: true });
//   }, MOUSE_POLL_INTERVAL);
// }

// function stopMousePolling() {
//   if (mousePollInterval) {
//     clearInterval(mousePollInterval);
//     mousePollInterval = null;
//   }
// }

// ipcMain.on("new-message", (_, data) => {
//   unreadCount++;
//   updateTrayIcon();

//   if (!notificationWindow || notificationWindow.isDestroyed()) return;

//   notificationWindow.setIgnoreMouseEvents(true, { forward: true });
//   positionNotificationWindow();
//   notificationWindow.show();
//   notificationWindow.webContents.send("show-notification", data);
//   startMousePolling();
// });

// ipcMain.on("toast-count-changed", (_, count) => {
//   if (!notificationWindow || notificationWindow.isDestroyed()) return;

//   if (count <= 0) {
//     notificationWindow.setIgnoreMouseEvents(true, { forward: true });
//     notificationWindow.hide();
//     stopMousePolling();
//   } else {
//     positionNotificationWindow();
//   }
// });

// ipcMain.on("reset-unread", () => {
//   unreadCount = 0;
//   updateTrayIcon();

//   if (mainWindow) {
//     mainWindow.flashFrame(false);
//   }
// });

// ipcMain.on("open-chat-request", (_, chatId) => {
//   if (!mainWindow) return;

//   if (mainWindow.isMinimized()) {
//     mainWindow.restore();
//   }

//   mainWindow.show();
//   mainWindow.focus();
//   mainWindow.webContents.send("open-chat", chatId);
// });

// app.whenReady().then(() => {
//   createWindow();
//   createNotificationWindow();
//   createTray();
// });

// app.on("window-all-closed", (e) => {
//   e.preventDefault();
// });


const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
  session,
  desktopCapturer,
} = require("electron");
const path = require("path");

app.disableHardwareAcceleration();

let mainWindow;
let tray;
let notificationWindow = null;
let pickerWindow = null;

let unreadCount = 0;

const isDev = !app.isPackaged;

const APP_URL = isDev
  ? "http://localhost:3000"
  : "https://chat-vert-nu-34.vercel.app/";

const APP_ICON = path.join(__dirname, "icons/icon.png");
const TRAY_ICON = path.join(__dirname, "icons/tray.png");
const TRAY_ICON_UNREAD = path.join(__dirname, "icons/tray-unread.png");

const NOTIF_WIDTH = 380;
const NOTIF_HEIGHT = 100;
const NOTIF_MARGIN = 16;
const MOUSE_POLL_INTERVAL = 50;

const ALLOWED_PERMISSIONS = new Set([
  "media",
  "display-capture",
  "fullscreen",
  "clipboard-sanitized-write",
]);

const PICKER_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; }
html, body { height: 100%; }
body {
  background: #0d0b17;
  color: #f3f1fa;
  font: 13px system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(169, 150, 255, 0.18);
  user-select: none;
}
header {
  padding: 18px 20px 12px;
  font-size: 15px;
  font-weight: 600;
  -webkit-app-region: drag;
}
main {
  flex: 1;
  overflow: auto;
  padding: 4px 20px 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  align-content: start;
}
.card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px;
  cursor: pointer;
  min-width: 0;
  transition: border-color 0.12s, background 0.12s;
}
.card:hover { background: rgba(255, 255, 255, 0.07); }
.card.sel { border-color: #7c5cff; background: rgba(124, 92, 255, 0.14); }
.card img.t {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
  background: #07060d;
}
.name {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #d7d1ef;
  min-width: 0;
}
.name img { width: 14px; height: 14px; flex: none; }
.name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
label { display: flex; align-items: center; gap: 6px; color: #a9a3c0; cursor: pointer; margin-right: auto; }
label.hidden { display: none; }
input[type=checkbox] { accent-color: #7c5cff; }
button {
  font: inherit;
  padding: 8px 18px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
  cursor: pointer;
}
button:hover { background: rgba(255, 255, 255, 0.1); }
button.primary { background: linear-gradient(135deg, #7c5cff, #5b3df0); border-color: rgba(169, 150, 255, 0.35); }
button:disabled { opacity: 0.4; cursor: default; }
</style>
</head>
<body>
<header>Share your screen</header>
<main id="grid"></main>
<footer>
  <label id="audioLabel" class="hidden"><input type="checkbox" id="audio">Share system audio</label>
  <button id="cancel">Cancel</button>
  <button id="share" class="primary" disabled>Share</button>
</footer>
<script>
const { ipcRenderer } = require("electron");
let selected = null;
let selectedCard = null;
const grid = document.getElementById("grid");
const shareBtn = document.getElementById("share");
const audio = document.getElementById("audio");

function send(payload) {
  ipcRenderer.send("screen-picker-choice", payload);
}

function confirmChoice() {
  if (selected) send({ id: selected, audio: audio.checked });
}

function select(card, id) {
  if (selectedCard) selectedCard.classList.remove("sel");
  selectedCard = card;
  selected = id;
  card.classList.add("sel");
  shareBtn.disabled = false;
}

ipcRenderer.on("screen-picker-items", function (_e, data) {
  if (data.canShareAudio) document.getElementById("audioLabel").classList.remove("hidden");
  data.items.forEach(function (item) {
    const card = document.createElement("div");
    card.className = "card";

    const thumb = document.createElement("img");
    thumb.className = "t";
    thumb.src = item.thumb;

    const name = document.createElement("div");
    name.className = "name";
    if (item.icon) {
      const icon = document.createElement("img");
      icon.src = item.icon;
      name.appendChild(icon);
    }
    const text = document.createElement("span");
    text.textContent = item.name;
    name.appendChild(text);

    card.appendChild(thumb);
    card.appendChild(name);
    card.addEventListener("click", function () { select(card, item.id); });
    card.addEventListener("dblclick", function () { select(card, item.id); confirmChoice(); });
    grid.appendChild(card);
  });
});

document.getElementById("cancel").addEventListener("click", function () { send(null); });
shareBtn.addEventListener("click", confirmChoice);
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") send(null);
  if (e.key === "Enter") confirmChoice();
});
</script>
</body>
</html>`;

function updateTrayIcon() {
  if (!tray) return;

  const icon =
    unreadCount > 0
      ? nativeImage.createFromPath(TRAY_ICON_UNREAD)
      : nativeImage.createFromPath(TRAY_ICON);

  tray.setImage(icon);
  tray.setToolTip(unreadCount > 0 ? `Chat • ${unreadCount} unread` : "Chat");
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0d0b14",
    icon: APP_ICON,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(APP_URL).catch((err) => {
    console.error("[loadURL] failed to start load:", err);
  });

  mainWindow.webContents.on(
    "did-fail-load",
    (_e, errorCode, errorDescription, validatedURL) => {
      console.error(
        "[did-fail-load]",
        errorCode,
        errorDescription,
        validatedURL
      );
    }
  );

  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    console.error("[render-process-gone]", details);
  });

  mainWindow.webContents.on("unresponsive", () => {
    console.error("[renderer] became unresponsive");
  });

  function broadcastVisibility() {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (!mainWindow.webContents || mainWindow.webContents.isDestroyed()) return;
    const visible = mainWindow.isVisible() && mainWindow.isFocused();
    mainWindow.webContents.send("window-visibility-changed", visible);
  }

  mainWindow.on("show", broadcastVisibility);
  mainWindow.on("hide", broadcastVisibility);
  mainWindow.on("focus", broadcastVisibility);
  mainWindow.on("blur", broadcastVisibility);
  mainWindow.webContents.once("did-finish-load", broadcastVisibility);

  mainWindow.on("close", (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on("focus", () => {
    unreadCount = 0;
    updateTrayIcon();
    mainWindow.flashFrame(false);
  });
}

function pickDisplaySource(sources) {
  return new Promise((resolve) => {
    if (pickerWindow && !pickerWindow.isDestroyed()) {
      pickerWindow.close();
    }

    let settled = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      ipcMain.removeListener("screen-picker-choice", onChoice);
      const win = pickerWindow;
      pickerWindow = null;
      if (win && !win.isDestroyed()) win.close();
      resolve(result);
    };

    const onChoice = (event, payload) => {
      if (!pickerWindow || pickerWindow.isDestroyed()) return;
      if (event.sender !== pickerWindow.webContents) return;
      finish(payload && typeof payload.id === "string" ? payload : null);
    };

    ipcMain.on("screen-picker-choice", onChoice);

    const items = sources.map((s) => ({
      id: s.id,
      name: s.name,
      thumb: s.thumbnail.isEmpty()
        ? ""
        : "data:image/jpeg;base64," + s.thumbnail.toJPEG(70).toString("base64"),
      icon: s.appIcon && !s.appIcon.isEmpty() ? s.appIcon.toDataURL() : null,
    }));

    const win = new BrowserWindow({
      width: 720,
      height: 520,
      parent: mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined,
      modal: Boolean(mainWindow && !mainWindow.isDestroyed()),
      show: false,
      frame: false,
      resizable: false,
      minimizable: false,
      maximizable: false,
      backgroundColor: "#0d0b17",
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        sandbox: false,
      },
    });
    pickerWindow = win;

    win.webContents.once("did-finish-load", () => {
      if (win.isDestroyed()) return;
      win.webContents.send("screen-picker-items", {
        items,
        canShareAudio: process.platform === "win32",
      });
    });

    win.once("ready-to-show", () => {
      if (!win.isDestroyed()) win.show();
    });

    win.on("closed", () => finish(null));

    win
      .loadURL("data:text/html;charset=utf-8," + encodeURIComponent(PICKER_HTML))
      .catch((err) => {
        console.error("[picker loadURL] failed:", err);
        finish(null);
      });
  });
}

function setupSession() {
  const ses = session.defaultSession;

  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });

  ses.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 320, height: 180 },
        fetchWindowIcons: true,
      });

      const available = sources.filter((s) => s.name);
      if (!available.length) {
        callback({});
        return;
      }

      const choice = await pickDisplaySource(available);
      if (!choice) {
        callback({});
        return;
      }

      const source = available.find((s) => s.id === choice.id);
      if (!source) {
        callback({});
        return;
      }

      if (choice.audio && process.platform === "win32") {
        callback({ video: source, audio: "loopback" });
      } else {
        callback({ video: source });
      }
    } catch (err) {
      console.error("[display-media] failed:", err);
      callback({});
    }
  });
}

function getActiveDisplay() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return screen.getDisplayMatching(mainWindow.getBounds());
  }
  return screen.getPrimaryDisplay();
}

function positionNotificationWindow() {
  if (!notificationWindow || notificationWindow.isDestroyed()) return;

  const display = getActiveDisplay();
  const area = display.workArea;

  notificationWindow.setBounds({
    x: Math.round(area.x + area.width - NOTIF_WIDTH - NOTIF_MARGIN),
    y: Math.round(area.y + area.height - NOTIF_HEIGHT - NOTIF_MARGIN),
    width: NOTIF_WIDTH,
    height: NOTIF_HEIGHT,
  });
}

function createNotificationWindow() {
  notificationWindow = new BrowserWindow({
    width: NOTIF_WIDTH,
    height: NOTIF_HEIGHT,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  notificationWindow.setIgnoreMouseEvents(true, { forward: true });

  notificationWindow.loadURL(APP_URL + "/notification").catch((err) => {
    console.error("[notificationWindow loadURL] failed:", err);
  });

  notificationWindow.webContents.on(
    "did-fail-load",
    (_e, errorCode, errorDescription, validatedURL) => {
      console.error(
        "[notification did-fail-load]",
        errorCode,
        errorDescription,
        validatedURL
      );
    }
  );

  notificationWindow.on("closed", () => {
    stopMousePolling();
    notificationWindow = null;
  });
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(TRAY_ICON));
  tray.setToolTip("Chat");

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open",
        click() {
          mainWindow.show();
          mainWindow.focus();
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click() {
          app.isQuiting = true;
          app.quit();
        },
      },
    ])
  );

  tray.on("click", () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mousePollInterval = null;

function startMousePolling() {
  if (mousePollInterval) return;

  mousePollInterval = setInterval(() => {
    if (!notificationWindow || notificationWindow.isDestroyed()) {
      stopMousePolling();
      return;
    }

    const cursor = screen.getCursorScreenPoint();
    const bounds = notificationWindow.getBounds();

    const isInside =
      cursor.x >= bounds.x &&
      cursor.x <= bounds.x + bounds.width &&
      cursor.y >= bounds.y &&
      cursor.y <= bounds.y + bounds.height;

    notificationWindow.setIgnoreMouseEvents(!isInside, { forward: true });
  }, MOUSE_POLL_INTERVAL);
}

function stopMousePolling() {
  if (mousePollInterval) {
    clearInterval(mousePollInterval);
    mousePollInterval = null;
  }
}

ipcMain.on("new-message", (_, data) => {
  unreadCount++;
  updateTrayIcon();

  if (!notificationWindow || notificationWindow.isDestroyed()) return;

  notificationWindow.setIgnoreMouseEvents(true, { forward: true });
  positionNotificationWindow();
  notificationWindow.show();
  notificationWindow.webContents.send("show-notification", data);
  startMousePolling();
});

ipcMain.on("toast-count-changed", (_, count) => {
  if (!notificationWindow || notificationWindow.isDestroyed()) return;

  if (count <= 0) {
    notificationWindow.setIgnoreMouseEvents(true, { forward: true });
    notificationWindow.hide();
    stopMousePolling();
  } else {
    positionNotificationWindow();
  }
});

ipcMain.on("reset-unread", () => {
  unreadCount = 0;
  updateTrayIcon();

  if (mainWindow) {
    mainWindow.flashFrame(false);
  }
});

ipcMain.on("open-chat-request", (_, chatId) => {
  if (!mainWindow) return;

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("open-chat", chatId);
});

app.whenReady().then(() => {
  setupSession();
  createWindow();
  createNotificationWindow();
  createTray();
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});
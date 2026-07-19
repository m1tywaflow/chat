const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
} = require("electron");

const path = require("path");

app.disableHardwareAcceleration();

let mainWindow;
let tray;
let notificationWindow = null;

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
  createWindow();
  createNotificationWindow();
  createTray();
});

app.on("window-all-closed", (e) => {
  e.preventDefault();
});

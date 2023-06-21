"use strict";
const electron = require("electron");
const path = require("node:path");
const electronRouterDom = require("electron-router-dom");
const utils = require("@electron-toolkit/utils");
const node_crypto = require("node:crypto");
const Store = require("electron-store");
const _interopDefaultLegacy = (e) => e && typeof e === "object" && "default" in e ? e : { default: e };
const path__default = /* @__PURE__ */ _interopDefaultLegacy(path);
const Store__default = /* @__PURE__ */ _interopDefaultLegacy(Store);
function createTray(window) {
  const tray = new electron.Tray(path__default.default.resolve(__dirname, "rotionTemplate.png"));
  const menu = electron.Menu.buildFromTemplate([
    { label: "Rotion", enabled: false },
    { type: "separator" },
    {
      label: "Criar novo documento",
      click: () => {
        window.webContents.send("new-document");
      }
    },
    { type: "separator" },
    { label: "Documentos recentes", enabled: false },
    {
      label: "Discover",
      accelerator: "CommandOrControl+1",
      acceleratorWorksWhenHidden: false
    },
    {
      label: "Ignite",
      accelerator: "CommandOrControl+2",
      acceleratorWorksWhenHidden: false
    },
    {
      label: "NodeJS",
      accelerator: "CommandOrControl+3",
      acceleratorWorksWhenHidden: false
    },
    { type: "separator" },
    {
      label: "Sair do Rotion",
      role: "quit"
    }
  ]);
  tray.setContextMenu(menu);
}
const IPC = {
  DOCUMENTS: {
    FETCH_ALL: "documents: fetch-all",
    FETCH: "documents: fetch",
    CREATE: "documents: create",
    SAVE: "documents: save",
    DELETE: "documents: delete"
  }
};
const store = new Store__default.default({
  defaults: {
    documents: {}
  }
});
console.log(store.path);
electron.ipcMain.handle(
  IPC.DOCUMENTS.FETCH_ALL,
  async () => {
    return {
      data: Object.values(store.get("documents"))
    };
  }
);
electron.ipcMain.handle(
  IPC.DOCUMENTS.FETCH,
  async (_, { id }) => {
    const document = store.get(`documents.${id}`);
    return {
      data: document
    };
  }
);
electron.ipcMain.handle(
  IPC.DOCUMENTS.CREATE,
  async () => {
    const id = node_crypto.randomUUID();
    const document = {
      id,
      title: "Untitled"
    };
    store.set(`documents.${id}`, document);
    return {
      data: document
    };
  }
);
electron.ipcMain.handle(
  IPC.DOCUMENTS.SAVE,
  async (_, { id, title, content }) => {
    store.set(`documents.${id}`, {
      id,
      title,
      content
    });
  }
);
electron.ipcMain.handle(
  IPC.DOCUMENTS.DELETE,
  async (_, { id }) => {
    store.delete(`documents.${id}`);
  }
);
function createShortcuts(window) {
  electron.app.on("browser-window-focus", () => {
    electron.globalShortcut.register("CommandOrControl+N", () => {
      window.webContents.send("new-document");
    });
  });
  electron.app.on("browser-window-blur", () => {
    electron.globalShortcut.unregisterAll();
  });
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1120,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#17141f",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: {
      x: 20,
      y: 20
    },
    ...process.platform === "linux" ? {
      icon: path__default.default.join(__dirname, "../../build/icon.png")
    } : {},
    ...process.platform === "win32" ? {
      icon: path__default.default.join(__dirname, "../../build/icon.png")
    } : {},
    webPreferences: {
      preload: path__default.default.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  createTray(mainWindow);
  createShortcuts(mainWindow);
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  const devServerURL = electronRouterDom.createURLRoute(
    process.env.ELECTRON_RENDERER_URL,
    "main"
  );
  const fileRoute = electronRouterDom.createFileRoute(
    path__default.default.join(__dirname, "../renderer/index.html"),
    "main"
  );
  if (utils.is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(devServerURL);
  } else {
    mainWindow.loadFile(...fileRoute);
  }
}
if (process.platform === "darwin") {
  electron.app.dock.setIcon(path__default.default.resolve(__dirname, "icon.png"));
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});

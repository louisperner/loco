"use strict";
const electron = require("electron");
const path = require("path");
electron.app.whenReady().then(() => {
  const win = new electron.BrowserWindow({
    show: true,
    transparent: true,
    frame: false,
    // width: 1500,
    // height: 1500,
    center: true,
    hasShadow: false,
    movable: false,
    alwaysOnTop: false,
    focusable: true,
    // simpleFullscreen: true
    icon: path.join(process.cwd(), "loco-icon.icns"),
    webPreferences: {
      sandbox: true,
      webviewTag: true
    }
  });
  win.maximize();
  win.show();
  win.setFocusable(true);
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile("dist/index.html");
  }
});

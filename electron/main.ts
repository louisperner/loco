import { app, screen, BrowserWindow } from 'electron';

app.whenReady().then(() => {
  // const win = new BrowserWindow({
  //   transparent: true,
  //   frame: true,
  //   fullscreen: false,
  // })

  const win = new BrowserWindow({
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
    webPreferences: {
      sandbox: true,
      webviewTag: true,
    },
  });
  win.maximize();
  win.show();
  win.setFocusable(true);

  // win.getFocusedWindow();

  // pointer none
  // win.setIgnoreMouseEvents(true);

  // You can use `process.env.VITE_DEV_SERVER_URL` when the vite command is called `serve`
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load your file
    win.loadFile('dist/index.html');
  }

  // const win = BrowserWindow.getFocusedWindow();
  // let win = BrowserWindow.getAllWindows()[0];

  // setInterval(() => {
  //   const point = screen.getCursorScreenPoint();
  //   const [x, y] = win.getPosition();
  //   const [w, h] = win.getSize();

  //   if (point.x > x && point.x < x + w && point.y > y && point.y < y + h) {
  //     updateIgnoreMouseEvents(point.x - x, point.y - y);
  //   }
  // }, 300);

  // const updateIgnoreMouseEvents = async (x, y) => {
  //   // console.log('updateIgnoreMouseEvents');

  //   // capture 1x1 image of mouse position.
  //   const image = await win.webContents.capturePage({
  //     x,
  //     y,
  //     width: 1,
  //     height: 1,
  //   });

  //   var buffer = image.getBitmap();

  //   // set ignore mouse events by alpha.
  //   win.setIgnoreMouseEvents(!buffer[3]);
  //   // console.log('setIgnoreMouseEvents', !buffer[3]);
  // };
});

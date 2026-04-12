/**
 * Electron 主进程入口
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { initDatabase } from './database';
import { initIPCHandlers } from './ipcHandlers';
import { seedTestData } from './seed';

let mainWindow: BrowserWindow | null = null;
let db: ReturnType<typeof initDatabase> | null = null;

const createWindow = async () => {
  // 初始化数据库
  db = initDatabase();

  // 初始化 IPC 处理程序
  initIPCHandlers(db);

  // 开发环境下初始化测试数据（已禁用，如需测试数据请取消注释）
  // if (process.env.NODE_ENV === 'development') {
  //   seedTestData();
  // }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: '财富自由之路',
    show: false,
  });

  // 窗口准备好后再显示（避免闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 开发环境加载开发服务器
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5175');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
};

// 应用准备就绪
app.whenReady().then(createWindow);

// 所有窗口关闭时退出
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// macOS 点击 dock 图标时重新创建窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 应用退出前关闭数据库连接
app.on('will-quit', () => {
  if (db) {
    db.close();
  }
});

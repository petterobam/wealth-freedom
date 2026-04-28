/**
 * v1.0.0 订阅授权 IPC 处理程序
 * 
 * 注册 license 命名空间到 ipcMain
 * 桥接 license.ts 核心模块与渲染进程
 */

import { ipcMain } from 'electron';
import {
  activateLicense,
  getLicenseStatus,
  renewLicense,
  deactivateLicense,
  getCurrentFeatures,
  hasFeature,
  checkLimit,
  checkFirstRunTrial,
  getMachineId,
  type LicenseStatus,
  type FeatureMap,
} from './license';

/**
 * 初始化授权相关 IPC 处理程序
 */
export function initLicenseHandlers(): void {
  // 首次启动自动试用
  ipcMain.handle('license:checkTrial', () => {
    return checkFirstRunTrial();
  });

  // 激活 License
  ipcMain.handle('license:activate', (_event, key: string) => {
    return activateLicense(key);
  });

  // 获取授权状态
  ipcMain.handle('license:status', () => {
    return getLicenseStatus();
  });

  // 续期
  ipcMain.handle('license:renew', () => {
    return renewLicense();
  });

  // 停用
  ipcMain.handle('license:deactivate', () => {
    return deactivateLicense();
  });

  // 获取当前功能权限
  ipcMain.handle('license:features', () => {
    return getCurrentFeatures();
  });

  // 检查单个功能
  ipcMain.handle('license:hasFeature', (_event, feature: keyof FeatureMap) => {
    return hasFeature(feature);
  });

  // 检查数量限制
  ipcMain.handle('license:checkLimit', (_event, feature: 'maxAccounts' | 'maxTransactions' | 'maxRecurringRules', currentCount: number) => {
    return checkLimit(feature, currentCount);
  });

  // 获取机器ID（用于问题排查）
  ipcMain.handle('license:machineId', () => {
    return getMachineId();
  });
}

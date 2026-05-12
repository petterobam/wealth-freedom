/**
 * v1.0.0 订阅授权 IPC 处理程序
 * 
 * 注册 license 命名空间到 ipcMain
 * 桥接 license.ts 核心模块与渲染进程
 */

import { ipcMain } from 'electron';
import {
  activateLicense,
  activateLicenseOnline,
  getLicenseStatus,
  renewLicense,
  renewLicenseOnline,
  deactivateLicense,
  getCurrentFeatures,
  hasFeature,
  checkLimit,
  checkFirstRunTrial,
  getMachineId,
  performOnlineCheck,
  needsOnlineCheck,
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

  // ============================================================
  // v1.8.0 在线验证 IPC
  // ============================================================

  // 在线激活（优先在线，失败回退本地）
  ipcMain.handle('license:activateOnline', async (_event, key: string) => {
    try {
      const result = await activateLicenseOnline(key);
      if (result.success) return result;
      // 在线激活失败（网络错误/服务器不可用），回退到本地激活
      return activateLicense(key);
    } catch {
      // 异常回退到本地激活
      return activateLicense(key);
    }
  });

  // 在线续期（优先在线，失败回退本地）
  ipcMain.handle('license:renewOnline', async () => {
    try {
      const result = await renewLicenseOnline();
      if (result.success) return result;
      // 在线续期失败，回退到本地续期
      return renewLicense();
    } catch {
      // 异常回退到本地续期
      return renewLicense();
    }
  });

  // 定期联网检查
  ipcMain.handle('license:onlineCheck', async () => {
    return await performOnlineCheck();
  });

  // 检查是否需要联网验证（UI 提示用）
  ipcMain.handle('license:needsOnlineCheck', () => {
    return needsOnlineCheck();
  });
}

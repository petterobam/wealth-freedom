/**
 * v1.1.0 应用内更新检查
 * 通过 GitHub Releases API 检查新版本
 */

import { ipcMain, app, shell, Notification } from 'electron';
import { semiver } from './semver';

const GITHUB_OWNER = 'petterobam';
const GITHUB_REPO = 'wealth-freedom';
const RELEASES_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

let lastCheckResult: UpdateInfo | null = null;
let autoCheckInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 从 GitHub API 获取最新 Release 信息
 */
async function fetchLatestRelease(): Promise<{
  tag_name: string;
  html_url: string;
  body: string;
  published_at: string;
  assets: Array<{ name: string; browser_download_url: string }>;
} | null> {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { 'User-Agent': 'wealth-freedom-app' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * 检查更新
 */
async function checkForUpdate(): Promise<UpdateInfo> {
  const currentVersion = app.getVersion();
  const release = await fetchLatestRelease();

  if (!release) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      downloadUrl: '',
      releaseNotes: '',
      releaseDate: '',
    };
  }

  const latestVersion = release.tag_name.replace(/^v/, '');
  const hasUpdate = semiver(latestVersion, currentVersion) > 0;

  // 找到适合当前平台的下载链接
  const platform = process.platform;
  const arch = process.arch;
  let downloadUrl = release.html_url; // 默认跳转到 Release 页面

  for (const asset of release.assets) {
    if (platform === 'darwin' && asset.name.endsWith('.dmg')) {
      if (arch === 'arm64' && asset.name.includes('arm64')) {
        downloadUrl = asset.browser_download_url;
        break;
      }
      if (arch === 'x64' && (asset.name.includes('x64') || asset.name.includes('amd64'))) {
        downloadUrl = asset.browser_download_url;
        break;
      }
      // 如果没有明确架构标记，取第一个 dmg
      if (!downloadUrl || !downloadUrl.endsWith('.dmg')) {
        downloadUrl = asset.browser_download_url;
      }
    }
    if (platform === 'win32' && asset.name.endsWith('.exe')) {
      downloadUrl = asset.browser_download_url;
      break;
    }
  }

  const result: UpdateInfo = {
    hasUpdate,
    currentVersion,
    latestVersion,
    downloadUrl,
    releaseNotes: release.body || '',
    releaseDate: release.published_at || '',
  };

  lastCheckResult = result;

  // 如果有更新，显示系统通知
  if (hasUpdate) {
    try {
      const notification = new Notification({
        title: '发现新版本 🎉',
        body: `v${latestVersion} 已发布，点击查看更新详情`,
      });
      notification.on('click', () => {
        shell.openExternal(downloadUrl);
      });
      notification.show();
    } catch {
      // 通知不可用时静默处理
    }
  }

  return result;
}

/**
 * 初始化更新检查 IPC 处理程序
 */
export function initUpdateHandlers(): void {
  // 手动检查更新
  ipcMain.handle('update:check', async () => {
    return checkForUpdate();
  });

  // 获取上次检查结果（不触发网络请求）
  ipcMain.handle('update:last-result', () => {
    return lastCheckResult;
  });

  // 打开下载页面
  ipcMain.handle('update:download', (_event, url: string) => {
    shell.openExternal(url);
  });
}

/**
 * 启动自动更新检查（每24小时检查一次）
 */
export function startAutoUpdateCheck(): void {
  // 启动时延迟5分钟检查（避免冷启动影响体验）
  setTimeout(async () => {
    await checkForUpdate();
  }, 5 * 60 * 1000);

  // 每24小时检查一次
  autoCheckInterval = setInterval(async () => {
    await checkForUpdate();
  }, 24 * 60 * 60 * 1000);
}

/**
 * 停止自动更新检查
 */
export function stopAutoUpdateCheck(): void {
  if (autoCheckInterval) {
    clearInterval(autoCheckInterval);
    autoCheckInterval = null;
  }
}

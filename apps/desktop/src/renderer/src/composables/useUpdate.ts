/**
 * v1.1.0 应用内更新检查 composable
 */
import { ref, onMounted } from 'vue';

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  releaseNotes: string;
  releaseDate: string;
}

const updateInfo = ref<UpdateInfo | null>(null);
const checking = ref(false);
const lastChecked = ref<string>('');

export function useUpdate() {
  const checkUpdate = async () => {
    checking.value = true;
    try {
      const result = await (window as any).api.update.check();
      updateInfo.value = result;
      lastChecked.value = new Date().toLocaleString('zh-CN');
    } catch (e) {
      console.error('检查更新失败:', e);
    } finally {
      checking.value = false;
    }
  };

  const openDownload = (url: string) => {
    (window as any).api.update.download(url);
  };

  onMounted(async () => {
    // 加载上次缓存结果
    try {
      const cached = await (window as any).api.update.lastResult();
      if (cached) updateInfo.value = cached;
    } catch {}
  });

  return {
    updateInfo,
    checking,
    lastChecked,
    checkUpdate,
    openDownload,
  };
}

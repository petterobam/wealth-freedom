/**
 * 用户相关类型定义
 */

export interface User {
  id: string;
  name: string;
  currency: string;
  createdAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  language: string;
  theme: 'light' | 'dark';
  startDayOfMonth: number;
  guaranteeMonths: number;
  expectedReturnRate: number;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  language: 'zh-CN',
  theme: 'light',
  startDayOfMonth: 1,
  guaranteeMonths: 6,
  expectedReturnRate: 8.0,
};

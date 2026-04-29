/**
 * v1.0.0 订阅授权核心模块
 * 
 * 功能：
 * - License Key 格式校验与解析
 * - 本地加密存储 (AES-256-CBC)
 * - 机器指纹生成
 * - 授权状态管理（免费/试用/基础/旗舰）
 * - 自动续期（7天周期，14天宽限）
 * - 功能门控（Feature Gates）
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

// ============================================================
// 类型定义
// ============================================================

export type LicenseTier = 'free' | 'trial' | 'basic' | 'pro';

export interface LicenseInfo {
  key: string;
  tier: LicenseTier;
  activatedAt: string;
  expiresAt: string;
  machineId: string;
  signature: string;
  lastRenewAt: string;
  renewGraceUntil: string;
}

export interface LicenseStatus {
  tier: LicenseTier;
  isActive: boolean;
  isTrial: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
  message: string;
}

export interface FeatureMap {
  maxAccounts: number;
  maxTransactions: number;
  maxRecurringRules: number;
  maxAiCalls: number; // v1.3.0: 每日 AI 调用次数，0=不可用，Infinity=无限制
  exportFormats: string[];
  hasBudget: boolean;
  hasInvestment: boolean;
  hasPdfReport: boolean;
  hasAutoBackup: boolean;
  hasHealthScore: boolean;
  hasRecurring: boolean;
  hasAI: boolean; // v1.3.0: 是否有 AI 功能
}

// ============================================================
// 常量配置
// ============================================================

/** License Key 前缀与层级映射 */
const KEY_PREFIX_MAP: Record<string, LicenseTier> = {
  'WF-TRI': 'trial',
  'WF-BAS': 'basic',
  'WF-PRO': 'pro',
};

/** 各层级有效期（天） */
const TIER_DURATION: Record<string, number> = {
  trial: 30,
  basic: 30,
  pro: 30,
};

/** 续期周期（天） */
const RENEW_INTERVAL_DAYS = 7;

/** 续期宽限期（天） */
const RENEW_GRACE_DAYS = 14;

/** 加密密钥（生产环境应使用更安全的密钥管理方案） */
// 使用 machineId 作为加密密钥的一部分，确保不同机器无法互换 license 文件
const ENCRYPTION_KEY_ENV = 'WEALTH_FREEDOM_LICENSE_KEY';
const FALLBACK_KEY = 'wf-v1.0-license-encryption-key-2026';

/** 功能权限映射 */
export const FEATURE_MAP: Record<LicenseTier, FeatureMap> = {
  free: {
    maxAccounts: 3,
    maxTransactions: 200,
    maxRecurringRules: 3,
    maxAiCalls: 0,
    exportFormats: ['csv'],
    hasBudget: false,
    hasInvestment: false,
    hasPdfReport: false,
    hasAutoBackup: false,
    hasHealthScore: false,
    hasRecurring: true,
    hasAI: false,
  },
  trial: {
    maxAccounts: Infinity,
    maxTransactions: Infinity,
    maxRecurringRules: Infinity,
    maxAiCalls: 10,
    exportFormats: ['csv', 'xlsx', 'pdf'],
    hasBudget: true,
    hasInvestment: true,
    hasPdfReport: true,
    hasAutoBackup: true,
    hasHealthScore: true,
    hasRecurring: true,
    hasAI: true,
  },
  basic: {
    maxAccounts: Infinity,
    maxTransactions: Infinity,
    maxRecurringRules: Infinity,
    maxAiCalls: 20,
    exportFormats: ['csv', 'xlsx'],
    hasBudget: true,
    hasInvestment: true,
    hasPdfReport: false,
    hasAutoBackup: true,
    hasHealthScore: true,
    hasRecurring: true,
    hasAI: true,
  },
  pro: {
    maxAccounts: Infinity,
    maxTransactions: Infinity,
    maxRecurringRules: Infinity,
    maxAiCalls: Infinity,
    exportFormats: ['csv', 'xlsx', 'pdf'],
    hasBudget: true,
    hasInvestment: true,
    hasPdfReport: true,
    hasAutoBackup: true,
    hasHealthScore: true,
    hasRecurring: true,
    hasAI: true,
  },
};

// ============================================================
// 机器指纹
// ============================================================

/**
 * 获取机器唯一标识
 * 基于 Electron app.getPath + 系统信息生成稳定的哈希值
 */
export function getMachineId(): string {
  const appPath = app.getPath('userData');
  const hostname = require('os').hostname();
  const platform = process.platform;
  const arch = process.arch;
  const raw = `${appPath}:${hostname}:${platform}:${arch}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ============================================================
// 加密存储
// ============================================================

/**
 * 获取加密密钥
 */
function getEncryptionKey(): string {
  // 优先从环境变量读取
  const envKey = process.env[ENCRYPTION_KEY_ENV];
  if (envKey) return envKey;
  return FALLBACK_KEY;
}

/**
 * 加密数据
 */
function encrypt(data: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(key, 'wf-salt-v1', 32);
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * 解密数据
 */
function decrypt(encryptedData: string): string | null {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const derivedKey = crypto.scryptSync(key, 'wf-salt-v1', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * 获取 license 文件路径
 */
function getLicenseFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'license.dat');
}

// ============================================================
// License Key 格式校验
// ============================================================

/**
 * 校验 License Key 格式
 * 格式：WF-{TIER}-{XXXX}-{XXXX}-{XXXX}-{XXXX}
 */
export function validateKeyFormat(key: string): { valid: boolean; tier?: LicenseTier; error?: string } {
  const trimmed = key.trim().toUpperCase();

  // 匹配前缀
  const prefixMatch = Object.keys(KEY_PREFIX_MAP).find(prefix => trimmed.startsWith(prefix));
  if (!prefixMatch) {
    return { valid: false, error: '密钥格式错误：应以 WF-TRI、WF-BAS 或 WF-PRO 开头' };
  }

  // 校验完整格式：WF-XXX-XXXX-XXXX-XXXX-XXXX
  const pattern = /^WF-(TRI|BAS|PRO)-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!pattern.test(trimmed)) {
    return { valid: false, error: '密钥格式错误：应为 WF-XXX-XXXX-XXXX-XXXX-XXXX 格式' };
  }

  // 校验位验证（第3-6段的简单校验和）
  const parts = trimmed.split('-');
  const payload = parts.slice(2).join('');
  const checksum = payload.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  if (checksum % 17 !== 0) {
    return { valid: false, error: '密钥校验失败：无效的密钥' };
  }

  return { valid: true, tier: KEY_PREFIX_MAP[prefixMatch] };
}

/**
 * 生成签名（模拟 RSA 签名，MVP 阶段使用 HMAC）
 * 生产环境应替换为真正的 RSA-2048 签名
 */
function generateSignature(data: string): string {
  const key = getEncryptionKey();
  return crypto.createHmac('sha256', key + '-signature').update(data).digest('base64');
}

/**
 * 验证签名
 */
function verifySignature(data: string, signature: string): boolean {
  const expected = generateSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(expected, 'base64')
  );
}

// ============================================================
// 核心操作
// ============================================================

/**
 * 激活 License
 */
export function activateLicense(key: string): { success: boolean; tier?: LicenseTier; expiresAt?: string; message: string } {
  // 1. 格式校验
  const validation = validateKeyFormat(key);
  if (!validation.valid) {
    return { success: false, message: validation.error! };
  }

  // 2. 检查是否已被其他机器激活（MVP 阶段跳过联网验证）
  // TODO: 联网验证密钥是否有效、是否已被使用

  const tier = validation.tier!;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TIER_DURATION[tier] * 24 * 60 * 60 * 1000);
  const machineId = getMachineId();

  // 3. 构造 License 信息
  const licenseInfo: LicenseInfo = {
    key: key.trim().toUpperCase(),
    tier,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    machineId,
    signature: '', // 先留空，后面计算
    lastRenewAt: now.toISOString(),
    renewGraceUntil: new Date(expiresAt.getTime() + RENEW_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  };

  // 4. 生成签名
  const signPayload = `${licenseInfo.key}:${licenseInfo.tier}:${licenseInfo.expiresAt}:${licenseInfo.machineId}`;
  licenseInfo.signature = generateSignature(signPayload);

  // 5. 加密存储
  const saved = saveLicense(licenseInfo);
  if (!saved) {
    return { success: false, message: '保存授权信息失败' };
  }

  return {
    success: true,
    tier,
    expiresAt: expiresAt.toISOString(),
    message: tier === 'trial' ? '试用版已激活，有效期 30 天' : `${tier === 'basic' ? '基础版' : '旗舰版'}已激活`,
  };
}

/**
 * 读取本地 License 文件
 */
export function readLicense(): LicenseInfo | null {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) return null;

  try {
    const encrypted = fs.readFileSync(filePath, 'utf8');
    const decrypted = decrypt(encrypted);
    if (!decrypted) return null;
    return JSON.parse(decrypted) as LicenseInfo;
  } catch {
    return null;
  }
}

/**
 * 保存 License 到本地
 */
function saveLicense(info: LicenseInfo): boolean {
  try {
    const filePath = getLicenseFilePath();
    const json = JSON.stringify(info);
    const encrypted = encrypt(json);
    fs.writeFileSync(filePath, encrypted, 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取当前授权状态
 */
export function getLicenseStatus(): LicenseStatus {
  const license = readLicense();

  if (!license) {
    return {
      tier: 'free',
      isActive: true,
      isTrial: false,
      expiresAt: null,
      daysLeft: null,
      message: '免费版',
    };
  }

  // 验证机器指纹
  const currentMachineId = getMachineId();
  if (license.machineId !== currentMachineId) {
    return {
      tier: 'free',
      isActive: false,
      isTrial: false,
      expiresAt: null,
      daysLeft: null,
      message: '授权与当前设备不匹配，请重新激活',
    };
  }

  // 验证签名
  const signPayload = `${license.key}:${license.tier}:${license.expiresAt}:${license.machineId}`;
  if (!verifySignature(signPayload, license.signature)) {
    return {
      tier: 'free',
      isActive: false,
      isTrial: false,
      expiresAt: null,
      daysLeft: null,
      message: '授权信息已被篡改',
    };
  }

  // 检查过期
  const now = new Date();
  const expiresAt = new Date(license.expiresAt);
  const graceUntil = new Date(license.renewGraceUntil);
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

  if (now <= expiresAt) {
    // 正常使用中
    return {
      tier: license.tier,
      isActive: true,
      isTrial: license.tier === 'trial',
      expiresAt: license.expiresAt,
      daysLeft,
      message: license.tier === 'trial' ? `试用版，剩余 ${daysLeft} 天` : `${license.tier === 'basic' ? '基础版' : '旗舰版'}，剩余 ${daysLeft} 天`,
    };
  }

  if (now <= graceUntil) {
    // 宽限期内
    const graceDaysLeft = Math.ceil((graceUntil.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return {
      tier: license.tier,
      isActive: true, // 宽限期内仍可用
      isTrial: license.tier === 'trial',
      expiresAt: license.expiresAt,
      daysLeft: -graceDaysLeft, // 负数表示已过期但在宽限期
      message: `授权已过期，宽限期剩余 ${graceDaysLeft} 天，请尽快续费`,
    };
  }

  // 完全过期
  return {
    tier: 'free',
    isActive: false,
    isTrial: false,
    expiresAt: license.expiresAt,
    daysLeft: 0,
    message: '授权已过期，已恢复为免费版',
  };
}

/**
 * 续期授权（联网）
 * MVP 阶段：本地模拟续期，延长 30 天
 * TODO: 接入验证 API
 */
export function renewLicense(): { success: boolean; message: string } {
  const license = readLicense();
  if (!license) {
    return { success: false, message: '未找到授权信息' };
  }

  // 验证当前状态
  const status = getLicenseStatus();
  if (status.tier === 'free') {
    return { success: false, message: '当前为免费版，无需续期' };
  }

  // 延长有效期
  const now = new Date();
  const baseDate = status.isActive ? new Date(license.expiresAt) : now;
  const newExpiresAt = new Date(baseDate.getTime() + TIER_DURATION[license.tier] * 24 * 60 * 60 * 1000);

  license.expiresAt = newExpiresAt.toISOString();
  license.lastRenewAt = now.toISOString();
  license.renewGraceUntil = new Date(newExpiresAt.getTime() + RENEW_GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 重新签名
  const signPayload = `${license.key}:${license.tier}:${license.expiresAt}:${license.machineId}`;
  license.signature = generateSignature(signPayload);

  const saved = saveLicense(license);
  if (!saved) {
    return { success: false, message: '保存续期信息失败' };
  }

  return { success: true, message: `续期成功，新到期日：${newExpiresAt.toLocaleDateString('zh-CN')}` };
}

/**
 * 停用授权
 */
export function deactivateLicense(): { success: boolean; message: string } {
  const filePath = getLicenseFilePath();
  if (!fs.existsSync(filePath)) {
    return { success: false, message: '未找到授权信息' };
  }

  try {
    fs.unlinkSync(filePath);
    return { success: true, message: '授权已停用，已恢复为免费版' };
  } catch {
    return { success: false, message: '停用失败' };
  }
}

/**
 * 获取当前功能权限
 */
export function getCurrentFeatures(): FeatureMap {
  const status = getLicenseStatus();
  return FEATURE_MAP[status.tier] || FEATURE_MAP.free;
}

/**
 * 检查是否有某项功能
 */
export function hasFeature(feature: keyof FeatureMap): boolean {
  const features = getCurrentFeatures();
  const value = features[feature];
  if (typeof value === 'boolean') return value;
  return true; // 非布尔类型的限制需单独检查
}

/**
 * 检查是否达到数量限制
 */
export function checkLimit(feature: 'maxAccounts' | 'maxTransactions' | 'maxRecurringRules' | 'aiCalls', currentCount?: number): { allowed: boolean; limit: number; message?: string } {
  const features = getCurrentFeatures();
  
  // AI 调用特殊处理
  if (feature === 'aiCalls') {
    const limit = features.maxAiCalls;
    if (limit === 0) {
      return { allowed: false, limit: 0, message: 'AI 功能需要升级到基础版或旗舰版' };
    }
    return { allowed: true, limit };
  }
  
  const limit = features[feature];
  const count = currentCount ?? 0;
  if (count >= limit) {
    const tierNames: Record<LicenseTier, string> = { free: '免费版', trial: '试用版', basic: '基础版', pro: '旗舰版' };
    const status = getLicenseStatus();
    const featureNames: Record<string, string> = { maxAccounts: '账户', maxTransactions: '交易记录', maxRecurringRules: '周期规则', aiCalls: 'AI 调用' };
    return {
      allowed: false,
      limit,
      message: `${tierNames[status.tier]}最多支持 ${limit === Infinity ? '无限' : limit} 个${featureNames[feature]}，升级以解锁更多`,
    };
  }
  return { allowed: true, limit };
}

/**
 * 首次安装自动试用
 * 检测是否为首次安装，如果是则自动激活 30 天试用
 */
export function checkFirstRunTrial(): { activated: boolean; message?: string } {
  const license = readLicense();
  if (license) return { activated: false }; // 已有授权

  // 检查是否已经有过试用标记
  const trialMarkerPath = path.join(app.getPath('userData'), '.trial-marked');
  if (fs.existsSync(trialMarkerPath)) {
    return { activated: false };
  }

  // 自动生成试用密钥并激活
  const trialKey = generateTrialKey();
  const result = activateLicense(trialKey);

  if (result.success) {
    // 标记已试用
    fs.writeFileSync(trialMarkerPath, new Date().toISOString(), 'utf8');
    return { activated: true, message: '已自动激活 30 天旗舰版试用' };
  }

  return { activated: false };
}

/**
 * 生成试用密钥（本地生成，仅用于首次试用）
 */
function generateTrialKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  // 调整字符使校验和满足 % 17 === 0
  const raw = segments.join('');
  let checksum = raw.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const remainder = checksum % 17;
  if (remainder !== 0) {
    // 修改最后一个字符来满足校验
    const lastChar = raw[raw.length - 1];
    const needed = (17 - remainder) % 17;
    const newCharCode = lastChar.charCodeAt(0) + needed;
    const newChar = chars[newCharCode % chars.length];
    segments[3] = segments[3].slice(0, -1) + newChar;
  }

  return `WF-TRI-${segments.join('-')}`;
}

// ============================================================
// 密钥生成工具（管理员用，不暴露给渲染进程）
// ============================================================

/**
 * 生成正式 License Key
 * 仅供管理员/CLI 工具使用
 */
export function generateLicenseKey(tier: 'basic' | 'pro'): string {
  const prefix = tier === 'basic' ? 'WF-BAS' : 'WF-PRO';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  
  for (let s = 0; s < 4; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[Math.floor(Math.random() * chars.length)];
    }
    segments.push(segment);
  }

  // 调整校验和
  const raw = segments.join('');
  let checksum = raw.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const remainder = checksum % 17;
  if (remainder !== 0) {
    const lastChar = raw[raw.length - 1];
    const needed = (17 - remainder) % 17;
    const newCharCode = lastChar.charCodeAt(0) + needed;
    const newChar = chars[newCharCode % chars.length];
    segments[3] = segments[3].slice(0, -1) + newChar;
  }

  return `${prefix}-${segments.join('-')}`;
}

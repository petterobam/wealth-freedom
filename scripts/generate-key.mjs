#!/usr/bin/env node

/**
 * License Key 生成工具（管理员使用）
 * 
 * 用法：
 *   node generate-key.mjs [--tier basic|pro|trial] [--days 30] [--count 1]
 * 
 * 示例：
 *   node generate-key.mjs --tier basic --days 30       # 生成1个30天基础版密钥
 *   node generate-key.mjs --tier pro --days 365 --count 10  # 批量生成10个年付旗舰版
 *   node generate-key.mjs --tier trial                  # 生成30天试用密钥
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const KEY_DIR = path.join(__dirname, '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEY_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEY_DIR, 'public.pem');

const TIER_PREFIX = {
  trial: 'TRI',
  basic: 'BAS',
  pro: 'PRO',
};

const TIER_DEFAULT_DAYS = {
  trial: 30,
  basic: 30,
  pro: 30,
};

// ============================================================
// RSA 密钥对管理
// ============================================================

function ensureKeyPair() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log('🔑 未找到密钥对，正在生成 RSA-2048 密钥对...');
    fs.mkdirSync(KEY_DIR, { recursive: true });
    
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 });
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    
    console.log(`✅ 密钥对已生成：`);
    console.log(`   私钥: ${PRIVATE_KEY_PATH}`);
    console.log(`   公钥: ${PUBLIC_KEY_PATH}`);
    console.log(`   ⚠️  请妥善保管私钥，不要提交到 Git！`);
    console.log();
  }
  
  return {
    privateKey: fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8'),
    publicKey: fs.readFileSync(PUBLIC_KEY_PATH, 'utf-8'),
  };
}

// ============================================================
// License Key 生成
// ============================================================

function generateRandomPart() {
  // 生成 20 字节随机数据，Base32 编码（去掉填充），分成 4 组
  const bytes = crypto.randomBytes(20);
  const base32 = bytes.toString('base64')
    .replace(/[+/=]/g, '') // 去掉特殊字符
    .toUpperCase()
    .slice(0, 16);
  
  // 分成 4 组，每组 4 个字符
  return [
    base32.slice(0, 4),
    base32.slice(4, 8),
    base32.slice(8, 12),
    base32.slice(12, 16),
  ].join('-');
}

function generateLicenseKey(tier, days) {
  const prefix = TIER_PREFIX[tier];
  if (!prefix) throw new Error(`Unknown tier: ${tier}`);
  
  const randomPart = generateRandomPart();
  const key = `WF-${prefix}-${randomPart}`;
  
  // 计算过期时间
  const now = new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return { key, tier, days, expiresAt: expiresAt.toISOString() };
}

function signLicense(licenseInfo, privateKey) {
  // 签名内容：key + tier + expiresAt
  const signPayload = `${licenseInfo.key}:${licenseInfo.tier}:${licenseInfo.expiresAt}`;
  
  const signer = crypto.createSign('SHA256');
  signer.update(signPayload);
  signer.end();
  
  const signature = signer.sign(privateKey, 'base64');
  return signature;
}

function generateSignedKey(tier, days, privateKey) {
  const license = generateLicenseKey(tier, days);
  const signature = signLicense(license, privateKey);
  
  return {
    ...license,
    signature,
    activatedAt: new Date().toISOString(),
  };
}

// ============================================================
// 输出
// ============================================================

function printKey(signedKey, index) {
  const expDate = new Date(signedKey.expiresAt).toLocaleDateString('zh-CN');
  const tierName = { trial: '试用版', basic: '基础版', pro: '旗舰版' }[signedKey.tier];
  
  if (index !== undefined) console.log(`\n--- 密钥 #${index + 1} ---`);
  console.log(`🔑 ${signedKey.key}`);
  console.log(`   类型: ${tierName} | 有效期: ${signedKey.days}天 | 到期: ${expDate}`);
}

function saveKeysToFile(keys) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `keys-${timestamp}.json`;
  const filepath = path.join(KEY_DIR, filename);
  
  const output = {
    generatedAt: new Date().toISOString(),
    count: keys.length,
    keys: keys,
  };
  
  fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`\n📁 密钥已保存到: ${filepath}`);
  return filepath;
}

// ============================================================
// 参数解析
// ============================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = { tier: 'basic', days: null, count: 1 };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--tier':
        options.tier = args[++i];
        break;
      case '--days':
        options.days = parseInt(args[++i], 10);
        break;
      case '--count':
        options.count = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
License Key 生成工具

用法:
  node generate-key.mjs [选项]

选项:
  --tier <trial|basic|pro>   授权类型 (默认: basic)
  --days <number>            有效天数 (默认: trial=30, basic=30, pro=30)
  --count <number>           生成数量 (默认: 1)
  -h, --help                 显示帮助

示例:
  node generate-key.mjs --tier trial
  node generate-key.mjs --tier basic --days 365
  node generate-key.mjs --tier pro --count 10
`);
        process.exit(0);
    }
  }
  
  if (!['trial', 'basic', 'pro'].includes(options.tier)) {
    console.error(`❌ 无效的授权类型: ${options.tier} (可选: trial, basic, pro)`);
    process.exit(1);
  }
  
  if (options.days === null) {
    options.days = TIER_DEFAULT_DAYS[options.tier];
  }
  
  return options;
}

// ============================================================
// 主流程
// ============================================================

function main() {
  const options = parseArgs();
  const { privateKey } = ensureKeyPair();
  
  console.log(`\n🚀 生成 ${options.count} 个 ${options.tier} 密钥（${options.days}天有效期）...\n`);
  
  const keys = [];
  for (let i = 0; i < options.count; i++) {
    const signedKey = generateSignedKey(options.tier, options.days, privateKey);
    keys.push(signedKey);
    printKey(signedKey, options.count > 1 ? i : undefined);
  }
  
  if (keys.length > 0) {
    saveKeysToFile(keys);
  }
  
  console.log(`\n✅ 完成！共生成 ${keys.length} 个密钥。`);
}

main();

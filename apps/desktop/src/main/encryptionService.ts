/**
 * 数据加密服务
 * v1.9.0 — AES-256-GCM 敏感字段加密
 */
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT_LENGTH = 32
const PBKDF2_ITERATIONS = 100_000

// 内存中缓存的派生密钥（应用关闭即丢失）
let derivedKey: Buffer | null = null
let masterPasswordHash: string | null = null

/**
 * 从主密码派生加密密钥（PBKDF2）
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512')
}

/**
 * 计算密码哈希（用于验证）
 */
function hashPassword(password: string, salt: Buffer): string {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS + 1, 64, 'sha512').toString('hex')
}

/**
 * 初始化加密：设置或验证主密码
 * @returns { isSetup: boolean } 是否是新设置
 */
export function initEncryption(password: string): { isSetup: boolean; salt: string; hash: string } {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const hash = hashPassword(password, salt)
  derivedKey = deriveKey(password, salt)
  masterPasswordHash = hash

  return {
    isSetup: true,
    salt: salt.toString('base64'),
    hash,
  }
}

/**
 * 解锁加密：验证密码并派生密钥
 */
export function unlockEncryption(password: string, salt: string, expectedHash: string): boolean {
  const saltBuf = Buffer.from(salt, 'base64')
  const hash = hashPassword(password, saltBuf)

  if (hash !== expectedHash) {
    return false
  }

  derivedKey = deriveKey(password, saltBuf)
  masterPasswordHash = hash
  return true
}

/**
 * 锁定加密（清除内存中的密钥）
 */
export function lockEncryption(): void {
  derivedKey = null
  masterPasswordHash = null
}

/**
 * 是否已解锁
 */
export function isUnlocked(): boolean {
  return derivedKey !== null
}

/**
 * 加密单个值
 * @returns base64 编码的 iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  if (!derivedKey) throw new Error('加密未解锁')
  if (!plaintext) return ''

  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  const tag = cipher.getAuthTag()

  // 格式: iv(16) + tag(16) + ciphertext
  const result = Buffer.concat([iv, tag, Buffer.from(encrypted, 'base64')])
  return result.toString('base64')
}

/**
 * 解密单个值
 */
export function decrypt(ciphertext: string): string {
  if (!derivedKey) throw new Error('加密未解锁')
  if (!ciphertext) return ''

  const data = Buffer.from(ciphertext, 'base64')
  const iv = data.subarray(0, IV_LENGTH)
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, undefined, 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * 批量加密（用于迁移）
 */
export function encryptBatch(values: string[]): string[] {
  return values.map(v => encrypt(v))
}

/**
 * 批量解密
 */
export function decryptBatch(values: string[]): string[] {
  return values.map(v => decrypt(v))
}

/**
 * 生成加密状态摘要
 */
export function getEncryptionStatus(): {
  unlocked: boolean
  algorithm: string
  keyLength: number
} {
  return {
    unlocked: isUnlocked(),
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8,
  }
}

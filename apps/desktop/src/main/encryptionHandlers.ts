/**
 * 数据加密 IPC 处理程序
 * v1.9.0 — 主密码管理 + 敏感字段加解密
 */
import { ipcMain } from 'electron'
import type { Database } from 'better-sqlite3'
import {
  initEncryption,
  unlockEncryption,
  lockEncryption,
  encrypt,
  decrypt,
  encryptBatch,
  decryptBatch,
  isUnlocked,
  getEncryptionStatus,
} from './encryptionService'

let db: Database.Database

export function initEncryptionHandlers(database: Database.Database) {
  db = database

  // 确保加密元数据表存在
  db.exec(`
    CREATE TABLE IF NOT EXISTS encryption_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  ipcMain.handle('encryption:setup', handleSetup)
  ipcMain.handle('encryption:unlock', handleUnlock)
  ipcMain.handle('encryption:lock', handleLock)
  ipcMain.handle('encryption:isUnlocked', () => isUnlocked())
  ipcMain.handle('encryption:encrypt', handleEncrypt)
  ipcMain.handle('encryption:decrypt', handleDecrypt)
  ipcMain.handle('encryption:encryptBatch', handleEncryptBatch)
  ipcMain.handle('encryption:decryptBatch', handleDecryptBatch)
  ipcMain.handle('encryption:getStatus', () => getEncryptionStatus())
  ipcMain.handle('encryption:isEnabled', handleIsEnabled)
  ipcMain.handle('encryption:migrateData', handleMigrateData)
}

async function handleSetup(
  _e: Electron.IpcMainInvokeEvent,
  { password }: { password: string }
) {
  const { salt, hash } = initEncryption(password)

  // 保存 salt 和 hash 到数据库
  db.prepare('INSERT OR REPLACE INTO encryption_meta (key, value) VALUES (?, ?)')
    .run('salt', salt)
  db.prepare('INSERT OR REPLACE INTO encryption_meta (key, value) VALUES (?, ?)')
    .run('hash', hash)
  db.prepare('INSERT OR REPLACE INTO encryption_meta (key, value) VALUES (?, ?)')
    .run('enabled', 'true')

  return { success: true }
}

async function handleUnlock(
  _e: Electron.IpcMainInvokeEvent,
  { password }: { password: string }
) {
  const saltRow = db.prepare("SELECT value FROM encryption_meta WHERE key = 'salt'")
    .get() as { value: string } | undefined
  const hashRow = db.prepare("SELECT value FROM encryption_meta WHERE key = 'hash'")
    .get() as { value: string } | undefined

  if (!saltRow || !hashRow) {
    return { success: false, error: '加密未初始化' }
  }

  const ok = unlockEncryption(password, saltRow.value, hashRow.value)
  return { success: ok, error: ok ? undefined : '密码错误' }
}

async function handleLock() {
  lockEncryption()
  return { success: true }
}

async function handleEncrypt(
  _e: Electron.IpcMainInvokeEvent,
  { plaintext }: { plaintext: string }
) {
  if (!isUnlocked()) return { error: '加密未解锁' }
  return { ciphertext: encrypt(plaintext) }
}

async function handleDecrypt(
  _e: Electron.IpcMainInvokeEvent,
  { ciphertext }: { ciphertext: string }
) {
  if (!isUnlocked()) return { error: '加密未解锁' }
  return { plaintext: decrypt(ciphertext) }
}

async function handleEncryptBatch(
  _e: Electron.IpcMainInvokeEvent,
  { values }: { values: string[] }
) {
  if (!isUnlocked()) return { error: '加密未解锁' }
  return { ciphertexts: encryptBatch(values) }
}

async function handleDecryptBatch(
  _e: Electron.IpcMainInvokeEvent,
  { values }: { values: string[] }
) {
  if (!isUnlocked()) return { error: '加密未解锁' }
  return { plaintexts: decryptBatch(values) }
}

async function handleIsEnabled() {
  const row = db.prepare("SELECT value FROM encryption_meta WHERE key = 'enabled'")
    .get() as { value: string } | undefined
  return row?.value === 'true'
}

/**
 * 数据迁移：将现有敏感字段加密
 * 加密 accounts.balance 和 transactions.amount
 */
async function handleMigrateData() {
  if (!isUnlocked()) return { error: '加密未解锁' }

  const encryptedCount = { accounts: 0, transactions: 0 }

  // 加密账户余额
  const accounts = db.prepare('SELECT id, balance FROM accounts WHERE balance IS NOT NULL')
    .all() as Array<{ id: string; balance: string }>

  const updateAccount = db.prepare('UPDATE accounts SET balance = ? WHERE id = ?')
  for (const acc of accounts) {
    // 跳过已加密的数据（base64 特征）
    if (acc.balance.length > 20 && /^[A-Za-z0-9+/=]+$/.test(acc.balance)) continue
    const encrypted = encrypt(acc.balance)
    updateAccount.run(encrypted, acc.id)
    encryptedCount.accounts++
  }

  // 加密交易金额
  const transactions = db.prepare('SELECT id, amount FROM transactions WHERE amount IS NOT NULL')
    .all() as Array<{ id: string; amount: string }>

  const updateTx = db.prepare('UPDATE transactions SET amount = ? WHERE id = ?')
  for (const tx of transactions) {
    if (tx.amount.length > 20 && /^[A-Za-z0-9+/=]+$/.test(tx.amount)) continue
    const encrypted = encrypt(tx.amount)
    updateTx.run(encrypted, tx.id)
    encryptedCount.transactions++
  }

  return { success: true, encryptedCount }
}

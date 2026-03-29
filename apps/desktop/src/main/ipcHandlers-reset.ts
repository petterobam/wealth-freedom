
// ==================== 数据库管理处理函数 ====================
async function handleDatabaseReset() {
  try {
    // 删除所有数据
    db.exec('DELETE FROM dreams');
    db.exec('DELETE FROM goals');
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM debts');
    db.exec('DELETE FROM accounts');
    db.exec('DELETE FROM users');
    
    return { success: true };
  } catch (error) {
    console.error('重置数据库失败:', error);
    return { success: false, error: String(error) };
  }
}

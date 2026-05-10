/**
 * ============================================================
 * MongoDB 数据导入脚本 - BlogLogin 项目
 * ============================================================
 * 【用途】将导出的 JSON 文件导入到数据库
 * 【使用】node import-mongodb.js
 * ============================================================
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置项
// ============================================================
const DB_CONFIG = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bloglogin'
};

// 导入目录（修改为你的导出目录）
const IMPORT_DIR = path.join(__dirname, 'exports', 'export_20240115_123456');

// 要导入的文件列表
const FILES_TO_IMPORT = [
  'users.json',
  'blogs.json',
  'messages.json',
  'notifications.json',
  'comments.json',
  'topics.json',
  'follows.json'
];

// ============================================================
// 工具函数
// ============================================================

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m'
  };
  const reset = '\x1b[0m';
  
  const icon = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };
  
  console.log(`${colors[type]}${icon[type]} ${message}${reset}`);
}

/**
 * 导入单个文件
 */
async function importFile(db, filePath) {
  const fileName = path.basename(filePath);
  const collectionName = fileName.replace('.json', '');
  
  try {
    // 读取 JSON 文件
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (!Array.isArray(data) || data.length === 0) {
      log(`${fileName} 文件为空或格式错误`, 'warning');
      return { file: fileName, count: 0, success: false };
    }
    
    // 获取集合
    const collection = db.collection(collectionName);
    
    // 清空现有数据（可选，谨慎使用！）
    // await collection.deleteMany({});
    
    // 插入数据
    const result = await collection.insertMany(data);
    
    log(`已导入：${fileName} (${result.insertedCount} 条数据)`, 'success');
    
    return { file: fileName, count: result.insertedCount, success: true };
    
  } catch (error) {
    log(`导入失败：${fileName} - ${error.message}`, 'error');
    return { file: fileName, count: 0, success: false, error: error.message };
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('\n========================================');
  console.log('🐱 MongoDB 数据导入工具 - BlogLogin 项目');
  console.log('========================================\n');
  
  // 检查导入目录
  if (!fs.existsSync(IMPORT_DIR)) {
    log(`导入目录不存在：${IMPORT_DIR}`, 'error');
    log('请修改脚本中的 IMPORT_DIR 为正确的导出目录', 'warning');
    process.exit(1);
  }
  
  // 连接数据库
  const client = new MongoClient(DB_CONFIG.uri);
  
  try {
    await client.connect();
    log('已连接到 MongoDB', 'success');
    
    const db = client.db();
    
    // 导入所有文件
    const results = [];
    
    for (const fileName of FILES_TO_IMPORT) {
      const filePath = path.join(IMPORT_DIR, fileName);
      
      if (!fs.existsSync(filePath)) {
        log(`${fileName} 文件不存在，跳过`, 'warning');
        results.push({ file: fileName, count: 0, success: false, error: '文件不存在' });
        continue;
      }
      
      const result = await importFile(db, filePath);
      results.push(result);
    }
    
    // 输出统计
    const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
    const successCount = results.filter(r => r.success).length;
    
    console.log('\n========================================');
    log('导入完成！', 'success');
    console.log('========================================\n');
    
    log(`总记录数：${totalRecords}`, 'info');
    log(`成功：${successCount}/${FILES_TO_IMPORT.length}`, 'success');
    log(`失败：${FILES_TO_IMPORT.length - successCount}`, 
        FILES_TO_IMPORT.length - successCount > 0 ? 'warning' : 'info');
    
  } catch (error) {
    log(`导入失败：${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    log('已关闭数据库连接', 'info');
  }
}

// 运行导入
main();

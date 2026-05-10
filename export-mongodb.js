/**
 * ============================================================
 * MongoDB 数据导出脚本 - BlogLogin 项目
 * ============================================================
 * 【用途】使用 Node.js 导出所有集合数据
 * 【格式】JSON 格式（易读、易迁移）
 * 【输出】./exports/ 目录
 * 
 * 【使用方法】
 * 1. 安装依赖：npm install mongodb
 * 2. 运行导出：node export-mongodb.js
 * ============================================================
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// ============================================================
// 配置项
// ============================================================
const DB_CONFIG = {
  host: 'localhost',
  port: 27017,
  name: 'bloglogin',
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/bloglogin'
};

// 要导出的集合列表
const COLLECTIONS = [
  'users',
  'blogs',
  'messages',
  'notifications',
  'comments',
  'topics',
  'follows'
];

// 导出目录
const EXPORT_DIR = path.join(__dirname, 'exports', `export_${Date.now()}`);

// ============================================================
// 工具函数
// ============================================================

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 创建目录：${dirPath}`);
  }
}

/**
 * 格式化输出
 */
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',  // 青色
    success: '\x1b[32m', // 绿色
    warning: '\x1b[33m', // 黄色
    error: '\x1b[31m'   // 红色
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
 * 导出单个集合
 */
async function exportCollection(db, collectionName) {
  const outputFile = path.join(EXPORT_DIR, `${collectionName}.json`);
  
  try {
    const collection = db.collection(collectionName);
    
    // 查询所有数据
    const data = await collection.find({}).toArray();
    
    if (data.length === 0) {
      log(`集合 ${collectionName} 为空，跳过`, 'warning');
      return { collection: collectionName, count: 0, success: true };
    }
    
    // 写入文件
    fs.writeFileSync(outputFile, JSON.stringify(data, null, 2));
    
    log(`已导出：${collectionName} (${data.length} 条数据)`, 'success');
    
    return { collection: collectionName, count: data.length, success: true };
    
  } catch (error) {
    log(`导出失败：${collectionName} - ${error.message}`, 'error');
    return { collection: collectionName, count: 0, success: false, error: error.message };
  }
}

/**
 * 创建导出报告
 */
function createReport(results, startTime, endTime) {
  const report = {
    exportTime: new Date().toISOString(),
    database: DB_CONFIG.name,
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    duration: (endTime - startTime) / 1000,
    summary: {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalRecords: results.reduce((sum, r) => sum + r.count, 0)
    },
    details: results
  };
  
  const reportFile = path.join(EXPORT_DIR, 'export-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  // 创建 README
  const readme = `# MongoDB 数据导出报告

**导出时间：** ${new Date().toLocaleString('zh-CN')}
**数据库：** ${DB_CONFIG.name}
**主机：** ${DB_CONFIG.host}:${DB_CONFIG.port}
**耗时：** ${report.duration.toFixed(2)} 秒

## 导出统计

- **总记录数：** ${report.summary.totalRecords}
- **成功集合：** ${report.summary.success}/${report.summary.total}
- **失败集合：** ${report.summary.failed}

## 文件列表

${results.map(r => `- ${r.collection}.json (${r.count} 条)`).join('\n')}

## 导入方法

\`\`\`bash
# 导入单个集合
mongoimport --host ${DB_CONFIG.host} --port ${DB_CONFIG.port} \\
  --db ${DB_CONFIG.name} \\
  --collection <集合名> \\
  --file <文件名.json>

# 示例：导入 users
mongoimport --host ${DB_CONFIG.host} --port ${DB_CONFIG.port} \\
  --db ${DB_CONFIG.name} \\
  --collection users \\
  --file users.json
\`\`\`

## 使用 Node.js 导入

\`\`\`javascript
const { MongoClient } = require('mongodb');

async function importData() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('${DB_CONFIG.name}');
    const collection = db.collection('users');
    
    const data = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    await collection.insertMany(data);
    
    console.log('导入成功！');
  } finally {
    await client.close();
  }
}
\`\`\`

## 注意事项

1. ⚠️ 敏感数据请妥善保管
2. ⚠️ 导入前请备份现有数据
3. ⚠️ 确保 MongoDB 服务正在运行
4. ⚠️ 确保有足够权限
`;
  
  const readmeFile = path.join(EXPORT_DIR, 'README.md');
  fs.writeFileSync(readmeFile, readme);
  
  return report;
}

/**
 * 主函数
 */
async function main() {
  const startTime = Date.now();
  
  console.log('\n========================================');
  console.log('🐱 MongoDB 数据导出工具 - BlogLogin 项目');
  console.log('========================================\n');
  
  // 创建导出目录
  ensureDir(EXPORT_DIR);
  
  // 连接数据库
  const client = new MongoClient(DB_CONFIG.uri);
  
  try {
    await client.connect();
    log('已连接到 MongoDB', 'success');
    
    const db = client.db(DB_CONFIG.name);
    
    // 验证连接
    const collections = await db.listCollections().toArray();
    log(`数据库中有 ${collections.length} 个集合`, 'info');
    
    // 导出所有集合
    const results = [];
    
    for (const collectionName of COLLECTIONS) {
      // 检查集合是否存在
      const exists = collections.some(c => c.name === collectionName);
      
      if (!exists) {
        log(`集合 ${collectionName} 不存在，跳过`, 'warning');
        results.push({ collection: collectionName, count: 0, success: false, error: '集合不存在' });
        continue;
      }
      
      const result = await exportCollection(db, collectionName);
      results.push(result);
    }
    
    // 创建报告
    const endTime = Date.now();
    const report = createReport(results, startTime, endTime);
    
    // 输出统计
    console.log('\n========================================');
    log('导出完成！', 'success');
    console.log('========================================\n');
    
    log(`总记录数：${report.summary.totalRecords}`, 'info');
    log(`成功：${report.summary.success}/${report.summary.total}`, 'success');
    log(`失败：${report.summary.failed}`, report.summary.failed > 0 ? 'warning' : 'info');
    log(`耗时：${report.duration.toFixed(2)} 秒`, 'info');
    log(`导出目录：${EXPORT_DIR}`, 'info');
    
    console.log('\n查看导出文件：');
    console.log(`  ls -lh ${EXPORT_DIR}\n`);
    
  } catch (error) {
    log(`导出失败：${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    log('已关闭数据库连接', 'info');
  }
}

// 运行导出
main();

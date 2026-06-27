/**
 * 清理学习版注释脚本
 *
 * 清理规则：
 * 1. 删除 【xxx】 格式的注释行（如：【面试常问】、【原理】等）
 * 2. 删除 ASCII 图表注释行（包含 ┌│└──│═ 等字符的注释行）
 * 3. 删除纯分隔线注释行（如 // ────── 或 // ═════）
 * 4. 保留正常的代码注释（TODO、FIXME、参数说明等）
 */

const fs = require('fs');
const path = require('path');

// 需要清理的目录
const TARGET_DIRS = [
    'src/vue',
    'src/controllers',
    'src/models',
    'src/routes',
    'src/services',
    'src/middlewares',
    'src/utils',
    'src/config'
];

// 匹配规则：需要删除的注释行正则
const PATTERNS_TO_REMOVE = [
    // 【xxx】格式 - 普通注释
    /^\s*\/\/\s*【[^】]+】/,
    // 【xxx】格式 - JSDoc注释 (* 【xxx】)
    /^\s*\*\s*【[^】]+】/,
    // 【xxx】格式 - 任意位置（Vue模板多行注释内部等）
    /【[^】]+】/,
    // Q&A 格式（Q1: Q2: A1: A2: 等面试问答格式）
    /^\s*\/\/\s*[QA]\d+\s*[:：]/,
    // Q&A 格式 - 无前缀（HTML注释内部）
    /^[QA]\d+\s*[:：]/,
    // "学习版" 标记
    /学习版|面试准备|面试话术/,
    // ASCII 图表行 - 普通注释
    /^\s*\/\/\s*[┌┃└├│─┬┴┼╔╗╚╝║═╠╣╦╩╬]/,
    // ASCII 图表行 - JSDoc注释
    /^\s*\*\s*[┌┃└├│─┬┴┼╔╗╚╝║═╠╣╦╩╬]/,
    // ASCII 图表行 - 无前缀（HTML注释内部）
    /^\s*[┌┃└├│─┬┴┼╔╗╚╝║═╠╣╦╩╬]/,
    // 纯分隔线注释
    /^\s*\/\/\s*[─═\-={5,}\s]*$/,
    // 纯 emoji 标记行
    /^\s*\/\/\s*[✅❌⚠️★☆▶▷➤✔✘→←↑↓]\s*$/,
];

// 统计信息
let stats = {
    totalFiles: 0,
    modifiedFiles: 0,
    totalLinesRemoved: 0,
    skippedFiles: [],
    errors: []
};

/**
 * 处理单个文件
 */
function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const originalLineCount = lines.length;
    const cleanedLines = [];
    let removedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let shouldRemove = false;

        // 检查是否匹配删除模式
        for (const pattern of PATTERNS_TO_REMOVE) {
            if (pattern.test(line)) {
                shouldRemove = true;
                break;
            }
        }

        if (shouldRemove) {
            removedCount++;
        } else {
            cleanedLines.push(line);
        }
    }

    // 如果有改动，写回文件
    if (removedCount > 0) {
        fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf-8');
        stats.modifiedFiles++;
        stats.totalLinesRemoved += removedCount;
        console.log(`  ✓ ${filePath.replace(/\\/g, '/')} (-${removedCount} 行)`);
    }
}

/**
 * 递归遍历目录
 */
function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath, callback); // 递归子目录
        } else if (stat.isFile()) {
            // 只处理 .js / .vue / .scss 文件
            const ext = path.extname(file).toLowerCase();
            if (['.js', '.vue', '.scss'].includes(ext)) {
                callback(filePath);
                stats.totalFiles++;
            }
        }
    }
}

// ==================== 主程序 ====================
console.log('\n🧹 开始清理学习版注释...\n');

for (const dir of TARGET_DIRS) {
    const fullPath = path.resolve(dir);

    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ 目录不存在: ${dir}`);
        continue;
    }

    console.log(`📁 处理目录: ${dir}/`);
    walkDir(fullPath, processFile);
}

console.log('\n' + '='.repeat(50));
console.log('📊 清理完成！统计信息：');
console.log('   扫描文件数:', stats.totalFiles);
console.log('   修改文件数:', stats.modifiedFiles);
console.log('   删除行数:', stats.totalLinesRemoved);
console.log('='.repeat(50) + '\n');

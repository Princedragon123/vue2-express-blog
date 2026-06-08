// 提供内容安全过滤功能，包括：
// 1. 敏感词检测
// 2. 敏感词替换
// 3. 内容长度验证
// 4. 评论内容验证
// A: 生产环境应该存在数据库或配置文件，方便动态更新
// A: 使用 Trie 树（前缀树）或 DFA 算法，时间复杂度 O(n)
// A: 使用正则表达式，如 "敏[感干]词" 匹配 "敏感词" 和 "敏干词"

// 敏感词列表
// 1. 存储在数据库中，方便动态管理
// 2. 支持分级（一般、严重、违法）
// 3. 支持正则表达式匹配变体
// 4. 定期更新维护
const sensitiveWords = [
    // 政治敏感词
    '敏感词1', '敏感词2', '敏感词3',
    // 色情敏感词
    '色情词1', '色情词2',
    // 暴力敏感词
    '暴力词1', '暴力词2',
    // 其他敏感词
    '其他敏感词1', '其他敏感词2'
];

// 过滤服务对象
const filterService = {
    // 检查内容是否包含敏感词
    // - content: 要检查的内容
    // - true: 包含敏感词
    // - false: 不包含敏感词
    // - 遍历敏感词列表
    // - 只要有一个敏感词匹配，就返回 true
    // - includes() 检查是否包含子串
    hasSensitiveWords: (content) => {
        // 参数验证
        if (!content || typeof content !== 'string') {
            return false;
        }
        
        // some() - 数组方法，有一个满足条件就返回 true
        // word => content.includes(word) - 检查内容是否包含该敏感词
        return sensitiveWords.some(word => content.includes(word));
    },

    // 过滤内容中的敏感词
    // - content: 要过滤的内容
    // - 过滤后的内容（敏感词替换为 * 号）
    // 输入: "这是一条敏感词1的内容"
    // 输出: "这是一条****的内容"
    filterSensitiveWords: (content) => {
        // 参数验证
        if (!content || typeof content !== 'string') {
            return content;
        }
        
        let filteredContent = content;
        
        // 遍历敏感词列表，逐个替换
        sensitiveWords.forEach(word => {
            // 生成替换字符串：与敏感词等长的 * 号
            // '敏感词1'.length = 4 → '****'
            const replacement = '*'.repeat(word.length);
            
            // 使用正则表达式全局替换
            // new RegExp(word, 'gi')
            // - g: global 全局匹配（替换所有）
            // - i: ignoreCase 忽略大小写
            filteredContent = filteredContent.replace(
                new RegExp(word, 'gi'), 
                replacement
            );
        });
        
        return filteredContent;
    },

    // 验证内容长度
    // - content: 要验证的内容
    // - maxLength: 最大长度
    // - true: 符合长度要求
    // - false: 超过最大长度
    validateLength: (content, maxLength) => {
        // 空内容视为符合要求（由其他验证处理）
        if (!content || typeof content !== 'string') {
            return true;
        }
        
        // 检查长度
        return content.length <= maxLength;
    },

    // 验证评论内容（综合验证）
    // - content: 评论内容
    // - { valid: boolean, message: string }
    // 1. 非空验证
    // 2. 长度验证
    // 3. 敏感词验证
    validateComment: (content) => {
        // 步骤1：验证内容是否为空
        if (!content || content.trim().length < 1) {
            return { valid: false, message: '评论内容不能为空' };
        }

        // 步骤2：验证内容长度
        if (content.length > 500) {
            return { valid: false, message: '评论内容不能超过500个字符' };
        }

        // 步骤3：检查敏感词
        if (filterService.hasSensitiveWords(content)) {
            return { valid: false, message: '评论内容包含敏感词，请修改后重试' };
        }

        // 所有验证通过
        return { valid: true, message: '验证通过' };
    }
};

// 导出过滤服务
// const filterService = require('../services/filterService');
// // 验证评论
// const result = filterService.validateComment(commentContent);
// if (!result.valid) {
//   return res.status(400).json({ message: result.message });
// // 过滤敏感词
// const filteredContent = filterService.filterSensitiveWords(content);
// // 检查是否包含敏感词
// if (filterService.hasSensitiveWords(content)) {
//   // 标记为待审核
module.exports = filterService;

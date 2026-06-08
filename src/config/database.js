// database.js - 数据库连接配置
// 建立与 MongoDB 数据库的连接，包括：
// 1. 加载数据库连接字符串
// 2. 使用 Mongoose 连接数据库
// 3. 处理连接成功/失败的回调
// A: Mongoose 提供 Schema 验证、中间件、关联查询等功能
// A: 数据库连接失败意味着应用无法正常工作，不如直接退出
// A: 监听 disconnected 事件，实现自动重连

// 导入依赖模块

// Mongoose：MongoDB 对象建模工具
// - 定义 Schema（数据结构）
// - 创建 Model（数据模型）
// - 提供中间件和验证
const mongoose = require('mongoose');

// dotenv：环境变量管理
require('dotenv').config();

// 获取数据库连接字符串
// - 不要将 .env 文件提交到 Git
// - 生产环境使用环境变量或密钥管理服务
const mongoURI = process.env.MONGODB_URI;

// 连接 MongoDB 数据库
const connectDB = async () => {
    try {
        // 连接 MongoDB
        // mongoose.connect() 返回 Promise
        // Mongoose 6+ 默认启用所有推荐选项
        await mongoose.connect(mongoURI);
        
        // 连接成功
        console.log('MongoDB 数据库连接成功');
    } catch (error) {
        // 连接失败
        // 输出错误信息
        console.error('MongoDB 数据库连接失败:', error.message);
        
        // 退出进程
        // process.exit(1) - 非零退出码表示异常退出
        // process.exit(0) - 零退出码表示正常退出
        process.exit(1);
    }
};

// 导出连接函数
// const connectDB = require('./config/database');
// // 在 server.js 中调用
// connectDB().catch(error => {
//   console.error('数据库连接失败:', error);
// });
// // 或者使用 async/await
// async function startServer() {
//   await connectDB();
//   app.listen(PORT, () => console.log('服务器启动'));
module.exports = connectDB;

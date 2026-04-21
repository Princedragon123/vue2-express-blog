// ==========================================
// 🎯 Express 路由匹配过程可视化演示
// ==========================================

const express = require('express');
const app = express();

// ==========================================
// 📝 中间件：打印请求信息
// ==========================================
app.use((req, res, next) => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 收到请求！');
  console.log('📍 HTTP 方法:', req.method);
  console.log('📍 完整路径:', req.originalUrl);
  console.log('='.repeat(60));
  next();
});

// ==========================================
// 🏗️ 模拟主路由（类似 routes/index.js）
// ==========================================
const mainRouter = express.Router();

mainRouter.use((req, res, next) => {
  console.log('\n📍 进入主路由 (mainRouter)');
  console.log('   当前看到的路径:', req.path);
  next();
});

// ==========================================
// 🏗️ 模拟认证子路由（类似 authRoutes.js）
// ==========================================
const authRouter = express.Router();

authRouter.use((req, res, next) => {
  console.log('\n📍 进入认证子路由 (authRouter)');
  console.log('   当前看到的路径:', req.path);
  next();
});

// 注册路由
authRouter.post('/register', (req, res) => {
  console.log('\n✅ 匹配成功！');
  console.log('🎯 路由: POST /register');
  console.log('🎯 处理函数: authController.register');
  console.log('\n📋 完整调用链:');
  console.log('   app → mainRouter → authRouter → authController.register');
  res.json({ 
    success: true, 
    message: '注册成功！（这是演示响应）',
    匹配过程: [
      '1. app 匹配 /api 前缀',
      '2. mainRouter 匹配 /auth 前缀',
      '3. authRouter 匹配 POST /register',
      '4. 调用 authController.register'
    ]
  });
});

// 登录路由
authRouter.post('/login', (req, res) => {
  console.log('\n✅ 匹配成功！');
  console.log('🎯 路由: POST /login');
  console.log('🎯 处理函数: authController.login');
  res.json({ 
    success: true, 
    message: '登录成功！（这是演示响应）' 
  });
});

// ==========================================
// 🏗️ 模拟博客子路由（类似 blogRoutes.js）
// ==========================================
const blogRouter = express.Router();

blogRouter.use((req, res, next) => {
  console.log('\n📍 进入博客子路由 (blogRouter)');
  console.log('   当前看到的路径:', req.path);
  next();
});

blogRouter.get('/', (req, res) => {
  console.log('\n✅ 匹配成功！');
  console.log('🎯 路由: GET /');
  console.log('🎯 处理函数: blogController.getBlogs');
  res.json({ 
    success: true, 
    message: '获取博客列表成功！（这是演示响应）' 
  });
});

// ==========================================
// 🔗 挂载路由（类似 server.js 和 routes/index.js）
// ==========================================

// 挂载认证子路由到主路由
mainRouter.use('/auth', (req, res, next) => {
  console.log('\n🔗 mainRouter 匹配到 /auth 前缀');
  console.log('   去掉 /auth 前缀，转发给 authRouter');
  authRouter(req, res, next);
});

// 挂载博客子路由到主路由
mainRouter.use('/blogs', (req, res, next) => {
  console.log('\n🔗 mainRouter 匹配到 /blogs 前缀');
  console.log('   去掉 /blogs 前缀，转发给 blogRouter');
  blogRouter(req, res, next);
});

// 挂载主路由到 app
app.use('/api', (req, res, next) => {
  console.log('\n🔗 app 匹配到 /api 前缀');
  console.log('   去掉 /api 前缀，转发给 mainRouter');
  mainRouter(req, res, next);
});

// ==========================================
// 🚀 启动服务器
// ==========================================
const PORT = 3002; // 使用 3002 端口，不影响项目的 3001

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Express 路由匹配演示服务器已启动！');
  console.log('📍 服务器地址: http://localhost:' + PORT);
  console.log('='.repeat(60));
  console.log('\n📋 测试地址（复制到浏览器或用 Postman 测试）：');
  console.log('   1. POST http://localhost:3002/api/auth/register');
  console.log('   2. POST http://localhost:3002/api/auth/login');
  console.log('   3. GET  http://localhost:3002/api/blogs');
  console.log('\n💡 测试方法：');
  console.log('   方法1: 在浏览器地址栏输入上面的 GET 地址');
  console.log('   方法2: 用 curl 命令测试');
  console.log('   方法3: 用 Postman 测试');
  console.log('\n🎬 然后看控制台输出，你会看到完整的匹配过程！\n');
});

// ==========================================
// 📖 使用说明
// ==========================================
/*
运行方式：
  node 路由匹配演示.js

然后你会在控制台看到：
  - 每一层匹配的过程
  - 路径是怎么被一层一层去掉的
  - 最终匹配到哪个路由和处理函数

就像这样：
  ============================================================
  🚀 收到请求！
  📍 HTTP 方法: POST
  📍 完整路径: /api/auth/register
  ============================================================
  
  🔗 app 匹配到 /api 前缀
     去掉 /api 前缀，转发给 mainRouter
  
  📍 进入主路由 (mainRouter)
     当前看到的路径: /auth/register
  
  🔗 mainRouter 匹配到 /auth 前缀
     去掉 /auth 前缀，转发给 authRouter
  
  📍 进入认证子路由 (authRouter)
     当前看到的路径: /register
  
  ✅ 匹配成功！
  🎯 路由: POST /register
  🎯 处理函数: authController.register
  
  📋 完整调用链:
     app → mainRouter → authRouter → authController.register
*/

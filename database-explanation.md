# 数据库实现详解

这个项目使用 MongoDB 和 Mongoose 进行数据库操作，与你之前的实现方式类似，但有一些结构上的优化和额外的功能。让我详细解释一下：

## 1. 项目数据库结构

### 1.1 数据库配置 (`src/config/database.js`)

```javascript
// 导入 mongoose 库
const mongoose = require('mongoose');
// 导入 dotenv 库，用于加载环境变量
require('dotenv').config();

// MongoDB 连接 URI，从环境变量中获取
const mongoURI = process.env.MONGODB_URI;

// 连接 MongoDB 数据库
const connectDB = async () => {
    try {
        // 连接 MongoDB 数据库
        await mongoose.connect(mongoURI);
        // 连接成功时输出日志
        console.log('MongoDB 数据库连接成功');
    } catch (error) {
        // 连接失败时输出错误信息
        console.error('MongoDB 数据库连接失败:', error.message);
        // 退出进程
        process.exit(1);
    }
};

// 导出连接函数
module.exports = connectDB;
```

**说明**：
- 与你的实现类似，使用 `mongoose.connect()` 连接数据库
- 不同之处在于：
  - 从 `.env` 环境变量文件中获取连接 URI，更安全且便于配置
  - 使用异步函数和 try/catch 处理连接错误
  - 连接失败时自动退出进程

### 1.2 环境变量配置 (`.env`)

```
# MongoDB 配置
MONGODB_URI=mongodb://localhost:27017/bloglogin

# JWT 配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# 服务器配置
PORT=3000
NODE_ENV=development
```

**说明**：
- 将数据库连接信息放在环境变量中，避免硬编码
- 你之前可能是直接在代码中写连接字符串，使用环境变量更安全

### 1.3 用户模型 (`src/models/User.js`)

```javascript
// 导入 mongoose
const mongoose = require('mongoose');
// 导入 bcryptjs 用于密码哈希
const bcrypt = require('bcryptjs');

// 定义用户模式
const userSchema = new mongoose.Schema({
    // 用户名
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    // 邮箱
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    // 密码（哈希后存储）
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // 创建时间
    createdAt: {
        type: Date,
        default: Date.now
    },
    // 更新时间
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 密码哈希中间件（保存前执行）
userSchema.pre('save', async function(next) {
    // 如果密码未修改，则跳过
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // 生成盐
        const salt = await bcrypt.genSalt(10);
        // 哈希密码
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 创建用户模型
const User = mongoose.model('User', userSchema);

// 导出用户模型
module.exports = User;
```

**说明**：
- 与你的实现类似，定义了用户的 schema 和 model
- 不同之处在于：
  - 添加了密码哈希功能，使用 bcrypt 确保密码安全
  - 实现了密码验证方法
  - 添加了创建时间和更新时间字段
  - 使用中间件在保存用户前自动哈希密码

### 1.4 数据库使用 (控制器示例)

在 `src/controllers/authController.js` 中使用 User 模型：

```javascript
// 导入用户模型
const User = require('../models/User');

// 注册功能
exports.register = async (req, res) => {
    try {
        // 提取请求体数据
        const { username, email, password, confirmPassword } = req.body;
        
        // 验证数据...
        
        // 检查邮箱是否已存在
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: '该邮箱已被注册' });
        }
        
        // 检查用户名是否已存在
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: '该用户名已被使用' });
        }
        
        // 创建新用户
        const newUser = new User({
            username,
            email,
            password
        });
        
        // 保存用户到数据库
        await newUser.save();
        
        // 生成 JWT 令牌...
        
        // 返回响应...
    } catch (error) {
        // 处理错误...
    }
};
```

**说明**：
- 与你的实现类似，使用 User 模型进行数据库操作
- 不同之处在于：
  - 使用 async/await 处理异步操作
  - 添加了数据验证
  - 与 JWT 认证集成

### 1.5 服务器启动时连接数据库

在 `src/server.js` 中：

```javascript
// 导入数据库连接模块
const connectDB = require('./config/database');

// ... 其他配置 ...

// 连接数据库
connectDB();

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器已启动，监听端口 ${PORT}`);
});
```

**说明**：
- 在服务器启动时调用 `connectDB()` 函数连接数据库

## 2. 与你自己实现的比较

### 相似之处
- 都使用 mongoose 连接 MongoDB
- 都定义了 schema 和 model
- 都在控制器中使用 model 进行数据库操作

### 不同之处
- **项目结构**：这个项目将数据库配置、模型、控制器、路由等分离到不同的目录，结构更清晰
- **环境变量**：使用 .env 文件管理配置，更安全、更灵活
- **密码安全**：实现了密码哈希功能，确保密码安全
- **中间件**：使用 mongoose 中间件自动处理密码哈希
- **异步操作**：使用 async/await 处理异步操作，代码更简洁
- **JWT 集成**：与 JWT 认证集成，实现了完整的用户认证系统

## 3. 如何运行和测试

1. **确保 MongoDB 已安装并运行**
   - 你可以使用 MongoDB Compass 连接到 `mongodb://localhost:27017`
   - 数据库 `bloglogin` 会在首次连接时自动创建

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **测试 API**
   - 你可以使用 Postman 或其他 API 测试工具
   - 注册 API: `POST http://localhost:3000/api/register`
   - 登录 API: `POST http://localhost:3000/api/login`

## 4. 如何扩展

如果你想添加新的功能，例如文章模块，可以按照以下步骤：

1. **创建文章模型** (`src/models/Post.js`)
2. **创建文章控制器** (`src/controllers/postController.js`)
3. **创建文章路由** (`src/routes/postRoutes.js`)
4. **在主路由中注册文章路由**

这样的结构可以保持代码的清晰和可维护性。

## 总结

这个项目的数据库实现与你之前的方式类似，但有一些结构上的优化和额外的功能，特别是在安全性和代码组织方面。你可以根据自己的需要修改和扩展这个结构。

如果你有任何问题，随时可以问我！
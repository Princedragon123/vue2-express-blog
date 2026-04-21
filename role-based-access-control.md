# 基于角色的访问控制（管理员/普通用户区分）

您的想法是对的，区分管理员和普通用户是通过账号密码登录后，根据用户的角色信息来显示不同的页面。下面详细说明如何实现：

## 1. 用户角色字段的添加

我已经在用户模型中添加了 `role` 字段：

```javascript
// 用户角色：'user'（普通用户）或 'admin'（管理员）
role: {
    type: String,
    enum: ['user', 'admin'],  // 只允许这两个值
    default: 'user'           // 默认是普通用户
}
```

**说明**：
- 新增用户默认是普通用户
- 只有在需要时才将特定用户设置为管理员
- `enum` 确保角色值只能是 'user' 或 'admin'，避免错误

## 2. 创建管理员用户

有两种方式创建管理员用户：

### 方法一：通过代码直接创建

```javascript
// 在项目根目录创建一个 create-admin.js 文件
const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdmin() {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 创建管理员用户
    const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',  // 实际使用时应该使用强密码
        role: 'admin'          // 设置为管理员角色
    });
    
    // 保存到数据库
    await adminUser.save();
    console.log('管理员用户创建成功');
    
    // 关闭数据库连接
    await mongoose.disconnect();
}

createAdmin().catch(console.error);
```

运行这个脚本创建管理员：
```bash
node create-admin.js
```

### 方法二：在 MongoDB Compass 中手动设置

1. 找到已有的用户记录
2. 添加或修改 `role` 字段值为 'admin'

## 3. 登录后根据角色显示不同页面

### 3.1 后端实现

在登录成功后，将用户角色信息包含在 JWT 令牌中或直接返回给前端：

```javascript
// src/controllers/authController.js - login 函数
exports.login = async (req, res) => {
    try {
        // ... 验证用户和密码 ...
        
        // 生成 JWT 令牌，包含用户角色
        const token = jwt.generateToken({
            userId: user._id,
            role: user.role  // 包含角色信息
        });
        
        // 返回用户信息和令牌
        res.status(200).json({
            message: '登录成功',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role  // 返回角色信息
            },
            token
        });
    } catch (error) {
        // ... 错误处理 ...
    }
};
```

### 3.2 前端实现

在 Vue 前端中：

1. **登录成功后保存角色信息**

```javascript
// 登录成功后保存用户信息到 localStorage
localStorage.setItem('user', JSON.stringify(response.data.user));
localStorage.setItem('token', response.data.token);
```

2. **根据角色显示不同的路由**

```javascript
// src/vue/router/index.js
import Vue from 'vue';
import Router from 'vue-router';
import Home from '../components/Home.vue';
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import UserDashboard from '../components/UserDashboard.vue';
import AdminDashboard from '../components/AdminDashboard.vue';

Vue.use(Router);

const router = new Router({
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    // 普通用户路由
    { 
      path: '/dashboard', 
      component: UserDashboard,
      meta: { requiresAuth: true, roles: ['user', 'admin'] } // 普通用户和管理员都可以访问
    },
    // 管理员路由
    { 
      path: '/admin/dashboard', 
      component: AdminDashboard,
      meta: { requiresAuth: true, roles: ['admin'] } // 只有管理员可以访问
    }
  ]
});

// 路由守卫，检查用户是否有权限访问
router.beforeEach((to, from, next) => {
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 获取当前用户
    const user = JSON.parse(localStorage.getItem('user'));
    
    // 检查用户是否已登录
    if (!user) {
      // 未登录，重定向到登录页
      next({ path: '/login' });
    } else {
      // 检查用户是否有访问权限
      if (to.matched.some(record => record.meta.roles)) {
        const roles = to.meta.roles;
        // 检查用户角色是否在允许的角色列表中
        if (roles.includes(user.role)) {
          next(); // 有权限，继续访问
        } else {
          // 没有权限，重定向到首页
          next({ path: '/' });
        }
      } else {
        next(); // 不需要角色检查，继续访问
      }
    }
  } else {
    next(); // 不需要认证，继续访问
  }
});

export default router;
```

3. **根据角色显示不同的导航菜单**

```vue
<!-- 在导航组件中 -->
<template>
  <nav>
    <router-link to="/">首页</router-link>
    <router-link to="/dashboard">用户中心</router-link>
    
    <!-- 只有管理员才能看到的导航 -->
    <router-link v-if="user && user.role === 'admin'" to="/admin/dashboard">管理员中心</router-link>
    
    <!-- 登录/退出按钮 -->
    <div v-if="!user">
      <router-link to="/login">登录</router-link>
      <router-link to="/register">注册</router-link>
    </div>
    <div v-else>
      <button @click="logout">退出登录</button>
    </div>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      user: null
    };
  },
  mounted() {
    // 获取当前用户信息
    this.user = JSON.parse(localStorage.getItem('user'));
  },
  methods: {
    logout() {
      // 清除用户信息和令牌
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.user = null;
      this.$router.push('/');
    }
  }
};
</script>
```

## 4. 保护管理员 API 路由

在后端，需要保护管理员 API 路由不被普通用户访问：

```javascript
// src/middlewares/adminAuth.js
// 管理员认证中间件

exports.adminAuth = async (req, res, next) => {
    try {
        // 假设用户信息已经通过 authMiddleware 添加到 req.user
        if (req.user && req.user.role === 'admin') {
            next(); // 是管理员，继续访问
        } else {
            // 不是管理员，返回错误
            res.status(403).json({ message: '权限不足，需要管理员权限' });
        }
    } catch (error) {
        res.status(500).json({ message: '服务器错误' });
    }
};
```

使用这个中间件保护管理员 API：

```javascript
// src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/auth');
const { adminAuth } = require('../middlewares/adminAuth');

// 管理员路由，需要先认证用户身份，再检查是否是管理员
router.get('/dashboard', authMiddleware, adminAuth, adminController.getDashboard);
router.post('/users', authMiddleware, adminAuth, adminController.createUser);
router.delete('/users/:id', authMiddleware, adminAuth, adminController.deleteUser);

module.exports = router;
```

## 5. 完整流程总结

1. **用户注册**：默认创建普通用户
2. **创建管理员**：通过代码或手动设置将特定用户设为管理员
3. **用户登录**：
   - 输入账号密码
   - 后端验证并返回包含角色信息的 JWT 令牌
   - 前端保存用户信息和令牌
4. **访问控制**：
   - 路由守卫检查用户是否登录以及是否有访问权限
   - 根据用户角色显示不同的导航菜单和页面内容
   - 后端 API 也会检查用户角色是否有操作权限

## 6. 注意事项

1. **安全性**：
   - 管理员密码要足够强大，避免使用简单密码
   - 不要在前端代码中硬编码管理员账号信息
   - 确保所有管理员 API 路由都有适当的保护

2. **用户体验**：
   - 明确告知用户当前的角色和权限
   - 对于没有权限的操作，提供友好的提示信息

3. **扩展性**：
   - 当前实现只有两种角色，但可以轻松扩展更多角色（如 'editor'、'moderator' 等）
   - 可以进一步细化权限，如不同管理员有不同的操作权限

通过这种方式，您可以实现管理员和普通用户的区分，登录后显示不同的页面，并确保系统的安全性和可维护性。
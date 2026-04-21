# 登录注册功能实现详解

## 目录

1. [项目概述](#项目概述)
2. [前端实现](#前端实现)
   - [登录页面](#登录页面)
   - [注册页面](#注册页面)
   - [前端API调用](#前端API调用)
3. [后端实现](#后端实现)
   - [认证路由](#认证路由)
   - [认证控制器](#认证控制器)
   - [JWT工具](#JWT工具)
   - [密码加密](#密码加密)
4. [前后端交互流程](#前后端交互流程)
   - [登录流程](#登录流程)
   - [注册流程](#注册流程)
5. [RESTful API设计](#RESTful-API设计)
6. [代码实战](#代码实战)
7. [常见问题与解决方案](#常见问题与解决方案)

## 项目概述

本项目是一个基于Vue 2.7和Express的博客系统，实现了完整的用户认证功能，包括用户注册、登录、获取用户信息、登出和Token刷新。系统使用JWT（JSON Web Token）进行身份认证，使用bcryptjs进行密码加密，采用RESTful API设计风格。

## 前端实现

### 登录页面

**文件**：`src/vue/components/Login.vue`

**核心代码**：

```vue
<template>
  <div class="login-container">
    <!-- 其他代码省略 -->
    <form @submit.prevent="login">
      <!-- 用户名或邮箱输入 -->
      <div class="mb-4 form-group">
        <label for="loginEmail" class="form-label cel-label">用户名或邮箱</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-user"></i>
          </span>
          <input type="text" id="loginEmail" v-model="formData.email" class="form-control cel-input" placeholder="请输入用户名或邮箱" required>
          <div class="input-glow"></div>
        </div>
        <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
      </div>

      <!-- 密码输入 -->
      <div class="mb-4 form-group">
        <label for="loginPassword" class="form-label cel-label">密码</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-lock"></i>
          </span>
          <input type="password" id="loginPassword" v-model="formData.password" class="form-control cel-input" placeholder="请输入您的密码" required ref="passwordInput">
          <button class="btn btn-outline-secondary border-cel" type="button" @click="togglePassword" ref="toggleButton">
            <i class="fas fa-eye" ref="eyeIcon"></i>
          </button>
          <div class="input-glow"></div>
        </div>
        <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
      </div>

      <!-- 登录按钮 -->
      <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-login" :disabled="isLoading">
        <i class="fas fa-sign-in-alt me-2"></i>{{ isLoading ? '登录中...' : '登录' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      formData: {
        email: '',
        password: '',
        rememberMe: true
      },
      errors: {},
      isLoading: false,
      passwordVisible: false
    };
  },
  methods: {
    // 表单验证
    validateForm() {
      this.errors = {};
      
      // 验证用户名或邮箱
      if (!this.formData.email) {
        this.errors.email = '请输入用户名或邮箱';
      } else if (this.formData.email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        // 如果包含@符号，则验证邮箱格式
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码
      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    // 登录方法
    async login() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await this.$http.post('/auth/login', this.formData);
        
        if (response.data.message === '登录成功') {
          // 登录成功，保存认证状态
          const auth = require('../utils/auth').default;
          auth.loginSuccess(response.data.user, response.data.token, this.formData.rememberMe);
          
          // 根据用户角色选择不同的跳转页面
          let redirectPath;
          if (response.data.user && response.data.user.role === 'admin') {
            redirectPath = '/admin';
          } else {
            redirectPath = '/blog';
          }
          this.$router.push(redirectPath);
        } else {
          // 登录失败，显示错误信息
          this.errors.login = response.data.message || '登录失败，请检查邮箱和密码';
        }
      } catch (error) {
        // 处理错误
        if (error.response) {
          this.errors.login = error.response.data.message || '登录失败，请检查邮箱和密码';
        } else if (error.request) {
          this.errors.login = '网络错误，无法连接到服务器，请检查网络连接';
        } else {
          this.errors.login = '请求配置错误，请稍后重试';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>
```

### 注册页面

**文件**：`src/vue/components/Register.vue`

**核心代码**：

```vue
<template>
  <div class="register-container">
    <!-- 其他代码省略 -->
    <form @submit.prevent="register">
      <!-- 用户名输入 -->
      <div class="mb-4 form-group">
        <label for="registerUsername" class="form-label cel-label">用户名</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-user"></i>
          </span>
          <input type="text" id="registerUsername" v-model="formData.username" class="form-control cel-input" placeholder="请设置用户名" required>
          <div class="input-glow"></div>
        </div>
        <div class="error-message" v-if="errors.username">{{ errors.username }}</div>
      </div>

      <!-- 邮箱输入 -->
      <div class="mb-4 form-group">
        <label for="registerEmail" class="form-label cel-label">邮箱</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-envelope"></i>
          </span>
          <input type="email" id="registerEmail" v-model="formData.email" class="form-control cel-input" placeholder="请输入邮箱" required>
          <div class="input-glow"></div>
        </div>
        <div class="error-message" v-if="errors.email">{{ errors.email }}</div>
      </div>

      <!-- 密码输入 -->
      <div class="mb-4 form-group">
        <label for="registerPassword" class="form-label cel-label">密码</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-lock"></i>
          </span>
          <input type="password" id="registerPassword" v-model="formData.password" class="form-control cel-input" placeholder="请设置密码（至少6位）" required ref="passwordInput">
          <button class="btn btn-outline-secondary border-cel" type="button" @click="togglePassword" ref="toggleButton">
            <i class="fas fa-eye" ref="eyeIcon"></i>
          </button>
          <div class="input-glow"></div>
        </div>
        <div class="form-text text-muted mt-1">密码至少8位，包含字母和数字</div>
        <div class="error-message" v-if="errors.password">{{ errors.password }}</div>
      </div>

      <!-- 确认密码输入 -->
      <div class="mb-4 form-group">
        <label for="confirmPassword" class="form-label cel-label">确认密码</label>
        <div class="input-group">
          <span class="input-group-text bg-light border-cel">
            <i class="fas fa-lock"></i>
          </span>
          <input type="password" id="confirmPassword" v-model="formData.confirmPassword" class="form-control cel-input" placeholder="请再次输入密码" required ref="confirmPasswordInput">
          <button class="btn btn-outline-secondary border-cel" type="button" @click="toggleConfirmPassword" ref="toggleConfirmButton">
            <i class="fas fa-eye" ref="confirmEyeIcon"></i>
          </button>
          <div class="input-glow"></div>
        </div>
        <div class="error-message" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</div>
      </div>

      <!-- 同意条款 -->
      <div class="form-check mb-4">
        <input class="form-check-input cel-checkbox" type="checkbox" id="terms" v-model="formData.agreeTerms" required>
        <label class="form-check-label cel-label" for="terms">
          我已阅读并同意 <a href="#" class="text-primary text-decoration-none cel-link">用户协议</a> 和 <a href="#" class="text-primary text-decoration-none cel-link">隐私政策</a>
        </label>
        <div class="error-message" v-if="errors.agreeTerms">{{ errors.agreeTerms }}</div>
      </div>

      <!-- 注册按钮 -->
      <button type="submit" class="btn btn-primary w-100 py-2 cel-button btn-register" :disabled="isLoading">
        <i class="fas fa-user-plus me-2"></i>{{ isLoading ? '注册中...' : '注册' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'Register',
  data() {
    return {
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
      },
      errors: {},
      isLoading: false
    };
  },
  methods: {
    // 表单验证
    validateForm() {
      this.errors = {};
      
      // 验证用户名
      if (!this.formData.username) {
        this.errors.username = '请输入用户名';
      } else if (this.formData.username.length < 3) {
        this.errors.username = '用户名长度不能少于3位';
      }
      
      // 验证邮箱
      if (!this.formData.email) {
        this.errors.email = '请输入邮箱';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) {
        this.errors.email = '请输入有效的邮箱地址';
      }
      
      // 验证密码
      if (!this.formData.password) {
        this.errors.password = '请输入密码';
      } else if (this.formData.password.length < 6) {
        this.errors.password = '密码长度不能少于6位';
      }
      
      // 验证确认密码
      if (!this.formData.confirmPassword) {
        this.errors.confirmPassword = '请确认密码';
      } else if (this.formData.confirmPassword !== this.formData.password) {
        this.errors.confirmPassword = '两次输入的密码不一致';
      }
      
      // 验证同意条款
      if (!this.formData.agreeTerms) {
        this.errors.agreeTerms = '请同意服务条款和隐私政策';
      }
      
      return Object.keys(this.errors).length === 0;
    },
    
    // 注册方法
    async register() {
      if (!this.validateForm()) {
        return;
      }
      
      this.isLoading = true;
      
      try {
        const response = await this.$http.post('/auth/register', {
          username: this.formData.username,
          email: this.formData.email,
          password: this.formData.password
        });
        
        if (response.data.message === '注册成功') {
          // 注册成功，跳转到登录页
          this.$router.push('/login');
        } else {
          // 注册失败，显示错误信息
          if (response.data.errors) {
            this.errors = response.data.errors;
          } else {
            this.errors.register = response.data.message || '注册失败，请稍后重试';
          }
        }
      } catch (error) {
        // 处理错误
        if (error.response) {
          this.errors.register = error.response.data.message || '注册失败，请稍后重试';
        } else if (error.request) {
          this.errors.register = '网络错误，无法连接到服务器，请检查网络连接';
        } else {
          this.errors.register = '请求配置错误，请稍后重试';
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>
```

### 前端API调用

**文件**：`src/vue/main.js`

**核心代码**：

```javascript
// 配置axios
Vue.prototype.$http = axios;
// 配置API基础路径
axios.defaults.baseURL = '/api';
axios.defaults.withCredentials = true;

// 请求拦截器
axios.interceptors.request.use(config => {
  // 从localStorage或sessionStorage获取token
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// 响应拦截器
axios.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response && error.response.status === 401) {
    // 清除登录信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    // 重定向到登录页
    router.push('/login');
  }
  return Promise.reject(error);
});
```

**文件**：`src/vue/utils/auth.js`

**核心代码**：

```javascript
// 认证状态管理
const auth = {
  // 初始化认证状态
  init() {
    // 从localStorage或sessionStorage获取用户信息和token
    const user = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (user && token) {
      this.user = JSON.parse(user);
      this.token = token;
    }
  },
  
  // 登录成功
  loginSuccess(user, token, rememberMe) {
    this.user = user;
    this.token = token;
    
    // 根据rememberMe决定存储位置
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('user', JSON.stringify(user));
      sessionStorage.setItem('token', token);
    }
  },
  
  // 登出
  logout() {
    this.user = null;
    this.token = null;
    
    // 清除存储的信息
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  },
  
  // 检查是否已登录
  isLoggedIn() {
    return !!this.token;
  }
};

export default auth;
```

## 后端实现

### 认证路由

**文件**：`src/routes/authRoutes.js`

**核心代码**：

```javascript
// 导入 express
const express = require('express');
// 创建路由实例
const router = express.Router();

// 导入认证控制器
const authController = require('../controllers/authController');
// 导入认证中间件
const { authMiddleware } = require('../middlewares/auth');

// 注册路由
router.post('/register', authController.register);

// 登录路由
router.post('/login', authController.login);

// 获取当前用户信息路由（需要认证）
router.get('/me', authMiddleware, authController.getMe);

// 登出路由
router.post('/logout', authMiddleware, authController.logout);

// Token刷新路由
router.post('/refresh-token', authController.refreshToken);

// 导出路由
module.exports = router;
```

### 认证控制器

**文件**：`src/controllers/authController.js`

**核心代码**：

```javascript
// 导入用户模型
const User = require('../models/User');
// 导入验证工具
const { registerValidation, loginValidation } = require('../utils/validation');
// 导入 JWT 工具
const jwt = require('../utils/jwt');

// 注册功能
exports.register = async (req, res) => {
    try {
        // 提取请求体数据
        const { username, email, password } = req.body;
        
        // 使用 yup 验证数据
        await registerValidation.validate({
            username,
            email,
            password,
            confirmPassword: password // 直接使用password作为confirmPassword，因为前端已验证
        });
        
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
        
        // 生成 JWT 令牌
        const token = jwt.generateToken(newUser._id);
        
        // 返回用户信息和令牌
        res.status(201).json({
            message: '注册成功',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        // 处理验证错误
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        
        // 处理其他错误
        console.error('注册失败:', error.message);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

// 登录功能
exports.login = async (req, res) => {
    try {
        // 提取请求体数据
        const { email, password } = req.body;
        
        // 验证密码不能为空
        if (!password) {
            return res.status(400).json({ success: false, message: '密码不能为空' });
        }
        
        // 查找用户 - 支持用户名或邮箱登录
        const user = await User.findOne({
            $or: [
                { email }, // 邮箱登录
                { username: email } // 用户名登录（将email字段作为用户名查询）
            ]
        });
        
        if (!user) {
            return res.status(400).json({ success: false, message: '邮箱或密码错误' });
        }
        
        // 验证密码
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '邮箱或密码错误' });
        }
        
        // 检查用户状态
        if (user.status === 'banned') {
            return res.status(403).json({ 
                success: false, 
                message: `该账号已被封禁，原因：${user.banReason || '未提供原因'}。请联系管理员邮箱进行申诉。` 
            });
        }
        
        // 生成 JWT 令牌，根据用户角色设置不同过期时间
        const token = jwt.generateToken(user._id, user.role);
        
        // 返回用户信息和令牌
        res.status(200).json({
            success: true,
            message: '登录成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                avatar: user.profile?.avatar,
                profile: user.profile
            },
            token
        });
    } catch (error) {
        // 处理验证错误
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: error.message });
        }
        
        // 处理其他错误
        console.error('登录失败:', error.message);
        res.status(500).json({ success: false, message: '服务器内部错误' });
    }
};

// 获取当前用户信息功能
exports.getMe = async (req, res) => {
    try {
        // 从请求对象中获取用户信息
        if (!req.user) {
            return res.status(401).json({ message: '未授权访问，请先登录' });
        }
        
        // 从数据库中获取完整的用户信息
        const user = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpires');
        
        if (!user) {
            return res.status(404).json({ message: '用户不存在' });
        }
        
        // 返回用户信息
        res.status(200).json({
            user: user
        });
    } catch (error) {
        // 处理错误
        console.error('获取用户信息失败:', error.message);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

// 登出功能
exports.logout = async (req, res) => {
    try {
        // 清除会话（如果使用会话）
        if (req.session) {
            req.session.destroy();
        }
        
        // 返回成功信息
        res.status(200).json({ message: '登出成功' });
    } catch (error) {
        // 处理错误
        console.error('登出失败:', error.message);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

// Token刷新功能
exports.refreshToken = async (req, res) => {
    try {
        // 从请求头获取当前token
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: '未授权访问，请先登录' });
        }
        
        // 验证当前token
        const decoded = jwt.verifyToken(token);
        
        // 查找用户
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ message: '用户不存在' });
        }
        
        // 生成新的token
        const newToken = jwt.generateToken(user._id, user.role);
        
        // 返回新token和用户信息
        res.status(200).json({
            message: 'Token刷新成功',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token: newToken
        });
    } catch (error) {
        // 处理错误
        console.error('Token刷新失败:', error.message);
        res.status(401).json({ message: '令牌无效或已过期，请重新登录' });
    }
};
```

### JWT工具

**文件**：`src/utils/jwt.js`

**核心代码**：

```javascript
// 导入 jsonwebtoken 库
const jwt = require('jsonwebtoken');

// 从环境变量获取密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 生成 JWT 令牌
exports.generateToken = (userId, role = 'user') => {
    // 根据用户角色设置不同的过期时间
    // 管理员用户令牌过期时间较短（30分钟）
    // 普通用户令牌过期时间较长（7天）
    const expiresIn = role === 'admin' ? '30m' : '7d';
    
    // 生成令牌
    const token = jwt.sign(
        { id: userId, role },
        JWT_SECRET,
        { expiresIn }
    );
    
    return token;
};

// 验证 JWT 令牌
exports.verifyToken = (token) => {
    try {
        // 验证令牌
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (error) {
        // 令牌无效或已过期
        throw new Error('无效的令牌');
    }
};
```

### 密码加密

**文件**：`src/models/User.js`

**核心代码**：

```javascript
// 导入 mongoose
const mongoose = require('mongoose');
// 导入 bcryptjs
const bcrypt = require('bcryptjs');

// 创建用户模式
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'banned']
    },
    banReason: {
        type: String
    },
    profile: {
        avatar: {
            type: String
        },
        bio: {
            type: String
        },
        website: {
            type: String
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
    // 只有当密码被修改时才加密
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        // 生成盐
        const salt = await bcrypt.genSalt(10);
        // 加密密码
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// 密码比较方法
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // 比较密码
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// 创建用户模型
const User = mongoose.model('User', userSchema);

// 导出用户模型
module.exports = User;
```

## 前后端交互流程

### 登录流程

1. **前端**：用户在登录页面输入用户名/邮箱和密码，点击登录按钮
2. **前端**：表单验证，确保输入内容符合要求
3. **前端**：调用 `this.$http.post('/auth/login', formData)` 发送登录请求
4. **后端**：`authController.login` 方法处理登录请求
   - 验证密码不能为空
   - 根据邮箱或用户名查找用户
   - 验证密码是否正确
   - 检查用户状态（是否被封禁）
   - 生成JWT令牌
   - 返回用户信息和令牌
5. **前端**：接收响应，处理登录结果
   - 登录成功：保存用户信息和令牌到localStorage或sessionStorage，跳转到相应页面
   - 登录失败：显示错误信息

### 注册流程

1. **前端**：用户在注册页面输入用户名、邮箱、密码和确认密码，勾选同意条款，点击注册按钮
2. **前端**：表单验证，确保输入内容符合要求
3. **前端**：调用 `this.$http.post('/auth/register', formData)` 发送注册请求
4. **后端**：`authController.register` 方法处理注册请求
   - 验证请求数据格式
   - 检查邮箱和用户名是否已存在
   - 创建新用户并保存到数据库（密码会自动加密）
   - 生成JWT令牌
   - 返回用户信息和令牌
5. **前端**：接收响应，处理注册结果
   - 注册成功：跳转到登录页面
   - 注册失败：显示错误信息

## RESTful API设计

### 认证相关API

| API路径 | 方法 | 功能 | 请求体 | 响应 |
|---------|------|------|--------|------|
| `/api/auth/register` | POST | 注册新用户 | `{"username": "...", "email": "...", "password": "..."}` | `{"message": "注册成功", "user": {...}, "token": "..."}` |
| `/api/auth/login` | POST | 用户登录 | `{"email": "...", "password": "..."}` | `{"message": "登录成功", "user": {...}, "token": "..."}` |
| `/api/auth/me` | GET | 获取当前用户信息 | N/A | `{"user": {...}}` |
| `/api/auth/logout` | POST | 用户登出 | N/A | `{"message": "登出成功"}` |
| `/api/auth/refresh-token` | POST | 刷新Token | N/A | `{"message": "Token刷新成功", "user": {...}, "token": "..."}` |

### RESTful设计原则

1. **资源导向**：API设计围绕资源展开，如用户（/auth）
2. **HTTP方法**：使用合适的HTTP方法
   - POST：创建资源（注册、登录）
   - GET：获取资源（获取用户信息）
   - POST：执行操作（登出、刷新Token）
3. **无状态**：服务器不存储客户端状态，通过Token验证身份
4. **统一接口**：使用标准的HTTP状态码和响应格式
5. **分层系统**：前端和后端分离，通过API进行通信

## 代码实战

### 前端实战

**步骤1：创建登录页面**

1. 创建 `Login.vue` 文件
2. 实现登录表单，包括用户名/邮箱输入、密码输入和登录按钮
3. 添加表单验证逻辑
4. 实现登录方法，调用后端API
5. 处理登录结果，保存用户信息和Token

**步骤2：创建注册页面**

1. 创建 `Register.vue` 文件
2. 实现注册表单，包括用户名、邮箱、密码、确认密码输入和同意条款复选框
3. 添加表单验证逻辑
4. 实现注册方法，调用后端API
5. 处理注册结果，跳转到登录页面

**步骤3：配置axios**

1. 在 `main.js` 中配置axios
2. 设置API基础路径
3. 添加请求拦截器，在请求头中添加Token
4. 添加响应拦截器，处理401错误（Token过期）

**步骤4：实现认证状态管理**

1. 创建 `auth.js` 文件
2. 实现登录成功、登出、检查登录状态等方法
3. 处理Token的存储和获取

### 后端实战

**步骤1：创建用户模型**

1. 创建 `User.js` 文件
2. 定义用户模式，包括用户名、邮箱、密码、角色等字段
3. 添加密码加密中间件
4. 实现密码比较方法

**步骤2：实现JWT工具**

1. 创建 `jwt.js` 文件
2. 实现生成Token和验证Token的方法
3. 根据用户角色设置不同的Token过期时间

**步骤3：实现认证控制器**

1. 创建 `authController.js` 文件
2. 实现注册、登录、获取用户信息、登出、刷新Token等方法
3. 添加错误处理

**步骤4：创建认证路由**

1. 创建 `authRoutes.js` 文件
2. 定义认证相关的API路由
3. 为需要认证的路由添加认证中间件

**步骤5：配置认证中间件**

1. 创建 `auth.js` 文件
2. 实现认证中间件，验证Token并将用户信息添加到请求对象中

## 常见问题与解决方案

### 1. 登录失败，提示"邮箱或密码错误"

**可能原因**：
- 用户名或邮箱输入错误
- 密码输入错误
- 用户不存在

**解决方案**：
- 检查用户名或邮箱是否正确
- 检查密码是否正确，注意区分大小写
- 确认用户是否已注册

### 2. 注册失败，提示"该邮箱已被注册"

**可能原因**：
- 邮箱已被其他用户注册

**解决方案**：
- 使用其他邮箱注册
- 如果是自己的邮箱，尝试登录

### 3. Token过期

**可能原因**：
- Token已超过过期时间

**解决方案**：
- 重新登录获取新的Token
- 使用Token刷新接口获取新的Token

### 4. 密码加密问题

**可能原因**：
- 密码加密失败
- 密码比较失败

**解决方案**：
- 检查密码加密中间件是否正确实现
- 检查密码比较方法是否正确实现
- 确保密码长度符合要求（至少6位）

### 5. CORS错误

**可能原因**：
- 前端和后端的域名或端口不同，导致跨域请求被阻止

**解决方案**：
- 在后端配置CORS中间件，允许前端域名的请求
- 使用代理服务器（如webpack-dev-server的proxy配置）

### 6. 401 Unauthorized错误

**可能原因**：
- Token无效或已过期
- 未提供Token

**解决方案**：
- 重新登录获取新的Token
- 确保在请求头中添加了正确的Token

## 总结

登录注册功能是现代Web应用的基础功能，本项目通过以下技术实现了安全、可靠的用户认证系统：

1. **前端**：使用Vue 2.7构建用户界面，通过axios调用后端API，实现表单验证和错误处理
2. **后端**：使用Express构建RESTful API，实现用户注册、登录、获取用户信息、登出和Token刷新功能
3. **认证**：使用JWT进行身份认证，实现无状态的认证机制
4. **安全**：使用bcryptjs进行密码加密，保护用户密码安全
5. **架构**：采用前后端分离架构，通过API进行通信

通过本教程的学习，你应该能够理解登录注册功能的完整实现流程，包括前后端交互、JWT认证、密码加密等核心技术。你可以根据自己的需求，扩展和修改代码，实现更复杂的用户认证系统。
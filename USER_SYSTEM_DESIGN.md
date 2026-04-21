# 用户系统设计方案

## 1. 系统概述

本博客系统的用户系统包含以下核心功能：
- 用户注册与登录
- 个人资料管理
- 文章发布与管理
- 关注/粉丝功能
- 私信功能（基础结构已实现）

## 2. 技术栈

### 后端
- Node.js + Express.js 构建 RESTful API
- MongoDB + Mongoose 进行数据存储
- JWT (JSON Web Token) 进行用户认证
- bcryptjs 进行密码加密

### 前端
- Vue.js 2.x 作为前端框架
- Axios 进行 HTTP 请求
- Vue Router 进行路由管理
- 本地存储 (localStorage/sessionStorage) 存储用户认证信息

## 3. 核心模块设计

### 3.1 用户模型 (User.js)

用户模型是整个系统的核心，定义了用户的基本信息、社交关系和统计数据：

```javascript
// 基本信息
username: { type: String, required: true, unique: true },
email: { type: String, required: true, unique: true },
password: { type: String, required: true },
role: { type: String, default: 'user' },

// 个人资料
profile: {
  avatar: { type: String, default: 'default.jpg' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  birthDate: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  coverImage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
},

// 社交关系
social: {
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
},

// 统计数据
stats: {
  postsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 }
}
```

### 3.2 认证系统 (authController.js)

认证系统负责用户的注册、登录和会话管理：

- **注册**：验证用户输入，加密密码，创建用户记录
- **登录**：验证用户凭证，生成JWT令牌，返回用户信息
- **获取当前用户**：验证JWT令牌，返回当前登录用户信息

### 3.3 个人资料管理 (userController.js)

个人资料管理模块负责处理用户个人资料的获取和更新：

- **获取用户信息**：根据用户ID获取用户详细信息，包括个人资料、社交关系和统计数据
- **更新用户信息**：允许用户更新个人资料
- **关注/取消关注**：管理用户之间的关注关系

### 3.4 前端实现 (Vue Components)

#### Profile.vue 组件

负责显示用户个人资料：
- 获取并显示用户基本信息、统计数据、最新博客
- 实现关注/取消关注功能
- 显示用户的关注者和关注列表

#### Blog.vue 组件

负责显示博客文章列表：
- 显示博客文章及作者信息
- 实现点击作者头像跳转到个人资料页的功能

#### Login.vue 组件

负责用户登录：
- 提供登录表单
- 处理登录逻辑，存储JWT令牌
- 提供"记住我"功能

## 4. 认证流程

1. **用户登录**：
   - 用户输入用户名和密码
   - 服务器验证用户凭证
   - 生成JWT令牌（过期时间：普通用户7天，管理员30分钟）
   - 返回令牌和用户信息

2. **前端存储**：
   - 根据"记住我"设置，将令牌存储在localStorage或sessionStorage中

3. **API请求**：
   - 前端请求拦截器自动附加令牌到请求头
   - 服务器验证令牌的有效性
   - 返回请求结果

4. **令牌过期处理**：
   - 后端返回401状态码
   - 前端响应拦截器重定向到登录页

## 5. 问题排查与修复

### 5.1 频繁重新登录问题

**问题原因**：
- JWT令牌过期时间设置过短（1天）
- "记住我"选项默认未启用，令牌存储在sessionStorage中

**解决方案**：
- 延长JWT令牌过期时间至7天
- 默认启用"记住我"功能

### 5.2 点击头像无法获取用户信息问题

**问题原因**：
- 前端缓存机制可能导致显示旧数据
- ObjectId比较使用了不正确的方法（includes vs some）

**解决方案**：
- 优化缓存机制，确保获取最新数据
- 修复ObjectId比较逻辑

### 5.3 无法访问作者个人资料问题

**问题原因**：
- 路由参数传递不正确
- 作者ID格式不匹配

**解决方案**：
- 修复路由参数传递
- 确保作者ID格式正确

## 6. 后续优化建议

1. **实现更完善的缓存策略**：使用更智能的缓存机制，避免频繁请求API
2. **增加用户活动日志**：记录用户的登录、操作等活动
3. **实现用户权限管理**：细化用户角色和权限
4. **优化私信功能**：完成私信的发送、接收和存储功能
5. **增加用户通知系统**：通知用户关注、点赞、评论等活动

## 7. 总结

本用户系统设计遵循了现代Web应用的最佳实践，使用JWT进行无状态认证，分离了前后端逻辑，提供了完整的用户管理功能。系统具有良好的可扩展性，可以根据需求添加更多功能。

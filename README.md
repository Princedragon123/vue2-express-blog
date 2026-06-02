# Vue2-Express-Blog

<p align="center">
  <strong>一个基于 Vue2 + Express + MongoDB 的全栈博客社交平台</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue-2.7.x-green" alt="Vue">
  <img src="https://img.shields.io/badge/Express-4.22.x-black" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248" alt="MongoDB">
  <img src="https://img.shields.io/badge/Webpack-5.x-8DD6F9" alt="Webpack">
  <img src="https://img.shields.io/badge/Socket.IO-4.8.x-black" alt="Socket.IO">
</p>

---

## ✨ 功能特性

### 核心功能
- **用户系统** — 注册 / 登录 / JWT 认证 / 角色权限（普通用户 / SVIP / 管理员）
- **文章发布** — 富文本编辑器（Quill） / Markdown 支持 / 图片上传 / 话题标签
- **社交互动** — 关注 / 粉丝 / 点赞 / 收藏 / 评论 / 浏览记录
- **实时通讯** — WebSocket 私聊 / 消息通知 / 在线状态
- **搜索系统** — 文章搜索 / 用户搜索 / 搜索历史 / 热门推荐
- **话题系统** — 话题创建 / 关注话题 / 话题文章聚合

### 特色功能
- **井字棋对战** — 基于 Socket.IO 的实时双人在线对战（MeowChess）
- **管理员后台** — 用户管理 / 博客管理 / 批量操作
- **图片处理** — 头像裁剪 / 背景图设置 / 图片懒加载
- **安全防护** — Helmet / XSS 过滤 / CSRF / 密码加密 / JWT 过期检测

---

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **前端框架** | Vue 2.7 + Vue Router 3 + Vuex 3 | 渐进式 SPA 框架 |
| **UI 组件** | Bootstrap 5 + Element UI + Font Awesome | 响应式布局 |
| **富文本编辑** | Quill 2.0 | 文章编辑 |
| **动画引擎** | GSAP 3.15 | 页面动效 |
| **后端框架** | Express 4.22 | RESTful API |
| **数据库** | MongoDB (Mongoose 9) | NoSQL 数据存储 |
| **认证鉴权** | JSONwebtoken + bcryptjs | JWT 身份验证 |
| **实时通信** | Socket.IO 4.8 | 即时消息 & 对战 |
| **文件上传** | Multer 2.0 | 多类型文件上传 |
| **构建工具** | Webpack 5 + Babel 7 | 模块打包 & 编译 |
| **开发工具** | Nodemon / Sass | 热更新 & 预处理 |

---

## 📁 项目结构

```
bloglogin/
├── src/                          # 源代码目录
│   ├── config/
│   │   └── database.js           # MongoDB 连接配置
│   │
│   ├── controllers/              # 控制器层（业务逻辑）
│   │   ├── authController.js     #   认证（注册/登录/JWT）
│   │   ├── BlogController.js     #   博客文章 CRUD
│   │   ├── userController.js     #   用户信息管理
│   │   ├── messageController.js  #   私信消息
│   │   ├── topicController.js    #   话题管理
│   │   ├── notificationController.js  # 通知推送
│   │   └── adminController.js    #   管理员操作
│   │
│   ├── models/                   # 数据模型（Mongoose Schema）
│   │   ├── User.js               #   用户模型
│   │   ├── Blog.js               #   文章模型
│   │   ├── Comment.js            #   评论模型
│   │   ├── Follow.js             #   关注关系
│   │   ├── Like.js               #   点赞记录
│   │   ├── Message.js            #   私信消息
│   │   ├── Notification.js       #   通知
│   │   ├── Topic.js              #   话题
│   │   ├── ChessRecord.js        #   对战记录
│   │   └── ...                   #   Bookmark/BrowseHistory 等
│   │
│   ├── routes/                   # 路由层（API 端点）
│   │   ├── index.js              #   主路由入口
│   │   ├── authRoutes.js         #   /api/auth/*
│   │   ├── blogRoutes.js         #   /api/blogs/*
│   │   ├── userRoutes.js         #   /api/users/*
│   │   ├── messageRoutes.js      #   /api/messages/*
│   │   ├── chessRoutes.js        #   /api/chess/*
│   │   └── ...                   #   topic/notification 等
│   │
│   ├── middlewares/              # 中间件
│   │   └── auth.js               #   JWT 鉴权中间件
│   │
│   ├── services/                 # 服务层
│   │   ├── socketService.js      #   Socket.IO 实时通信
│   │   ├── chessService.js       #   井字棋游戏逻辑
│   │   ├── uploadService.js      #   文件上传服务
│   │   └── filterService.js      #   内容过滤
│   │
│   ├── utils/                    # 工具函数
│   │   ├── jwt.js                #   JWT 工具
│   │   ├── errorHandler.js       #   统一错误处理
│   │   ├── validation.js         #   数据校验（Yup）
│   │   └── privacy.js            #   隐私处理
│   │
│   ├── server.js                 # Express 入口文件
│   │
│   └── vue/                      # 前端源码
│       ├── main.js               #   Vue 入口
│       ├── App.vue               #   根组件
│       ├── router/index.js       #   路由配置（含权限守卫）
│       ├── store/index.js        #   Vuex 状态管理
│       ├── utils/api.js          #   Axios 封装
│       ├── assets/               #   静态资源（字体/样式/图片/SVG）
│       └── components/           #   Vue 组件
│           ├── AuthPage.vue          #   登录/注册页
│           ├── Blog.vue              #   博客首页
│           ├── Create.vue            #   文章编辑
│           ├── Detail.vue            #   文章详情
│           ├── Profile.vue           #   个人主页
│           ├── ProfileSettings.vue   #   设置页
│           ├── Messages.vue          #   私信聊天
│           ├── Notifications.vue     #   通知中心
│           ├── Search.vue            #   搜索页
│           ├── TopicList.vue         #   话题列表
│           ├── AdminDashboard.vue    #   管理后台
│           ├── meow-chess/           #   井字棋模块
│           ├── blog/                 #   博客相关组件
│           ├── detail/               #   详情页组件
│           ├── create/               #   编辑器组件
│           ├── login/                #   登录组件
│           ├── messages/             #   消息组件
│           ├── notifications/        #   通知组件
│           ├── profile/              #   个人中心组件
│           ├── my-profile/           #   设置子组件
│           ├── dynamic/              #   动态流组件
│           ├── media-carousel/       #   媒体轮播组件
│           ├── admin-users/          #   管理员-用户
│           ├── admin-blogs/          #   管理员-博客
│           └── interactive-food/     #   互动页面组件
│
├── build/
│   └── webpack.config.js         # Webpack 构建配置
│
├── .env                         # 环境变量（需自行配置）
├── .gitignore                   # Git 忽略规则
└── package.json                 # 项目依赖
```

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0
- MongoDB >= 5.0
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Princedragon123/vue2-express-blog.git
cd vue2-express-blog

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 MongoDB 连接字符串和 JWT_SECRET

# 4. 启动开发服务器
npm run dev
```

### 可用命令

```bash
npm run dev          # 启动开发服务器（nodemon 热重载）
npm start            # 生产模式启动
npm run build        # Webpack 构建生产包
npm run dev:webpack  # Webpack 开发服务器
```

### 环境变量说明

```env
# .env 配置示例
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bloglogin
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
ALLOWED_ORIGINS=http://localhost:8080
```

---

## 🔌 API 接口

| 模块 | 前缀 | 主要接口 |
|------|------|---------|
| **认证** | `/api/auth` | `POST /register` `POST /login` `GET /me` |
| **用户** | `/api/users` | `GET /:id` `PUT /profile` `POST /avatar` |
| **博客** | `/api/blogs` | `GET /` `POST /` `PUT /:id` `DELETE /:id` |
| **评论** | `/api/comments` | `POST /` `DELETE /:id` |
| **关注** | `/api/follows` | `POST /:userId` `DELETE /:userId` |
| **点赞** | `/api/likes` | `POST /blog/:id` `DELETE /blog/:id` |
| **消息** | `/api/messages` | `GET /` `POST /` `GET /:userId` |
| **通知** | `/api/notifications` | `GET /` `PUT /read` |
| **话题** | `/api/topics` | `GET /` `POST /` `GET /:id` |
| **搜索** | `/api/search` | `GET /users` `GET /blogs` |
| **对战** | `/api/chess` | `POST /move` `POST /surrender` |

> 详细接口文档请参考各路由文件中的注释。

---

## 👥 用户角色与权限

| 角色 | 权限范围 |
|------|---------|
| **游客** | 浏览公开内容、注册/登录 |
| **普通用户** | 发布文章、关注/点赞、私信、搜索 |
| **SVIP** | 以上全部 + 特殊互动页面访问 |
| **管理员** | 以上全部 + 后台管理面板（用户/博客管理） |

---

## 🎮 特色模块

### MeowChess 井字棋对战
- 基于 Socket.IO 的实时双人对战
- 匹配大厅 + 对战房间
- 排行榜系统 + 战绩统计
- 断线重连支持

### 管理员后台
- 用户列表 / 搜索 / 编辑 / 禁用
- 博客审核 / 删除 / 批量操作
- 分页 + 状态筛选

---

## 📊 数据模型关系

```
User ──1:N── Blog ──1:N── Comment
  │            │
  │            ├─1:N── Like
  │            ├─1:1── Bookmark
  │            └─N:N── Topic (通过 topics 字段)
  │
  ├─N:M── Follow (关注/粉丝)
  ├─1:N── Message (私信)
  ├─1:N── Notification (通知)
  ├─1:N── BrowseHistory (浏览记录)
  └─1:N── SearchRecord (搜索记录)
  
User ──1:N── ChessRecord (对战记录)
```

---

## 🛡 安全措施

- **JWT 认证** — Token 签发 / 自动过期 / 前端守卫拦截
- **密码安全** — bcryptjs 加密存储
- **XSS 防护** — xss-clean 中间件 + sanitize-html
- **CSRF 防护** — csurf Token 校验
- **请求头安全** — Helmet 中间件
- **CORS 配置** — 白名单跨域策略
- **输入校验** — express-validator + Yup Schema
- **路由守卫** — 基于角色的页面/接口权限控制

---

## 📝 开发规范

- 前端采用**组件化开发**，按功能模块拆分目录
- 后端遵循 **MVC 分层架构**：Controller → Service → Model
- API 统一返回格式：`{ success, data, message }`
- 路由守卫统一在 `router/index.js` 中管理
- 所有异步操作使用 async/await

---

## 📄 License

ISC License

---

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Express](https://expressjs.com/) - Node.js Web 框架
- [MongoDB](https://www.mongodb.com/) - NoSQL 数据库
- [Socket.IO](https://socket.io/) - 实时通信引擎

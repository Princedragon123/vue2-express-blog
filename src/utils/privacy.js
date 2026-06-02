// ============================================================
// privacy.js - 隐私检查工具（学习版·权限控制）
// ============================================================
// 
// 【文件职责】
// 提供隐私权限检查功能，包括：
// 1. 检查用户是否有权查看其他用户信息
// 2. 检查用户是否有权查看博客
// 3. 过滤无权查看的内容
// 
// 【学习重点】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  1. 隐私设置：用户可控制谁可以查看自己的内容                            │
// │  2. 权限层级：管理员 > 自己 > 其他人                                    │
// │  3. 隐私字段：publicPosts, showFollowers 等                             │
// │  4. 过滤函数：批量过滤无权查看的内容                                    │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【隐私检查流程】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │   用户请求查看内容                                                      │
// │   ────────────────                                                      │
// │       │                                                                 │
// │       │ GET /api/users/:id/profile                                     │
// │       ▼                                                                 │
// │   隐私检查                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       ├── 1. 检查是否为管理员                                          │
// │       │   if (currentUser.role === 'admin') → 允许                    │
// │       │                                                                 │
// │       ├── 2. 检查是否为本人                                            │
// │       │   if (currentUser._id === targetUser._id) → 允许              │
// │       │                                                                 │
// │       ├── 3. 检查隐私设置                                              │
// │       │   if (targetUser.privacy[field] === false) → 拒绝              │
// │       │                                                                 │
// │       └── 4. 默认允许                                                  │
// │           → 允许                                                       │
// │                                                                         │
// │       ▼                                                                 │
// │   返回结果                                                              │
// │   ────────                                                              │
// │       │                                                                 │
// │       ├── 允许 → 返回数据                                              │
// │       └── 拒绝 → 返回 403 或隐藏敏感字段                                │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【隐私设置字段】
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                                                                         │
// │  user.privacy = {                                                       │
// │    publicPosts: true,      // 文章是否公开                              │
// │    showFollowers: true,    // 是否显示粉丝列表                          │
// │    showFollowing: true,    // 是否显示关注列表                          │
// │    showLikes: true,        // 是否显示点赞列表                          │
// │    allowPrivateMessage: true  // 是否允许私信                           │
// │  }                                                                      │
// │                                                                         │
// │  【字段含义】                                                            │
// │  - true: 公开/允许                                                      │
// │  - false: 私密/禁止                                                     │
// │  - undefined: 默认公开（向后兼容）                                      │
// │                                                                         │
// └─────────────────────────────────────────────────────────────────────────┘
// 
// 【面试常问】
// Q1: 为什么管理员可以绕过隐私检查？
// A: 管理员需要审核内容，必须能查看所有信息
// 
// Q2: 隐私设置存在哪里？
// A: 存在 User 模型的 privacy 字段中
// 
// Q3: 如何处理隐私设置的默认值？
// A: undefined 视为 true（默认公开）
// ============================================================

// ============================================================
// 检查用户是否有权限查看目标用户的信息
// ============================================================
// 【参数】
// - currentUser: 当前登录用户（可能为 null）
// - targetUser: 目标用户
// - privacyField: 隐私设置字段名
// 
// 【返回】
// - true: 有权限查看
// - false: 无权限查看
// 
// 【示例】
// canViewUserInfo(currentUser, targetUser, 'showFollowers')
// // true 或 false
// ============================================================
exports.canViewUserInfo = (currentUser, targetUser, privacyField) => {
  // ====================================================
  // 规则1：管理员可以查看所有信息
  // ====================================================
  // 【原因】管理员需要审核内容等
  if (currentUser && currentUser.role === 'admin') {
    return true;
  }
  

  if (currentUser && currentUser._id && targetUser._id && 
      currentUser._id.toString() === targetUser._id.toString()) {
    return true;
  }
  
  if (!targetUser.privacy || targetUser.privacy[privacyField] !== false) {
    return true;
  }
  return false;
};

exports.canViewBlog = (currentUser, blog) => {
  // ====================================================
  // 规则1：管理员可以查看所有博客
  // ====================================================
  if (currentUser && currentUser.role === 'admin') {
    return true;
  }
  
  if (currentUser && currentUser._id && blog.author && blog.author._id &&
      currentUser._id.toString() === blog.author._id.toString()) {
    return true;
  }

  if (!blog.author || !blog.author.privacy || blog.author.privacy.publicPosts !== false) {
    return true;
  }

  return false;
};

exports.filterBlogsByPrivacy = (blogs, currentUser) => {
  return blogs.filter(blog => exports.canViewBlog(currentUser, blog));
};

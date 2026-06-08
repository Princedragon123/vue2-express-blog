// 提供隐私权限检查功能，包括：
// 1. 检查用户是否有权查看其他用户信息
// 2. 检查用户是否有权查看博客
// 3. 过滤无权查看的内容
// A: 管理员需要审核内容，必须能查看所有信息
// A: 存在 User 模型的 privacy 字段中
// A: undefined 视为 true（默认公开）

// 检查用户是否有权限查看目标用户的信息
// - currentUser: 当前登录用户（可能为 null）
// - targetUser: 目标用户
// - privacyField: 隐私设置字段名
// - true: 有权限查看
// - false: 无权限查看
// canViewUserInfo(currentUser, targetUser, 'showFollowers')
// // true 或 false
exports.canViewUserInfo = (currentUser, targetUser, privacyField) => {
  // 规则1：管理员可以查看所有信息
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
  // 规则1：管理员可以查看所有博客
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

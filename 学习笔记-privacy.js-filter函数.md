# privacy.js - filter 函数学习笔记

## 相关文件：`src/utils/privacy.js`

---

## 问题1：`return blogs.filter(blog => exports.canViewBlog(currentUser, blog));` 里面具体参数是什么？

### 解答：

#### `filterBlogsByPrivacy` 函数：

```javascript
exports.filterBlogsByPrivacy = (blogs, currentUser) => {
  return blogs.filter(blog => exports.canViewBlog(currentUser, blog));
};
```

| 参数 | 类型 | 说明 |
|------|------|------|
| **blogs** | Array | 博客列表数组 |
| **currentUser** | Object \| null | 当前登录用户 |

#### `canViewBlog` 函数参数：

```javascript
exports.canViewBlog = (currentUser, blog) => { ... }
```

| 参数 | 类型 | 说明 |
|------|------|------|
| **currentUser** | Object \| null | 当前登录用户（包含 `_id`, `role` 等字段） |
| **blog** | Object | 博客对象（包含 `author`, `privacy` 等字段） |

---

## 问题2：这个 `filter` 函数，里面带了个无名函数

### 解答：

#### Array.filter() 方法：
- 作用：筛选数组，只保留符合条件的元素
- 返回：一个新数组
- 参数：一个测试函数

#### 箭头函数（无名函数）：

```javascript
// 写法1：箭头函数（最简洁）
blog => exports.canViewBlog(currentUser, blog)

// 写法2：带括号
(blog) => exports.canViewBlog(currentUser, blog)

// 写法3：普通函数表达式
function(blog) {
  return exports.canViewBlog(currentUser, blog);
}
```

#### 执行流程：

```
blogs 数组
├── blog1 → 传入箭头函数 → canViewBlog() → true?  → 保留 ✅
├── blog2 → 传入箭头函数 → canViewBlog() → false? → 过滤 ❌
└── ...
```

---

## 问题3：这个参数不是 true，false 吗，filter(true)

### 解答：

#### ❌ 错误理解：

```javascript
blogs.filter(true);  // 这是错的！
```

#### ✅ 正确理解：

`filter()` **不是直接接收 true/false**，而是接收一个**函数**，这个函数**返回** true/false！

```javascript
// ✅ 正确写法
blogs.filter(blog => {
  return exports.canViewBlog(currentUser, blog);
});
```

#### 简单例子：

```javascript
const numbers = [1, 2, 3, 4, 5, 6];

// 保留偶数
const evenNumbers = numbers.filter(num => num % 2 === 0);
// 结果: [2, 4, 6]
```

---

## `canViewBlog` 判断规则：

| 规则 | 条件 | 结果 |
|------|------|------|
| 1 | currentUser.role === 'admin' | ✅ 允许 |
| 2 | currentUser._id === blog.author._id | ✅ 允许 |
| 3 | blog.author.privacy.publicPosts !== false | ✅ 允许 |
| 4 | 其他情况 | ❌ 禁止 |

# 📐 项目样式使用规范

> **版本：** 1.0  
> **更新日期：** 2026-04-22  
> **适用范围：** 所有 Vue 组件

---

## 🎯 样式架构总览

本项目采用**三层样式架构**：

```
┌─────────────────────────────────────────────────────────────┐
│  第一层：Bootstrap Grid + 工具类（布局层）                    │
│  - 响应式网格系统                                            │
│  - Flex 布局工具                                             │
│  - 间距、文本、显示工具                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  第二层：自定义全局样式（组件层）                             │
│  - CSS Reset + CSS 变量                                      │
│  - 表单、导航、按钮等可复用组件                              │
│  - 全局工具类                                                │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  第三层：组件特定样式（业务层）                               │
│  - 组件独有的布局和效果                                      │
│  - cel-前缀的自定义样式                                      │
│  - scoped 保护的局部样式                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 使用规范

### ✅ **推荐使用 Bootstrap 的部分**

#### **1. Grid 布局系统**

```vue
<!-- ✅ 推荐：使用 Bootstrap Grid -->
<div class="container-fluid">
  <div class="row">
    <div class="col-md-8 col-lg-6 col-xl-5">
      <!-- 内容 -->
    </div>
  </div>
</div>
```

**可用类名：**
- `container`, `container-fluid`
- `row`
- `col-`, `col-sm-`, `col-md-`, `col-lg-`, `col-xl-`, `col-xxl-`

---

#### **2. Flex 布局工具**

```vue
<!-- ✅ 推荐：使用 Flex 工具快速布局 -->
<div class="d-flex justify-content-center align-items-center">
  <div class="flex-grow-1">内容</div>
</div>
```

**可用类名：**
- `d-flex`, `d-inline-flex`
- `flex-row`, `flex-column`
- `justify-content-start/center/end/between/around`
- `align-items-start/center/end/stretch/baseline`
- `flex-grow-0`, `flex-grow-1`
- `flex-shrink-0`, `flex-shrink-1`

---

#### **3. Spacing 间距工具**

```vue
<!-- ✅ 推荐：使用间距工具 -->
<div class="mb-4 p-3">
  <h2 class="mb-2">标题</h2>
  <p class="mb-0">内容</p>
</div>
```

**可用类名：**
- `m-0` ~ `m-5` (margin)
- `p-0` ~ `p-5` (padding)
- `mx-`, `my-`, `mt-`, `mr-`, `mb-`, `ml-`
- `px-`, `py-`, `pt-`, `pr-`, `pb-`, `pl-`

---

#### **4. Text 文本工具**

```vue
<!-- ✅ 推荐：使用文本工具 -->
<div class="text-center">
  <h2 class="text-primary">标题</h2>
  <p class="text-muted">副标题</p>
</div>
```

**可用类名：**
- `text-center`, `text-left`, `text-right`
- `text-primary`, `text-secondary`, `text-muted`, `text-danger`
- `text-uppercase`, `text-lowercase`, `text-capitalize`
- `font-weight-light/normal/bold`
- `font-italic`

---

#### **5. Display 显示工具**

```vue
<!-- ✅ 推荐：使用显示工具 -->
<div class="d-none d-md-block w-100">
  内容
</div>
```

**可用类名：**
- `d-none`, `d-block`, `d-inline`, `d-inline-block`
- `d-flex`, `d-inline-flex`
- `w-25`, `w-50`, `w-75`, `w-100`
- `h-25`, `h-50`, `h-75`, `h-100`

---

#### **6. Borders 边框和阴影**

```vue
<!-- ✅ 可用：边框和阴影 -->
<div class="border rounded shadow-sm">
  内容
</div>
```

**可用类名：**
- `border`, `border-top`, `border-bottom`
- `rounded`, `rounded-sm`, `rounded-lg`, `rounded-circle`
- `shadow-sm`, `shadow`, `shadow-lg`

---

### ❌ **推荐使用自定义样式的部分**

#### **1. 按钮组件**

```vue
<!-- ❌ 避免：使用 Bootstrap 按钮 -->
<button class="btn btn-primary">登录</button>

<!-- ✅ 推荐：使用自定义按钮 -->
<button class="cel-button btn-login">登录</button>
```

**原因：**
- 自定义按钮更符合项目主题
- 可以使用 CSS 变量统一控制
- 更容易实现特殊效果（渐变、动画等）

---

#### **2. 表单组件**

```vue
<!-- ❌ 避免：使用 Bootstrap 表单 -->
<div class="form-group">
  <label class="form-label">用户名</label>
  <input type="text" class="form-control">
</div>

<!-- ✅ 推荐：使用自定义表单 -->
<div class="form-group">
  <label class="cel-label">用户名</label>
  <div class="input-group">
    <span class="input-group-text">
      <i class="fas fa-user"></i>
    </span>
    <input type="text" class="cel-input">
  </div>
</div>
```

**原因：**
- 自定义表单样式统一
- 支持图标输入组合
- 更好的错误提示样式

---

#### **3. 卡片组件**

```vue
<!-- ❌ 避免：使用 Bootstrap 卡片 -->
<div class="card">
  <div class="card-body">
    内容
  </div>
</div>

<!-- ✅ 推荐：使用自定义卡片 -->
<div class="login-card">
  <div class="card-body p-5">
    内容
  </div>
</div>
```

**原因：**
- 自定义卡片更有设计感
- 可以添加特殊效果（装饰元素、动画等）
- 符合项目主题风格

---

#### **4. 导航组件**

```vue
<!-- ⚠️ 可选：导航组件 -->
<!-- 方案 A：使用 Bootstrap nav-pills -->
<div class="nav nav-pills">
  <button class="nav-link active">登录</button>
  <button class="nav-link">注册</button>
</div>

<!-- 方案 B：使用自定义导航 -->
<div class="nav-pills">
  <button class="nav-link active">登录</button>
  <button class="nav-link">注册</button>
</div>
```

**建议：**
- 简单场景可用 Bootstrap
- 复杂效果用自定义

---

### 🎨 **必须使用自定义样式的部分**

#### **1. cel-前缀的样式**

```vue
<!-- ✅ 必须：cel-前缀样式 -->
<button class="cel-button">按钮</button>
<input class="cel-input">
<label class="cel-label">标签</label>
<input class="cel-checkbox">
<p class="cel-text">文本</p>
```

**说明：**
- `cel-` 前缀代表 "Cell Shading"（赛璐璐风格）
- 这些是项目的核心设计语言
- 不得替换为 Bootstrap 类名

---

#### **2. 组件特定样式**

```vue
<!-- ✅ 必须：组件特定样式 -->
<div class="login-container">
  <div class="login-card">
    <div class="card-decoration">
      <span class="logo-text">Logo</span>
    </div>
  </div>
</div>
```

**说明：**
- 每个组件独有的样式
- 使用 BEM 命名规范
- 在 `<style scoped>` 中定义

---

## 📊 使用比例建议

| 层级 | Bootstrap | 自定义 | 说明 |
|------|-----------|--------|------|
| **布局** | 80% | 20% | Grid、Flex 用 Bootstrap |
| **组件** | 20% | 80% | 表单、按钮、卡片用自定义 |
| **工具类** | 60% | 40% | 间距、文本用 Bootstrap，特殊效果用自定义 |

---

## 🔧 实战示例

### **示例 1：登录卡片**

```vue
<template>
  <!-- 外层：Bootstrap Grid 布局 -->
  <div class="container-fluid min-vh-100 d-flex align-items-center justify-content-center">
    <div class="row w-100 justify-content-center">
      <div class="col-md-8 col-lg-6 col-xl-5">
        
        <!-- 卡片：自定义样式 -->
        <div class="login-card shadow-lg">
          <div class="card-body p-5">
            
            <!-- 标题：Bootstrap 文本工具 -->
            <div class="text-center mb-5">
              <h2 class="mb-1">
                <span class="logo-text">
                  <i class="fas fa-magic text-primary"></i> kk 博客
                </span>
              </h2>
              <p class="text-muted">欢迎回到 kk 博客</p>
            </div>
            
            <!-- 表单：自定义表单组件 -->
            <div class="mb-4 form-group">
              <label class="cel-label">用户名或邮箱</label>
              <div class="input-group">
                <span class="input-group-text">
                  <i class="fas fa-user"></i>
                </span>
                <input type="text" class="cel-input" v-model="formData.email">
              </div>
            </div>
            
            <!-- 按钮：自定义按钮 -->
            <button class="cel-button btn-login w-100 py-2">
              登录
            </button>
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

**分析：**
- ✅ Grid 布局：`container-fluid`, `row`, `col-*`
- ✅ Flex 工具：`d-flex`, `justify-content-center`
- ✅ Spacing 工具：`p-5`, `mb-5`, `mb-4`, `py-2`
- ✅ Text 工具：`text-center`, `text-muted`, `text-primary`
- ✅ 自定义组件：`login-card`, `form-group`, `cel-input`, `btn-login`

---

### **示例 2：文章列表**

```vue
<template>
  <div class="container py-5">
    <div class="row">
      <!-- 循环渲染文章卡片 -->
      <div 
        v-for="blog in blogs" 
        :key="blog.id"
        class="col-md-6 col-lg-4 mb-4"
      >
        <!-- 文章卡片：自定义 -->
        <article class="blog-card card-interactive">
          <!-- 文章图片：自定义 + Bootstrap -->
          <div class="blog-card__image img-cover-container">
            <img :src="blog.cover" :alt="blog.title">
          </div>
          
          <!-- 文章内容：混合使用 -->
          <div class="p-4">
            <h3 class="text-lg text-primary mb-2">
              {{ blog.title }}
            </h3>
            <p class="text-muted text-sm mb-3">
              {{ blog.summary }}
            </p>
            
            <!-- 元信息：Flex 布局 -->
            <div class="d-flex justify-content-between align-items-center">
              <span class="text-sm">
                <i class="fas fa-user"></i> {{ blog.author }}
              </span>
              <span class="text-sm">
                <i class="fas fa-eye"></i> {{ blog.views }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
```

---

## 📝 检查清单

在编写组件样式时，请检查：

- [ ] **布局**：是否使用了 Bootstrap Grid？
- [ ] **Flex**：是否使用了 Bootstrap Flex 工具？
- [ ] **间距**：是否优先使用 Bootstrap Spacing 工具？
- [ ] **按钮**：是否使用了自定义 `.cel-button`？
- [ ] **表单**：是否使用了自定义 `.form-group` 和 `.cel-input`？
- [ ] **卡片**：是否使用了自定义卡片类名？
- [ ] **cel-前缀**：是否正确使用了 cel-前缀样式？
- [ ] **scoped**：组件特定样式是否加了 `scoped`？

---

## 🎯 总结

**核心原则：**

1. **布局用 Bootstrap** - Grid、Flex、Spacing
2. **组件用自定义** - 按钮、表单、卡片
3. **工具类混合用** - 哪个方便用哪个
4. **cel-前缀必须保留** - 项目特色

**好处：**

- ✅ 开发效率高（Bootstrap 工具类）
- ✅ 设计独特性强（自定义组件）
- ✅ 文件体积小（按需引入 Bootstrap）
- ✅ 维护成本低（清晰的架构）

---

**文档状态：** 🟢 已完成  
**适用范围：** 所有新组件开发

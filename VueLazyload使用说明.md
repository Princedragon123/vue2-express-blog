# VueLazyload 插件使用说明

## 一、什么是VueLazyload？

VueLazyload是一个Vue插件，用于实现图片的懒加载（Lazy Loading），即图片进入视口时才加载，而不是页面加载时就全部加载。

## 二、安装与注册

### 1. 安装依赖
```bash
npm install vue-lazyload --save
```

### 2. 在main.js中注册

**简单注册**：
```javascript
import VueLazyload from 'vue-lazyload';

Vue.use(VueLazyload);
```

**带配置注册**：
```javascript
import VueLazyload from 'vue-lazyload';

Vue.use(VueLazyload, {
  preLoad: 1.3,  // 预加载比例
  error: '/assets/error.png',  // 加载失败时的图片
  loading: '/assets/loading.gif',  // 加载中的占位图
  attempt: 1  // 加载失败后重试次数
});
```

## 三、在组件中使用

### 1. 普通图片
```vue
<template>
  <img v-lazy="imageUrl" alt="懒加载图片">
</template>
```

### 2. 背景图片
```vue
<template>
  <div v-lazy:background-image="backgroundUrl"></div>
</template>
```

**注意**：
- 不是使用`src`属性，而是使用`v-lazy`指令
- 背景图片使用`v-lazy:background-image`

## 四、工作原理

1. 页面加载时，VueLazyload会监听图片元素
2. 当图片元素进入视口（用户可见区域）时，才会加载真实图片
3. 加载前显示占位图，加载完成后显示真实图片

## 五、优势

- **提高页面加载速度**：只加载当前可见的图片
- **减少带宽使用**：避免加载用户可能不会看到的图片
- **提升用户体验**：页面加载更快，减少白屏时间
- **支持响应式**：适应不同屏幕尺寸

## 六、项目中的应用

在项目中，你会看到类似这样的代码：

```vue
<!-- 在Blog.vue或其他组件中 -->
<img v-lazy="blog.coverImage" class="blog-cover">
```

这样，当用户滚动到这个图片位置时，图片才会开始加载。

## 七、注意事项

- `Vue.use(VueLazyload);`只是注册插件，需要在组件中使用`v-lazy`指令才会生效
- 懒加载可以显著提升页面性能，特别是图片较多的页面
- 是现代前端开发中常用的优化手段之一
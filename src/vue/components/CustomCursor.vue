<!-- 
=============================================================================
  CustomCursor.vue - 自定义鼠标光标组件
=============================================================================

  创建一个跟随鼠标的自定义光标，用于增强用户体验

  1. 游戏化界面
  2. 创意展示页面
  3. 品牌特色强调

  1. 移动端自动隐藏（触摸设备不需要）
  2. 提供关闭选项（考虑可访问性）
  3. 避免影响正常使用

=============================================================================
-->

<template>
  <!-- 自定义光标容器 -->
  <div 
    class="custom-cursor"
    :class="{ 
      'custom-cursor--hidden': isHidden,
      'custom-cursor--hover': isHovering
    }"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`
    }"
  >
    <!-- 光标外层（大圆） -->
    <div class="custom-cursor__outer"></div>
    
    <!-- 光标内层（小圆点） -->
    <div class="custom-cursor__inner"></div>
    
    <!-- 点击波纹效果 -->
    <div 
      v-if="isClicking"
      class="custom-cursor__ripple"
    ></div>
  </div>
</template>

<script>
export default {
  name: 'CustomCursor',
  
  data() {
    return {
      // 光标位置
      position: {
        x: 0,
        y: 0
      },
      
      // 是否隐藏（移出窗口/触摸设备）
      isHidden: false,
      
      // 是否在可点击元素上
      isHovering: false,
      
      // 是否正在点击
      isClicking: false,
      
      // 延迟隐藏定时器
      hideTimer: null
    }
  },
  
  mounted() {
    // 触摸设备不启用自定义光标
    if ('ontouchstart' in window) {
      return
    }
    
    // 监听鼠标移动
    document.addEventListener('mousemove', this.handleMouseMove)
    
    // 监听鼠标进入/离开窗口
    document.addEventListener('mouseenter', this.handleMouseEnter)
    document.addEventListener('mouseleave', this.handleMouseLeave)
    
    // 监听鼠标按下/松开
    document.addEventListener('mousedown', this.handleMouseDown)
    document.addEventListener('mouseup', this.handleMouseUp)
    
    // 监听可点击元素
    document.addEventListener('mouseover', this.handleMouseOver)
  },
  
  beforeDestroy() {
    // 清理事件监听
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseenter', this.handleMouseEnter)
    document.removeEventListener('mouseleave', this.handleMouseLeave)
    document.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.removeEventListener('mouseover', this.handleMouseOver)
    
    // 清除定时器
    if (this.hideTimer) {
      clearTimeout(this.hideTimer)
    }
  },
  
  methods: {
    // 处理鼠标移动
    handleMouseMove(e) {
      this.position.x = e.clientX
      this.position.y = e.clientY
      this.isHidden = false
      
      // 清除隐藏定时器
      if (this.hideTimer) {
        clearTimeout(this.hideTimer)
      }
    },
    
    // 处理鼠标进入窗口
    handleMouseEnter() {
      this.isHidden = false
    },
    
    // 处理鼠标离开窗口
    handleMouseLeave() {
      // 延迟隐藏，避免闪烁
      this.hideTimer = setTimeout(() => {
        this.isHidden = true
      }, 100)
    },
    
    // 处理鼠标按下
    handleMouseDown() {
      this.isClicking = true
    },
    
    // 处理鼠标松开
    handleMouseUp() {
      this.isClicking = false
    },
    
    // 处理鼠标悬停在可点击元素上
    handleMouseOver(e) {
      const target = e.target
      const clickableTags = ['A', 'BUTTON', 'INPUT', 'TEXTAREA']
      const hasClickHandler = target.onclick || target.getAttribute('v-on:click')
      
      // 检查是否是可点击元素
      if (
        clickableTags.includes(target.tagName) ||
        hasClickHandler ||
        target.classList.contains('cel-button') ||
        target.classList.contains('btn-login') ||
        target.style.cursor === 'pointer'
      ) {
        this.isHovering = true
      } else {
        this.isHovering = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;  /* 不干扰正常点击 */
  z-index: 999999;
  transform: translate(-50%, -50%);
  transition: opacity 0.2s ease, transform 0.1s ease;
  
  /* 默认隐藏，JS 启用后显示 */
  opacity: 0;
  
  &.custom-cursor--hidden {
    opacity: 0;
  }
  
  /* 鼠标移动时显示 */
  &:not(.custom-cursor--hidden) {
    opacity: 1;
  }
  
  /* 悬停在可点击元素上时变大 */
  &.custom-cursor--hover {
    transform: translate(-50%, -50%) scale(1.5);
    
    .custom-cursor__outer {
      border-color: var(--primary-pink);
      background: rgba(236, 72, 153, 0.1);
    }
  }
}

/* 外层大圆 */
.custom-cursor__outer {
  width: 40px;
  height: 40px;
  border: 2px solid var(--primary-pink);
  border-radius: 50%;
  background: rgba(236, 72, 153, 0.05);
  transition: all 0.15s ease;
  box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);
}

/* 内层小圆点 */
.custom-cursor__inner {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: var(--primary-pink);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 5px rgba(236, 72, 153, 0.5);
}

/* 点击波纹效果 */
.custom-cursor__ripple {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border: 2px solid var(--primary-pink);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple-effect 0.6s ease-out;
  opacity: 0;
}

@keyframes ripple-effect {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
  }
}

/* 移动端隐藏 */
@media (max-width: 768px) {
  .custom-cursor {
    display: none !important;
  }
}
</style>

// 触摸手势 Mixin - 提供左滑返回、下拉刷新等移动端交互
// Vue 2 Options API 格式，所有组件可通过 mixins: [touchMixin] 使用

const SWIPE_THRESHOLD = 80;   // 最小滑动距离
const SWIPE_VELOCITY = 0.3;   // 最小滑动速度 (px/ms)

export default {
  methods: {
    /**
     * 绑定左滑返回手势
     * 在页面最左边缘向右滑动 → 触发 router.back()
     * 使用方式：mounted() { this.enableSwipeBack(); }
     */
    enableSwipeBack() {
      let startX = 0;
      let startY = 0;
      let startTime = 0;

      this._swipeBackHandler = (e) => {
        // 只在触摸点靠近左边缘（< 40px）时触发
        if (e.touches[0].clientX > 40) return;

        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startTime = Date.now();
      };

      this._swipeBackEndHandler = (e) => {
        if (!startX) return;
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - startX;
        const dy = Math.abs(endY - startY);
        const dt = Date.now() - startTime;

        // 水平滑动超过阈值，且水平大于垂直（排除上下滚动）
        if (dx > SWIPE_THRESHOLD && dx > dy * 1.5 && (dx / dt > SWIPE_VELOCITY)) {
          if (window.history.length > 1) {
            this.$router.back();
          }
        }
        startX = 0;
      };

      document.addEventListener('touchstart', this._swipeBackHandler, { passive: true });
      document.addEventListener('touchend', this._swipeBackEndHandler, { passive: true });
    },

    /**
     * 解绑左滑返回手势
     */
    disableSwipeBack() {
      if (this._swipeBackHandler) {
        document.removeEventListener('touchstart', this._swipeBackHandler);
        document.removeEventListener('touchend', this._swipeBackEndHandler);
      }
    },

    /**
     * 绑定触摸反馈 - 点击时添加涟漪效果
     * 使用方式：在元素上 @touchstart="addRipple"
     */
    addRipple(event) {
      const el = event.currentTarget;
      // 移除旧涟漪
      const oldRipple = el.querySelector('.touch-ripple');
      if (oldRipple) oldRipple.remove();

      const ripple = document.createElement('span');
      ripple.className = 'touch-ripple';
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${event.touches[0].clientX - rect.left - size / 2}px;
        top: ${event.touches[0].clientY - rect.top - size / 2}px;
        border-radius: 50%;
        background: rgba(236, 72, 153, 0.15);
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
      `;

      el.style.position = el.style.position || 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(ripple);

      ripple.addEventListener('animationend', () => ripple.remove());
    },

    /**
     * 下拉刷新检测
     * 使用方式：mounted() { this.enablePullToRefresh(callback); }
     * @param {Function} onRefresh - 刷新回调函数
     */
    enablePullToRefresh(onRefresh) {
      let startY = 0;
      let pulling = false;

      this._pullStartHandler = (e) => {
        // 只在页面顶部且向下拉时触发
        if (window.scrollY > 10) return;
        startY = e.touches[0].clientY;
        pulling = true;
      };

      this._pullMoveHandler = (e) => {
        if (!pulling) return;
        const currentY = e.touches[0].clientY;
        const distance = currentY - startY;
        if (distance > 60) {
          pulling = false;
          if (typeof onRefresh === 'function') onRefresh();
        }
      };

      this._pullEndHandler = () => {
        pulling = false;
      };

      document.addEventListener('touchstart', this._pullStartHandler, { passive: true });
      document.addEventListener('touchmove', this._pullMoveHandler, { passive: true });
      document.addEventListener('touchend', this._pullEndHandler, { passive: true });
    },

    /**
     * 解绑下拉刷新
     */
    disablePullToRefresh() {
      if (this._pullStartHandler) {
        document.removeEventListener('touchstart', this._pullStartHandler);
        document.removeEventListener('touchmove', this._pullMoveHandler);
        document.removeEventListener('touchend', this._pullEndHandler);
      }
    }
  },

  beforeDestroy() {
    // 自动清理所有触摸监听器
    this.disableSwipeBack();
    this.disablePullToRefresh();
  }
};

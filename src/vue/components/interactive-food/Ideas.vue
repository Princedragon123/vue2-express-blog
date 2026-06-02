<template>
  <div class="ideas-wrapper">
    <div class="ideas-container">
      <p
        v-if="currentIndex < lines.length"
        :key="currentIndex"
        class="idea-line"
        :class="{ 'idea-special': currentIndex === lines.length - 1 }"
        ref="lineRef"
      >{{ lines[currentIndex] }}</p>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Ideas',
  props: {
    lines: { 
      type: Array, 
      default: () => [
        '每一行代码都是一个故事',
        '每一个组件都是一段旅程'
      ] 
    }
  },
  data() {
    return {
      currentIndex: 0
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      if (this.currentIndex >= this.lines.length) return;
      
      const tl = gsap.timeline();
      const lineEl = this.$refs.lineRef;
      
      if (!lineEl) return;
      
      tl.set(lineEl, {
        opacity: 0,
        y: 30
      });
      
      tl.to(lineEl, {
        duration: 0.6,
        opacity: 1,
        y: 0,
        ease: 'power3.out'
      })
      .to({}, { duration: 1.5 }) // 缩短等待时间
      .to(lineEl, {
        duration: 0.6,
        opacity: 0,
        y: -30,
        ease: 'power3.in',
        onComplete: () => {
          this.currentIndex++;
          this.$nextTick(() => {
            this.playAnimation();
          });
        }
      });
    }
  }
};
</script>

<style scoped>
.ideas-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  min-height: 200px;
}

.ideas-container {
  text-align: center;
  position: relative;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.idea-line {
  font-size: 2rem;
  color: #ffffff;
  margin: 0;
  white-space: nowrap;
  font-weight: 600;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.idea-special {
  background: linear-gradient(135deg, #f472b6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.2rem;
}
</style>

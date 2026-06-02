<template>
  <div class="greeting-wrapper">
    <h1 class="greeting-title">
      {{ title }}
      <span class="greeting-name">{{ name }}</span>
    </h1>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Greeting',
  props: {
    title: { type: String, default: '欢迎来到' },
    name: { type: String, default: '奇妙的前端世界！' }
  },
  mounted() {
    this.playAnimation();
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      tl.from('.greeting-title', {
        duration: 1,
        opacity: 0,
        y: -50,
        ease: 'power3.out'
      })
      .from('.greeting-name', {
        duration: 0.8,
        opacity: 0,
        scale: 0.5,
        color: '#f472b6'
      }, '-=0.4');
    }
  }
};
</script>

<style scoped>
.greeting-wrapper {
  text-align: center;
  padding: 40px;
}

.greeting-title {
  font-size: 3rem;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(244, 114, 182, 0.5);
  margin: 0;
  font-weight: 800;
}

.greeting-name {
  display: block;
  font-size: 3.5rem;
  margin-top: 10px;
  background: linear-gradient(135deg, #f472b6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>

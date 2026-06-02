<template>
  <div class="quote-wrapper">
    <div class="quote-card">
      <span class="quote-mark">"</span>
      <p class="quote-text">{{ text }}</p>
      <p v-if="author" class="quote-author">— {{ author }}</p>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Quote',
  props: {
    text: { type: String, default: '代码是写给人看的，顺便给机器执行' },
    author: { type: String, default: '佚名' }
  },
  mounted() {
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      
      tl.from('.quote-mark', {
        duration: 0.6,
        opacity: 0,
        scale: 3,
        rotation: 45,
        ease: 'back.out'
      })
      .from('.quote-text', {
        duration: 0.8,
        opacity: 0,
        y: 30,
        ease: 'power3.out'
      }, '-=0.3');
      
      if (this.author) {
        tl.from('.quote-author', {
          duration: 0.6,
          opacity: 0,
          x: -30,
          ease: 'power3.out'
        }, '-=0.2');
      }
    }
  }
};
</script>

<style scoped>
.quote-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.quote-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px 50px;
  max-width: 600px;
  text-align: center;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.quote-mark {
  font-size: 5rem;
  color: #f472b6;
  line-height: 1;
  display: block;
  font-family: Georgia, serif;
}

.quote-text {
  font-size: 1.8rem;
  color: #ffffff;
  line-height: 1.6;
  margin: 10px 0 20px;
  font-weight: 500;
}

.quote-author {
  font-size: 1.2rem;
  color: #60a5fa;
  font-style: italic;
  margin: 0;
}
</style>

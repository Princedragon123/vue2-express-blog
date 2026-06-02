<template>
  <div class="wavetext-wrapper">
    <h2 class="wavetext-title" ref="title">
      <span
        v-for="(char, index) in chars"
        :key="index"
        class="wavetext-char"
        ref="chars"
      >{{ char }}</span>
    </h2>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'WaveText',
  props: {
    text: { type: String, default: '波浪文字特效' }
  },
  data() {
    return {
      chars: []
    };
  },
  mounted() {
    this.chars = this.text.split('');
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const charElements = this.$refs.chars || [];
      
      charElements.forEach((char, index) => {
        gsap.to(char, {
          y: -15,
          duration: 0.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.08
        });
      });
    }
  }
};
</script>

<style scoped>
.wavetext-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.wavetext-title {
  font-size: 3rem;
  margin: 0;
  font-weight: 800;
}

.wavetext-char {
  display: inline-block;
  background: linear-gradient(135deg, #f472b6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 20px rgba(244, 114, 182, 0.4);
}
</style>

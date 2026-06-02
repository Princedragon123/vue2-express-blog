<template>
  <div class="neontext-wrapper">
    <h2 class="neontext-title" :class="{ 'neon-on': isOn }">{{ text }}</h2>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'NeonText',
  props: {
    text: { type: String, default: '霓虹闪烁特效' }
  },
  data() {
    return {
      isOn: false
    };
  },
  mounted() {
    this.playAnimation();
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.5 });
      
      tl.to(this, {
        isOn: true,
        duration: 0.1
      })
      .to({}, { duration: 0.1 })
      .to(this, {
        isOn: false,
        duration: 0.1
      })
      .to({}, { duration: 0.05 })
      .to(this, {
        isOn: true,
        duration: 0.1
      })
      .to({}, { duration: 2 });
    }
  }
};
</script>

<style scoped>
.neontext-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  background: #0a0a0a;
  border-radius: 20px;
}

.neontext-title {
  font-size: 3rem;
  margin: 0;
  font-weight: 800;
  color: #333;
  transition: all 0.1s;
  letter-spacing: 0.1em;
}

.neontext-title.neon-on {
  color: #fff;
  text-shadow:
    0 0 5px #f472b6,
    0 0 10px #f472b6,
    0 0 20px #f472b6,
    0 0 40px #f472b6,
    0 0 80px #f472b6;
}
</style>

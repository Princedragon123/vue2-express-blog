<template>
  <div class="countdown-wrapper">
    <div class="countdown-container">
      <span
        v-for="(num, index) in numbers"
        :key="index"
        class="countdown-num"
        ref="nums"
      >{{ num }}</span>
      <span class="countdown-go" ref="go">{{ goText }}</span>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Countdown',
  props: {
    from: { type: Number, default: 3 },
    goText: { type: String, default: 'GO！' }
  },
  data() {
    return {
      numbers: []
    };
  },
  mounted() {
    for (let i = this.from; i >= 1; i--) {
      this.numbers.push(i);
    }
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      const numElements = this.$refs.nums || [];
      const goElement = this.$refs.go;
      
      tl.set([...numElements, goElement], {
        scale: 0,
        opacity: 0,
        rotation: -180
      });
      
      numElements.forEach((num) => {
        tl.to(num, {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 0.5,
          ease: 'back.out'
        })
        .to(num, {
          scale: 2,
          opacity: 0,
          duration: 0.4,
          ease: 'back.in'
        }, '+=0.8');
      });
      
      tl.to(goElement, {
        scale: 1.2,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        ease: 'back.out'
      })
      .to(goElement, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    }
  }
};
</script>

<style scoped>
.countdown-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.countdown-container {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.countdown-num, .countdown-go {
  position: absolute;
  font-size: 6rem;
  font-weight: 800;
  background: linear-gradient(135deg, #f472b6 0%, #60a5fa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(244, 114, 182, 0.4);
}

.countdown-go {
  font-size: 5rem;
}
</style>

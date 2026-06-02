<template>
  <div class="profile-wrapper">
    <div class="wish">
      <h3 class="wish-hbd" ref="hbd">
        <span v-for="(char, index) in chars" :key="index" class="wish-char" ref="chars">{{ char }}</span>
      </h3>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Profile',
  props: {
    wishTitle: { type: String, default: 'Hello Developer' }
  },
  data() {
    return {
      chars: []
    };
  },
  mounted() {
    this.chars = this.wishTitle.split('');
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      const charElements = this.$refs.chars || [];
      const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];
      
      tl.from(charElements, {
        duration: 0.5,
        opacity: 0,
        y: -30,
        stagger: 0.06,
        ease: 'back.out'
      })
      .to(charElements, {
        duration: 0.3,
        color: (i) => colors[i % colors.length],
        stagger: 0.04,
        ease: 'power2.inOut'
      }, '-=0.3');
    }
  }
};
</script>

<style scoped>
.profile-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.wish {
  text-align: center;
}

.wish-hbd {
  font-size: 3.5rem;
  margin: 0;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.wish-char {
  display: inline-block;
  color: #ffffff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}
</style>

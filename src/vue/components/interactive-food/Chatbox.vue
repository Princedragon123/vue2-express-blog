<template>
  <div class="chatbox-wrapper">
    <div class="chatbox-container">
      <div class="chatbox-avatar">🐱</div>
      <div class="chatbox-bubble">
        <span
          v-for="(char, index) in chars"
          :key="index"
          class="chatbox-char"
          ref="chars"
        >{{ char }}</span>
        <span class="chatbox-cursor">|</span>
      </div>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Chatbox',
  props: {
    message: { type: String, default: '在这里，代码会跳舞，设计会唱歌～' }
  },
  data() {
    return {
      chars: []
    };
  },
  mounted() {
    this.chars = this.message.split('');
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      const charElements = this.$refs.chars || [];
      
      tl.set(charElements, {
        visibility: 'hidden',
        opacity: 0
      })
      .to(charElements, {
        duration: 0.05,
        visibility: 'visible',
        opacity: 1,
        stagger: 0.05,
        ease: 'none'
      });
    }
  }
};
</script>

<style scoped>
.chatbox-wrapper {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.chatbox-container {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  max-width: 600px;
}

.chatbox-avatar {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.chatbox-bubble {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 20px 25px;
  color: #ffffff;
  font-size: 1.5rem;
  line-height: 1.5;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.chatbox-bubble::before {
  content: '';
  position: absolute;
  left: -10px;
  top: 25px;
  border-width: 10px;
  border-style: solid;
  border-color: transparent rgba(255, 255, 255, 0.15) transparent transparent;
}

.chatbox-char {
  display: inline;
}

.chatbox-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>

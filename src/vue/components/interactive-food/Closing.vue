<template>
  <div class="closing-wrapper">
    <div class="closing-container">
      <p class="closing-text">{{ text }}</p>
      <p class="closing-text">{{ secondText }}</p>
      <button 
        v-if="showButton" 
        id="replay" 
        class="replay-btn"
        ref="replayBtn"
        @click="handleReplay"
      >
        <span class="last-smile">✨</span>
        重新开始
      </button>
    </div>
  </div>
</template>

<script>
import gsap from 'gsap';

export default {
  name: 'Closing',
  props: {
    text: { type: String, default: '感谢你的观看，愿你代码无Bug，梦想成真！' },
    secondText: { type: String, default: '点击下方按钮，重新开始这段旅程' },
    showButton: { type: Boolean, default: true }
  },
  mounted() {
    this.$nextTick(() => {
      this.playAnimation();
    });
  },
  methods: {
    playAnimation() {
      const tl = gsap.timeline();
      const textElements = this.$el.querySelectorAll('.closing-text');
      const replayBtn = this.$refs.replayBtn;
      
      tl.set(replayBtn, {
        pointerEvents: 'none'
      })
      .from(textElements, {
        duration: 1,
        opacity: 0,
        y: 30,
        stagger: 0.8,
        ease: 'power3.out'
      });
      
      if (this.showButton) {
        tl.from(replayBtn, {
          duration: 0.8,
          opacity: 0,
          scale: 0.5,
          y: 30,
          ease: 'back.out'
        })
        .set(replayBtn, {
          pointerEvents: 'auto'
        })
        .to('.last-smile', {
          duration: 0.5,
          rotation: 360,
          repeat: -1,
          ease: 'none'
        }, '+=0.5');
      }
    },
    handleReplay() {
      this.$emit('replay');
    }
  }
};
</script>

<style scoped>
.closing-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.closing-container {
  text-align: center;
}

.closing-text {
  font-size: 1.8rem;
  color: #ffffff;
  margin: 15px 0;
  font-weight: 500;
}

.replay-btn {
  margin-top: 30px;
  padding: 15px 40px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #f472b6 0%, #60a5fa 100%);
  border: none;
  border-radius: 50px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(244, 114, 182, 0.4);
  transition: transform 0.3s, box-shadow 0.3s;
}

.replay-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(244, 114, 182, 0.6);
}

.replay-btn:active {
  transform: translateY(0);
}

.last-smile {
  display: inline-block;
  margin-right: 10px;
  font-size: 1.5rem;
}
</style>

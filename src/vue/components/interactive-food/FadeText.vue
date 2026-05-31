<template>
  <div class="fade-text-wrapper">
    <p class="fade-text-content" :class="{ visible: isVisible }">{{ text }}</p>
  </div>
</template>

<script>
export default {
  name: 'FadeText',
  props: {
    text: { type: String, default: '' }
  },
  data() {
    return {
      isVisible: false
    };
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => { this.isVisible = true; }, 50);
    });
  },
  watch: {
    text() {
      this.isVisible = false;
      this.$nextTick(() => {
        setTimeout(() => { this.isVisible = true; }, 100);
      });
    }
  }
};
</script>

<style scoped>
@font-face {
  font-family: "思源黑体 Bold";
  font-weight: 700;
  src: url("//at.alicdn.com/wf/webfont/GeeIQMoZJeZu/5LQe2M509uck.woff2") format("woff2"),
       url("//at.alicdn.com/wf/webfont/GeeIQMoZJeZu/oH5tekCKoicb.woff") format("woff");
  font-display: swap;
}

.fade-text-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 40px;
}

.fade-text-content {
  font-family: "思源黑体 Bold", "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 40px;
  color: #54d1fe;
  line-height: 1.9;
  letter-spacing: 2px;
  margin: 0;
  text-align: center;
  max-width: 760px;
  opacity: 0;
  transition: opacity 0.8s ease-out;
  text-shadow: 0 0 20px rgba(120, 200, 255, 0.5), 0 0 40px rgba(100, 180, 255, 0.25);
}

.fade-text-content.visible {
  opacity: 1;
}
</style>
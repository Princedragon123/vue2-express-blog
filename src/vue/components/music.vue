<template>
  <div class="music">
    <div class="musicball">
      <i></i>
      <img src="" alt="专辑图片" />
    </div>
    <div class="music-info">
      <!-- 歌词/歌名跑马灯容器 -->
      <div class="musicName">
        <!-- 滚动包裹层（双文本实现无缝） -->
        <div class="scroll-wrapper" :class="{ 'animate-scroll': shouldScroll }">
          <span class="lyric-text">{{ currentLyric }}</span>
          <span class="lyric-text">{{ currentLyric }}</span>
        </div>
      </div>
      <div class="musicController">
        <img src="" alt="上一首" />
        <img src="" alt="暂停" />
        <img src="" alt="下一首" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MusicPlayer',
  data() {
    return {
      currentLyric: '这是一首很长很长很长很长的歌的名字，需要循环滚动展示歌词'
    }
  },
  computed: {
    shouldScroll() {
      // 简单的判断逻辑，你也可以用 $refs 精确计算文本和容器宽度
      return this.currentLyric.length > 10; // 长度超过10个字符就滚动
    }
  }
}
</script>

<style scoped>
/* 音乐播放器整体容器 */
.music {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 20px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.9), rgba(255, 105, 180, 0.9));
  padding: 15px 30px;
  border-radius: 50px;
  box-shadow: 0 8px 25px rgba(255, 105, 180, 0.3);
  z-index: 999;
}

/* 专辑封面球 */
.musicball {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #fff;
  overflow: hidden;
  flex-shrink: 0;
}

.music-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 跑马灯核心样式 */
.musicName {
  width: 250px; /* 设定固定宽度作为视口 */
  overflow: hidden;
  white-space: nowrap;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

/* 滚动包裹层 */
.scroll-wrapper {
  display: inline-flex;
  gap: 50px; /* 两个文本之间的间距 */
}

/* 滚动动画（只有加了 animate-scroll 类才会播放） */
.animate-scroll {
  animation: lyricScroll 15s linear infinite;
}

/* 歌词文本 */
.lyric-text {
  flex-shrink: 0;
}

/* 滚动关键帧 */
@keyframes lyricScroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%); /* 移动一半，因为有两个文本 */
  }
}

.musicController {
  display: flex;
  gap: 20px;
  justify-content: center;
}
</style>

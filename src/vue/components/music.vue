<template>
  <div
    class="music-float-player"
    :class="{
      'is-open': isModalOpen,
      'is-sticking': isSticking && !isDragging && !isHovering,
    }"
    :style="{
      left: finalLeft + 'px',
      top: finalTop + 'px',
      width: isModalOpen ? modalWidth + 'px' : '60px',
      height: isModalOpen ? modalHeight + 'px' : '60px',
      borderRadius: isModalOpen ? '20px' : '50%',
    }"
    @dblclick.stop="openModal"
    @mousedown="onDragStart"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <img
      class="bg-cover"
      :src="currentSong.cover"
      alt="封面"
      draggable="false"
    />

    <!-- 小球悬浮状态 -->
    <div class="ball-normal" v-if="!isModalOpen">
      <div class="rotate-wrap" :class="{ playing: isPlaying }">
        <img
          :src="currentSong.cover"
          class="mini-cover"
          alt=""
          draggable="false"
        />
      </div>
    </div>

    <!-- 展开播放器面板 -->
    <div class="modal-content" v-if="isModalOpen">
      <button class="close-btn" @click.stop="closeModal">
        <svg-icon name="close" :size="18"></svg-icon>
      </button>
      <div class="song-info">
        <h3>{{ currentSong.name }}</h3>
        <p>{{ currentSong.artist }}</p>
      </div>
      <div class="lyric-box">
        <div class="lyric-scroll" ref="lyricScroll" @scroll="onLyricScroll">
          <!-- 歌词点击跳转事件 -->
          <p
            v-for="(line, index) in displayLyrics"
            :key="index"
            :class="{ active: line.isActive }"
            :data-index="index"
            @click.stop="onLyricClick(index)"
            :style="{ cursor: 'pointer' }"
          >
            {{ line.text }}
          </p>
          <p v-if="parsedLyrics.length === 0" class="no-lyric">暂无歌词</p>
        </div>
      </div>
      <!-- 时间显示 + 进度条 -->
      <div class="progress-container">
        <span class="time current-time">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar" @click.stop="onProgressClick">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          ></div>
        </div>
        <span class="time total-time">{{ formatTime(duration) }}</span>
      </div>
      <div class="control-group">
        <button @click.stop="togglePlayMode">
          <svg-icon :name="playModeIcon" :size="20"></svg-icon>
        </button>
        <button @click.stop="playPrev">
          <svg-icon name="skipBack" :size="20"></svg-icon>
        </button>
        <button @click.stop="togglePlay">
          <svg-icon :name="isPlaying ? 'pause' : 'play'" :size="24"></svg-icon>
        </button>
        <button @click.stop="playNext">
          <svg-icon name="skipForward" :size="20"></svg-icon>
        </button>

        <!-- 歌曲目录按钮 + 面板 -->
        <div class="volume-control">
          <button @click.stop="toggleSongListPanel">
            <svg-icon name="list" :size="20"></svg-icon>
          </button>

          <div class="song-list-panel" v-show="showSongListPanel" @click.stop>
            <div class="song-list-scroll">
              <div
                v-for="(song, idx) in songList"
                :key="idx"
                class="song-item"
                :class="{ active: idx === currentSongIndex }"
                @click="switchToSong(idx)"
              >
                {{ song.name }}
              </div>
            </div>
          </div>
        </div>

        <!-- 音量区域 外层按钮只弹出面板 -->
        <div class="volume-control">
          <button @click.stop="toggleVolumePanel">
            <svg-icon name="volumeUp" :size="20"></svg-icon>
          </button>
          <!-- 垂直音量面板 -->
          <div class="volume-panel" v-show="showVolumePanel" @click.stop>
            <button class="volume-mute-btn" @click.stop="toggleMute">
              <svg-icon
                :name="isMuted ? 'volumeMute' : 'volumeUp'"
                :size="20"
              ></svg-icon>
            </button>
            <div class="volume-slider">
              <input
                ref="volumeSlider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                :value="currentVolume"
                @input="onVolumeChange"
                orient="vertical"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <audio
      ref="audioPlayer"
      :src="currentSong.audioPath"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onAudioLoaded"
      @ended="onAudioEnded"
      @error="onAudioError"
      @canplay="onAudioCanPlay"
    />
  </div>
</template>

<script>
// 歌曲本地路径配置
const songConfig = [
  {
    name: "不为谁而作的歌",
    artist: "林俊杰",
    cover: "https://picsum.photos/seed/music1/300/300",
    audioPath: "/static/uploads/music/不为谁而作的歌.flac",
    lyricPath: "/static/uploads/musicLyrics/不为谁而作的歌.lrc",
  },
  {
    name: "裹着心的光",
    artist: "林俊杰",
    cover: "https://picsum.photos/seed/music2/300/300",
    audioPath: "/static/uploads/music/裹着心的光.flac",
    lyricPath: "/static/uploads/musicLyrics/裹着心的光.lrc",
  },
  {
    name: "黑夜问白天",
    artist: "林俊杰",
    cover: "https://picsum.photos/seed/music3/300/300",
    audioPath: "/static/uploads/music/黑夜问白天.flac",
    lyricPath: "/static/uploads/musicLyrics/黑夜问白天.lrc",
  },
  {
    name: "将故事写成我们",
    artist: "林俊杰",
    cover: "https://picsum.photos/seed/music4/300/300",
    audioPath: "/static/uploads/music/将故事写成我们.flac",
    lyricPath: "/static/uploads/musicLyrics/将故事写成我们.lrc",
  },
  {
    name: "一定会",
    artist: "林俊杰",
    cover: "https://picsum.photos/seed/music5/300/300",
    audioPath: "/static/uploads/music/一定会.flac",
    lyricPath: "/static/uploads/musicLyrics/一定会.lrc",
  },
];

export default {
  name: "MusicFloatPlayer",
  data() {
    return {
      modalWidth: 960,
      modalHeight: 720,
      ballX: window.innerWidth - 250,
      ballY: window.innerHeight - 150,
      isModalOpen: false,
      isDragging: false,
      dragOffsetX: 0,
      dragOffsetY: 0,

      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playMode: 0,

      songList: songConfig.map((song) => ({ ...song, lyric: "" })),
      currentSongIndex: 0,
      parsedLyrics: [],
      currentLyricIndex: -1,

      autoStickTimer: null,
      stickDelay: 5000,
      isSticking: false,
      isHovering: false,

      currentVolume: 0.7,
      lastVolume: 0.7,
      isMuted: false,
      showVolumePanel: false,

      lyricScrollTimer: null,
      isManualScrolling: false,
      lyricResumeDelay: 1500,

      shouldAutoPlay: false,
      userInteracted: false,

      // 歌曲目录面板
      showSongListPanel: false,
    };
  },
  computed: {
    currentSong() {
      return this.songList[this.currentSongIndex];
    },
    progressPercent() {
      return this.duration ? (this.currentTime / this.duration) * 100 : 0;
    },
    playModeIcon() {
      return ["repeat", "repeatOne", "shuffle"][this.playMode];
    },
    finalLeft() {
      return this.isModalOpen
        ? (window.innerWidth - this.modalWidth) / 2
        : this.ballX;
    },
    finalTop() {
      return this.isModalOpen
        ? (window.innerHeight - this.modalHeight) / 2
        : this.ballY;
    },
    displayLyrics() {
      return this.parsedLyrics.map((line, index) => ({
        text: line.text,
        time: line.time,
        isActive: index === this.currentLyricIndex,
      }));
    },
  },
  mounted() {
    window.addEventListener("resize", this.handleWindowResize);
    this.resetAutoStickTimer();
    this.$nextTick(() => {
      this.$refs.audioPlayer.volume = this.currentVolume;
    });
    document.addEventListener("click", this.closeAllPanels);
    document.addEventListener("click", this.markUserInteraction);
    document.addEventListener("keydown", this.markUserInteraction);
    document.addEventListener("touchstart", this.markUserInteraction);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.handleWindowResize);
    this.clearAutoStickTimer();
    this.clearLyricScrollTimer();
    document.removeEventListener("click", this.closeAllPanels);
    document.removeEventListener("click", this.markUserInteraction);
    document.removeEventListener("keydown", this.markUserInteraction);
    document.removeEventListener("touchstart", this.markUserInteraction);
  },
  methods: {
    // 标记用户已产生交互（点击/按键/触摸），用于绕过浏览器自动播放限制
    markUserInteraction() {
      if (!this.userInteracted) {
        this.userInteracted = true;
        if (this.shouldAutoPlay) this.tryPlay();
      }
    },
    // 尝试播放音频，处理浏览器自动播放策略限制
    tryPlay() {
      if (!this.$refs.audioPlayer) return;
      if (this.userInteracted || this.isMuted) {
        this.$refs.audioPlayer
          .play()
          .then(() => {
            this.isPlaying = true;
            this.shouldAutoPlay = false;
          })
          .catch((err) => {
            this.shouldAutoPlay = true;
            this.isPlaying = false;
          });
      } else {
        this.shouldAutoPlay = true;
        this.isPlaying = false;
      }
    },
    // 清除自动贴边定时器
    clearAutoStickTimer() {
      if (this.autoStickTimer) clearTimeout(this.autoStickTimer);
      this.autoStickTimer = null;
    },
    // 重置自动贴边定时器（鼠标离开后5秒自动贴边）
    resetAutoStickTimer() {
      if (this.isModalOpen) return;
      this.clearAutoStickTimer();
      this.isSticking = false;
      this.autoStickTimer = setTimeout(
        () => this.autoStickToEdge(),
        this.stickDelay,
      );
    },
    // 自动贴边到屏幕左侧或右侧
    autoStickToEdge() {
      const size = 60;
      const centerX = this.ballX + size / 2;
      this.ballX =
        centerX < window.innerWidth / 2 ? 0 : window.innerWidth - size;
      this.isSticking = true;
    },
    // 鼠标进入悬浮球，暂停贴边计时
    onMouseEnter() {
      this.isHovering = true;
      this.resetAutoStickTimer();
    },
    // 鼠标离开悬浮球，重新启动贴边计时
    onMouseLeave() {
      this.isHovering = false;
      this.resetAutoStickTimer();
    },
    // 双击打开播放器模态框
    openModal() {
      this.isModalOpen = true;
      this.loadLyric(this.currentSongIndex);
      this.clearAutoStickTimer();
      this.isSticking = false;
    },
    // 异步加载歌词文件并解析
    async loadLyric(idx) {
      const song = this.songList[idx];
      if (song.lyric) return this.parseLyrics(song.lyric);
      try {
        const res = await fetch(song.lyricPath);
        if (res.ok) {
          const txt = await res.text();
          this.songList[idx].lyric = txt;
          this.parseLyrics(txt);
        }
      } catch (e) {
        this.parsedLyrics = [];
      }
    },
    // 关闭播放器模态框
    closeModal() {
      this.isModalOpen = false;
      this.resetAutoStickTimer();
      this.closeAllPanels();
    },
    // 开始拖拽悬浮球
    onDragStart(e) {
      if (this.isModalOpen) return;
      this.isDragging = true;
      this.dragOffsetX = e.clientX - this.ballX;
      this.dragOffsetY = e.clientY - this.ballY;
      this.clearAutoStickTimer();
      this.isSticking = false;
      const size = 60;
      document.onmousemove = (e) => {
        let x = e.clientX - this.dragOffsetX;
        let y = e.clientY - this.dragOffsetY;
        x = Math.max(0, Math.min(x, window.innerWidth - size));
        y = Math.max(0, Math.min(y, window.innerHeight - size));
        this.ballX = x;
        this.ballY = y;
      };
      document.onmouseup = () => {
        this.isDragging = false;
        this.resetAutoStickTimer();
        document.onmousemove = null;
        document.onmouseup = null;
      };
    },
    // 窗口大小变化时，限制悬浮球位置不超出屏幕
    handleWindowResize() {
      const s = 60;
      this.ballX = Math.max(0, Math.min(this.ballX, window.innerWidth - s));
      this.ballY = Math.max(0, Math.min(this.ballY, window.innerHeight - s));
      this.resetAutoStickTimer();
    },
    // 切换播放/暂停状态
    togglePlay() {
      const audio = this.$refs.audioPlayer;
      if (this.isPlaying) {
        audio.pause();
        this.isPlaying = false;
      } else {
        this.tryPlay();
      }
      this.resetAutoStickTimer();
    },
    // 切换播放模式：顺序播放 → 单曲循环 → 随机播放
    togglePlayMode() {
      this.playMode = (this.playMode + 1) % 3;
      this.resetAutoStickTimer();
    },
    // 播放下一首（根据播放模式决定下一首）
    playNext() {
      const wasPlaying = this.isPlaying;
      if (this.playMode === 2) {
        // 随机播放：绝不随机到当前正在播放的
        let randomIdx;
        do {
          randomIdx = Math.floor(Math.random() * this.songList.length);
        } while (
          randomIdx === this.currentSongIndex &&
          this.songList.length > 1
        );
        this.currentSongIndex = randomIdx;
      } else {
        this.currentSongIndex =
          (this.currentSongIndex + 1) % this.songList.length;
      }
      this.resetPlayback(wasPlaying);
      this.resetAutoStickTimer();
    },
    // 格式化时间为 mm:ss 格式
    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return "00:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    },
    // 播放上一首
    playPrev() {
      const wasPlaying = this.isPlaying;
      this.currentSongIndex =
        (this.currentSongIndex - 1 + this.songList.length) %
        this.songList.length;
      this.resetPlayback(wasPlaying);
      this.resetAutoStickTimer();
    },
    // 重置播放状态，加载新歌曲
    resetPlayback(autoPlay = false) {
      this.currentTime = this.duration = 0;
      this.currentLyricIndex = -1;
      this.parsedLyrics = [];
      this.loadLyric(this.currentSongIndex);
      this.$nextTick(() => {
        const a = this.$refs.audioPlayer;
        a.load();
        a.volume = this.isMuted ? 0 : this.currentVolume;
        if (autoPlay) this.tryPlay();
        else this.isPlaying = false;
      });
    },
    // 音频播放时间更新，同步歌词高亮
    onTimeUpdate() {
      this.currentTime = this.$refs.audioPlayer.currentTime;
      if (!this.isManualScrolling) this.updateLyric();
    },
    // 音频元数据加载完成，获取总时长
    onAudioLoaded() {
      this.duration = this.$refs.audioPlayer.duration;
    },
    // 音频可以播放时，尝试自动播放
    onAudioCanPlay() {
      if (this.shouldAutoPlay) this.tryPlay();
    },
    // 音频加载错误处理
    onAudioError(e) {
      console.error("音频加载失败", e, this.currentSong.audioPath);
      this.isPlaying = false;
    },
    // 音频播放结束，根据播放模式决定下一首或循环
    onAudioEnded() {
      if (this.playMode === 1) {
        this.$refs.audioPlayer.currentTime = 0;
        this.tryPlay();
      } else {
        this.playNext();
      }
    },
    // 解析LRC格式歌词文本
    parseLyrics(str) {
      const lines = str.split("\n");
      this.parsedLyrics = [];
      lines.forEach((line) => {
        const reg = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
        const res = line.match(reg);
        if (!res) return;
        const t =
          parseInt(res[1]) * 60 + parseInt(res[2]) + parseInt(res[3]) / 1000;
        const text = res[4].trim();
        text && this.parsedLyrics.push({ time: t, text });
      });
      // 按时间升序排序歌词
      this.parsedLyrics.sort((a, b) => a.time - b.time);
      this.$nextTick(
        () => this.$refs.lyricScroll && (this.$refs.lyricScroll.scrollTop = 0),
      );
    },
    // 根据当前播放时间更新高亮歌词行
    updateLyric(forceUpdate = false) {
      let idx = -1;
      const now = this.currentTime;
      // 遍历所有歌词，找到最后一个时间≤当前时间的歌词
      for (let i = 0; i < this.parsedLyrics.length; i++) {
        if (this.parsedLyrics[i].time <= now) {
          idx = i;
        }
      }
      if ((idx !== this.currentLyricIndex && idx !== -1) || forceUpdate) {
        this.currentLyricIndex = idx;
        !this.isManualScrolling && this.scrollToLyric(idx);
      }
    },
    // 滚动歌词容器，使当前歌词行居中显示
    scrollToLyric(idx) {
      this.$nextTick(() => {
        const box = this.$refs.lyricScroll;
        if (!box) return;
        const els = box.querySelectorAll("[data-index]");
        if (!els[idx]) return;
        const top =
          els[idx].offsetTop - box.clientHeight / 2 + els[idx].clientHeight / 2;
        box.scrollTo({ top, behavior: "smooth" });
      });
    },
    // 用户手动滚动歌词，暂停自动同步
    onLyricScroll() {
      this.isManualScrolling = true;
      this.clearLyricScrollTimer();
      this.lyricScrollTimer = setTimeout(() => {
        this.isManualScrolling = false;
        this.scrollToLyric(this.currentLyricIndex);
      }, this.lyricResumeDelay);
    },
    // 清除歌词滚动定时器
    clearLyricScrollTimer() {
      if (this.lyricScrollTimer) clearTimeout(this.lyricScrollTimer);
      this.lyricScrollTimer = null;
    },
    // 点击歌词行，跳转到对应播放时间
    onLyricClick(index) {
      if (index >= 0 && index < this.parsedLyrics.length) {
        const targetTime = this.parsedLyrics[index].time;
        this.$refs.audioPlayer.currentTime = targetTime;
        this.currentTime = targetTime;

        // 强制重新计算当前正确的歌词索引
        this.updateLyric(true);
        // 立即清除手动滚动状态，恢复自动同步
        this.clearLyricScrollTimer();
        this.isManualScrolling = false;
        this.scrollToLyric(this.currentLyricIndex);

        this.resetAutoStickTimer();
      }
    },
    // 点击进度条，跳转到对应播放时间
    onProgressClick(e) {
      const bar = e.currentTarget;
      const rect = bar.getBoundingClientRect();
      const p = (e.clientX - rect.left) / rect.width;
      const targetTime = p * this.duration;
      this.$refs.audioPlayer.currentTime = targetTime;
      this.currentTime = targetTime;

      // 强制重新计算歌词索引
      this.updateLyric(true);
      // 立即清除手动滚动状态
      this.clearLyricScrollTimer();
      this.isManualScrolling = false;
      this.scrollToLyric(this.currentLyricIndex);

      this.resetAutoStickTimer();
    },

    // 切换音量面板显示/隐藏
    toggleVolumePanel() {
      this.showVolumePanel = !this.showVolumePanel;
      this.showSongListPanel = false;
    },

    // 切换歌曲目录面板显示/隐藏
    toggleSongListPanel() {
      this.showSongListPanel = !this.showSongListPanel;
      this.showVolumePanel = false;
    },
    // 切换到指定歌曲
    switchToSong(idx) {
      const wasPlaying = this.isPlaying;
      this.currentSongIndex = idx;
      this.resetPlayback(wasPlaying);
      this.showSongListPanel = false;
    },
    // 关闭所有弹出面板（音量、歌曲列表）
    closeAllPanels() {
      this.showVolumePanel = false;
      this.showSongListPanel = false;
    },

    // 切换静音/恢复音量
    toggleMute() {
      this.isMuted = !this.isMuted;
      const audio = this.$refs.audioPlayer;
      const slider = this.$refs.volumeSlider;
      if (this.isMuted) {
        this.lastVolume = this.currentVolume;
        audio.volume = 0;
        this.currentVolume = 0;
        slider.value = 0;
      } else {
        this.currentVolume = this.lastVolume;
        audio.volume = this.lastVolume;
        slider.value = this.lastVolume;
      }
      if (this.shouldAutoPlay) this.tryPlay();
    },
    // 音量滑块变化，实时更新音量
    onVolumeChange(e) {
      const val = parseFloat(e.target.value);
      this.currentVolume = val;
      this.$refs.audioPlayer.volume = val;
      this.isMuted = val <= 0;
      if (this.isMuted) this.lastVolume = 0;
    },
  },
};
</script>

<style scoped>
.music-float-player {
  position: fixed;
  z-index: 99999;
  overflow: hidden;
  cursor: move;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.music-float-player.is-open {
  cursor: default !important;
}
.music-float-player.is-sticking {
  opacity: 0.5;
}
.music-float-player.is-sticking:hover {
  opacity: 1;
}
.music-float-player.is-sticking[style*="left: 0px"] {
  transform: translateX(-40px);
}
.music-float-player.is-sticking[style*="left: calc(100% - 60px)"] {
  transform: translateX(40px);
}
.music-float-player.is-sticking:hover {
  transform: translateX(0) !important;
  opacity: 1;
}

.bg-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s;
  filter: blur(20px) brightness(0.6);
}
.music-float-player.is-open .bg-cover {
  opacity: 1;
}

.ball-normal {
  width: 100%;
  height: 100%;
}
.rotate-wrap {
  width: 100%;
  height: 100%;
  animation: rotate 8s linear infinite paused;
}
.rotate-wrap.playing {
  animation-play-state: running;
}
.mini-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

.modal-content {
  position: relative;
  z-index: 2;
  padding: 30px;
  height: 100%;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
.song-info {
  text-align: center;
}
.song-info h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
}
.song-info p {
  margin: 0;
  opacity: 0.7;
}
.lyric-box {
  flex: 1;
  overflow: hidden;
  margin: 20px 0;
}
.lyric-scroll {
  height: 100%;
  overflow-y: auto;
  text-align: center;
  scrollbar-width: none;
  padding: 20px 0;
}
.lyric-scroll::-webkit-scrollbar {
  display: none;
}
.lyric-scroll p {
  padding: 12px 0;
  font-size: 16px;
  opacity: 0.5;
  transition: all 0.3s ease;
  cursor: pointer;
}
.lyric-scroll p.active {
  opacity: 1;
  font-size: 20px;
  font-weight: bold;
  color: #31c27c;
  transform: scale(1.05);
}
.lyric-scroll p:hover {
  opacity: 0.8;
  transform: scale(1.02);
}
.no-lyric {
  text-align: center;
  opacity: 0.5;
  padding-top: 50px;
}
/* 进度条容器（包含时间显示） */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.time {
  font-size: 12px;
  opacity: 0.7;
  color: #fff;
  min-width: 45px;
  user-select: none;
}

.current-time {
  text-align: right;
}

.total-time {
  text-align: left;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #31c27c;
  border-radius: 2px;
  transition: width 0.1s linear;
}
.progress-fill {
  height: 100%;
  background: #31c27c;
  border-radius: 2px;
  transition: width 0.1s linear;
}
.control-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}
.control-group button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.control-group button:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}

/* 音量面板 */
.volume-control {
  position: relative;
}
.volume-panel {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  padding: 15px 10px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.volume-mute-btn {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}
.volume-mute-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.volume-slider {
  height: 100px;
  display: flex;
  align-items: center;
}
.volume-slider input[type="range"] {
  width: 100px;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
  transform: rotate(-90deg);
}
.volume-slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #31c27c;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* ==================== 歌曲目录面板样式 ==================== */
.song-list-panel {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  width: 180px;
  max-height: 168px; /* 显示4首，刚好4首 */
  background: rgba(0, 0, 0, 0.85);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}
.song-list-scroll {
  max-height: 168px;
  overflow-y: auto;
  padding: 6px 0;
  scrollbar-width: none;
}
.song-list-scroll::-webkit-scrollbar {
  display: none;
}
.song-item {
  padding: 10px 14px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.song-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
.song-item.active {
  background: #31c27c;
  color: #fff;
  font-weight: bold;
}
</style>

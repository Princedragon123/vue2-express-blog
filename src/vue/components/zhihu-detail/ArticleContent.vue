<template>
  <div class="article-content">
    <div v-if="videoUrl" class="video-container">
      <video controls class="article-video">
        <source :src="processedVideoUrl" type="video/mp4">
        您的浏览器不支持视频播放。
      </video>
    </div>

    <div v-html="processedContent"></div>
  </div>
</template>

<script>
export default {
  name: 'ArticleContent',
  props: {
    articleType: {
      type: String,
      default: ''
    },
    mediaFiles: {
      type: Array,
      default: () => []
    },
    videoUrl: {
      type: String,
      default: ''
    },
    shortContent: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    }
  },
  computed: {
    processedContent() {
      const rawContent = this.shortContent || this.content;
      return this.processContentImages(rawContent);
    },
    processedVideoUrl() {
      return this.processVideoUrl(this.videoUrl);
    }
  },
  methods: {
    processContentImages(content) {
      if (!content) return '';

      let processedContent = content;

      processedContent = processedContent.replace(/<img\s+src="([^"]+)"\s*(?:style="[^"]*")?/g, (match, src) => {
        let newSrc = src;
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/static/')) {
          newSrc = `/static/uploads/${src.replace(/^\/+|^\/*/, '')}`;
        }
        return `<img src="${newSrc}" style="max-width: 100%; height: auto; display: block; margin: 16px 0;"`;
      });

      processedContent = processedContent.replace(/<video\s+.*?src="([^"]+)"\s*(?:style="[^"]*")?/g, (match, src) => {
        let newSrc = src;
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/static/')) {
          newSrc = `/static/uploads/${src.replace(/^\/+|^\/*/, '')}`;
        }
        return `<video controls style="max-width: 100%; height: auto; display: block; margin: 16px 0;"><source src="${newSrc}" type="video/mp4">您的浏览器不支持视频播放。</video>`;
      });

      processedContent = processedContent.replace(/\(\/static\/uploads\/[^)]+\)/g, '');

      return processedContent;
    },

    processVideoUrl(videoUrl) {
      if (!videoUrl) return '';

      if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('/static/')) {
        return `/static/uploads/${videoUrl.replace(/^\/+|^\/*/, '')}`;
      }

      return videoUrl;
    }
  }
};
</script>

<style scoped>
.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 24px;
  max-width: 100%;
  width: 100%;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
}

.article-content :deep(img) {
  max-width: 100% !important;
  width: 100% !important;
  height: auto !important;
  display: block !important;
  margin: 16px 0 !important;
  border-radius: 8px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
}

.video-container {
  margin: 16px 0;
  width: 100%;
}

.article-video {
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
}

.article-content :deep(p) {
  margin-bottom: 16px;
}

.article-content :deep(h2) {
  font-size: 20px;
  font-weight: 600;
  margin: 24px 0 16px;
  color: #333;
}

.article-content :deep(h3) {
  font-size: 18px;
  font-weight: 600;
  margin: 20px 0 12px;
  color: #333;
}

.article-content :deep(ul),
.article-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.article-content :deep(li) {
  margin-bottom: 8px;
}
</style>

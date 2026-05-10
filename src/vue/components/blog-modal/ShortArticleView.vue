<template>
  <div class="modal-content short-article-content">
    <div class="short-article-media">
      <MediaCarousel 
        :mediaList="processedMediaFiles"
        :autoplay="true"
        :autoplay-interval="5000"
        :loop="true"
      />
    </div>

    <div class="short-article-info">
      <AuthorInfo
        :author="blog?.author"
        :current-user-id="currentUserId"
        :is-following="isFollowing"
        :post-date="blog?.date"
        @open-profile="$emit('open-profile', $event)"
        @toggle-follow="$emit('toggle-follow')"
      />

      <h2 class="article-title">{{ blog?.title }}</h2>

      <div class="article-body">
        <p v-if="!blog?.shortContent">这是一篇精彩的短文章内容，展示了作者的独特见解和经验分享。</p>
        <div v-else>{{ blog.shortContent }}</div>
      </div>

      <div class="location-info" v-if="blog?.location">
        <span class="nav-icon">📍</span>
        <span>{{ blog.location }}</span>
      </div>

      <div class="article-tags">
        <span v-for="(tag, index) in blog?.hashtags" :key="index" class="article-tag" @click="$emit('filter-by-tag', tag)">
          #{{ tag }}
        </span>
      </div>

      <InteractionSection 
        :likes="blog?.likes || 0"
        :comments="blog?.comments || 0"
        :bookmarks="blog?.bookmarks || 0"
        :is-liked="blog?.isLiked || false"
        :is-bookmarked="isBookmarked || false"
        :blog-id="blogId"
        @like="$emit('like', $event)"
        @bookmark="$emit('bookmark', $event)"
        @open-share="$emit('open-share')"
      />

      <CommentSection 
        :is-zhihu-style="false"
        :comments="comments"
        :is-loading-comments="isLoadingComments"
        :comment-error="commentError"
        :user="user"
        :comment-text="commentText"
        :article-author-id="blog?.author?._id"
        @update:commentText="$emit('update:commentText', $event)"
        @submit-comment="$emit('submit-comment', $event)"
        @submit-reply="$emit('submit-reply', $event)"
        @delete-comment="$emit('delete-comment', $event)"
      />
    </div>
  </div>
</template>

<script>
import AuthorInfo from './AuthorInfo.vue';
import MediaCarousel from '../MediaCarousel.vue';
import InteractionSection from '../InteractionSection.vue';
import CommentSection from '../CommentSection.vue';

export default {
  name: 'ShortArticleView',
  components: {
    AuthorInfo,
    MediaCarousel,
    InteractionSection,
    CommentSection
  },
  props: {
    blog: {
      type: Object,
      default: null
    },
    blogId: {
      type: String,
      default: ''
    },
    currentUserId: {
      type: String,
      default: ''
    },
    isFollowing: {
      type: Boolean,
      default: false
    },
    isBookmarked: {
      type: Boolean,
      default: false
    },
    comments: {
      type: Array,
      default: () => []
    },
    isLoadingComments: {
      type: Boolean,
      default: false
    },
    commentError: {
      type: String,
      default: null
    },
    user: {
      type: Object,
      default: null
    },
    commentText: {
      type: String,
      default: ''
    }
  },
  computed: {
    processedMediaFiles() {
      if (!this.blog?.mediaFiles) return [];
      return this.blog.mediaFiles.map(media => {
        let mediaUrl = media.url;
        if (mediaUrl && !mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
          if (!mediaUrl.startsWith('/static/uploads')) {
            mediaUrl = `/static/uploads/${mediaUrl.replace(/^\/+/, '')}`;
          }
        }
        return {
          url: mediaUrl,
          mediaType: media.mediaType || 'image'
        };
      });
    }
  }
};
</script>

<style scoped>
.modal-content.short-article-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 80vh;
  max-height: 800px;
}

.short-article-media {
  height: 100%;
  position: relative;
  overflow: hidden;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  margin-left: 10px;
}

.short-article-info {
  padding: 25px;
  display: flex;
  flex-direction: column;
}

.article-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  line-height: 1.3;
}

.article-body {
  margin-bottom: 24px;
  line-height: 1.7;
  color: #4b5563;
}

.article-body p {
  margin-bottom: 16px;
}

.location-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #6b7280;
  font-size: 14px;
  gap: 6px;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.article-tag {
  background-color: #f3e5f5;
  color: #8e24aa;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
}

.article-tag:hover {
  background-color: #e1bee7;
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .modal-content.short-article-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
    height: 90vh;
    max-height: none;
  }
  .short-article-media {
    height: 40vh;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-bottom-left-radius: 0;
  }
  .short-article-info {
    height: 50vh;
  }
  .article-title {
    font-size: 20px;
  }
}
</style>

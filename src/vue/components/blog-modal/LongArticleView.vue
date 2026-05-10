<template>
  <div class="modal-content long-article-content">
    <div class="long-article-header">
      <AuthorInfo
        :author="blog?.author"
        :current-user-id="currentUserId"
        :is-following="isFollowing"
        :post-date="blog?.date"
        @open-profile="$emit('open-profile', $event)"
        @toggle-follow="$emit('toggle-follow')"
      />
      <h2 class="article-title">{{ blog?.title }}</h2>
      <div class="article-meta">
        <div class="article-tags">
          <span v-for="(tag, index) in blog?.tags" :key="index" class="article-tag" @click="$emit('filter-by-tag', tag)">
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>

    <div class="article-info">
      <div class="article-body zhihu-style">
        <p v-if="!blog?.content">这是一篇精彩的文章内容，展示了作者的独特见解和经验分享。</p>
        <p v-if="!blog?.content">通过图文并茂的方式，为读者呈现了详细的攻略和实用的技巧。</p>
        <p v-if="!blog?.content">感谢您的阅读和支持！</p>
        <div v-else v-html="processedContent"></div>
      </div>

      <div class="article-footer zhihu-footer">
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
          :is-zhihu-style="true"
          :comments="comments"
          :is-loading-comments="isLoadingComments"
          :comment-error="commentError"
          :user="user"
          :comment-text="commentText"
          @submit-comment="$emit('submit-comment', $event)"
          @submit-reply="$emit('submit-reply', $event)"
          @delete-comment="$emit('delete-comment', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import AuthorInfo from './AuthorInfo.vue';
import InteractionSection from '../InteractionSection.vue';
import CommentSection from '../CommentSection.vue';

export default {
  name: 'LongArticleView',
  components: {
    AuthorInfo,
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
    processedContent() {
      if (!this.blog?.content) return '';
      let processedContent = this.blog.content;
      processedContent = processedContent.replace(/<img\s+src="([^"]+)"\s*(?:style="[^"]*")?/g, (match, src) => {
        let newSrc = src;
        if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('/static/')) {
          newSrc = `/static/uploads/${src.replace(/^\/+|^\/*/, '')}`;
        }
        return `<img src="${newSrc}" style="max-width: 100%; height: auto;"`;
      });
      processedContent = processedContent.replace(/\(\/static\/uploads\/[^)]+\)/g, '');
      return processedContent;
    }
  }
};
</script>

<style scoped>
.modal-content.long-article-content {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: none;
  padding: 20px;
  box-sizing: border-box;
  width: 100%;
}

.long-article-header {
  margin-bottom: 30px;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  width: 100%;
  box-sizing: border-box;
}

.long-article-header .article-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 20px 0 16px 0;
  line-height: 1.3;
}

.article-meta {
  margin-bottom: 10px;
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

.article-info {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
  box-sizing: border-box;
}

.article-info::-webkit-scrollbar {
  display: none;
}

.article-body.zhihu-style {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 40px;
}

.article-body.zhihu-style p {
  margin-bottom: 16px;
  text-align: justify;
}

.article-body.zhihu-style h1,
.article-body.zhihu-style h2,
.article-body.zhihu-style h3 {
  margin: 24px 0 16px 0;
  font-weight: 600;
  color: #1a1a1a;
}

.article-body.zhihu-style h1 {
  font-size: 24px;
}

.article-body.zhihu-style h2 {
  font-size: 20px;
}

.article-body.zhihu-style h3 {
  font-size: 18px;
}

.article-body.zhihu-style img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 16px 0;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.article-footer.zhihu-footer {
  margin-top: 40px;
}

@media (max-width: 768px) {
  .modal-content.long-article-content {
    flex-direction: column;
    height: auto;
    max-height: none;
    padding: 15px;
  }
  .long-article-header {
    max-width: 100%;
    padding: 0 10px;
  }
  .long-article-header .article-title {
    font-size: 24px;
  }
  .article-body.zhihu-style {
    font-size: 15px;
    line-height: 1.7;
    padding: 0 10px;
  }
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }
}

@media (max-width: 480px) {
  .modal-content.long-article-content {
    padding: 10px;
  }
  .long-article-header {
    padding: 0 8px;
  }
  .long-article-header .article-title {
    font-size: 20px;
  }
  .article-body.zhihu-style {
    font-size: 14px;
    line-height: 1.6;
    padding: 0 8px;
  }
  .article-body.zhihu-style img {
    max-width: 100%;
    height: auto;
    border-radius: 6px;
    margin: 12px 0;
  }
}
</style>

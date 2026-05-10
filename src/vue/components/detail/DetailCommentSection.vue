<template>
  <div class="comments-section">
    <h3 class="comments-title">评论 ({{ totalComments }})</h3>

    <div class="comment-input-section">
      <img v-lazy="userAvatar" alt="用户头像" class="commenter-avatar">
      <div class="comment-input-wrapper">
        <input type="text" class="comment-input" placeholder="写下你的评论..." :value="commentInput" @input="$emit('update:commentInput', $event.target.value)" @keyup.enter="$emit('submit-comment')">
        <button class="comment-submit-btn" @click="$emit('submit-comment')">发送</button>
      </div>
    </div>

    <div class="comments-list">
      <div v-if="isLoading" class="loading-comments">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载评论中...</span>
      </div>

      <div v-else-if="comments.length === 0" class="no-comments">
        <i class="fas fa-comments"></i>
        <span>暂无评论，快来写下第一条评论吧！</span>
      </div>

      <div v-else class="comment-item" v-for="comment in comments" :key="comment._id">
        <img v-lazy="getCommenterAvatar(comment)" alt="评论者头像" class="commenter-avatar">
        <div class="comment-content">
          <div class="comment-header">
            <span class="commenter-name">{{ comment.author.username }}</span>
            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
          </div>
          <div class="comment-text">{{ comment.content }}</div>
          <div class="comment-actions">
            <button class="comment-action-btn" @click="$emit('toggle-reply', comment._id)">
              <i class="fas fa-reply"></i>
              <span>回复</span>
            </button>
          </div>

          <div v-if="replyingTo === comment._id" class="reply-input-section">
            <div class="reply-input-wrapper">
              <input type="text" class="reply-input" placeholder="写下你的回复..." :value="replyInput" @input="$emit('update:replyInput', $event.target.value)" @keyup.enter="$emit('submit-reply', comment._id)">
              <button class="reply-submit-btn" @click="$emit('submit-reply', comment._id)">发送</button>
              <button class="reply-cancel-btn" @click="$emit('cancel-reply')">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getAuthorAvatar } from '../../utils/avatarUtils';

export default {
  name: 'DetailCommentSection',
  props: {
    comments: {
      type: Array,
      default: () => []
    },
    totalComments: {
      type: Number,
      default: 0
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    commentInput: {
      type: String,
      default: ''
    },
    replyInput: {
      type: String,
      default: ''
    },
    replyingTo: {
      type: String,
      default: ''
    },
    userAvatar: {
      type: String,
      default: ''
    }
  },
  methods: {
    getCommenterAvatar(comment) {
      return getAuthorAvatar(comment.author, 40);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString();
    }
  }
};
</script>

<style scoped>
.comments-section {
  margin-top: 30px;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
}

.comment-input-section {
  display: flex;
  gap: 12px;
  margin-bottom: 25px;
}

.commenter-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  gap: 8px;
}

.comment-input {
  flex: 1;
  padding: 10px 15px;
  border: 2px solid #eee;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.comment-input:focus {
  border-color: var(--primary-color, #667eea);
}

.comment-submit-btn {
  padding: 10px 20px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2));
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.comment-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.loading-comments,
.no-comments {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.loading-comments i,
.no-comments i {
  font-size: 2rem;
  margin-bottom: 10px;
  display: block;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 15px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.commenter-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin-bottom: 8px;
}

.comment-actions {
  display: flex;
  gap: 15px;
}

.comment-action-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
}

.comment-action-btn:hover {
  color: var(--primary-color, #667eea);
}

.reply-input-section {
  margin-top: 10px;
}

.reply-input-wrapper {
  display: flex;
  gap: 8px;
}

.reply-input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #eee;
  border-radius: 15px;
  font-size: 13px;
  outline: none;
}

.reply-input:focus {
  border-color: var(--primary-color, #667eea);
}

.reply-submit-btn {
  padding: 6px 14px;
  border-radius: 15px;
  background: linear-gradient(135deg, var(--primary-color, #667eea), var(--secondary-color, #764ba2));
  color: white;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.reply-cancel-btn {
  padding: 6px 14px;
  border-radius: 15px;
  background: #f0f0f0;
  color: #666;
  border: none;
  font-size: 12px;
  cursor: pointer;
}
</style>

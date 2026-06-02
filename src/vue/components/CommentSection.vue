<!-- ============================================================
CommentSection.vue - 评论组件（学习版）
============================================================

【文件职责】
提供完整的评论功能，包括：
1. 评论列表展示（支持排序）
2. 发表评论
3. 回复评论（支持多级回复）
4. 删除评论（权限控制）
5. 置顶评论（作者专属）
6. 知乎风格支持

【学习重点】
┌─────────────────────────────────────────────────────────────────────────┐
│  1. Props：父组件传递数据，实现组件复用                                  │
│  2. Emits：子组件向父组件发送事件                                        │
│  3. Computed：计算属性，自动排序评论                                     │
│  4. Watch：监听数据变化，同步更新                                        │
│  5. 权限控制：根据用户身份显示不同操作按钮                               │
└─────────────────────────────────────────────────────────────────────────┘

【组件通信流程】
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   父组件（BlogModal.vue / Detail.vue）                                  │
│   ─────────────────────────────────────                                │
│   │                                                                     │
│   │  Props（传递数据）                                                   │
│   │  ├─ comments: 评论列表                                              │
│   │  ├─ user: 当前用户信息                                              │
│   │  ├─ articleAuthorId: 文章作者ID                                     │
│   │  └─ isZhihuStyle: 是否知乎风格                                      │
│   │                                                                     │
│   │  Emits（发送事件）                                                   │
│   │  ├─ submit-comment: 提交评论                                        │
│   │  ├─ submit-reply: 提交回复                                          │
│   │  ├─ delete-comment: 删除评论                                        │
│   │  └─ pin-comment: 置顶评论                                           │
│   │                                                                     │
│   ▼                                                                     │
│   CommentSection.vue                                                    │
│   ─────────────────                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

【权限控制规则】
┌─────────────────────────────────────────────────────────────────────────┐
│  操作          │ 谁可以执行                                             │
│  ─────────────┼──────────────────────────────────────────────────────  │
│  发表评论      │ 所有登录用户                                           │
│  回复评论      │ 所有登录用户                                           │
│  删除评论      │ 评论作者本人 或 管理员                                 │
│  置顶评论      │ 文章作者                                               │
└─────────────────────────────────────────────────────────────────────────┘

【面试常问】
Q1: Props 和 Emits 的区别？
A: Props 是父传子，Emits 是子传父

Q2: 为什么用 computed 而不是 methods 排序？
A: computed 有缓存，性能更好

Q3: v-model 和 :value + @input 的区别？
A: v-model 是语法糖，等价于 :value + @input

Q4: 如何实现多级回复？
A: 递归组件或嵌套数据结构

Q5: 如何防止 XSS 攻击？
A: 使用 v-text 而不是 v-html，或使用 DOMPurify
============================================================ -->
<template>
  <div class="comments-section" :class="{ 'zhihu-comments': isZhihuStyle }">
    <!-- 评论标题和排序选项 -->
    <div class="comments-header">
      <h4 class="comments-title">评论 ({{ comments.length }})</h4>
      <div class="comment-sort-options">
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'time' }"
          @click="sortBy = 'time'; sortComments()"
        >
          按时间排序
        </button>
        <button 
          class="sort-btn" 
          :class="{ active: sortBy === 'hot' }"
          @click="sortBy = 'hot'; sortComments()"
        >
          按热度排序
        </button>
      </div>
    </div>
    
    <!-- 评论列表 -->
    <div class="comment-list">
      <div v-for="comment in sortedComments" :key="comment._id" class="comment-item" :class="{ 'zhihu-comment': isZhihuStyle, 'pinned': comment.isPinned }">
        <!-- 置顶标记 -->
        <div v-if="comment.isPinned" class="pinned-badge">
          <svg-icon name="thumbTack" :size="14"></svg-icon>
          <span>置顶</span>
        </div>
        <!-- 评论作者头像 -->
        <img 
          :src="getCommentAuthorAvatar(comment.author)" 
          :alt="comment.author?.username || '未知用户'" 
          class="comment-author-avatar"
        >
        
        <!-- 评论内容 -->
        <div class="comment-content">
          <!-- 评论头部（作者和时间） -->
          <div class="comment-header">
            <span class="comment-author">{{ comment.author?.username || comment.author?.name || '未知用户' }}</span>
            <span class="comment-date">{{ new Date(comment.createdAt).toLocaleString('zh-CN') }}</span>
          </div>
          
          <!-- 评论正文 -->
          <div class="comment-text">{{ comment.content }}</div>
          
          <!-- 评论操作（回复、删除和置顶） -->
          <div class="comment-actions">
            <button 
              class="reply-btn" 
              :class="{ 'zhihu-reply': isZhihuStyle }" 
              @click="comment.isReplying = !comment.isReplying"
            >
              <svg-icon v-if="!isZhihuStyle" name="reply" :size="14"></svg-icon>
              <span>{{ isZhihuStyle ? '回复' : '回复' }}</span>
            </button>
            <button 
              v-if="(user?.id || user?._id) === (comment.author?.id || comment.author?._id) || user?.role === 'admin'" 
              class="delete-btn" 
              :class="{ 'zhihu-delete': isZhihuStyle }" 
              @click="deleteComment(comment._id)"
            >
              <svg-icon v-if="!isZhihuStyle" name="trash" :size="14"></svg-icon>
              <span>{{ isZhihuStyle ? '删除' : '删除' }}</span>
            </button>
            <button 
              v-if="(user?.id || user?._id) === articleAuthorId" 
              class="pin-btn" 
              :class="{ 'zhihu-pin': isZhihuStyle, 'active': comment.isPinned }" 
              @click="pinComment(comment)"
            >
              <svg-icon name="thumbTack" :size="14"></svg-icon>
              <span>{{ comment.isPinned ? '取消置顶' : '置顶' }}</span>
            </button>
          </div>
          
          <!-- 回复输入框 -->
          <div v-if="comment.isReplying" class="reply-input-section">
            <img v-if="!isZhihuStyle" :src="getCurrentUserAvatar(user)" :alt="user?.username || '用户头像'" class="reply-user-avatar">
            <input 
              type="text" 
              :value="comment.replyText" 
              @input="comment.replyText = $event.target.value" 
              placeholder="写下你的回复..." 
              class="reply-input" 
              @keyup.enter="submitReply(comment)"
            >
            <button 
              class="send-reply-btn" 
              @click="submitReply(comment)" 
              :disabled="!comment.replyText || !comment.replyText.trim()"
            >
              <svg-icon name="paperPlane" :size="16"></svg-icon>
            </button>
            <button class="cancel-reply-btn" @click="comment.isReplying = false">取消</button>
          </div>
          
          <!-- 回复列表 -->
          <div v-if="comment.replies && comment.replies.length > 0" class="replies-list">
            <div v-for="reply in comment.replies" :key="reply._id" class="reply-item">
              <!-- 回复作者头像 -->
              <img 
                :src="getCommentAuthorAvatar(reply.author)" 
                :alt="reply.author?.username || '未知用户'" 
                class="reply-author-avatar"
              >
              
              <!-- 回复内容 -->
              <div class="reply-content">
                <!-- 回复头部（作者和时间） -->
                <div class="reply-header">
                  <span class="reply-author">{{ reply.author?.username || reply.author?.name || '未知用户' }}</span>
                  <span class="reply-date">{{ new Date(reply.createdAt).toLocaleString('zh-CN') }}</span>
                </div>
                
                <!-- 回复正文 -->
                <div class="reply-text">
                  <span v-if="reply.replyTo || reply.replyToUsername" class="reply-to">
                    回复 <span class="reply-to-user">@{{ reply.replyToUsername || '未知用户' }}</span>：
                  </span>
                  {{ reply.content }}
                </div>
                
                <!-- 回复操作（回复和删除） -->
                <div class="reply-actions">
                  <button 
                    class="reply-btn" 
                    :class="{ 'zhihu-reply': isZhihuStyle }" 
                    @click="reply.isReplying = !reply.isReplying"
                  >
                    <svg-icon v-if="!isZhihuStyle" name="reply" :size="14"></svg-icon>
                    <span>{{ isZhihuStyle ? '回复' : '回复' }}</span>
                  </button>
                  <button 
                    v-if="(user?.id || user?._id) === (reply.author?.id || reply.author?._id) || user?.role === 'admin'" 
                    class="delete-btn" 
                    :class="{ 'zhihu-delete': isZhihuStyle }" 
                    @click="deleteComment(reply._id)"
                  >
                    <svg-icon v-if="!isZhihuStyle" name="trash" :size="14"></svg-icon>
                    <span>{{ isZhihuStyle ? '删除' : '删除' }}</span>
                  </button>
                </div>
                
                <!-- 回复的回复输入框 -->
                <div v-if="reply.isReplying" class="reply-input-section">
                  <img v-if="!isZhihuStyle" :src="getCurrentUserAvatar(user)" :alt="user?.username || '用户头像'" class="reply-user-avatar">
                  <input 
                    type="text" 
                    :value="reply.replyText" 
                    @input="reply.replyText = $event.target.value" 
                    placeholder="写下你的回复..." 
                    class="reply-input" 
                    @keyup.enter="submitReply(reply, comment)"
                  >
                  <button 
                    class="send-reply-btn" 
                    @click="submitReply(reply, comment)" 
                    :disabled="!reply.replyText.trim()"
                  >
                    <svg-icon name="paperPlane" :size="16"></svg-icon>
                  </button>
                  <button class="cancel-reply-btn" @click="reply.isReplying = false">取消</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoadingComments" class="loading-comments">
      <p>加载评论中...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-if="commentError" class="comment-error">
      <p>{{ commentError }}</p>
    </div>
    
    <!-- 评论输入框 -->
    <div class="comment-input-section" :class="{ 'zhihu-comment-input': isZhihuStyle }">
      <div v-if="isZhihuStyle" class="comment-input-container">
        <img :src="getCurrentUserAvatar(user)" :alt="user?.username || '用户头像'" class="user-avatar">
        <input 
          type="text" 
          :value="localCommentText" 
          @input="updateCommentText($event.target.value)" 
          placeholder="写下你的评论..." 
          class="comment-input" 
          @keyup.enter="submitComment()"
        >
        <button 
            class="send-comment-btn" 
            aria-label="发送评论" 
            tabindex="0" 
            @click="submitComment()" 
            :disabled="!localCommentText.trim()"
          >
            发送
          </button>
      </div>
      <div v-else>
        <img :src="getCurrentUserAvatar(user)" :alt="user?.username || '用户头像'" class="user-avatar">
        <input 
          type="text" 
          :value="localCommentText" 
          @input="updateCommentText($event.target.value)" 
          placeholder="写下你的评论..." 
          class="comment-input" 
          @keyup.enter="submitComment()"
        >
        <button 
            class="send-comment-btn" 
            aria-label="发送评论" 
            tabindex="0" 
            @click="submitComment()" 
            :disabled="!localCommentText.trim()"
          >
            发送
          </button>
      </div>
    </div>
  </div>
</template>

<script>
// ============================================================
// 导入依赖模块
// ============================================================
// getAuthorAvatar: 头像处理工具函数
import { getAuthorAvatar } from '../utils/avatarUtils';

export default {
  name: 'CommentSection',
  
  // ============================================================
  // Props - 父组件传递的数据
  // ============================================================
  // 【作用】接收父组件传递的数据，实现组件复用
  // 
  // 【验证规则】
  // type: 数据类型
  // default: 默认值
  // required: 是否必填
  // 
  // 【面试常问】
  // Q: Props 可以修改吗？
  // A: 不可以，Props 是单向数据流，子组件不能直接修改
  // 
  // Q: 如何实现双向绑定？
  // A: 使用 v-model 或 .sync 修饰符
  // ============================================================
  props: {
    // 是否使用知乎风格
    // 【用途】切换不同的UI风格
    isZhihuStyle: {
      type: Boolean,
      default: false
    },
    
    // 评论数据列表
    // 【结构】[{ _id, author, content, likes, replies, createdAt, isPinned }]
    comments: {
      type: Array,
      default: () => []
    },
    
    // 评论加载状态
    isLoadingComments: {
      type: Boolean,
      default: false
    },
    
    // 错误信息
    commentError: {
      type: String,
      default: null
    },
    
    // 当前登录用户信息
    // 【用途】判断权限（删除、置顶）
    user: {
      type: Object,
      default: null
    },
    
    // 评论输入框内容（支持v-model）
    commentText: {
      type: String,
      default: ''
    },
    
    // 文章作者ID
    // 【用途】判断是否有置顶权限
    articleAuthorId: {
      type: [String, Number],
      default: null
    }
  },
  
  // ============================================================
  // data - 组件内部数据
  // ============================================================
  data() {
    return {
      // 本地评论输入框内容
      // 【用途】实现本地状态管理
      localCommentText: this.commentText,
      
      // 排序方式
      // 【可选值】'time'（按时间）或 'hot'（按热度）
      sortBy: 'time'
    };
  },
  
  // ============================================================
  // computed - 计算属性
  // ============================================================
  // 【特点】
  // 1. 有缓存：依赖不变，不重新计算
  // 2. 自动更新：依赖变化，自动重新计算
  // 
  // 【面试常问】
  // Q: computed 和 methods 的区别？
  // A: computed 有缓存，methods 每次都执行
  // 
  // Q: computed 和 watch 的区别？
  // A: computed 返回值，watch 执行副作用
  // ============================================================
  computed: {
    // 排序后的评论列表
    // 【逻辑】
    // 1. 分离置顶和非置顶评论
    // 2. 对非置顶评论排序
    // 3. 合并结果（置顶在前）
    sortedComments() {
      // 分离置顶和非置顶评论
      const pinnedComments = this.comments.filter(comment => comment.isPinned);
      const normalComments = this.comments.filter(comment => !comment.isPinned);
      
      // 复制数组，避免修改原数组
      let sortedNormalComments = [...normalComments];
      
      if (this.sortBy === 'time') {
        // 按时间排序：最新的在前
        sortedNormalComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (this.sortBy === 'hot') {
        // 按热度排序：点赞数 + 回复数
        sortedNormalComments.sort((a, b) => {
          const hotnessA = (a.likes || 0) + (a.replies?.length || 0);
          const hotnessB = (b.likes || 0) + (b.replies?.length || 0);
          return hotnessB - hotnessA;
        });
      }
      
      // 置顶评论始终在最前面
      return [...pinnedComments, ...sortedNormalComments];
    }
  },
  
  // ============================================================
  // watch - 监听器
  // ============================================================
  // 【作用】监听数据变化，执行相应操作
  // 
  // 【面试常问】
  // Q: watch 和 computed 的区别？
  // A: watch 用于副作用，computed 用于计算值
  // 
  // Q: immediate 和 deep 有什么用？
  // A: immediate 立即执行，deep 深度监听
  // ============================================================
  watch: {
    // 监听 prop 变化，同步到本地数据
    commentText(newValue) {
      this.localCommentText = newValue;
    },
    // 监听评论数据变化
    comments() {
      this.sortComments();
    }
  },
  
  // ============================================================
  // emits - 声明组件发出的事件
  // ============================================================
  // 【Vue 3 新特性】显式声明组件发出的事件
  // 【作用】提高代码可读性，便于维护
  // 
  // 【事件列表】
  // submit-comment: 提交评论
  // submit-reply: 提交回复
  // delete-comment: 删除评论
  // update:commentText: 更新评论输入框内容（v-model）
  // pin-comment: 置顶评论
  // ============================================================
  emits: ['submit-comment', 'submit-reply', 'delete-comment', 'update:commentText', 'pin-comment'],
  
  methods: {
    // 排序评论（实际逻辑在 computed 中）
    sortComments() {
      // 排序逻辑已在 computed 属性中实现
    },
    // 获取评论作者头像
    getCommentAuthorAvatar(author, size = 40) {
      return getAuthorAvatar(author, size);
    },
    // 获取当前用户头像
    getCurrentUserAvatar(user, size = 40) {
      return getAuthorAvatar(user, size);
    },
    // 提交评论
    submitComment() {
      this.$emit('submit-comment', this.localCommentText);
    },
    // 提交回复
    submitReply(comment, parentComment = null) {
      this.$emit('submit-reply', comment, parentComment);
    },
    // 删除评论
    deleteComment(commentId) {
      this.$emit('delete-comment', commentId);
    },
    // 置顶评论
    pinComment(comment) {
      this.$emit('pin-comment', comment._id);
    },
    // 更新评论输入框内容
    updateCommentText(value) {
      this.localCommentText = value;
      this.$emit('update:commentText', value);
    }
  }
};
</script>

<style scoped>
/* 评论区样式 */
.comments-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

/* 评论头部（标题和排序选项） */
.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.comments-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 排序选项 */
.comment-sort-options {
  display: flex;
  gap: 10px;
}

.sort-btn {
  padding: 4px 12px;
  border: 1px solid #dcdcdc;
  border-radius: 16px;
  background-color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
}

.sort-btn.active {
  background-color: #fef0f5;
  border-color: var(--primary-pink);
  color: var(--primary-pink);
}

/* 置顶标记 */
.pinned-badge {
  position: absolute;
  top: -10px;
  left: -10px;
  background-color: var(--primary-pink);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pinned-badge i {
  font-size: 8px;
}

/* 带置顶标记的评论项 */
.comment-item.pinned {
  position: relative;
  padding-left: 20px;
  background-color: #f9f9f9;
  border-left: 3px solid var(--primary-pink);
}

/* 置顶按钮 */
.pin-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  background-color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pin-btn:hover {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
}

.pin-btn.active {
  background-color: #fef0f5;
  border-color: var(--primary-pink);
  color: var(--primary-pink);
}

.zhihu-pin {
  font-size: 14px;
  padding: 0 8px;
  border: none;
  background: none;
  color: #646464;
}

.zhihu-pin:hover {
  color: var(--primary-pink);
}

.zhihu-pin.active {
  color: var(--primary-pink);
  background: none;
  border: none;
}

.comment-list {
  margin-bottom: 20px;
}

.comment-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-right: 10px;
}

.comment-date {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10px;
}

.comment-actions {
  display: flex;
  align-items: center;
}

.reply-btn, .delete-btn {
  background: none;
  border: none;
  font-size: 12px;
  color: #999;
  cursor: pointer;
  margin-right: 15px;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.reply-btn:hover, .delete-btn:hover {
  color: var(--primary-pink);
}

.reply-btn i, .delete-btn i {
  margin-right: 4px;
}

/* 回复列表 */
.replies-list {
  margin-top: 10px;
  margin-left: 52px;
}

.reply-item {
  display: flex;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f5;
}

.reply-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.reply-author {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-right: 8px;
}

.reply-date {
  font-size: 11px;
  color: #999;
}

.reply-text {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 8px;
}

.reply-to {
  color: var(--primary-pink);
  margin-right: 4px;
}

.reply-to-user {
  font-weight: 600;
}

.reply-actions {
  display: flex;
  align-items: center;
}

/* 回复输入框 */
.reply-input-section {
  margin-top: 10px;
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.reply-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 10px;
  flex-shrink: 0;
}

.reply-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 8px 12px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.reply-input:focus {
  border-color: var(--primary-pink);
}

.send-reply-btn, .cancel-reply-btn {
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 8px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.send-reply-btn {
  color: var(--primary-pink);
}

.send-reply-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.cancel-reply-btn {
  color: #999;
}

.cancel-reply-btn:hover {
  color: #666;
  background-color: #f0f0f0;
}

/* 评论输入框 */
.comment-input-section {
  margin-top: 20px;
}

.comment-input-container {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}

.comment-input {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 15px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.comment-input:focus {
  border-color: var(--primary-pink);
}

.send-comment-btn {
  background: none;
  border: none;
  color: var(--primary-pink);
  cursor: pointer;
  margin-left: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.send-comment-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.send-comment-btn:hover:not(:disabled) {
  background-color: rgba(236, 72, 153, 0.1);
}

/* 加载和错误状态 */
.loading-comments {
  text-align: center;
  padding: 20px;
  color: #999;
}

.comment-error {
  text-align: center;
  padding: 20px;
  color: #ff4d4f;
}

/* 知乎风格样式 */
.zhihu-comments {
  border-top: 1px solid #f0f0f0;
}

.zhihu-comment {
  border-bottom: 1px solid #f5f5f5;
}

.zhihu-reply {
  color: #646464;
}

.zhihu-reply:hover {
  color: #1890ff;
}

.zhihu-delete {
  color: #646464;
}

.zhihu-delete:hover {
  color: #ff4d4f;
}

.zhihu-comment-input {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
}
</style>
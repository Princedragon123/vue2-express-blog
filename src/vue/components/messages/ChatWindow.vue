<template>
  <div class="chat-area">
    <div v-if="!selectedContact" class="no-contact-selected">
      <span class="nav-icon">💬</span>
      <h3>选择一个联系人开始聊天</h3>
      <p>点击左侧联系人列表中的用户开始私信</p>
    </div>

    <div v-else class="chat-container">
      <div class="chat-header">
        <div class="chat-contact-info">
          <img :src="getContactAvatar(selectedContact)" :alt="selectedContact.username" class="chat-contact-avatar" @error="handleAvatarError($event, selectedContact.username, 40)">
          <div class="chat-contact-name">{{ selectedContact.username }}</div>
        </div>
        <div class="chat-actions">
          <button class="btn-secondary" @click="$emit('clear-chat')">
            <span class="nav-icon">🗑️</span> 清空聊天
          </button>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer" @scroll="handleScroll">
        <div v-if="isLoadingMessages" class="loading-state">
          <div class="spinner"></div>
          <p>加载消息中...</p>
        </div>

        <div v-else-if="messages.length === 0" class="empty-chat">
          <p>开始与 {{ selectedContact.username }} 聊天吧</p>
        </div>

        <div v-else class="messages-list">
          <div v-if="isLoadingMore" class="loading-more">
            <div class="spinner small"></div>
            <p>加载更多消息...</p>
          </div>

          <div
            v-for="(message, index) in messages"
            :key="message._id || index"
            :class="['message-item', message.sender === currentUserId ? 'sent' : 'received']"
          >
            <div v-if="message.sender !== currentUserId" class="message-avatar left">
              <img :src="getMessageSenderAvatar(message)" :alt="message.senderUsername" class="avatar-img" @error="handleAvatarError($event, message.senderUsername, 30)">
            </div>
            <div class="message-content">
              <div class="message-text">
                <template v-for="(part, idx) in parseMessageContent(message.content)">
                  <span v-if="part.type === 'text'" :key="`text-${idx}`">{{ part.text }}</span>
                  <img 
                    v-else-if="part.type === 'emoji'" 
                    :src="part.url" 
                    :alt="part.name || 'emoji'" 
                    class="custom-emoji-message"
                    @contextmenu.prevent="showEmojiContextMenu(part, $event)"
                    :key="`emoji-${idx}`"
                  >
                </template>
              </div>
              <div class="message-time">{{ formatDate(message.createdAt) }}</div>
            </div>
            <div v-if="message.sender === currentUserId" class="message-avatar right">
              <img :src="getCurrentUserAvatar()" :alt="'我'" class="avatar-img" @error="handleAvatarError($event, 'Me', 30)">
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <button class="emoji-btn" @click="toggleEmojiPanel($event)">
          😊
        </button>
        <textarea
          ref="messageInputRef"
          :value="messageInput"
          @input="handleInput"
          placeholder="输入消息..."
          class="message-input"
          @keydown.enter.prevent="$emit('send')"
        ></textarea>
        <button class="btn-primary send-btn" @click="$emit('send')" :disabled="!messageInput.trim()">
          <span class="nav-icon">✈️</span>
        </button>
      </div>
      
      <!-- 表情包面板 -->
      <div v-if="showEmojiPanel" ref="emojiPanelRef" class="emoji-panel" @click.stop>
        <div class="emoji-grid">
          <!-- 收藏分类显示加号按钮 -->
          <div 
            v-if="currentCategory === 'favorites'"
            class="emoji-item add-emoji-btn"
            @click="triggerFileUpload($event)"
            title="添加表情包"
          >
            <span class="add-icon">➕</span>
          </div>
          <!-- 显示表情 -->
          <span 
            v-for="(emoji, index) in currentEmojis" 
            :key="index"
            class="emoji-item"
            :class="{ 'custom-emoji': typeof emoji === 'object' && emoji.url }"
            @click="insertEmoji(emoji, $event)"
            @contextmenu.prevent="showContextMenu(emoji, $event)"
            title="点击发送，右键删除（收藏的表情）"
          >
            <img v-if="typeof emoji === 'object' && emoji.url" :src="emoji.url" alt="表情" class="custom-emoji-img">
            <span v-else>{{ emoji }}</span>
          </span>
        </div>
        <!-- 底部分类栏 -->
        <div class="emoji-categories">
          <div 
            v-for="(category, key) in emojiCategories" 
            :key="key"
            class="category-item"
            :class="{ active: currentCategory === key }"
            @click="switchCategory(key, $event)"
            :title="category.name"
          >
            {{ category.icon }}
          </div>
        </div>
      </div>
      
      <!-- 隐藏的文件上传 -->
      <input 
        type="file" 
        ref="fileInput" 
        style="display: none" 
        accept="image/*,image/gif" 
        @change="handleFileSelect"
      >
    </div>
  </div>
</template>

<script>
import avatarMixin from '../../mixins/avatarMixin';
import apiMethods from '../../utils/api';
import { showNotification } from '../../utils/notification';

export default {
  name: 'ChatWindow',
  mixins: [avatarMixin],
  props: {
    selectedContact: {
      type: Object,
      default: null
    },
    messages: {
      type: Array,
      default: () => []
    },
    messageInput: {
      type: String,
      default: ''
    },
    currentUserId: {
      type: String,
      default: ''
    },
    isLoadingMessages: {
      type: Boolean,
      default: false
    },
    isLoadingMore: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showEmojiPanel: false,
      currentCategory: 'emoji',
      favoriteEmojis: [],
      emojiCategories: {
        emoji: {
          icon: '😊',
          name: '表情',
          list: [
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
            '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
            '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝',
            '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐',
            '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
            '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢',
            '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠',
            '🥳', '😎', '🤓', '🧐', '🤫', '🤭', '🧐', '🤠'
          ]
        },
        gesture: {
          icon: '👍',
          name: '手势',
          list: [
            '�', '�', '👏', '🙌', '🤝', '🤲', '🤜', '🤛',
            '✊', '✌️', '🤞', '🤟', '🤘', '🤙', '👌', '🤏',
            '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚',
            '🖐️', '🖖', '👋', '🤙', '💪', '🦾', '🖕'
          ]
        },
        animal: {
          icon: '🐱',
          name: '动物',
          list: [
            '🐱', '🐶', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
            '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
            '🐧', '🐦', '🐤', '🦄', '🐝', '🦋', '🐌', '🐞',
            '🐜', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑'
          ]
        },
        food: {
          icon: '🍔',
          name: '食物',
          list: [
            '🍔', '🍕', '🌭', '🍿', '🧂', '🥓', '🥩', '🍗',
            '🍖', '🦴', '🌮', '🌯', '🥙', '🧆', '🍝', '🍜',
            '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙',
            '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧'
          ]
        },
        activity: {
          icon: '⚽',
          name: '活动',
          list: [
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
            '�', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
            '🏏', '🪃', '🥅', '🪜', '🎣', '🤿', '🎽', '🎿',
            '🛷', '🥌', '🎯', '🪀', '🎯', '🪁', '🎈', '🎪'
          ]
        },
        favorites: {
          icon: '⭐',
          name: '收藏',
          list: []
        }
      }
    };
  },
  computed: {
    currentEmojis() {
      if (this.currentCategory === 'favorites') {
        return this.favoriteEmojis;
      }
      return this.emojiCategories[this.currentCategory]?.list || [];
    }
  },
  methods: {
    async loadFavorites() {
      try {
        const response = await apiMethods.emojis.getFavorites();
        if (response.emojis) {
          this.favoriteEmojis = response.emojis;
        }
      } catch (e) {
        console.error('加载收藏表情失败', e);
        // 降级到 localStorage
        try {
          const saved = localStorage.getItem('favoriteEmojis');
          if (saved) {
            this.favoriteEmojis = JSON.parse(saved);
          }
        } catch (localErr) {
          console.error('本地加载失败', localErr);
        }
      }
    },
    saveFavorites() {
      try {
        localStorage.setItem('favoriteEmojis', JSON.stringify(this.favoriteEmojis));
      } catch (e) {
        console.error('保存收藏表情失败', e);
      }
    },
    addToFavorites(emoji) {
      if (!this.favoriteEmojis.find(e => e.id === emoji.id || e === emoji)) {
        this.favoriteEmojis.unshift(emoji);
        this.saveFavorites();
      }
    },
    async removeFromFavorites(emoji) {
      try {
        if (emoji.id) {
          await apiMethods.emojis.deleteFavorite(emoji.id);
        }
        const index = this.favoriteEmojis.findIndex(e => e.id === emoji.id || e === emoji);
        if (index > -1) {
          this.favoriteEmojis.splice(index, 1);
          this.saveFavorites();
        }
      } catch (e) {
        console.error('删除表情包失败', e);
        showNotification('删除失败', 'error');
      }
    },
    triggerFileUpload(event) {
      event.stopPropagation();
      this.$refs.fileInput.click();
    },
    async handleFileSelect(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件！');
        return;
      }
      
      // 检查文件大小（限制 5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB！');
        return;
      }
      
      try {
        // 上传到后端
        const formData = new FormData();
        formData.append('emoji', file);
        const response = await apiMethods.emojis.upload(formData);
        
        if (response.emoji) {
          this.favoriteEmojis.unshift(response.emoji);
          this.saveFavorites();
          showNotification('上传成功', 'success');
        }
      } catch (e) {
        console.error('上传表情包失败', e);
        showNotification('上传失败', 'error');
      }
      
      // 清空 input
      event.target.value = '';
    },
    showContextMenu(emoji, event) {
      // 只对收藏的表情显示右键菜单
      if (this.currentCategory !== 'favorites') return;
      
      if (confirm('确定删除这个表情包吗？')) {
        this.removeFromFavorites(emoji);
      }
    },
    parseMessageContent(content) {
      if (!content) return [{ type: 'text', text: '' }];
      
      const parts = [];
      const emojiRegex = /\[EMOJI:([^\]]+)\]/g;
      let lastIndex = 0;
      let match;
      
      while ((match = emojiRegex.exec(content)) !== null) {
        // 添加文本部分
        if (match.index > lastIndex) {
          parts.push({
            type: 'text',
            text: content.slice(lastIndex, match.index)
          });
        }
        
        // 解析表情标记
        const encodedInfo = match[1];
        let emoji;
        
        try {
          // 尝试解码 JSON
          emoji = JSON.parse(atob(encodedInfo));
        } catch (e) {
          // 如果解码失败，尝试作为 id 查找
          emoji = this.favoriteEmojis.find(e => e.id == encodedInfo);
        }
        
        if (emoji && emoji.url) {
          parts.push({
            type: 'emoji',
            id: emoji.id,
            url: emoji.url,
            name: emoji.name
          });
        } else {
          // 没找到就显示原始文本
          parts.push({
            type: 'text',
            text: match[0]
          });
        }
        
        lastIndex = match.index + match[0].length;
      }
      
      // 添加剩余文本
      if (lastIndex < content.length) {
        parts.push({
          type: 'text',
          text: content.slice(lastIndex)
        });
      }
      
      return parts.length > 0 ? parts : [{ type: 'text', text: content }];
    },
    showEmojiContextMenu(emoji, event) {
      // 检查是否是别人发的表情
      // 在当前实现中，我们简单显示添加到收藏的选项
      if (confirm('是否添加到收藏？')) {
        this.addToFavorites(emoji);
      }
    },
    switchCategory(category, event) {
      event.stopPropagation();
      this.currentCategory = category;
    },
    handleClickOutside(event) {
      // 检查点击是否在表情包面板外部
      if (this.showEmojiPanel && this.$refs.emojiPanelRef && !this.$refs.emojiPanelRef.contains(event.target)) {
        this.showEmojiPanel = false;
      }
    },
    toggleEmojiPanel(event) {
      event.stopPropagation();
      this.showEmojiPanel = !this.showEmojiPanel;
    },
    insertEmoji(emoji, event) {
      event.stopPropagation();
      
      // 如果是图片表情，插入特殊标记，包含完整信息
      if (typeof emoji === 'object' && emoji.url) {
        const encodedInfo = btoa(JSON.stringify(emoji));
        this.$emit('update:messageInput', this.messageInput + `[EMOJI:${encodedInfo}]`);
      } else {
        this.$emit('update:messageInput', this.messageInput + emoji);
      }
      
      this.$nextTick(() => {
        this.autoResize();
      });
    },
    handleInput(event) {
      this.$emit('update:messageInput', event.target.value);
      this.autoResize();
    },
    autoResize() {
      this.$nextTick(() => {
        const textarea = this.$refs.messageInputRef;
        if (!textarea) return;
        
        // 先重置高度，让 scrollHeight 准确计算
        textarea.style.height = 'auto';
        
        // 计算新高度，最大 5 行
        const lineHeight = 21; // 大约一行的高度
        const maxHeight = lineHeight * 5; // 5 行的最大高度
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        
        textarea.style.height = newHeight + 'px';
      });
    },
    getContactAvatar(contact) {
      return this.getAvatar(contact, 40);
    },
    getMessageSenderAvatar(message) {
      if (message.senderInfo) {
        return this.getAvatar(message.senderInfo, 30);
      }
      if (message.sender !== this.currentUserId && this.selectedContact) {
        return this.getAvatar(this.selectedContact, 30);
      }
      return this.getAvatar(null, 30);
    },
    getCurrentUserAvatar() {
      const user = this.$store.getters.currentUser;
      return this.getAvatar(user, 30);
    },
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    },
    handleScroll() {
      const container = this.$refs.messagesContainer;
      if (!container) return;
      if (container.scrollTop < 50) {
        this.$emit('load-more');
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
          setTimeout(() => {
            if (container.scrollTop < container.scrollHeight - 100) {
              container.scrollTop = container.scrollHeight;
            }
          }, 100);
        }
      });
    },
    getScrollInfo() {
      const container = this.$refs.messagesContainer;
      if (!container) return null;
      return {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight
      };
    },
    restoreScrollPosition(oldScrollTop, oldScrollHeight) {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          const newScrollHeight = container.scrollHeight;
          const addedHeight = newScrollHeight - oldScrollHeight;
          container.scrollTop = oldScrollTop + addedHeight;
        }
      });
    }
  },
  watch: {
    messageInput(newVal) {
      if (!newVal) {
        // 当输入框为空时，重置高度
        this.$nextTick(() => {
          const textarea = this.$refs.messageInputRef;
          if (textarea) {
            textarea.style.height = '44px';
          }
        });
      }
    }
  },
  mounted() {
    this.autoResize();
    this.loadFavorites();
    // 监听点击外部关闭表情包面板
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeDestroy() {
    // 移除事件监听
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  position: relative;
}

.no-contact-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  gap: 10px;
}

.no-contact-selected .nav-icon {
  font-size: 3rem;
}

.no-contact-selected h3 {
  margin: 0;
  color: var(--text-primary);
}

.no-contact-selected p {
  color: #6b7280;
  margin: 0;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.chat-contact-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--primary-pink);
}

.chat-contact-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.btn-secondary {
  padding: 8px 16px;
  border: 2px solid var(--background-dark);
  border-radius: 20px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-secondary:hover {
  border-color: var(--primary-pink);
  color: var(--primary-pink);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.2);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.chat-messages::-webkit-scrollbar {
  display: none;
}

.loading-state,
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #6b7280;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--primary-pink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

.spinner.small {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  color: #6b7280;
  font-size: 0.85rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message-item {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-item.sent {
  justify-content: flex-end;
}

.message-item.received {
  justify-content: flex-start;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--background-dark);
}

.message-content {
  max-width: 65%;
  padding: 10px 16px;
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
}

.message-item.sent .message-content {
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.received .message-content {
  background: #f3f4f6;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-text {
  font-size: 0.9rem;
  line-height: 1.5;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 4px;
  opacity: 0.7;
}

.message-item.sent .message-time {
  text-align: right;
  color: rgba(255, 255, 255, 0.7);
}

.message-item.received .message-time {
  color: #9ca3af;
}

.chat-input-area {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--background-dark);
  border-radius: 25px;
  font-size: 0.9rem;
  outline: none;
  resize: none !important;
  overflow-y: auto;
  min-height: 44px;
  max-height: 105px;
  height: 44px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  background: #fff;
  line-height: 21px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.message-input::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.message-input:focus {
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-pink) 0%, var(--secondary-pink) 100%);
  border: none;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  font-size: 1.1rem;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.4);
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.send-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.emoji-btn {
  background: #fff;
  border: 2px solid var(--background-dark);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s ease;
}

.emoji-btn:hover {
  background: var(--background-light);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.emoji-btn:active {
  transform: scale(0.95);
}

.emoji-panel {
  position: absolute;
  bottom: 90px;
  left: 20px;
  background: #fff;
  border: 2px solid var(--background-dark);
  border-radius: 15px;
  padding: 15px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
  max-height: 300px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  overflow-y: auto;
  max-height: 220px;
  padding-right: 5px;
}

.emoji-grid::-webkit-scrollbar {
  width: 4px;
}

.emoji-grid::-webkit-scrollbar-thumb {
  background: var(--background-dark);
  border-radius: 2px;
}

.emoji-item {
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: var(--background-light);
  transform: scale(1.3);
}

.emoji-item:active {
  transform: scale(1.1);
}

.emoji-categories {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding:  0 5px;

  border-top: 1px solid var(--background-dark);
  gap: 5px;
}

.category-item {
  font-size: 1.4rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.6;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.category-item:hover {
  background: var(--background-light);
  opacity: 0.9;
  transform: scale(1.15);
}

.category-item.active {
  background: var(--background-light);
  opacity: 1;
  border: 2px solid var(--primary-pink);
  transform: scale(1.1);
}

.add-emoji-btn {
  border: 2px dashed var(--background-dark);
  background: var(--background-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-emoji-btn:hover {
  border-color: var(--primary-pink);
  background: rgba(236, 72, 153, 0.1);
  transform: scale(1.1);
}

.add-icon {
  font-size: 1.5rem;
}

.custom-emoji {
  padding: 2px;
}

.custom-emoji-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.custom-emoji-message {
  max-width: 150px;
  max-height: 150px;
  object-fit: contain;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.custom-emoji-message:hover {
  transform: scale(1.05);
}

@media (max-width: 768px) {
  .chat-area {
    width: 100%;
  }
  .message-content {
    max-width: 80%;
  }
}
</style>

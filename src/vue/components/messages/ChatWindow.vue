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
              <div class="message-text">{{ message.content }}</div>
              <div class="message-time">{{ formatDate(message.createdAt) }}</div>
            </div>
            <div v-if="message.sender === currentUserId" class="message-avatar right">
              <img :src="getCurrentUserAvatar()" :alt="'我'" class="avatar-img" @error="handleAvatarError($event, 'Me', 30)">
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input-area">
        <textarea
          :value="messageInput"
          @input="$emit('update:messageInput', $event.target.value)"
          placeholder="输入消息..."
          class="message-input"
          @keydown.enter.prevent="$emit('send')"
        ></textarea>
        <button class="btn-primary send-btn" @click="$emit('send')" :disabled="!messageInput.trim()">
          <span class="nav-icon">✈️</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import avatarMixin from '../../mixins/avatarMixin';
import auth from '../../utils/auth';

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
  methods: {
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
      const user = auth.getCurrentUser();
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
  }
};
</script>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  resize: none;
  height: 44px;
  font-family: inherit;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
  background: #fff;
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

@media (max-width: 768px) {
  .chat-area {
    width: 100%;
  }
  .message-content {
    max-width: 80%;
  }
}
</style>

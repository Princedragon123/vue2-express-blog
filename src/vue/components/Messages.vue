<template>
  <article class="messages-page" aria-label="消息页面">
    <!-- 桌面端布局：联系人列表 + 聊天窗口并排 -->
    <main class="messages-page__main" role="main">
      <!-- 联系人列表（移动端：全屏；桌面端：左侧栏） -->
      <aside class="messages-page__contacts" :class="{ 'messages-page__contacts--hidden': isMobile && selectedContact }">
        <header class="contacts-header">
          <h2 class="contacts-header__title">消息</h2>
          <div class="contacts-header__tabs">
            <button :class="['contacts-tab', { 'contacts-tab--active': activeTab === 'messages' }]" @click="switchTab('messages')">
              私信
              <span v-if="unreadMessageCount > 0" class="contacts-tab__badge">{{ unreadMessageCount }}</span>
            </button>
            <button :class="['contacts-tab', { 'contacts-tab--active': activeTab === 'notifications' }]" @click="switchTab('notifications')">
              通知
              <span v-if="unreadNotificationCount > 0" class="contacts-tab__badge">{{ unreadNotificationCount }}</span>
            </button>
          </div>
        </header>

        <!-- 搜索框 -->
        <div class="contacts-search" v-if="activeTab === 'messages'">
          <input v-model="searchQuery" placeholder="搜索联系人..." class="contacts-search__input">
        </div>

        <!-- 联系人列表 -->
        <ContactList
          v-if="activeTab === 'messages'"
          :contacts="contacts"
          :filtered-contacts="filteredContacts"
          :selected-contact="selectedContact"
          :search-query="searchQuery"
          :is-loading="isLoadingContacts"
          :last-messages="lastMessages"
          :unread-counts="unreadCounts"
          @update:searchQuery="searchQuery = $event"
          @select="selectContact"
        />

        <!-- 通知列表 -->
        <NotificationList
          v-else
          :notifications="notifications"
          :is-loading="isLoadingNotifications"
          @click-notification="handleNotificationClick"
          @delete-notification="deleteNotification"
        />
      </aside>

      <!-- 聊天窗口（移动端：从右侧滑入） -->
      <section class="messages-page__chat" :class="{ 'messages-page__chat--active': !isMobile || selectedContact }">
        <!-- 移动端返回按钮 -->
        <header class="chat-header" v-if="selectedContact">
          <button v-if="isMobile" class="chat-header__back" @click="selectedContact = null">←</button>
          <span class="chat-header__name">{{ selectedContact.username }}</span>
          <button class="chat-header__clear" @click="clearChat" title="清空聊天记录">🗑️</button>
        </header>

        <ChatWindow
          v-if="selectedContact"
          ref="chatWindow"
          :selected-contact="selectedContact"
          :messages="messages"
          :message-input="messageInput"
          :current-user-id="currentUserId"
          :is-loading-messages="isLoadingMessages"
          :is-loading-more="isLoadingMore"
          @update:messageInput="messageInput = $event"
          @send="sendMessage"
          @clear-chat="clearChat"
          @load-more="loadMoreMessages"
        />

        <!-- 无选中联系人的空状态 -->
        <div v-else class="chat-empty">
          <span class="chat-empty__icon">💬</span>
          <p class="chat-empty__text">选择一个联系人开始聊天</p>
        </div>
      </section>
    </main>

    <!-- 博客弹窗 -->
    <BlogModal
      v-if="showBlogModal"
      :visible="showBlogModal"
      :blog="currentBlog"
      :user="currentUser"
      @close="closeBlogModal"
    />
  </article>
</template>

<script>
import BlogModal from './BlogModal.vue';
import ContactList from './messages/ContactList.vue';
import ChatWindow from './messages/ChatWindow.vue';
import NotificationList from './messages/NotificationList.vue';
import { showNotification } from '../utils/notification';
import avatarMixin from '../mixins/avatarMixin';
import webSocketMixin from '../mixins/webSocketMixin';

export default {
  name: 'Messages',
  mixins: [avatarMixin, webSocketMixin],
  components: { BlogModal, ContactList, ChatWindow, NotificationList },

  data() {
    return {
      contacts: [],
      messages: [],
      selectedContact: null,
      messageInput: '',
      isLoadingContacts: false,
      isLoadingMessages: false,
      isLoadingMore: false,
      searchQuery: '',
      currentUserId: '',
      unreadCounts: {},
      lastMessages: {},
      unreadMessageCount: 0,
      messagePage: 1,
      hasMoreMessages: true,
      notifications: [],
      isLoadingNotifications: false,
      unreadNotificationCount: 0,
      totalNotificationCount: 0,
      activeTab: 'messages',
      showBlogModal: false,
      currentBlog: null,
      currentUser: null,
      isMobile: false
    };
  },

  computed: {
    filteredContacts() {
      if (!this.searchQuery) return this.contacts;
      const q = this.searchQuery.toLowerCase();
      return this.contacts.filter(c => c.username.toLowerCase().includes(q));
    }
  },

  created() {
    this.isMobile = window.innerWidth <= 768;
    // 检查是否有分享数据
    const shareInfo = sessionStorage.getItem('blogShareInfo');
    if (shareInfo) {
      this.activeTab = 'messages';
      sessionStorage.removeItem('blogShareInfo');
    }
    this.fetchCurrentUser();
    this.fetchContacts();
    this.fetchNotifications();
  },

  mounted() {
    this.setupWebSocket();
  },

  beforeDestroy() {
    document.body.style.overflow = '';
    this.removeSocketListeners();
  },

  methods: {
    async setupWebSocket() {
      try {
        if (!this.currentUserId) await this.fetchCurrentUser();
        const connected = await this.initWebSocket();
        if (connected) this.setupSocketListeners();
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    },

    setupSocketListeners() {
      this.addSocketListener('newMessage', (message) => {
        const senderId = typeof message.sender === 'object' ? message.sender._id?.toString() : message.sender?.toString();
        if (this.selectedContact && senderId === this.selectedContact._id) {
          this.messages.push({ ...message, senderInfo: typeof message.sender === 'object' ? message.sender : null, sender: senderId });
          this.lastMessages[this.selectedContact._id] = message.content;
          this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); });
        } else {
          if (!this.lastMessages[senderId]) this.lastMessages[senderId] = message.content;
          this.unreadCounts[senderId] = (this.unreadCounts[senderId] || 0) + 1;
          this.unreadMessageCount++;
        }
      });

      this.addSocketListener('notification', (notification) => {
        this.notifications.unshift(notification);
        this.unreadNotificationCount++;
        this.totalNotificationCount++;
      });
    },

    async fetchCurrentUser() {
      try {
        const response = await this.$http.auth.getCurrentUser();
        if (response.data) {
          this.currentUserId = response.data._id.toString();
          this.currentUser = response.data;
        }
      } catch { /* 静默 */ }
    },

    async fetchContacts() {
      this.isLoadingContacts = true;
      try {
        const response = await this.$http.messages.getContacts();
        if (response.success) {
          this.contacts = response.data;
          for (const contact of this.contacts) {
            await this.fetchLastMessage(contact._id);
          }
        }
      } catch { this.contacts = []; }
      finally { this.isLoadingContacts = false; }
    },

    async fetchLastMessage(userId) {
      try {
        const response = await this.$http.messages.getHistory(userId, { page: 1, limit: 1 });
        this.lastMessages[userId] = (response.success && response.data.length > 0) ? response.data[0].content : '暂无消息';
      } catch { this.lastMessages[userId] = '暂无消息'; }
    },

    async fetchMessages(userId) {
      this.isLoadingMessages = true;
      try {
        const response = await this.$http.messages.getHistory(userId, { page: 1, limit: 20 });
        if (response.success) {
          this.messages = response.data.map(msg => {
            const processed = { ...msg };
            if (typeof msg.sender === 'object' && msg.sender._id) {
              processed.senderInfo = msg.sender;
              processed.sender = msg.sender._id.toString();
            }
            return processed;
          });
          this.lastMessages[userId] = this.messages.length > 0 ? this.messages[this.messages.length - 1].content : '暂无消息';
          this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); });
        }
      } catch { /* 静默 */ }
      finally { this.isLoadingMessages = false; }
    },

    selectContact(contact) {
      this.selectedContact = contact;
      this.resetMessageState();
      this.fetchMessages(contact._id);
      this.markAsRead(contact._id);
    },

    async sendMessage() {
      if (!this.selectedContact || !this.messageInput.trim()) return;
      try {
        const response = await this.$http.messages.send({ receiver: this.selectedContact._id, content: this.messageInput.trim() });
        if (response.success) {
          this.messages.push(response.data);
          this.lastMessages[this.selectedContact._id] = response.data.content;
          this.messageInput = '';
          this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); });
        }
      } catch (error) {
        const msg = error.response?.status === 403 ? '请先关注对方才能发送消息' : '发送失败，请稍后重试';
        showNotification(msg, 'error');
      }
    },

    async loadMoreMessages() {
      if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return;
      this.isLoadingMore = true;
      try {
        const chatWindow = this.$refs.chatWindow;
        const scrollInfo = chatWindow ? chatWindow.getScrollInfo() : null;
        this.messagePage++;
        const response = await this.$http.messages.getHistory(this.selectedContact._id, { page: this.messagePage, limit: 20 });
        if (response.success && response.data.length > 0) {
          this.messages = [...response.data.reverse(), ...this.messages];
          if (chatWindow && scrollInfo) {
            chatWindow.restoreScrollPosition(scrollInfo.scrollTop, scrollInfo.scrollHeight);
          }
        } else {
          this.hasMoreMessages = false;
        }
      } catch { /* 静默 */ }
      finally { this.isLoadingMore = false; }
    },

    resetMessageState() {
      this.messages = [];
      this.messagePage = 1;
      this.hasMoreMessages = true;
      this.isLoadingMore = false;
    },

    async markAsRead(userId) {
      try {
        await this.$http.messages.markAsRead({ userId });
        this.unreadCounts[userId] = 0;
      } catch { /* 静默 */ }
    },

    clearChat() { if (confirm('确定要清空聊天记录吗？')) this.messages = []; },

    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'notifications' && this.notifications.length === 0) this.fetchNotifications();
    },

    async fetchNotifications() {
      this.isLoadingNotifications = true;
      try {
        const response = await this.$http.notifications.getList();
        if (response.success) {
          this.notifications = response.data;
          this.unreadNotificationCount = response.meta?.unread || 0;
          this.totalNotificationCount = response.meta?.total || 0;
        }
      } catch { this.notifications = []; }
      finally { this.isLoadingNotifications = false; }
    },

    handleNotificationClick(notification) {
      if (!notification.isRead) {
        this.$http.notifications.markAsRead(notification._id).catch(() => {});
      }
      if (notification.resourceType === 'blog' || notification.resourceType === 'comment') {
        this.fetchBlogDetail(notification.resourceId);
      } else if (notification.type === 'follow') {
        this.$router.push(`/profile/${notification.sender?._id}`);
      }
    },

    async fetchBlogDetail(blogId) {
      try {
        const response = await this.$http.blogs.getDetail(blogId);
        if (response.success) {
          this.currentBlog = { ...response.data, id: response.data._id, date: new Date(response.data.createdAt).toLocaleDateString('zh-CN') };
          this.showBlogModal = true;
          document.body.style.overflow = 'hidden';
        }
      } catch { /* 静默 */ }
    },

    closeBlogModal() {
      this.showBlogModal = false;
      this.currentBlog = null;
      document.body.style.overflow = '';
    },

    async deleteNotification(notificationId) {
      try {
        await this.$http.notifications.delete(notificationId);
        const deleted = this.notifications.find(n => n._id === notificationId);
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        this.totalNotificationCount--;
        if (deleted && !deleted.isRead && this.unreadNotificationCount > 0) this.unreadNotificationCount--;
      } catch {
        // 乐观删除：即使 API 失败也移除
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        this.totalNotificationCount--;
      }
    }
  }
};
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
  padding: 20px;
}

.messages-page__main {
  max-width: 1200px;
  margin: 0 auto;
  height: calc(100vh - 100px);
  min-height: 500px;
  background: linear-gradient(135deg, #fff 0%, #fef3c7 100%);
  border: 2px solid #fbcfe8;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(251, 207, 232, 0.2);
  display: flex;
  overflow: hidden;
}

/* 联系人侧栏 */
.messages-page__contacts {
  width: 340px;
  border-right: 1px solid rgba(236, 72, 153, 0.08);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.6);
}

.contacts-header {
  padding: 16px;
  border-bottom: 1px solid rgba(236, 72, 153, 0.08);
}

.contacts-header__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ec4899;
  margin-bottom: 12px;
}

.contacts-header__tabs {
  display: flex;
  gap: 8px;
}

.contacts-tab {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: none;
  background: rgba(236, 72, 153, 0.05);
  color: #666;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.contacts-tab--active {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: #fff;
}

.contacts-tab__badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: #ef4444;
  color: #fff;
  font-size: 0.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.contacts-search {
  padding: 10px 16px;
}

.contacts-search__input {
  width: 100%;
  padding: 8px 14px;
  border: 1.5px solid rgba(236, 72, 153, 0.15);
  border-radius: 20px;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.7);
  outline: none;
  transition: all 0.2s ease;
}

.contacts-search__input:focus {
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.06);
}

/* 聊天窗口 */
.messages-page__chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(236, 72, 153, 0.08);
  background: rgba(255, 255, 255, 0.5);
}

.chat-header__back {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(236, 72, 153, 0.08);
  border-radius: 50%;
  color: #ec4899;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-header__name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.chat-header__clear {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  padding: 4px;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 12px;
}

.chat-empty__icon { font-size: 3rem; }
.chat-empty__text { font-size: 0.9rem; }

/* 移动端布局 - 微信风格 */
@media (max-width: 768px) {
  .messages-page {
    padding: 0;
  }

  .messages-page__main {
    height: 100vh;
    border-radius: 0;
    border: none;
    position: relative;
  }

  .messages-page__contacts {
    width: 100%;
    position: absolute;
    inset: 0;
    z-index: 1;
    transition: transform 0.3s ease;
  }

  .messages-page__contacts--hidden {
    transform: translateX(-100%);
  }

  .messages-page__chat {
    position: absolute;
    inset: 0;
    z-index: 2;
    background: #fff;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .messages-page__chat--active {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .contacts-header { padding: 12px; }
  .contacts-header__title { font-size: 1rem; margin-bottom: 8px; }
}
</style>

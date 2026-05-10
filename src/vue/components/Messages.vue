<template>
  <div class="messages-container">
    <MessagesHeader />

    <MessagesTabs
      v-model="activeTab"
      :notification-count="unreadNotificationCount"
      :message-count="unreadMessageCount"
    />

    <div class="messages-content">
      <div v-if="activeTab === 'messages'" class="messages-section">
        <ContactList
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

        <ChatWindow
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
      </div>

      <NotificationList
        v-else-if="activeTab === 'notifications'"
        :notifications="notifications"
        :is-loading="isLoadingNotifications"
        @click-notification="handleNotificationClick"
        @delete-notification="deleteNotification"
      />
    </div>

    <BlogModal
      v-if="showBlogModal"
      :visible="showBlogModal"
      :blog="currentBlog"
      :user="currentUser"
      @close="closeBlogModal"
    />
  </div>
</template>

<script>
import BlogModal from './BlogModal.vue';
import ContactList from './messages/ContactList.vue';
import ChatWindow from './messages/ChatWindow.vue';
import NotificationList from './messages/NotificationList.vue';
import MessagesHeader from './messages/MessagesHeader.vue';
import MessagesTabs from './messages/MessagesTabs.vue';
import { showNotification } from '../utils/notification';
import avatarMixin from '../mixins/avatarMixin';
import webSocketMixin from '../mixins/webSocketMixin';
import auth from '../utils/auth';

export default {
  name: 'Messages',
  mixins: [avatarMixin, webSocketMixin],
  components: {
    BlogModal,
    ContactList,
    ChatWindow,
    NotificationList,
    MessagesHeader,
    MessagesTabs
  },
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
      activeTab: 'notifications',
      showBlogModal: false,
      currentBlog: null,
      currentUser: null
    };
  },
  computed: {
    filteredContacts() {
      if (!this.searchQuery) {
        return this.contacts;
      }
      return this.contacts.filter(contact =>
        contact.username.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    },
  },

  created() {
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
        if (!this.currentUserId) {
          await this.fetchCurrentUser();
        }
        const connected = await this.initWebSocket();
        if (connected) {
          this.setupSocketListeners();
        }
      } catch (error) {
        console.error('WebSocket初始化失败:', error);
      }
    },

    setupSocketListeners() {
      this.addSocketListener('newMessage', (message) => {
        const senderId = typeof message.sender === 'object'
          ? message.sender._id.toString()
          : message.sender.toString();

        if (this.selectedContact && senderId === this.selectedContact._id) {
          const newMessage = {
            ...message,
            senderInfo: typeof message.sender === 'object' ? message.sender : null,
            sender: senderId
          };
          this.messages.push(newMessage);
          this.lastMessages[this.selectedContact._id] = message.content;
          if (this.$refs.chatWindow) {
            this.$refs.chatWindow.scrollToBottom();
          }
        } else {
          if (!this.lastMessages[senderId]) {
            this.lastMessages[senderId] = message.content;
          }
          if (!this.unreadCounts[senderId]) {
            this.unreadCounts[senderId] = 0;
          }
          this.unreadCounts[senderId]++;
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
      } catch (error) {
        console.error('获取当前用户信息失败:', error);
      }
    },

    async fetchContacts() {
      try {
        this.isLoadingContacts = true;
        const response = await this.$http.messages.getContacts();
        if (response.success) {
          this.contacts = response.data;

          for (const contact of this.contacts) {
            await this.fetchLastMessage(contact._id);
          }
        }
      } catch (error) {
        console.error('获取联系人列表失败:', error);
        this.contacts = [];
      } finally {
        this.isLoadingContacts = false;
      }
    },

    async fetchLastMessage(userId) {
      try {
        const response = await this.$http.messages.getHistory(userId, {
          page: 1,
          limit: 1
        });
        if (response.success && response.data.length > 0) {
          const lastMessage = response.data[0];
          this.lastMessages[userId] = lastMessage.content;
        } else {
          this.lastMessages[userId] = '无消息';
        }
      } catch (error) {
        console.error(`获取联系人 ${userId} 的最后一条消息失败:`, error);
        this.lastMessages[userId] = '无消息';
      }
    },

    async fetchMessages(userId) {
      try {
        this.isLoadingMessages = true;
        const response = await this.$http.messages.getHistory(userId, {
          page: 1,
          limit: 20
        });
        if (response.success) {
          this.messages = response.data.map(message => {
            const processed = { ...message };
            if (typeof message.sender === 'object' && message.sender._id) {
              processed.senderInfo = message.sender;
              processed.sender = message.sender._id.toString();
            } else if (typeof message.sender !== 'string') {
              processed.sender = message.sender.toString();
            }
            return processed;
          });

          if (this.messages.length > 0) {
            const lastMessage = this.messages[this.messages.length - 1];
            this.lastMessages[userId] = lastMessage.content;
          } else {
            this.lastMessages[userId] = '无消息';
          }

          this.$nextTick(() => {
            if (this.$refs.chatWindow) {
              this.$refs.chatWindow.scrollToBottom();
            }
          });
        }
      } catch (error) {
        console.error('获取消息历史失败:', error);
      } finally {
        this.isLoadingMessages = false;
      }
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
        const response = await this.$http.messages.send({
          receiver: this.selectedContact._id,
          content: this.messageInput.trim()
        });

        if (response.success) {
          const newMessage = response.data;
          if (typeof newMessage.sender === 'object' && newMessage.sender._id) {
            newMessage.senderInfo = newMessage.sender;
            newMessage.sender = newMessage.sender._id.toString();
          } else {
            newMessage.sender = newMessage.sender.toString();
          }
          this.messages.push(newMessage);

          this.lastMessages[this.selectedContact._id] = newMessage.content;

          this.messageInput = '';
          if (this.$refs.chatWindow) {
            this.$refs.chatWindow.scrollToBottom();
          }
        }
      } catch (error) {
        console.error('发送消息失败:', error);
        if (error.response && error.response.status === 403) {
          showNotification('发送消息失败：' + error.response.data.message || '请先关注对方才能发送消息', 'error');
        } else {
          showNotification('发送消息失败，请稍后重试', 'error');
        }
      }
    },

    async loadMoreMessages() {
      if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return;

      try {
        this.isLoadingMore = true;

        const chatWindow = this.$refs.chatWindow;
        const scrollInfo = chatWindow ? chatWindow.getScrollInfo() : null;
        const oldScrollTop = scrollInfo ? scrollInfo.scrollTop : 0;
        const oldScrollHeight = scrollInfo ? scrollInfo.scrollHeight : 0;

        this.messagePage++;

        const response = await this.$http.messages.getHistory(this.selectedContact._id, {
          page: this.messagePage,
          limit: 20
        });

        if (response.success) {
          const newMessages = response.data;
          if (newMessages.length === 0) {
            this.hasMoreMessages = false;
          } else {
            const processedMessages = newMessages.map(message => {
              const processed = { ...message };
              if (typeof message.sender === 'object' && message.sender._id) {
                processed.senderInfo = message.sender;
                processed.sender = message.sender._id.toString();
              } else if (typeof message.sender !== 'string') {
                processed.sender = message.sender.toString();
              }
              return processed;
            });

            this.messages = [...processedMessages, ...this.messages];

            if (chatWindow) {
              chatWindow.restoreScrollPosition(oldScrollTop, oldScrollHeight);
            }
          }
        }
      } catch (error) {
        console.error('加载更多消息失败:', error);
      } finally {
        this.isLoadingMore = false;
      }
    },

    resetMessageState() {
      this.messages = [];
      this.messagePage = 1;
      this.hasMoreMessages = true;
      this.isLoadingMore = false;
    },

    async markAsRead(userId) {
      try {
        await this.$http.messages.markAsRead({
          userId: userId
        });
        this.unreadCounts[userId] = 0;
      } catch (error) {
        console.error('标记消息为已读失败:', error);
      }
    },

    async markNotificationAsRead(notificationId) {
      try {
        await this.$http.notifications.markAsRead(notificationId);
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      } catch (error) {
        console.error('标记通知为已读失败:', error);
      }
    },

    clearChat() {
      if (confirm('确定要清空聊天记录吗？')) {
        this.messages = [];
      }
    },

    switchTab(tab) {
      this.activeTab = tab;
      if (tab === 'notifications' && this.notifications.length === 0) {
        this.fetchNotifications();
      }
    },

    async fetchNotifications() {
      try {
        this.isLoadingNotifications = true;
        const response = await this.$http.notifications.getList();

        if (response.success) {
          this.notifications = response.data;
          this.unreadNotificationCount = response.meta ? response.meta.unread : 0;
          this.totalNotificationCount = response.meta ? response.meta.total : 0;
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        this.notifications = [];
        this.unreadNotificationCount = 0;
        this.totalNotificationCount = 0;
      } finally {
        this.isLoadingNotifications = false;
      }
    },

    handleNotificationClick(notification) {
      if (!notification.isRead) {
        this.markNotificationAsRead(notification._id);
      }
      if (notification.resourceType === 'blog' || notification.resourceType === 'comment') {
        this.fetchBlogDetail(notification.resourceId);
      } else if (notification.type === 'follow') {
        this.$router.push(`/profile/${notification.sender._id}`);
      }
    },

    async fetchBlogDetail(blogId) {
      try {
        const response = await this.$http.blogs.getDetail(blogId);
        if (response.success) {
          const blog = response.data;
          this.currentBlog = {
            ...blog,
            id: blog._id,
            date: new Date(blog.createdAt).toLocaleDateString('zh-CN')
          };
          this.showBlogModal = true;
          document.body.style.overflow = 'hidden';
        }
      } catch (error) {
        console.error('获取博客详情失败:', error);
      }
    },

    closeBlogModal() {
      this.showBlogModal = false;
      this.currentBlog = null;
      document.body.style.overflow = '';
    },

    async deleteNotification(notificationId) {
      try {
        const response = await this.$http.notifications.delete(notificationId);

        if (response.success) {
          const deletedNotification = this.notifications.find(n => n._id === notificationId);
          this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
          this.totalNotificationCount--;

          if (!deletedNotification.isRead && this.unreadNotificationCount > 0) {
            this.unreadNotificationCount--;
          }
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        const deletedNotification = this.notifications.find(n => n._id === notificationId);
        this.notifications = this.notifications.filter(notification => notification._id !== notificationId);
        this.totalNotificationCount--;

        if (!deletedNotification.isRead && this.unreadNotificationCount > 0) {
          this.unreadNotificationCount--;
        }
      }
    }
  }
};
</script>

<style scoped>
.messages-container {
  min-height: 100vh;
  font-family: var(--font-family);
  padding: 20px;
  background: linear-gradient(135deg, var(--background-light) 0%, var(--background-dark) 100%);
}

.messages-content {
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh;
  height: 80vh;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  overflow: hidden;
}

.messages-section {
  display: flex;
  gap: 0;
  height: 100%;
}

@media (max-width: 768px) {
  .messages-container {
    padding: 10px;
  }

  .messages-content {
    height: 85vh;
  }

  .messages-section {
    flex-direction: column;
  }
}
</style>

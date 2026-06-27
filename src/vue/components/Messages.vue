<template>
  <div class="msgs">
    <div class="msgs__shell">
      <!-- Contacts panel -->
      <aside class="msgs__contacts" :class="{ 'msgs__contacts--hidden': isMobile && selectedContact }">
        <div class="msgs__contacts-header">
          <h2 class="msgs__title">消息</h2>
          <div class="msgs__tabs">
            <button :class="['msgs__tab', { 'msgs__tab--active': activeTab === 'messages' }]" @click="switchTab('messages')">
              私信<span v-if="unreadMessageCount" class="msgs__badge">{{ unreadMessageCount }}</span>
            </button>
            <button :class="['msgs__tab', { 'msgs__tab--active': activeTab === 'notifications' }]" @click="switchTab('notifications')">
              通知<span v-if="unreadNotificationCount" class="msgs__badge">{{ unreadNotificationCount }}</span>
            </button>
          </div>
        </div>

        <div class="msgs__search" v-if="activeTab === 'messages'">
          <input v-model="searchQuery" placeholder="搜索联系人..." class="msgs__search-input">
        </div>

        <ContactList v-if="activeTab === 'messages'" :contacts="contacts" :filtered-contacts="filteredContacts" :selected-contact="selectedContact" :search-query="searchQuery" :is-loading="isLoadingContacts" :last-messages="lastMessages" :unread-counts="unreadCounts" @update:searchQuery="searchQuery = $event" @select="selectContact" />
        <NotificationList v-else :notifications="notifications" :is-loading="isLoadingNotifications" @click-notification="handleNotificationClick" @delete-notification="deleteNotification" />
      </aside>

      <!-- Chat panel -->
      <section class="msgs__chat" :class="{ 'msgs__chat--active': !isMobile || selectedContact }">
        <div class="msgs__chat-header" v-if="selectedContact">
          <button v-if="isMobile" class="msgs__back" @click="selectedContact = null">&larr;</button>
          <span class="msgs__chat-name">{{ selectedContact.username }}</span>
          <button class="msgs__chat-clear" @click="clearChat" title="清空">&times;</button>
        </div>
        <ChatWindow v-if="selectedContact" ref="chatWindow" :selected-contact="selectedContact" :messages="messages" :message-input="messageInput" :current-user-id="currentUserId" :is-loading-messages="isLoadingMessages" :is-loading-more="isLoadingMore" @update:messageInput="messageInput = $event" @send="sendMessage" @clear-chat="clearChat" @load-more="loadMoreMessages" />
        <div v-else class="msgs__chat-empty">选择一个联系人开始聊天</div>
      </section>
    </div>

    <BlogModal v-if="showBlogModal" :visible="showBlogModal" :blog="currentBlog" :user="currentUser" @close="closeBlogModal" />
  </div>
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
  data() { return { contacts: [], messages: [], selectedContact: null, messageInput: '', isLoadingContacts: false, isLoadingMessages: false, isLoadingMore: false, searchQuery: '', currentUserId: '', unreadCounts: {}, lastMessages: {}, unreadMessageCount: 0, messagePage: 1, hasMoreMessages: true, notifications: [], isLoadingNotifications: false, unreadNotificationCount: 0, totalNotificationCount: 0, activeTab: 'messages', showBlogModal: false, currentBlog: null, currentUser: null, isMobile: window.innerWidth <= 768 }; },
  computed: { filteredContacts() { if (!this.searchQuery) return this.contacts; const q = this.searchQuery.toLowerCase(); return this.contacts.filter(c => c.username.toLowerCase().includes(q)); } },
  created() {
    sessionStorage.removeItem('blogShareInfo');
    this.fetchCurrentUser(); this.fetchContacts(); this.fetchNotifications();
  },
  mounted() { this.setupWebSocket(); },
  beforeDestroy() { document.body.style.overflow = ''; this.removeSocketListeners(); },
  methods: {
    async setupWebSocket() { try { if (!this.currentUserId) await this.fetchCurrentUser(); if (await this.initWebSocket()) this.setupSocketListeners(); } catch {} },
    setupSocketListeners() {
      this.addSocketListener('newMessage', (msg) => {
        const sid = typeof msg.sender === 'object' ? msg.sender._id?.toString() : msg.sender?.toString();
        if (this.selectedContact && sid === this.selectedContact._id) { this.messages.push(msg); this.lastMessages[this.selectedContact._id] = msg.content; this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); }); }
        else { this.lastMessages[sid] = msg.content; this.unreadCounts[sid] = (this.unreadCounts[sid] || 0) + 1; this.unreadMessageCount++; }
      });
      this.addSocketListener('notification', (n) => { this.notifications.unshift(n); this.unreadNotificationCount++; this.totalNotificationCount++; });
    },
    async fetchCurrentUser() { try { const r = await this.$http.auth.getCurrentUser(); if (r.data) { this.currentUserId = r.data._id.toString(); this.currentUser = r.data; } } catch {} },
    async fetchContacts() { this.isLoadingContacts = true; try { const r = await this.$http.messages.getContacts(); if (r.success) { this.contacts = r.data; for (const c of this.contacts) await this.fetchLastMessage(c._id); } } catch {} finally { this.isLoadingContacts = false; } },
    async fetchLastMessage(uid) { try { const r = await this.$http.messages.getHistory(uid, { page: 1, limit: 1 }); this.lastMessages[uid] = (r.success && r.data.length) ? r.data[0].content : ''; } catch { this.lastMessages[uid] = ''; } },
    async fetchMessages(uid) { this.isLoadingMessages = true; try { const r = await this.$http.messages.getHistory(uid, { page: 1, limit: 20 }); if (r.success) { this.messages = r.data; this.lastMessages[uid] = this.messages.length ? this.messages[this.messages.length - 1].content : ''; this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); }); } } catch {} finally { this.isLoadingMessages = false; } },
    selectContact(c) { this.selectedContact = c; this.resetMsg(); this.fetchMessages(c._id); this.markAsRead(c._id); },
    async sendMessage() { if (!this.selectedContact || !this.messageInput.trim()) return; try { const r = await this.$http.messages.send({ receiver: this.selectedContact._id, content: this.messageInput.trim() }); if (r.success) { this.messages.push(r.data); this.lastMessages[this.selectedContact._id] = r.data.content; this.messageInput = ''; this.$nextTick(() => { if (this.$refs.chatWindow) this.$refs.chatWindow.scrollToBottom(); }); } } catch (e) { showNotification(e.response?.status === 403 ? '请先关注对方' : '发送失败', 'error'); } },
    async loadMoreMessages() { if (!this.selectedContact || this.isLoadingMore || !this.hasMoreMessages) return; this.isLoadingMore = true; try { const cw = this.$refs.chatWindow; const si = cw?.getScrollInfo(); this.messagePage++; const r = await this.$http.messages.getHistory(this.selectedContact._id, { page: this.messagePage, limit: 20 }); if (r.success && r.data.length) { this.messages = [...r.data.reverse(), ...this.messages]; if (cw && si) cw.restoreScrollPosition(si.scrollTop, si.scrollHeight); } else { this.hasMoreMessages = false; } } catch {} finally { this.isLoadingMore = false; } },
    resetMsg() { this.messages = []; this.messagePage = 1; this.hasMoreMessages = true; this.isLoadingMore = false; },
    async markAsRead(uid) { try { await this.$http.messages.markAsRead({ userId: uid }); this.unreadCounts[uid] = 0; } catch {} },
    clearChat() { if (confirm('清空聊天记录？')) this.messages = []; },
    switchTab(t) { this.activeTab = t; if (t === 'notifications' && !this.notifications.length) this.fetchNotifications(); },
    async fetchNotifications() { this.isLoadingNotifications = true; try { const r = await this.$http.notifications.getList(); if (r.success) { this.notifications = r.data; this.unreadNotificationCount = r.meta?.unread || 0; this.totalNotificationCount = r.meta?.total || 0; } } catch {} finally { this.isLoadingNotifications = false; } },
    handleNotificationClick(n) { if (!n.isRead) this.$http.notifications.markAsRead(n._id).catch(() => {}); if (n.resourceType === 'blog' || n.resourceType === 'comment') this.fetchBlogDetail(n.resourceId); else if (n.type === 'follow') this.$router.push(`/profile/${n.sender?._id}`); },
    async fetchBlogDetail(id) { try { const r = await this.$http.blogs.getDetail(id); if (r.success) { this.currentBlog = { ...r.data, id: r.data._id }; this.showBlogModal = true; document.body.style.overflow = 'hidden'; } } catch {} },
    closeBlogModal() { this.showBlogModal = false; this.currentBlog = null; document.body.style.overflow = ''; },
    async deleteNotification(id) { try { await this.$http.notifications.delete(id); } catch {} this.notifications = this.notifications.filter(n => n._id !== id); this.totalNotificationCount--; }
  }
};
</script>

<style scoped>
.msgs { min-height: 100vh; background: #faf8f5; padding: 20px; }
.msgs__shell { max-width: 1100px; margin: 0 auto; height: calc(100vh - 100px); min-height: 500px; background: #fff; border-radius: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.05); display: flex; overflow: hidden; }

.msgs__contacts { width: 340px; border-right: 1px solid #f3f4f6; display: flex; flex-direction: column; flex-shrink: 0; }
.msgs__contacts-header { padding: 20px 20px 12px; }
.msgs__title { font-size: 1.2rem; font-weight: 700; color: #1a1a1a; margin-bottom: 12px; }
.msgs__tabs { display: flex; gap: 6px; }
.msgs__tab { flex: 1; padding: 7px; border-radius: 9999px; border: none; background: #f3f4f6; color: #6b7280; font-size: 0.8rem; font-weight: 500; cursor: pointer; transition: all 0.2s; position: relative; }
.msgs__tab--active { background: #e11d48; color: #fff; }
.msgs__badge { position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; border-radius: 9px; background: #ef4444; color: #fff; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
.msgs__search { padding: 8px 16px; }
.msgs__search-input { width: 100%; padding: 8px 14px; border: 1.5px solid #e5e7eb; border-radius: 9999px; font-size: 0.8rem; outline: none; transition: border-color 0.2s; }
.msgs__search-input:focus { border-color: #e11d48; }

.msgs__chat { flex: 1; display: flex; flex-direction: column; }
.msgs__chat-header { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-bottom: 1px solid #f3f4f6; }
.msgs__back { width: 32px; height: 32px; border-radius: 50%; border: none; background: #f3f4f6; cursor: pointer; font-size: 1rem; }
.msgs__chat-name { flex: 1; font-weight: 600; font-size: 0.95rem; }
.msgs__chat-clear { border: none; background: none; font-size: 1.2rem; color: #9ca3af; cursor: pointer; }
.msgs__chat-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #d1d5db; font-size: 0.9rem; }

@media (max-width: 768px) {
  .msgs { padding: 0; }
  .msgs__shell { height: 100vh; border-radius: 0; position: relative; }
  .msgs__contacts { width: 100%; position: absolute; inset: 0; z-index: 1; transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .msgs__contacts--hidden { transform: translateX(-100%); }
  .msgs__chat { position: absolute; inset: 0; z-index: 2; background: #fff; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
  .msgs__chat--active { transform: translateX(0); }
}
</style>

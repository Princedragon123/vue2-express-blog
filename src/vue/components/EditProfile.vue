<template>
  <div class="edit">
    <div class="edit__container">
      <header class="edit__header"><h1 class="edit__title">编辑资料</h1><p class="edit__subtitle">更新你的个人信息</p></header>
      <div v-if="error" class="edit__error"><p>{{ error }}</p><button class="btn btn-primary" @click="fetchUserInfo">重新加载</button></div>
      <div v-else-if="isLoading" class="loading-state"><div class="spinner"></div><p>加载中...</p></div>
      <div v-else class="edit__form">
        <AvatarUploader :avatar="formData.avatar" @upload="handleAvatarUpload" />
        <BackgroundEditor :cover-image="formData.coverImage" @upload="handleCoverUpload" />
        <ProfileForm :username.sync="formData.username" :bio.sync="formData.bio" :location.sync="formData.location" :website.sync="formData.website" :occupation.sync="formData.occupation" />
        <FormActions :is-submitting="isSubmitting" @cancel="cancelEdit" @save="saveChanges" />
      </div>
    </div>
  </div>
</template>

<script>
import AvatarUploader from './my-profile/AvatarUploader.vue';
import BackgroundEditor from './my-profile/BackgroundEditor.vue';
import ProfileForm from './my-profile/ProfileForm.vue';
import FormActions from './my-profile/FormActions.vue';
import { showNotification } from '../utils/notification';

export default {
  name: 'EditProfile',
  components: { AvatarUploader, BackgroundEditor, ProfileForm, FormActions },
  data() { return { isLoading: true, isSubmitting: false, error: null, formData: { username: '', avatar: '', coverImage: '', bio: '', location: '', website: '', occupation: '' } }; },
  mounted() { this.fetchUserInfo(); },
  methods: {
    async fetchUserInfo() { this.isLoading = true; this.error = null; try { const token = this.$store.getters.getToken; if (!token) { this.error = '请先登录'; return; } const me = await this.$http.auth.getCurrentUser(); if (!me.data) { this.error = '获取用户信息失败'; return; } const uid = me.data.id || me.data._id; const r = await this.$http.users.getInfo(uid); if (r.success && r.data) { const u = (r.data.user || r.data); const p = u.profile || {}; this.formData = { username: u.username || '', avatar: p.avatar || '', coverImage: p.coverImage || '', bio: p.bio || '', location: p.location || '', website: p.website || '', occupation: p.occupation || '' }; } else { this.error = '获取用户信息失败'; } } catch (e) { this.error = e.message || '获取失败'; } finally { this.isLoading = false; } },
    async handleAvatarUpload(e) { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('avatar', f); this.isSubmitting = true; try { const r = await this.$http.post('/api/users/upload-avatar', fd); if (r.success) { this.formData.avatar = r.data.url; showNotification('上传成功', 'success'); } else { showNotification(r.message, 'error'); } } catch { showNotification('上传失败', 'error'); } finally { this.isSubmitting = false; } },
    async handleCoverUpload(e) { const f = e.target.files[0]; if (!f) return; const fd = new FormData(); fd.append('coverImage', f); this.isSubmitting = true; try { const r = await this.$http.post('/api/users/upload-cover', fd); if (r.success) { this.formData.coverImage = r.data.url; showNotification('上传成功', 'success'); } else { showNotification(r.message, 'error'); } } catch { showNotification('上传失败', 'error'); } finally { this.isSubmitting = false; } },
    async saveChanges() { if (!this.formData.username.trim()) { showNotification('请输入用户名', 'warning'); return; } this.isSubmitting = true; try { const uid = this.$store.getters.getUserId; const r = await this.$http.put(`/api/users/${uid}`, { bio: this.formData.bio, location: this.formData.location, website: this.formData.website, occupation: this.formData.occupation, coverImage: this.formData.coverImage }); if (r.success) { showNotification('更新成功', 'success'); this.$router.push('/my-profile'); } else { showNotification(r.message, 'error'); } } catch { showNotification('更新失败', 'error'); } finally { this.isSubmitting = false; } },
    cancelEdit() { this.$router.push('/my-profile'); }
  }
};
</script>

<style scoped>
.edit { min-height: 100vh; background: #faf8f5; }
.edit__container { max-width: 800px; margin: 0 auto; padding: 32px 20px 80px; }
.edit__header { text-align: left; margin-bottom: 28px; }
.edit__title { font-size: 1.5rem; font-weight: 700; color: #1a1a1a; margin: 0 0 4px; }
.edit__subtitle { font-size: 0.9rem; color: #9ca3af; margin: 0; }
.edit__error { text-align: center; padding: 40px; background: #fff; border-radius: 16px; }
.edit__error p { color: #6b7280; margin-bottom: 16px; }
.edit__form { background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
@media (max-width: 768px) { .edit__container { padding: 20px 12px 80px; } .edit__form { padding: 24px; } }
</style>

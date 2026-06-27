<template>
  <div class="edit-profile-page">
    <main class="edit-profile-page__main">
      <div class="edit-profile-page__container">
        <header class="edit-profile-page__header">
          <h1 class="edit-profile-page__title">编辑个人资料</h1>
          <p class="edit-profile-page__subtitle">更新你的个人信息和头像</p>
        </header>

        <div v-if="error" class="error-state">
          <p>{{ error }}</p>
          <button class="btn btn--primary" @click="fetchUserInfo">重新加载</button>
        </div>

        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else class="edit-profile-page__form">
          <AvatarUploader :avatar="formData.avatar" @upload="handleAvatarUpload" />
          <BackgroundEditor :cover-image="formData.coverImage" @upload="handleCoverUpload" />
          <ProfileForm
            :username.sync="formData.username"
            :bio.sync="formData.bio"
            :location.sync="formData.location"
            :website.sync="formData.website"
            :occupation.sync="formData.occupation"
          />
          <FormActions
            :is-submitting="isSubmitting"
            @cancel="cancelEdit"
            @save="saveChanges"
          />
        </div>
      </div>
    </main>
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

  data() {
    return {
      isLoading: true,
      isSubmitting: false,
      error: null,
      formData: {
        username: '', avatar: '', coverImage: '',
        bio: '', location: '', website: '', occupation: ''
      }
    };
  },

  mounted() {
    this.fetchUserInfo();
  },

  methods: {
    async fetchUserInfo() {
      this.isLoading = true;
      this.error = null;
      try {
        const token = this.$store.getters.getToken;
        if (!token) { this.error = '请先登录'; return; }

        const meData = await this.$http.auth.getCurrentUser();
        if (!meData.data) { this.error = '获取用户信息失败'; return; }

        const userId = meData.data.id || meData.data._id;
        if (!userId) { this.error = '用户信息不完整'; return; }

        const userResponse = await this.$http.users.getInfo(userId);
        if (userResponse.success && userResponse.data) {
          const responseData = userResponse.data;
          const user = responseData.user || responseData;
          const profile = user.profile || {};

          this.formData = {
            username: user.username || '',
            avatar: profile.avatar || '',
            coverImage: profile.coverImage || '',
            bio: profile.bio || '',
            location: profile.location || '',
            website: profile.website || '',
            occupation: profile.occupation || ''
          };
        } else {
          this.error = '获取用户详细信息失败';
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        this.error = error.message || '获取用户信息失败';
      } finally {
        this.isLoading = false;
      }
    },

    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('avatar', file);
      this.isSubmitting = true;
      try {
        const data = await this.$http.post('/api/users/upload-avatar', formData);
        if (data.success) { this.formData.avatar = data.data.url; showNotification('头像上传成功！', 'success'); }
        else { showNotification(`头像上传失败: ${data.message}`, 'error'); }
      } catch {
        showNotification('上传头像失败，请稍后重试', 'error');
      } finally { this.isSubmitting = false; }
    },

    async handleCoverUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('coverImage', file);
      this.isSubmitting = true;
      try {
        const data = await this.$http.post('/api/users/upload-cover', formData);
        if (data.success) { this.formData.coverImage = data.data.url; showNotification('背景图上传成功！', 'success'); }
        else { showNotification(`背景图上传失败: ${data.message}`, 'error'); }
      } catch {
        showNotification('上传背景图失败，请稍后重试', 'error');
      } finally { this.isSubmitting = false; }
    },

    async saveChanges() {
      if (!this.formData.username.trim()) { showNotification('请输入用户名', 'warning'); return; }
      this.isSubmitting = true;
      try {
        const token = this.$store.getters.getToken;
        if (!token) { showNotification('请先登录', 'warning'); this.$router.replace('/login'); return; }

        const userId = this.$store.getters.getUserId;
        const userData = {
          bio: this.formData.bio, location: this.formData.location,
          website: this.formData.website, occupation: this.formData.occupation,
          coverImage: this.formData.coverImage
        };
        const data = await this.$http.put(`/api/users/${userId}`, userData);
        if (data.success) { showNotification('个人资料更新成功！', 'success'); this.$router.push('/my-profile'); }
        else { showNotification(`更新失败: ${data.message}`, 'error'); }
      } catch {
        showNotification('更新失败，请稍后重试', 'error');
      } finally { this.isSubmitting = false; }
    },

    cancelEdit() { this.$router.push('/my-profile'); }
  }
};
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #fef3c7 0%, #fdf2f8 40%, #f0f9ff 100%);
}

.edit-profile-page__main {
  padding-bottom: 70px;
}

.edit-profile-page__container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.edit-profile-page__header {
  text-align: center;
  padding: 40px 0 30px;
  margin-bottom: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.edit-profile-page__title {
  margin: 0 0 8px;
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
}

.edit-profile-page__subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #999;
}

.edit-profile-page__form {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  padding: 24px;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border-radius: 16px;
  color: #991b1b;
}

.error-state p { margin-bottom: 16px; }

.loading-state { text-align: center; padding: 60px 20px; color: #999; }

.spinner {
  width: 40px; height: 40px;
  border: 3px solid #f3f3f3;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .edit-profile-page__container { padding: 12px; }
  .edit-profile-page__header { padding: 24px 0 20px; border-radius: 12px; }
  .edit-profile-page__title { font-size: 1.4rem; }
  .edit-profile-page__form { padding: 16px; border-radius: 12px; }
}
</style>

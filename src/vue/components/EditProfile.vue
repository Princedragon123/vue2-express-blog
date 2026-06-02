<!-- EditProfile.vue - 编辑个人资料组件 -->
<template>
  <div class="edit-profile-page">
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">编辑个人资料</h1>
          <p class="page-subtitle">更新你的个人信息和头像</p>
        </div>

        <div v-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="fetchUserInfo">重新加载</button>
        </div>

        <div v-else-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else class="edit-profile-form">
          <AvatarUploader
            :avatar="formData.avatar"
            @upload="handleAvatarUpload"
          />

          <BackgroundEditor
            :cover-image="formData.coverImage"
            @upload="handleCoverUpload"
          />

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

    <MobileBottomNav />
  </div>
</template>

<script>
import MobileBottomNav from "./MobileBottomNav.vue";
import AvatarUploader from "./my-profile/AvatarUploader.vue";
import BackgroundEditor from "./my-profile/BackgroundEditor.vue";
import ProfileForm from "./my-profile/ProfileForm.vue";
import FormActions from "./my-profile/FormActions.vue";

export default {
  name: "EditProfile",
  components: {
    MobileBottomNav,
    AvatarUploader,
    BackgroundEditor,
    ProfileForm,
    FormActions,
  },
  data() {
    return {
      isLoading: true,
      isSubmitting: false,
      error: null,
      formData: {
        username: "",
        avatar: "",
        coverImage: "",
        bio: "",
        location: "",
        website: "",
        occupation: "",
      },
    };
  },

  mounted() {
    this.fetchUserInfo();
  },

  methods: {
    getAuthToken() {
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    },

    async fetchUserInfo() {
      this.isLoading = true;
      this.error = null;

      try {
        const token = this.getAuthToken();
        if (!token) {
          this.error = "请先登录";
          this.isLoading = false;
          return;
        }

        const meData = await this.$http.get("/api/auth/me");

        if (!meData.data) {
          this.error = "获取用户信息失败";
          this.isLoading = false;
          return;
        }

        const userData = meData.data;
        const userId = userData.id || userData._id;

        if (!userId) {
          this.error = "用户信息不完整";
          this.isLoading = false;
          return;
        }

        const userResponseData = await this.$http.get(`/api/users/${userId}`);

        // ✅ 修复：从 data.user 里取！
        if (userResponseData.success && userResponseData.data) {
          const responseData = userResponseData.data;
          const detailedUser = responseData.user || responseData;  // 兼容两种情况
          const profile = detailedUser.profile || {};
          
          // 🐾 调试信息：打印获取到的数据
          console.log("📥 获取到的完整响应:", userResponseData);
          console.log("📥 获取到的用户详细信息:", detailedUser);
          console.log("📥 获取到的 profile:", profile);
          console.log("📥 avatar:", profile.avatar);
          console.log("📥 coverImage:", profile.coverImage);

          this.formData = {
            username: detailedUser.username || "",
            avatar: profile.avatar || "",
            coverImage: profile.coverImage || "",
            bio: profile.bio || "",
            location: profile.location || "",
            website: profile.website || "",
            occupation: profile.occupation || "",
          };
          
          // 🐾 调试信息：打印 formData
          console.log("📥 formData:", this.formData);
        } else {
          this.error = "获取用户详细信息失败";
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        this.error = error.message || "获取用户信息失败";
      } finally {
        this.isLoading = false;
      }
    },

    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("avatar", file);

        this.isSubmitting = true;

        try {
          const data = await this.$http.post(
            "/api/users/upload-avatar",
            formData,
          );

          if (data.success) {
            this.formData.avatar = data.data.url;
            this.showNotification("头像上传成功！", "success");
          } else {
            this.showNotification(`头像上传失败: ${data.message}`, "error");
          }
        } catch (error) {
          console.error("上传头像失败:", error);
          this.showNotification("上传头像失败，请稍后重试", "error");
        } finally {
          this.isSubmitting = false;
        }
      }
    },

    async handleCoverUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("coverImage", file);

        this.isSubmitting = true;

        try {
          const data = await this.$http.post(
            "/api/users/upload-cover",
            formData,
          );

          if (data.success) {
            this.formData.coverImage = data.data.url;
            this.showNotification("背景图上传成功！", "success");
          } else {
            this.showNotification(`背景图上传失败: ${data.message}`, "error");
          }
        } catch (error) {
          console.error("上传背景图失败:", error);
          this.showNotification("上传背景图失败，请稍后重试", "error");
        } finally {
          this.isSubmitting = false;
        }
      }
    },

    async saveChanges() {
      if (!this.formData.username.trim()) {
        this.showNotification("请输入用户名", "warning");
        return;
      }

      this.isSubmitting = true;

      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          this.showNotification("请先登录", "warning");
          this.isSubmitting = false;
          this.$router.push("/login");
          return;
        }

        const userData = {
          bio: this.formData.bio,
          location: this.formData.location,
          website: this.formData.website,
          occupation: this.formData.occupation,
          coverImage: this.formData.coverImage,
        };

        const data = await this.$http.put(
          `/api/users/${this.getUserId()}`,
          userData,
        );

        if (data.success) {
          this.showNotification("个人资料更新成功！", "success");
          this.$router.push("/my-profile");
        } else {
          this.showNotification(`更新失败: ${data.message}`, "error");
        }
      } catch (error) {
        console.error("更新个人资料失败:", error);
        this.showNotification("更新失败，请稍后重试", "error");
      } finally {
        this.isSubmitting = false;
      }
    },

    cancelEdit() {
      this.$router.push("/my-profile");
    },

    getUserId() {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          return payload.id || payload._id;
        } catch (error) {
          console.error("解析token失败:", error);
          return "";
        }
      }
      return "";
    },

    async updateAuthState() {
      try {
        const response = await this.$http.get("/auth/me");
        if (response.success && response.data) {
          const userData = response.data;
          const user = {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            avatar: userData.profile?.avatar,
            profile: userData.profile,
          };

          const token = this.$store.getters.getToken;
          this.$store.dispatch('loginSuccess', {
            user,
            token,
            rememberMe: localStorage.getItem("token") !== null
          });
        }
      } catch (error) {
        console.warn("更新认证状态失败（非致命错误）:", error.message);
      }
    },

    showNotification(message, type = "info") {
      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="nav-icon">${this.getNotificationIcon(type)}</span>
          <span>${message}</span>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add("show");
      }, 10);

      setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
    },

    getNotificationIcon(type) {
      switch (type) {
        case "success":
          return "✅";
        case "error":
          return "❌";
        case "warning":
          return "⚠️";
        default:
          return "ℹ️";
      }
    },
  },
};
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background-color: #fafafa;
}

.main-content {
  padding-bottom: 70px;
}

.page-header {
  background-color: white;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #8e8e8e;
}

.edit-profile-form {
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-bottom: 30px;
}

.error-message {
  background-color: #fee2e2;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
}

.error-message p {
  margin: 0 0 15px;
  color: #991b1b;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #8e8e8e;
  font-size: 1rem;
}

.btn-primary {
  padding: 12px 30px;
  background-color: #ff6b9d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #ff527d;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 107, 157, 0.3);
}
</style>

<style>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  transform: translateX(100%);
  transition: transform 0.3s ease, opacity 0.3s ease;
  opacity: 0;
}

.notification.show {
  transform: translateX(0);
  opacity: 1;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notification-content .nav-icon {
  font-size: 1.2rem;
}

.notification-success {
  background-color: #dcfce7;
  color: #166534;
}

.notification-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.notification-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.notification-info {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>

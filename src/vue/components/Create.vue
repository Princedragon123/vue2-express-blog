<template>
  <div class="create-page">
    <main class="main-content">
      <div class="page-header">
        <div class="container">
          <h1 class="page-title">{{ isEditMode ? "编辑攻略" : "创作攻略" }}</h1>
          <p class="page-subtitle">
            {{ isEditMode ? "修改你的攻略内容" : "分享你的经验和知识" }}
          </p>
        </div>
      </div>

      <div class="container">
        <form class="create-form" @submit.prevent="submitForm">
          <div class="form-section">
            <label class="form-label">文章类型</label>
            <div class="article-type-selector">
              <button
                type="button"
                class="type-btn"
                :class="{ active: formData.articleType === 'long' }"
                @click="setArticleType('long')"
                :disabled="isEditMode"
              >
                <span class="nav-icon">📝</span>
                <span>长文章</span>
                <small>知乎风格</small>
              </button>
              <button
                type="button"
                class="type-btn"
                :class="{ active: formData.articleType === 'short' }"
                @click="setArticleType('short')"
                :disabled="isEditMode"
              >
                <span class="nav-icon">📱</span>
                <span>短文章</span>
                <small>小红书风格</small>
              </button>
            </div>
            <p v-if="isEditMode" class="form-hint" style="color: #666">
              编辑模式下不支持切换文章类型
            </p>
          </div>

          <div class="form-section">
            <label for="title" class="form-label">文章标题</label>
            <input
              type="text"
              id="title"
              class="form-input"
              placeholder="请输入文章标题"
              v-model="formData.title"
            />
          </div>

          <div class="form-section" v-if="!isEditMode">
            <label for="category" class="form-label">选择分类</label>
            <select
              id="category"
              class="form-select"
              v-model="formData.category"
            >
              <option value="">请选择分类</option>
              <option value="游戏攻略">游戏攻略</option>
              <option value="旅游攻略">旅游攻略</option>
              <option value="美食攻略">美食攻略</option>
              <option value="科技攻略">科技攻略</option>
              <option value="健身攻略">健身攻略</option>
              <option value="美妆攻略">美妆攻略</option>
              <option value="学习攻略">学习攻略</option>
            </select>
          </div>

          <div class="form-section" v-if="formData.topic">
            <label class="form-label">当前话题</label>
            <div class="topic-selector topic-locked">
              <div class="topic-display">
                <span class="topic-name">{{
                  getTopicName(formData.topic)
                }}</span>
              </div>
              <div class="topic-lock-hint">
                <span class="nav-icon">🔒</span>
                <span v-if="isEditMode">话题已锁定，不可修改</span>
                <span v-else>话题已锁定，来自当前页面</span>
              </div>
            </div>
          </div>

          <div v-if="formData.articleType === 'long'">
            <div class="form-section">
              <label class="form-label">封面图片（可选）</label>
              <ImageUploader
                ref="imageUploader"
                :imageUrl="formData.imageUrl"
                @update:imageUrl="formData.imageUrl = $event"
                @notify="showNotification"
              />
            </div>

            <QuillEditorWrapper
              ref="quillEditor"
              v-model="formData.content"
              @notify="showNotification"
              @uploading="isSubmitting = $event"
            />

            <TagInput
              v-model="formData.tags"
              label="标签"
              placeholder="例如：#游戏 #攻略 #技巧"
              inputId="tags"
            />
          </div>

          <div v-else-if="formData.articleType === 'short'">
            <div class="form-section">
              <label class="form-label">封面图片</label>
              <ImageUploader
                ref="imageUploader"
                :imageUrl="formData.imageUrl"
                @update:imageUrl="formData.imageUrl = $event"
                @notify="showNotification"
              />
            </div>

            <div class="form-section">
              <label class="form-label">媒体文件</label>
              <p class="form-hint">支持多张图片或视频，最多9张</p>
              <MediaUploader
                :mediaFiles="formData.mediaFiles"
                :maxCount="9"
                @add-media="onAddMedia"
                @remove-media="onRemoveMedia"
                @notify="showNotification"
              />
            </div>

            <div class="form-section">
              <label for="shortContent" class="form-label">文章内容</label>
              <p class="form-hint">最多2000字</p>
              <textarea
                id="shortContent"
                v-model="formData.shortContent"
                class="form-textarea"
                placeholder="分享你的经验和知识..."
                rows="5"
                maxlength="2000"
              ></textarea>
              <div class="char-count">
                {{ formData.shortContent.length }}/2000
              </div>
            </div>

            <TagInput
              v-model="formData.hashtags"
              label="话题标签"
              hint="例如：#游戏攻略 #旅游体验"
              placeholder="输入话题标签，用空格分隔"
              inputId="hashtags"
            />

            <div class="form-section">
              <label for="location" class="form-label">位置信息（可选）</label>
              <input
                type="text"
                id="location"
                class="form-input"
                placeholder="例如：北京故宫"
                v-model="formData.location"
              />
            </div>
          </div>

          <div class="form-section form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="cancelCreate"
            >
              取消
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span class="nav-icon" v-if="isSubmitting">🔄</span>
              <span class="nav-icon" v-else>{{
                isEditMode ? "📝" : "🚀"
              }}</span>
              {{
                isSubmitting
                  ? isEditMode
                    ? "更新中..."
                    : "发布中..."
                  : isEditMode
                  ? "更新攻略"
                  : "发布攻略"
              }}
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script>
import QuillEditorWrapper from "./create/QuillEditorWrapper.vue";
import ImageUploader from "./create/ImageUploader.vue";
import MediaUploader from "./create/MediaUploader.vue";
import TagInput from "./create/TagInput.vue";
import { showNotification } from "../utils/notification";

export default {
  name: "Create",
  components: {
    QuillEditorWrapper,
    ImageUploader,
    MediaUploader,
    TagInput,
  },
  data() {
    return {
      isSubmitting: false,
      isEditMode: false,
      currentBlogId: null,
      formData: {
        title: "",
        category: "",
        topic: "",
        topicName: "",
        imageUrl: "",
        content: "",
        tags: "",
        articleType: "long",
        mediaFiles: [],
        shortContent: "",
        hashtags: "",
        location: "",
      },
      originalImageUrl: null,
    };
  },

  mounted() {
    if (this.$route.query.topic) {
      this.formData.topic = this.$route.query.topic;
      if (this.$route.query.topicName) {
        this.formData.topicName = this.$route.query.topicName;
      }
    }

    if (this.$route.params.id) {
      this.isEditMode = true;
      this.currentBlogId = this.$route.params.id;
      this.loadBlogDetail(this.currentBlogId);
    }
  },

  methods: {
    showNotification(message, type = "success") {
      // 调用你导入的工具函数
      showNotification(message, type);
    },
    onAddMedia(media) {
      this.formData.mediaFiles.push(media);
    },
    onRemoveMedia(index) {
      this.formData.mediaFiles.splice(index, 1);
    },
    parseTags(tagString) {
      if (!tagString) return [];
      let processed = tagString
        .replace(/,/g, " ")
        .replace(/，/g, " ")
        .replace(/、/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      let tags = processed.split(" ").filter((tag) => tag.trim());
      tags = tags
        .map((tag) => {
          tag = tag.trim();
          if (tag.startsWith("#")) {
            return tag.slice(1);
          }
          return tag;
        })
        .filter((tag) => tag);
      return tags;
    },
    formatTags(tags) {
      if (!tags || !Array.isArray(tags)) return "";
      return tags.map((tag) => `#${tag}`).join(" ");
    },
    getTopicName(topicId) {
      return this.formData.topicName || topicId;
    },

    setArticleType(type) {
      if (this.isEditMode) {
        showNotification("编辑模式下不支持切换文章类型", "warning");
        return;
      }
      this.formData.articleType = type;
      if (type === "long") {
        this.formData.mediaFiles = [];
        this.formData.shortContent = "";
        this.formData.hashtags = "";
        this.formData.location = "";
      } else if (type === "short") {
        this.formData.content = "";
        this.formData.tags = "";
      }
    },

    cancelCreate() {
      if (this.$refs.imageUploader) {
        this.$refs.imageUploader.clearFile();
      }
      this.formData = {
        title: "",
        category: "",
        topic: "",
        topicName: "",
        imageUrl: "",
        content: "",
        tags: "",
        articleType: "long",
        mediaFiles: [],
        shortContent: "",
        hashtags: "",
        location: "",
      };
      if (this.$refs.imageUploader) {
        this.$refs.imageUploader.clearFile();
      }
      this.$router.push("/my-creation");
    },

    async loadBlogDetail(blogId) {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          showNotification("请先登录", "warning");
          return;
        }
        const data = await this.$http.get(`/api/blogs/${blogId}`);
        if (data.success) {
          const blog = data.data;
          let imageUrl = blog.image;
          if (imageUrl) {
            if (imageUrl && imageUrl.startsWith("/static/uploads/")) {
            } else if (
              imageUrl &&
              !imageUrl.startsWith("http://") &&
              !imageUrl.startsWith("https://")
            ) {
              imageUrl = `/static/uploads/${imageUrl.replace(/^\/+|^\/*/, "")}`;
            }
          }
          const mediaFiles = blog.mediaFiles || [];
          const processedMediaFiles = mediaFiles.map((media) => {
            let mediaUrl = media.url;
            if (
              mediaUrl &&
              !mediaUrl.startsWith("http://") &&
              !mediaUrl.startsWith("https://")
            ) {
              if (!mediaUrl.startsWith("/static/uploads/")) {
                mediaUrl = `/static/uploads/${mediaUrl.replace(
                  /^\/+|^\/*/,
                  "",
                )}`;
              }
            }
            return {
              url: mediaUrl,
              mediaType: media.mediaType || "image",
            };
          });
          this.formData = {
            title: blog.title,
            content: blog.content,
            topic: blog.topic ? blog.topic._id : "",
            topicName: blog.topic ? blog.topic.name : "",
            imageUrl: imageUrl,
            tags: this.formatTags(blog.tags),
            articleType: blog.articleType || "long",
            mediaFiles: processedMediaFiles,
            shortContent: blog.shortContent || "",
            hashtags: this.formatTags(blog.hashtags),
            location: blog.location || "",
          };
          if (this.formData.articleType === "long") {
            this.$nextTick(() => {
              if (this.$refs.quillEditor) {
                this.$refs.quillEditor.setContent(blog.content || "");
              }
            });
          }
          this.originalImageUrl = imageUrl;
          this.currentBlogId = blogId;
        } else {
          showNotification(`加载文章失败: ${data.message}`, "error");
        }
      } catch (error) {
        console.error("加载文章详情失败:", error);
        showNotification("加载文章详情失败，请稍后重试", "error");
      }
    },

    validateForm() {
      if (!this.formData.title.trim()) {
        showNotification("请输入文章标题", "warning");
        return false;
      }
      if (this.formData.title.trim().length < 5) {
        showNotification("标题长度至少为 5 个字符", "warning");
        return false;
      }
      if (!this.formData.imageUrl) {
        showNotification("请设置封面图片", "warning");
        return false;
      }
      if (this.formData.articleType === "long") {
        if (!this.formData.content.trim()) {
          showNotification("请输入文章内容", "warning");
          return false;
        }
      } else if (this.formData.articleType === "short") {
        if (!this.formData.shortContent.trim()) {
          showNotification("请输入文章内容", "warning");
          return false;
        }
        if (this.formData.mediaFiles.length === 0) {
          showNotification("请上传媒体文件", "warning");
          return false;
        }
      }
      return true;
    },

    buildSubmitData(imageUrl) {
      const submitData = {
        title: this.formData.title,
        topic: this.formData.topic,
        articleType: this.formData.articleType,
        image: imageUrl,
      };

      if (this.formData.category) {
        const categoryTag = this.formData.category;
        const existingTags = this.parseTags(this.formData.tags);
        if (!existingTags.includes(categoryTag)) {
          existingTags.unshift(categoryTag);
        }
        this.formData.tags = existingTags.join(", ");
      }

      if (this.formData.articleType === "long") {
        submitData.content = this.formData.content;
        submitData.video = "";
        submitData.tags = this.parseTags(this.formData.tags);
        submitData.mediaFiles = [];
        submitData.shortContent = "";
        submitData.hashtags = [];
        submitData.location = "";
      } else if (this.formData.articleType === "short") {
        submitData.mediaFiles = this.formData.mediaFiles;
        submitData.shortContent = this.formData.shortContent;
        submitData.hashtags = this.parseTags(this.formData.hashtags);
        submitData.location = this.formData.location;
        submitData.content = "";
        submitData.video = "";
        submitData.tags = [];
      }

      return submitData;
    },

    async submitForm() {
      if (!this.validateForm()) return;

      this.isSubmitting = true;
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
          showNotification("请先登录", "warning");
          this.isSubmitting = false;
          return;
        }

        const imageFile = this.$refs.imageUploader
          ? this.$refs.imageUploader.getFile()
          : null;
        let uploadData = null;
        if (imageFile) {
          const imageFormData = new FormData();
          imageFormData.append("image", imageFile);
          uploadData = await this.$http.post(
            "/api/blogs/upload-image",
            imageFormData,
          );
          if (!uploadData.success) {
            throw new Error(`图片上传失败: ${uploadData.message}`);
          }
        }

        let imageUrl = this.formData.imageUrl;
        if (uploadData) {
          imageUrl = uploadData.data.url;
        } else if (this.isEditMode) {
          if (imageUrl && imageUrl.startsWith("blob:")) {
            imageUrl = this.originalImageUrl || "";
          } else if (!imageUrl) {
            imageUrl = this.originalImageUrl || "";
          }
        } else {
          if (!uploadData) {
            imageUrl = "";
          }
        }

        if (!imageUrl) {
          showNotification("封面图片上传失败，请重试", "error");
          this.isSubmitting = false;
          return;
        }

        const submitData = this.buildSubmitData(imageUrl);

        let data;
        if (this.isEditMode) {
          data = await this.$http.put(
            `/api/blogs/${this.currentBlogId}`,
            submitData,
          );
        } else {
          data = await this.$http.post("/api/blogs", submitData);
        }

        if (data.success) {
          showNotification(
            this.isEditMode ? "攻略更新成功！" : "攻略发布成功！",
            "success",
          );
          this.cancelCreate();
        } else {
          showNotification(
            this.isEditMode
              ? `更新失败: ${data.message}`
              : `发布失败: ${data.message}`,
            "error",
          );
        }
      } catch (error) {
        console.error("发布失败:", error);
        showNotification(`发布失败: ${error.message}`, "error");
      } finally {
        this.isSubmitting = false;
      }
    },
  },

  beforeDestroy() {
    if (this.$refs.imageUploader) {
      this.$refs.imageUploader.clearFile();
    }
  },
};
</script>

<style scoped>
.create-page {
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    var(--background-light) 0%,
    var(--background-dark) 100%
  );
  font-family: var(--font-family);
}

.main-content {
  padding-bottom: 70px;
}

.page-header {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 40px 0 30px;
  margin-bottom: 30px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin: 20px auto 30px;
  max-width: 1200px;
}

.page-title {
  margin: 0 0 10px;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0;
  font-size: 1rem;
  color: var(--text-secondary);
}

.create-form {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  border: 4px solid var(--background-dark);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  margin-bottom: 30px;
}

.form-section {
  margin-bottom: 25px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--text-primary);
  transition: all 0.3s ease;
  background-color: white;
  font-family: var(--font-family);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-pink);
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
}

.topic-selector {
  position: relative;
}

.topic-lock-hint {
  position: absolute;
  top: 50%;
  right: 16px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--background-dark);
}

.topic-selector.topic-locked .form-select {
  background-color: var(--background-light);
  cursor: not-allowed;
}

.topic-display {
  padding: 12px 15px;
  border: 2px solid var(--background-dark);
  border-radius: 10px;
  background-color: var(--background-light);
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 600;
}

.topic-name {
  display: inline-block;
  padding: 4px 12px;
  background-color: var(--primary-pink);
  color: white;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 600;
}

.form-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: var(--font-family);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
}

.btn {
  border-radius: 30px;
  padding: 12px 30px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-family: var(--font-family);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background: linear-gradient(
    135deg,
    var(--primary-pink),
    var(--secondary-pink)
  );
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--secondary-pink), #be185d);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  border: 2px solid var(--background-dark);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, var(--background-light) 0%, #fff 100%);
  box-shadow: 0 4px 12px rgba(251, 207, 232, 0.3);
}

.form-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 5px;
  margin-bottom: 15px;
  font-family: var(--font-family);
}

.char-count {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: right;
  margin-top: 5px;
  font-family: var(--font-family);
}

.article-type-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.type-btn {
  flex: 1;
  padding: 15px 20px;
  border: 4px solid var(--background-dark);
  border-radius: 10px;
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
  font-family: var(--font-family);
}

.type-btn:hover {
  border-color: var(--primary-pink);
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(251, 207, 232, 0.4);
}

.type-btn.active {
  border-color: var(--primary-pink);
  background: linear-gradient(135deg, #fff 0%, rgba(236, 72, 153, 0.1) 100%);
  color: var(--primary-pink);
  box-shadow: 0 12px 30px rgba(236, 72, 153, 0.3);
}

.type-btn span {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}

.type-btn small {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.type-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.type-btn:disabled:hover {
  border-color: var(--background-dark);
  background: linear-gradient(135deg, #fff 0%, var(--background-light) 100%);
  color: var(--text-primary);
  transform: none;
  box-shadow: 0 8px 25px rgba(251, 207, 232, 0.3);
}

@media (max-width: 768px) {
  .page-header {
    padding: 30px 0 20px;
  }
  .page-title {
    font-size: 1.5rem;
  }
  .create-form {
    padding: 20px;
  }
  .article-type-selector {
    flex-direction: column;
  }
  .type-btn {
    width: 100%;
  }
  .form-actions {
    flex-direction: column;
  }
  .btn {
    width: 100%;
  }
}
</style>

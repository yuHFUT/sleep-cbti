<template>
  <div class="topic-circle">
    <!-- 发布表单 -->
    <div class="post-form">
      <div class="form-header">
        <span class="form-icon">✍️</span>
        <span>分享你的 CBT-I 实践心得</span>
      </div>
      <textarea
        v-model="newPost"
        placeholder="例如：今天尝试了刺激控制，睡不着时起床看了会儿书，20分钟后再回床上，居然很快就睡着了...…"
        rows="4"
        maxlength="500"
        class="post-textarea"
      ></textarea>
      <div class="form-footer">
        <span class="char-count">{{ newPost.length }}/500</span>
        <button
          class="btn-post"
          :disabled="!newPost.trim() || posting"
          @click="doPost"
        >{{ posting ? '发布中...' : '📤 发布' }}</button>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div v-if="posts.length" class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-card">
        <div class="post-header">
          <span class="post-avatar">😴</span>
          <span class="post-user">{{ post.display_name }}</span>
          <span class="post-time">{{ post.timeAgo }}</span>
        </div>
        <p class="post-content">{{ post.content }}</p>
        <div class="post-footer">
          <button class="btn-like" @click="doLike(post.id)">
            ❤️ {{ post.likes || 0 }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="empty-icon">📖</span>
      <p>还没有人分享，来做第一个吧！</p>
      <p class="empty-hint">分享你的CBT-I实践心得、小胜利或感悟</p>
    </div>

    <!-- 加载更多 -->
    <div v-if="hasMore" class="load-more">
      <button class="btn-load-more" @click="loadMore">加载更多</button>
    </div>

    <div v-if="showToast" class="toast" :class="toastType">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPostList, createPost, likePost } from '@/api/community';

const props = defineProps({ userId: String });

const posts = ref([]);
const newPost = ref('');
const posting = ref(false);
const page = ref(1);
const hasMore = ref(false);
const toastMsg = ref('');
const toastType = ref('');
const showToast = ref(false);

function showMsg(msg, type = '') {
  toastMsg.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
}

async function loadPosts() {
  try {
    const res = await getPostList(page.value);
    if (page.value === 1) {
      posts.value = res.data.posts || [];
    } else {
      posts.value.push(...(res.data.posts || []));
    }
    hasMore.value = res.data.hasMore;
  } catch {}
}

async function loadMore() {
  page.value++;
  await loadPosts();
}

async function doPost() {
  if (!newPost.value.trim()) return;
  posting.value = true;
  try {
    const res = await createPost(props.userId, newPost.value.trim());
    newPost.value = '';
    page.value = 1;
    await loadPosts();
    showMsg(res.message || '发布成功！');
  } catch (err) {
    const msg = err.response?.data?.message || '发布失败';
    const risk = err.response?.data?.risk;
    showMsg(msg, risk === 'high' ? 'error' : risk === 'medium' ? 'warn' : '');
  } finally {
    posting.value = false;
  }
}

async function doLike(postId) {
  try {
    await likePost(postId);
    const post = posts.value.find(p => p.id === postId);
    if (post) post.likes = (post.likes || 0) + 1;
  } catch {}
}

onMounted(() => loadPosts());
</script>

<style scoped>
.topic-circle { min-height: 200px; position: relative; }

.post-form {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 1rem;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.6rem;
}

.form-icon { font-size: 1.1rem; }

.post-textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  font-size: 0.88rem;
  outline: none;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s;
}

.post-textarea:focus { border-color: #13c2c2; }

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.char-count { font-size: 0.72rem; color: #ccc; }

.btn-post {
  padding: 0.5rem 1.5rem;
  background: #13c2c2;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-post:disabled { opacity: 0.5; cursor: not-allowed; }

/* 帖子列表 */
.post-list { display: flex; flex-direction: column; gap: 0.6rem; }

.post-card {
  background: #fff;
  border-radius: 14px;
  padding: 1rem 1.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.post-avatar { font-size: 1.2rem; }
.post-user { font-size: 0.82rem; font-weight: 600; color: #13c2c2; }
.post-time { font-size: 0.7rem; color: #ccc; margin-left: auto; }

.post-content {
  font-size: 0.88rem;
  color: #444;
  line-height: 1.7;
  margin-bottom: 0.6rem;
  white-space: pre-wrap;
}

.post-footer { display: flex; justify-content: flex-end; }

.btn-like {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.3rem 0.8rem;
  border: 1px solid #f0f0f0;
  border-radius: 14px;
  background: #fafafa;
  font-size: 0.78rem;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
}

.btn-like:hover { border-color: #ffccc7; color: #ff4d4f; }

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }

.empty-state p { color: #999; font-size: 0.9rem; }
.empty-hint { font-size: 0.78rem !important; margin-top: 0.3rem; }

.load-more { text-align: center; margin-top: 1rem; }

.btn-load-more {
  padding: 0.5rem 1.5rem;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  color: #666;
  font-size: 0.85rem;
  cursor: pointer;
}

.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  z-index: 100;
  animation: fadeInOut 3s ease;
  background: #52c41a;
  color: #fff;
}

.toast.warn { background: #faad14; color: #fff; }
.toast.error { background: #ff4d4f; color: #fff; }

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  20% { opacity: 1; transform: translateX(-50%) translateY(0); }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
</style>

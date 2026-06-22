<template>
  <div class="profile-page">
    <div class="profile-header-card">
      <div class="user-info-section">
        <van-image
          round
          width="70px"
          height="70px"
          :src="state.user?.avatar || '/images/login1.jpg'"
          class="user-avatar"
        />
        
        <div class="user-meta">
          <div class="name-row">
            <span class="user-name">{{ state.user?.username || 'Traveler' }}</span>
            <span class="level-tag">Lv.1</span>
            
            <van-icon 
              name="edit" 
              class="edit-name-btn" 
              @click="openEditNameDialog" 
            />
          </div>
          <div class="user-email">{{ state.user?.email || '未绑定邮箱' }}</div>
          <div class="badge-row">
            <span class="interest-tag">旅行爱好者</span>
          </div>
        </div>
      </div>
    
    </div>
    <div class="vip-card">
      <div class="vip-content">
        <van-icon name="medal-o" class="vip-icon" />
        
        <div class="vip-text">
          <span class="vip-title">开通会员</span>
          <span class="vip-subtitle">享受专属权益，立省更多</span>
        </div>
        
        <van-icon name="arrow" class="vip-arrow" />
      </div>
    </div>
    <div class="data-dashboard">
      <div class="data-item">
        <van-icon name="notes-o" class="dash-icon trips" />
        <div class="dash-num-box">
          <span class="num">0</span>
          <span class="label">我的旅行<br><small>Trips</small></span>
        </div>
      </div>
      <div class="data-item">
        <van-icon name="location-o" class="dash-icon cities" />
        <div class="dash-num-box">
          <span class="num">0</span>
          <span class="label">去过城市<br><small>Cities</small></span>
        </div>
      </div>
      <div class="data-item">
        <van-icon name="card" class="dash-icon spent" />
        <div class="dash-num-box">
          <span class="num">0</span>
          <span class="label">累计消费<br><small>Spent</small></span>
        </div>
      </div>
    </div>

    <div class="menu-group">
      <van-cell title="我的旅行" icon="description-o" is-link />
      <van-cell title="我的计划" icon="todo-list-o" is-link />
      <van-cell title="积分商城" icon="award-o" value="赚积分兑好礼" value-class="orange-value" is-link />
      <van-cell title="我的收藏" icon="closed-contain" is-link />
    </div>

    <div class="menu-group">
      <van-cell title="设置" icon="setting-o" is-link />
      <van-cell title="关于我们" icon="info-o" is-link />
      <van-cell title="帮助与反馈" icon="comment-circle-o" is-link />
    </div>

    <div class="logout-container">
      <van-button block class="logout-btn" icon="log-out" @click="handleLogout">
        退出登录
      </van-button>
    </div>

    <van-dialog
      v-model:show="showEditDialog"
      title="修改用户名"
      show-cancel-button
      :before-close="onBeforeCloseEdit"
    >
      <div style="padding: 20px 16px;">
        <van-field
          v-model="newUsername"
          placeholder="请输入新的用户名"
          maxlength="15"
          clearable
          outlined
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { state, logout, updateProfile, fetchProfile } = useAuth()

// 修改用户名相关弹窗状态
const showEditDialog = ref(false)
const newUsername = ref('')

// 页面加载时自动去后端刷一次最新的数据库用户信息
onMounted(async () => {
  if (state.isAuthenticated) {
    await fetchProfile()

  }
})

// 点击修改图标，打开弹窗
const openEditNameDialog = () => {
  newUsername.value = state.user?.username || ''
  showEditDialog.value = true
}

// 弹窗确认或取消前的拦截逻辑
const onBeforeCloseEdit = async (action) => {
  if (action === 'cancel') {
    return true // 直接关闭
  }
  
  if (!newUsername.value.trim()) {
    showToast('用户名不能为空')
    return false // 拦截，不关闭弹窗
  }

  try {
    // 💡 调用 useAuth 里的 updateProfile 触发请求
    const res = await updateProfile({ username: newUsername.value.trim() })
    console.log('后端返回的完整响应：', res)
    if (res && res.success) {
      showToast('用户名修改成功')
      return true // 关闭弹窗并刷新了全局的 state.user
    } else {
      showToast(res.message || '修改失败，可能用户名已存在')
      return false
    }
  } catch {
    showToast('网络异常，修改失败')
    return false
  }
}

// 退出登录
const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<style scoped>
/* 样式完美复刻你截图中的“我的”界面设计 */
.profile-page {
  min-height: 100vh;
  background-color: #f4f7fc;
  padding: 16px;
  padding-bottom: 80px; /* 留出底部 Tabbar 的位置 */
  box-sizing: border-box;
}

/* 顶部个人卡片 */
.profile-header-card {
  background: linear-gradient(135deg, #e3edff 0%, #f0f5ff 100%);
  border-radius: 20px;
  padding: 24px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(22, 54, 92, 0.03);
}

.user-info-section {
  display: flex;
  align-items: center;
}

.user-avatar {
  border: 3px solid #ffffff;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
}

.user-meta {
  margin-left: 16px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a2b44;
}

.level-tag {
  background-color: #3b82f6;
  color: #ffffff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: bold;
}

/* 🚨 修改用户名图标小狂样式 */
.edit-name-btn {
  font-size: 16px;
  color: #3b82f6;
  cursor: pointer;
  padding: 2px;
  transition: transform 0.2s;
}
.edit-name-btn:active {
  transform: scale(0.85);
}

.user-email {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.badge-row {
  margin-top: 6px;
}

.interest-tag {
  background-color: #fee2e2;
  color: #ef4444;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 20px;
}

/* 会员卡片大容器 */
.vip-card {
  margin: 14px 0 0 0; /* 🚨 改为 0，让它自然吃满页面 padding 后的安全宽度 */
  background: linear-gradient(135deg, #eed4a9 0%, #d4af70 100%);
  border-radius: 12px;
  padding: 14px 16px; 
  box-shadow: 0 4px 12px rgba(212, 175, 112, 0.15);
}

/* 内部弹性盒子布局 */
.vip-content {
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: space-between; /* 撑开两端 */
  width: 100%;
}

/* 左侧勋章图标：固定大小，防止被挤压变扁 */
.vip-icon {
  font-size: 24px;
  color: #5d4017;
  flex-shrink: 0; /* 🚨 核心补丁：无论如何都不允许被压缩 */
  margin-right: 12px; /* 与文字保持间距 */
}

/* 中间文字区：主力自适应弹性层 */
.vip-text {
  flex: 1; /* 🚨 核心补丁：吃掉剩余的所有横向空间 */
  display: flex;
  flex-direction: column; /* 让标题和副标题垂直排列 */
  justify-content: center;
  min-width: 0; /* 🚨 极其关键：防止长文本在 Flex 容器中撑开布局 */
}

/* 会员标题 */
.vip-title {
  font-size: 15px;
  font-weight: bold;
  color: #5d4017;
  line-height: 1.4;
  margin-bottom: 2px;
}

/* 会员副标题 */
.vip-subtitle {
  font-size: 11px;
  color: rgba(93, 64, 23, 0.75);
  line-height: 1.3;
  /* 🚨 补丁：万一屏幕太小，允许文字优雅地打省略号，绝不把右侧箭头挤掉 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 右侧小箭头：固定大小 */
.vip-arrow {
  font-size: 14px;
  color: #5d4017;
  flex-shrink: 0; /* 🚨 核心补丁：不允许被压缩 */
  margin-left: 8px;
}

/* 三分数据面板 */
.data-dashboard {
  background: #ffffff;
  border-radius: 16px;
  margin-top: 16px;
  padding: 16px 0;
  display: flex;
  box-shadow: 0 4px 12px rgba(22, 54, 92, 0.02);
}

.data-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  position: relative;
}

.data-item:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background-color: #f1f5f9;
}

.dash-icon {
  font-size: 24px;
  padding: 8px;
  border-radius: 50px;
}

.dash-icon.trips { background-color: #eff6ff; color: #3b82f6; }
.dash-icon.cities { background-color: #f5f3ff; color: #8b5cf6; }
.dash-icon.spent { background-color: #fff7ed; color: #f97316; }

.dash-num-box {
  display: flex;
  flex-direction: column;
}

.dash-num-box .num {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.dash-num-box .label {
  font-size: 11px;
  color: #64748b;
  line-height: 1.2;
}

/* 单元格菜单组 */
.menu-group {
  background: #ffffff;
  border-radius: 16px;
  margin-top: 14px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(22, 54, 92, 0.02);
}

.orange-value {
  color: #f97316 !important;
  font-size: 12px;
}

/* 退出登录 */
.logout-container {
  margin-top: 20px;
}

.logout-btn {
  background: #ffffff !important;
  border: none !important;
  color: #ef4444 !important;
  border-radius: 14px !important;
  font-weight: 600;
  height: 48px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05);
}
</style>
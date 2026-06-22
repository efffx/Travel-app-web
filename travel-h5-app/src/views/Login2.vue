<template>
  <div class="login-page">
    <!-- 1. 保留并优化的顶部栏：fixed悬浮、透明背景、去除白底与下边框 -->
    <van-nav-bar 
      fixed
      placeholder
      left-arrow 
      @click-left="$router.back()" 
      class="transparent-nav"
    />

    <!-- 2. 沉浸式顶部背景区 -->
    <div class="header-banner">
      <!-- 临时使用一张高清城际风景图作为背景，可替换为您本地的 /images/login-bg.jpg -->
      <img class="banner-bg" src="/images/login1.jpg" alt="bg" />
      <div class="banner-mask"></div>

      <div class="banner-text">
        <h1 class="main-title">开启美好旅程</h1>
        <p class="sub-title">探索世界 · 遇见更好的风景</p>
      </div>
    </div>

    <!-- 3. 悬浮白底卡片区（参照 login.png 设计） -->
    <div class="login-card-container">
      <div class="login-card">
        <!-- 欢迎语与行李箱插图 -->
        <div class="card-header">
          <div class="header-left">
            <h2 class="welcome-title">欢迎回来</h2>
            <p class="welcome-desc">登录账号，继续您的精彩旅程</p>
          </div>
          <div class="header-right-img">
            <span class="mock-3d-icon">🧳</span>
          </div>
        </div>

        <!-- 登录表单 -->
        <van-form @submit="handleLogin" :show-error-message="false">
          <!-- 账号输入项 -->
          <div class="form-item-group">
            <label class="custom-label">账号</label>
            <div class="custom-input-box">
              <van-field 
                v-model="email" 
                placeholder="请输入手机号/邮箱/用户名"
                left-icon="user-o"
                :border="false"
                :rules="[{ required: true }]" 
              />
            </div>
          </div>

          <!-- 密码输入项 -->
          <div class="form-item-group">
            <label class="custom-label">密码</label>
            <div class="custom-input-box">
              <van-field 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="请输入密码"
                left-icon="lock"
                :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showPassword = !showPassword"
                :border="false"
                :rules="[{ required: true }]" 
              />
            </div>
          </div>

          <!-- 记住我 & 忘记密码 -->
          <div class="form-options">
            <van-checkbox v-model="rememberMe" icon-size="16px" checked-color="#2f86f6">记住我</van-checkbox>
            <span class="forget-pwd-link">忘记密码？</span>
          </div>

          <!-- 登录大按钮 -->
          <div class="submit-action-box">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit" 
              class="custom-submit-btn"
              :loading="loading"
            >
              登 录
            </van-button>
          </div>
        </van-form>

        <!-- 注册引导链接 -->
        <div class="register-footer">
          <span class="footer-hint">还没有账号？</span>
          <router-link to="/register" class="footer-link">立即注册</router-link>
        </div>
      </div>
    </div>
    
    <!-- 底部装饰波浪浅纹 -->
    <div class="bottom-wave-bg"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const rememberMe = ref(false)
const showPassword = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    if (await login(email.value, password.value)) {
      router.push('/profile')
    } else {
      showToast('账号或密码错误')
    }
  } catch { 
    showToast('网络请求失败') 
  } finally { 
    loading.value = false 
  }
}
</script>

<style scoped>
/* 页面容器基础样式 */
.login-page {
  min-height: 100vh;
  background-color: #ebf3fa;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 🚀 顶部栏透明悬浮样式修正 */
.transparent-nav {
  background: transparent !important;
}
.transparent-nav :deep(.van-nav-bar__content) {
  background: transparent !important;
}
.transparent-nav :deep(.van-nav-bar__title) {
  color: #16365c !important;
  font-weight: 600;
}
.transparent-nav :deep(.van-nav-bar__arrow) {
  color: #16365c !important;
  font-size: 18px;
}
/* 移除原生 Vant 导航栏的下边框阴影 */
.transparent-nav::after {
  border-bottom: none !important;
}

/* 顶部背景大图 */
.header-banner {
  position: relative;
  height: 280px; /* 略微加高，为顶部栏留出呼吸空间 */
  width: 100%;
}
.banner-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.banner-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, #ebf3fa 100%);
}
.banner-text {
  position: absolute;
  top: 95px; /* 下移文字，防止和导航栏撞车 */
  left: 28px;
  color: #16365c;
}
.main-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  letter-spacing: 1px;
}
.sub-title {
  font-size: 14px;
  opacity: 0.8;
  margin: 6px 0 0;
}

/* 悬浮表单卡片 */
.login-card-container {
  padding: 0 16px;
  margin-top: -65px; 
  position: relative;
  z-index: 5;
  flex: 1;
}
.login-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(22, 54, 92, 0.06);
}

/* 卡片内部头部排版 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.welcome-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}
.welcome-desc {
  font-size: 13px;
  color: #8c96a0;
  margin: 6px 0 0;
}
.mock-3d-icon {
  font-size: 46px;
  filter: drop-shadow(0 6px 8px rgba(0,0,0,0.15));
}

/* 输入框样式重构 */
.form-item-group {
  margin-bottom: 18px;
}
.custom-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  padding-left: 2px;
}
.custom-input-box {
  background: #ffffff;
  border: 1px solid #eef2f6;
  border-radius: 14px;
  overflow: hidden;
  transition: border-color 0.3s;
}
.custom-input-box:focus-within {
  border-color: #2f86f6;
}
.custom-input-box :deep(.van-cell) {
  padding: 12px 14px;
  background: transparent;
}

/* 选项栏 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  margin: 20px 2px 28px;
}
.form-options :deep(.van-checkbox__label) {
  color: #666;
}
.forget-pwd-link {
  color: #2f86f6;
  cursor: pointer;
}

/* 提交按钮 */
.submit-action-box {
  margin-bottom: 24px;
}
.custom-submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(90deg, #409eff 0%, #2f86f6 100%) !important;
  border: none !important;
  box-shadow: 0 6px 16px rgba(47, 134, 246, 0.3);
}

/* 底部脚部注册 */
.register-footer {
  text-align: center;
  font-size: 13px;
  margin-top: 8px;
}
.footer-hint {
  color: #8c96a0;
}
.footer-link {
  color: #2f86f6;
  font-weight: 600;
  margin-left: 4px;
}

/* 装饰性波浪 */
.bottom-wave-bg {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(47,134,246,0.06));
  pointer-events: none;
}
</style>
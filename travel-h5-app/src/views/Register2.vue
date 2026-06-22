<template>
  <div class="register-page">
    <van-nav-bar 
      fixed
      placeholder
      left-arrow 
      title="Register"
      @click-left="$router.back()" 
      class="transparent-nav"
    />

    <div class="header-banner">
      <img class="banner-bg" src="/images/Register.jpg" alt="bg" />
      <div class="banner-mask"></div>

      <div class="banner-text">
        <h1 class="main-title">创建账号</h1>
        <p class="sub-title">开启您的美好旅程</p>
      </div>
    </div>

    <div class="register-card-container">
      <div class="login-card">
        <van-form @submit="handleRegister" :show-error-message="false">
          
          <div class="form-item-group">
            <label class="custom-label">手机号码</label>
            <div class="custom-input-box">
              <van-field 
                v-model="phone" 
                type="tel"
                maxlength="11"
                placeholder="请输入手机号码"
                left-icon="phone-o"
                :border="false"
                :rules="[{ required: true }]" 
              />
            </div>
          </div>

          <!-- <div class="form-item-group">
            <label class="custom-label">验证码</label>
            <div class="custom-input-box code-container">
              <van-field 
                v-model="smsCode" 
                type="digit"
                maxlength="6"
                placeholder="请输入验证码"
                left-icon="shield-o"
                :border="false"
                :rules="[{ required: true }]" 
              />
              <div class="code-divider"></div>
              <button 
                type="button" 
                class="send-code-btn" 
                :disabled="counting" 
                @click="sendSms"
              >
                {{ counting ? `${countdown}s后重发` : '获取验证码' }}
              </button>
            </div>
          </div> -->

          <div class="form-item-group">
            <label class="custom-label">电子邮箱</label>
            <div class="custom-input-box">
              <van-field 
                v-model="email" 
                type="email"
                placeholder="请输入电子邮箱地址"
                left-icon="envelop-o"
                :border="false"
                :rules="[
                  { required: true },
                  { pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/, message: '邮箱格式不正确' }
                ]" 
              />
            </div>
          </div>

          <div class="form-item-group">
            <label class="custom-label">设置密码</label>
            <div class="custom-input-box">
              <van-field 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="请设置登录密码 (6-16位，含字母和数字)"
                left-icon="lock"
                :right-icon="showPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showPassword = !showPassword"
                :border="false"
                :rules="[{ required: true }]" 
              />
            </div>
          </div>

          <div class="form-item-group">
            <label class="custom-label">确认密码</label>
            <div class="custom-input-box">
              <van-field 
                v-model="confirmPassword" 
                :type="showConfirmPassword ? 'text' : 'password'" 
                placeholder="请再次输入登录密码"
                left-icon="lock"
                :right-icon="showConfirmPassword ? 'eye-o' : 'closed-eye'"
                @click-right-icon="showConfirmPassword = !showConfirmPassword"
                :border="false"
                :rules="[{ required: true }]" 
              />
            </div>
          </div>

          <div class="agreement-options">
            <van-checkbox v-model="agreementChecked" icon-size="16px" checked-color="#2f86f6">
              <span class="agreement-text">
                我已阅读并同意 <span class="link-text">《用户服务协议》</span> 和 <span class="link-text">《隐私政策》</span>
              </span>
            </van-checkbox>
          </div>

          <div class="submit-action-box">
            <van-button 
              round 
              block 
              type="primary" 
              native-type="submit" 
              class="custom-submit-btn"
              :loading="loading"
            >
              注 册
            </van-button>
          </div>
        </van-form>

        <div class="login-footer">
          <span class="footer-hint">已有账号？</span>
          <router-link to="/login" class="footer-link">去登录</router-link>
        </div>
      </div>
    </div>
    
    <div class="bottom-wave-bg"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { register } = useAuth()

// 表单状态模型
const phone = ref('')
//const smsCode = ref('')
const email = ref('') // 🚨 替换原有的 inviteCode
const password = ref('')
const confirmPassword = ref('')

const loading = ref(false)
const agreementChecked = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 验证码倒计时逻辑
const counting = ref(false)
const countdown = ref(60)

const sendSms = () => {
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }
  showToast('验证码已发送')
  counting.value = true
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      counting.value = false
      countdown.value = 60
    }
  }, 1000)
}

// 注册提交事件
const handleRegister = async () => {
  if (!agreementChecked.value) {
    showToast('请阅读并勾选隐私政策与用户协议')
    return
  }
  
  // 基础邮箱校验拦截提示
  const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!emailPattern.test(email.value)) {
    showToast('请输入合法的邮箱地址')
    return
  }

  if (password.value !== confirmPassword.value) {
    showToast('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    // 💡 将对应参数传给你后端的 register 接口。
    // 如果你的后端需要接收三个参数（用户名/手机、邮箱、密码），可以对应填入：
    if (await register(phone.value, email.value, password.value)) {
      showToast({
        type: 'success',
        message: '账号创建成功',
        onClose: () => {
          router.push('/login')
        }
      })
    } else {
      showToast('注册失败')
    }
  } catch { 
    showToast('注册接口异常') 
  } finally { 
    loading.value = false 
  }
}
</script>

<style scoped>
/* 页面容器基础样式 */
.register-page {
  min-height: 100vh;
  background-color: #ebf3fa;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 顶部栏透明悬浮样式 */
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
.transparent-nav::after {
  border-bottom: none !important;
}

/* 顶部背景大图 */
.header-banner {
  position: relative;
  height: 250px; 
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
  top: 90px; 
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
.register-card-container {
  padding: 0 16px;
  margin-top: -55px; 
  position: relative;
  z-index: 5;
  flex: 1;
  padding-bottom: 30px; /* 留出底部边距 */
}
.login-card {
  background: #ffffff;
  border-radius: 24px;
  padding: 26px 24px;
  box-shadow: 0 10px 30px rgba(22, 54, 92, 0.06);
}

/* 输入框样式重构 */
.form-item-group {
  margin-bottom: 16px;
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

/* 验证码特殊布局 */
.code-container {
  display: flex;
  align-items: center;
  padding-right: 14px;
}
.code-divider {
  width: 1px;
  height: 18px;
  background-color: #ebedf0;
}
.send-code-btn {
  border: none;
  background: transparent;
  color: #2f86f6;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  padding-left: 14px;
  cursor: pointer;
}
.send-code-btn:disabled {
  color: #c8c9cc;
}

/* 隐私服务协议 */
.agreement-options {
  margin: 18px 2px 24px;
}
.agreement-text {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
.link-text {
  color: #2f86f6;
  cursor: pointer;
}

/* 注册按钮 */
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

/* 底部脚部 */
.login-footer {
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
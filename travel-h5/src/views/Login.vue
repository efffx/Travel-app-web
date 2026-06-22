<template>
  <div class="page-container">
    <van-nav-bar title="Login" left-arrow @click-left="$router.back()" />
    <div class="page-content">
      <div class="card" style="margin-top:40px;">
        <h2 style="text-align:center;margin-bottom:24px;">Welcome Back</h2>
        <van-form @submit="handleLogin">
          <van-field v-model="email" label="Email" placeholder="Enter your email"
            :rules="[{ required: true, message: 'Email is required' }]" />
          <van-field v-model="password" type="password" label="Password" placeholder="Enter your password"
            :rules="[{ required: true, message: 'Password is required' }]" />
          <div style="margin:16px;">
            <van-button round block type="primary" native-type="submit" :loading="loading">Login</van-button>
          </div>
        </van-form>
        <div style="text-align:center;">
          <span style="color:#969799;font-size:14px;">Don't have an account?</span>
          <router-link to="/register" style="color:#1989fa;">Register</router-link>
        </div>
      </div>
    </div>
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

const handleLogin = async () => {
  loading.value = true
  try {
    if (await login(email.value, password.value)) router.push('/profile')
    else showToast('Login failed')
  } catch { showToast('Login failed') }
  finally { loading.value = false }
}
</script>

<template>
  <div class="page-container">
    <van-nav-bar title="Register" left-arrow @click-left="$router.back()" />
    <div class="page-content">
      <div class="card" style="margin-top:40px;">
        <h2 style="text-align:center;margin-bottom:24px;">Create Account</h2>
        <van-form @submit="handleRegister">
          <van-field v-model="username" label="Username" placeholder="Enter your username"
            :rules="[{ required: true, message: 'Username is required' }]" />
          <van-field v-model="email" label="Email" placeholder="Enter your email"
            :rules="[{ required: true, message: 'Email is required' }]" />
          <van-field v-model="password" type="password" label="Password" placeholder="At least 6 characters"
            :rules="[{ required: true, message: 'Password is required' }]" />
          <div style="margin:16px;">
            <van-button round block type="primary" native-type="submit" :loading="loading">Register</van-button>
          </div>
        </van-form>
        <div style="text-align:center;">
          <span style="color:#969799;font-size:14px;">Already have an account?</span>
          <router-link to="/login" style="color:#1989fa;">Login</router-link>
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
const { register } = useAuth()
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  try {
    if (await register(username.value, email.value, password.value)) router.push('/profile')
    else showToast('Registration failed')
  } catch { showToast('Registration failed') }
  finally { loading.value = false }
}
</script>


<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const route = useRoute()
const auth = useAuth()
const active = ref(0)

// 🚨 用一个响应式变量来控制显示
const isTabbarVisible = ref(false)

// 🚨 终极补丁：用 watch 深度侦听路由变化，全面兼容 Hash 模式和 App 预加载
watch(
  () => route.path,
  (newPath) => {
    // 打印当前路由日志，你可以在 Android Studio 的 Logcat 看到它到底获取到了什么
    console.log('【App 路由追踪】当前路径为:', newPath)
    
    // 如果你在路由里配了 meta.showTabbar 就用这一句：
    isTabbarVisible.value = !!route.meta?.showTabbar

    // 💡 【备用双保险方案】：如果上面那句还是不出来，直接取消下面这行的注释，用路径白名单强行判定：
    // isTabbarVisible.value = ['/', '/chat', '/profile', '/travel-logs', '/my-plans'].includes(newPath)
  },
  { immediate: true, deep: true } // 立即执行，深度侦听
)
</script>

<template>
  <div class="app-container">
    <router-view></router-view>
    
    <van-tabbar 
      v-show="isTabbarVisible" 
      route 
      v-model="active"
      safe-area-inset-bottom
      placeholder
      fixed
    >
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/chat" icon="chat-o">AI咨询</van-tabbar-item>
      <van-tabbar-item :to="auth.state.isAuthenticated ? '/profile' : '/login'" icon="user-o">个人中心</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// 1. 引入 Vant 组件库及样式
import Vant from 'vant'
import 'vant/lib/index.css'

// 2. 引入你的全局样式
import './styles/common.css'

// 3. 引入 Capacitor 原生存储状态初始化方法
import { initAuthFromStorage } from './composables/useAuth.js'

// 4. 统一的异步启动函数
const bootstrap = async () => {
  console.log('--- App 正在通过安全通道启动 ---')
  
  try {
    // 🚨 核心拦截：必须等到手机系统底层把 Token 吐出来，并成功赋值给全局 state
    await initAuthFromStorage()
    console.log('--- 原生存储凭证恢复成功 ---')
  } catch (error) {
    console.error('原生存储读取失败:', error)
  }

  // 5. 凭证恢复后，再创建唯一的 Vue 实例
  const app = createApp(App)
  
  // 6. 统一挂载插件
  app.use(Vant)   // 全局挂载 Vant，确保所有组件可用
  app.use(router) // 挂载路由
  
  // 7. 最终挂载到 DOM 上
  app.mount('#app')
  console.log('--- App 挂载成功，用户可流畅操作 ---')
}

// 🚨 执行启动
bootstrap()
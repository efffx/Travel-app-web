
// import { reactive } from 'vue'
// import { post, get, put } from '../utils/request.js'
// import { showToast } from 'vant'

// // 全局响应式状态，保持不变（很好地利用了外部闭包实现单例）
// const state = reactive({
//   token: localStorage.getItem('token') || null,
//   user: JSON.parse(localStorage.getItem('user') || 'null'),
//   isAuthenticated: !!localStorage.getItem('token')
// })

// export function useAuth() {
  
//   /**
//    * 1. 登录方法优化
//    * @param {String} account - 可以是手机号或电子邮箱
//    * @param {String} password - 密码
//    */
//   const login = async (account, password) => {
//     try {
//       // 🚨 将原先的 email 改为 account 传给后端，匹配 MySQL 中的 phone 或 email
//       const res = await post('/auth/login', { account, password })
      
//       if (res && res.success) {
//         state.token = res.data.token
//         state.user = res.data.user
//         state.isAuthenticated = true
        
//         localStorage.setItem('token', res.data.token)
//         localStorage.setItem('user', JSON.stringify(res.data.user))
        
//         showToast('登录成功')
//         return true
//       }
//       return false
//     } catch (err) {
//       // 防止后端接口抛错导致前端页面卡死
//       showToast('登录失败，请检查网络')
//       return false
//     }
//   }

//   /**
//    * 2. 注册方法优化
//    * @param {String} phone - 手机号码
//    * @param {String} email - 电子邮箱
//    * @param {String} password - 密码
//    */
//   const register = async (phone, email, password) => {
//     try {
//       // 🚨 将原先的 username 替换成我们 UI 需要的 phone
//       const res = await post('/auth/register', { phone, email, password })
      
//       if (res && res.success) {
//         state.token = res.data.token
//         state.user = res.data.user
//         state.isAuthenticated = true
        
//         localStorage.setItem('token', res.data.token)
//         localStorage.setItem('user', JSON.stringify(res.data.user))
        
//         showToast('注册并登录成功')
//         return true
//       }
//       return false
//     } catch (err) {
//       showToast('注册失败，请检查输入')
//       return false
//     }
//   }

//   // 3. 登出方法（保持原样）
//   const logout = () => {
//     state.token = null
//     state.user = null
//     state.isAuthenticated = false
//     localStorage.removeItem('token')
//     localStorage.removeItem('user')
//     showToast('已安全退出')
//   }

//   // 4. 获取个人资料（保持原样）
//   const fetchProfile = async () => {
//     const res = await get('/auth/profile')
//     if (res && res.success) {
//       state.user = res.data
//       localStorage.setItem('user', JSON.stringify(res.data))
//     }
//     return res
//   }

//   // // 5. 更新个人资料（保持原样）
//   // const updateProfile = async (data) => {
//   //   const res = await put('/auth/profile', data)
//   //   if (res && res.success) {
//   //     state.user = res.data
//   //     localStorage.setItem('user', JSON.stringify(res.data))
//   //   }
//   //   return res
//   // }
// const updateProfile = async (data) => {
//   try {
//     // 🚨 注意这里的路径：如果是原项目，可能是 /auth/profile 或者 /users/profile
//     // 请根据你后端实际的路由文件（如 authController.js 或 routes/auth.js）来核对路径
//     const res = await put('/auth/profile', data) 
//     console.log(data)
//     if (res && res.success) {
//       state.user = res.data
//       localStorage.setItem('user', JSON.stringify(res.data))
//       return { success: true }
//     }
//     return { success: false, message: res?.message }
//   } catch (err) {
//     console.error('更新个人资料请求失败:', err)
//     return { success: false }
//   }
// }
//   return { state, login, register, logout, fetchProfile, updateProfile }
// }


import { reactive } from 'vue'
import { post, get, put } from '../utils/request.js'
import { showToast } from 'vant'
// 🚨 1. 引入 Capacitor 原生存储插件
import { Preferences } from '@capacitor/preferences'

// 全局响应式状态
const state = reactive({
  token: null,
  user: null,
  isAuthenticated: false
})

// 🚨 2. 初始化方法：因为原生存储是异步的，我们需要一个方法在 App 启动时预先加载 Token
export const initAuthFromStorage = async () => {
  const { value: token } = await Preferences.get({ key: 'token' })
  const { value: userStr } = await Preferences.get({ key: 'user' })
  
  state.token = token || null
  state.user = userStr ? JSON.parse(userStr) : null
  state.isAuthenticated = !!token
}

export function useAuth() {
  
  /**
   * 1. 登录方法
   */
  const login = async (account, password) => {
    try {
      const res = await post('/auth/login', { account, password })
      
      if (res && res.success) {
        state.token = res.data.token
        state.user = res.data.user
        state.isAuthenticated = true
        
        // 🚨 3. 改为 Capacitor 原生异步存储
        await Preferences.set({ key: 'token', value: res.data.token })
        await Preferences.set({ key: 'user', value: JSON.stringify(res.data.user) })
        
        showToast('登录成功')
        return true
      }
      return false
    } catch (err) {
      showToast('登录失败，请检查网络')
      return false
    }
  }

  /**
   * 2. 注册方法
   */
  const register = async (phone, email, password) => {
    try {
      const res = await post('/auth/register', { phone, email, password })
      
      if (res && res.success) {
        state.token = res.data.token
        state.user = res.data.user
        state.isAuthenticated = true
        
        // 🚨 4. 改为 Capacitor 原生异步存储
        await Preferences.set({ key: 'token', value: res.data.token })
        await Preferences.set({ key: 'user', value: JSON.stringify(res.data.user) })
        
        showToast('注册并登录成功')
        return true
      }
      return false
    } catch (err) {
      showToast('注册失败，请检查输入')
      return false
    }
  }

  /**
   * 3. 登出方法
   */
  const logout = async () => {
    state.token = null
    state.user = null
    state.isAuthenticated = false
    
    // 🚨 5. 改为 Capacitor 原生异步移除
    await Preferences.remove({ key: 'token' })
    await Preferences.remove({ key: 'user' })
    
    showToast('已安全退出')
  }

  /**
   * 4. 获取个人资料
   */
  const fetchProfile = async () => {
    const res = await get('/auth/profile')
    if (res && res.success) {
      state.user = res.data
      // 🚨 6. 改为 Capacitor 原生异步存储
      await Preferences.set({ key: 'user', value: JSON.stringify(res.data) })
    }
    return res
  }

  /**
   * 5. 更新个人资料
   */
  const updateProfile = async (data) => {
    try {
      const res = await put('/auth/profile', data) 
      if (res && res.success) {
        state.user = res.data
        // 🚨 7. 改为 Capacitor 原生异步存储
        await Preferences.set({ key: 'user', value: JSON.stringify(res.data) })
        return { success: true }
      }
      return { success: false, message: res?.message }
    } catch (err) {
      console.error('更新个人资料请求失败:', err)
      return { success: false }
    }
  }

  return { state, login, register, logout, fetchProfile, updateProfile }
}
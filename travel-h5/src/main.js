import { createApp } from 'vue'
import 'vant/lib/index.css'
import Vant from 'vant'
import App from './App.vue'
import router from './router'
import './styles/common.css'



const app = createApp(App)
app.use(Vant)  // 全局挂载
app.use(router)
app.mount('#app')
<template>
  <div class="home-page">
    <header class="home-header">
      <div
        class="location-pill"
        @click="showLocationAction = true"
      >
        <van-icon
          name="location-o"
          size="14"
        />
        <span>{{ displayCity }}</span>
        <van-icon
          name="arrow-down"
          size="12"
        />
      </div>
      <div class="header-title">
        <van-icon name="star" color="#4A90E2" size="18" />
        <span>智能旅游助手</span>
      </div>
      <div class="header-notify">
        <van-icon name="bell" size="22" color="#323233" />
        <span class="notify-dot"></span>
      </div>

    </header>
    <van-action-sheet
  v-model:show="showLocationAction"
  :actions="locationActions"
  @select="onLocationSelect"
/>
    <div class="home-content">
      <section class="hero-card">
        <img
          class="hero-bg"
          src="/images/top.jpg"
          alt="遇见世界的美好"
        />
        <div class="hero-overlay">
          <h2>遇见世界的美好</h2>
          <p>AI 为您定制独一无二的旅行体验</p>
          <button class="hero-btn" @click="scrollToForm">开始规划 →</button>
        </div>
      </section>

      <section class="card plan-card" ref="planFormRef">
        <div class="section-head">
          <van-icon name="star" color="#4A90E2" size="16" />
          <span>规划您的旅程</span>
        </div>

        <div class="form-row" @click="showCityPicker = true">
          <van-icon name="location-o" color="#4A90E2" size="18" />
          <span class="form-row-input" :class="{ placeholder: !formData.city }">
            {{ formData.city || '请选择旅游城市' }}
          </span>
          <van-icon name="arrow" color="#c8c9cc" size="14" />
        </div>

        <div class="form-row">
          <van-icon name="balance-o" color="#4A90E2" size="18" />
          <input
            v-model="formData.budget"
            type="number"
            class="form-row-input native-input"
            placeholder="请输入预算（如：3000）"
          />
          <span class="suffix">元/人</span>
        </div>

        <div class="form-row">
          <van-icon name="calendar-o" color="#4A90E2" size="18" />
          <input
            v-model="formData.days"
            type="digit"
            class="form-row-input native-input"
            placeholder="请输入天数（如：5）"
          />
          <span class="suffix">天</span>
        </div>

        <van-button
          class="plan-submit-btn"
          round
          block
          :loading="isLoading"
          @click="handleSubmit"
        >
          开始智能规划 ✦
        </van-button>
      </section>

      <section class="card quick-card">
        <div class="section-head row-between">
          <span class="section-head-title">快捷入口</span>
          <van-icon name="arrow" color="#c8c9cc" size="14" />
        </div>
        <div class="quick-grid">
          <div
            v-for="item in quickActions"
            :key="item.title"
            class="quick-item"
            @click="handleQuickAction(item)"
          >
            <div class="quick-icon" :style="{ background: item.bg }">
              <van-icon :name="item.icon" color="#fff" size="22" />
            </div>
            <span class="quick-title">{{ item.title }}</span>
            <span class="quick-desc">{{ item.desc }}</span>
          </div>
        </div>
      </section>

      <section class="dest-section">
        <div class="section-head row-between">
          <span class="section-head-title">热门目的地</span>
          <van-icon name="arrow" color="#c8c9cc" size="14" />
        </div>
        <div class="dest-scroll">
          <div
            v-for="dest in popularDestinations"
            :key="dest.name"
            class="dest-card"
            @click="handleDestClick(dest)"
          >
            <img :src="dest.image" :alt="dest.name" loading="lazy" />
            <div class="dest-info">
              <div class="dest-name">{{ dest.name }}</div>
              <div class="dest-want">{{ dest.wantCount }}人想去</div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="!auth.state.isAuthenticated" class="login-card">
        <div class="login-illus">🧳</div>
        <div class="login-text">
          <div class="login-title">登录后体验更多功能</div>
          <div class="login-desc">保存行程、记录旅行日志，数据云端同步</div>
        </div>
        <van-button class="login-btn" round size="small" to="/login">立即登录</van-button>
      </section>
    </div>

    <van-popup v-model:show="showCityPicker" round position="bottom">
      <van-picker
        title="请选择旅游城市"
        :columns="cityColumns"
        @confirm="handleCityConfirm"
        @cancel="showCityPicker = false"
      />
    </van-popup>
    <van-popup
  v-model:show="showLocationCityPicker"
  round
  position="bottom"
>
  <van-picker
    title="请选择当前位置"
    :columns="cityColumns"
    @confirm="handleLocationCityConfirm"
    @cancel="showLocationCityPicker = false"
  />
</van-popup>
  </div>
</template>

<script setup>
import { reactive, ref,onMounted,computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useAuth.js'
import { Geolocation } from "@capacitor/geolocation"
// GPS定位城市
const gpsCity = ref("定位中...")

// 用户手动设置当前位置
const selectedCity = ref("")

// ActionSheet
const showLocationAction = ref(false)

// 左上角定位城市选择器
const showLocationCityPicker = ref(false)

// 页面显示城市
const displayCity = computed(() => {

  return selectedCity.value || gpsCity.value

})
// 点击左上角药丸：直接弹出选择菜单，允许用户无限次重新点
const handleLocationPillClick = () => {
  showLocationAction.value = true
}
// ActionSheet菜单
const locationActions = [

  {
    name: "📍 使用手机定位",
    type: "gps"
  },

  {
    name: "🏙 手动选择当前位置",
    type: "picker"
  }

]

// 点击菜单
const onLocationSelect = (action) => {

  showLocationAction.value = false

  if (action.type === "gps") {

    getCurrentLocation()

  }

  if (action.type === "picker") {

    showLocationCityPicker.value = true

  }

}

// 手动选择当前位置
const handleLocationCityConfirm = ({ selectedOptions }) => {

  selectedCity.value = selectedOptions[0].value

  showLocationCityPicker.value = false

}

// 🚨 纯网络独立端 MD5 加密算法（严格适配高德无障碍通关）
function safeMD5(string) {
  var k = [], i = 0;
  for (; i < 64; ) k[i] = 0 | 4294967296 * Math.sin(++i);
  var b = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476],
      j = function(a, b) { return a + b & 4294967295; },
      g = function(a, b) { return a << b | a >>> 32 - b; };
  var c = (function(a) {
    var b = (a.length + 8 >> 6) + 1, c = new Array(16 * b), d = 0;
    for (; d < 16 * b; d++) c[d] = 0;
    for (d = 0; d < a.length; d++) c[d >> 2] |= a.charCodeAt(d) << 8 * (d % 4);
    c[d >> 2] |= 128 << 8 * (d % 4);
    c[16 * b - 2] = 8 * a.length;
    return c;
  })(string);
  for (i = 0; i < c.length; i += 16) {
    var a = b.slice(0), d = 0;
    for (; d < 64; d++) {
      var f = [
        function(a, b, c) { return a & b | ~a & c; },
        function(a, b, c) { return c & a | ~c & b; },
        function(a, b, c) { return a ^ b ^ c; },
        function(a, b, c) { return b ^ (a | ~c); }
      ][0 | d / 16](b[1], b[2], b[3]);
      var e = [ [0, 1, 7], [1, 5, 5], [5, 3, 3], [0, 7, 9] ][0 | d / 16];
      f = j(j(f, c[i + (e[0] + e[1] * d) % 16]), j(k[d], a[3 - d % 4]));
      a[3 - d % 4] = b[1] = j(b[1], g(f, [ [7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21] ][0 | d / 16][d % 4]));
      b = [a[3], b[1], b[2], b[3]];
    }
    for (d = 0; d < 4; d++) b[d] = j(b[d], a[d]);
  }
  return (b[0] >>> 0).toString(16).padStart(8, '0') + 
         (b[1] >>> 0).toString(16).padStart(8, '0') + 
         (b[2] >>> 0).toString(16).padStart(8, '0') + 
         (b[3] >>> 0).toString(16).padStart(8, '0');
}

// 🎯 主力获取 GPS 经纬度方法
const getCurrentLocation = async () => {
  gpsCity.value = "定位中..."
  //showToast({ message: '正在搜寻GPS信号...', duration: 1000 })
  
  try {
    // 1. 请求手机系统权限
    const permission = await Geolocation.requestPermissions()
    if (permission.location !== "granted") {
      showToast("定位失败：请在手机系统设置中允许定位权限")
      gpsCity.value = "未授权"
      return
    }

    // 2. 抓取经纬度（设为 false 允许混和网络定位，大幅提高室内测试成功率）
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false, 
      timeout: 10000             // 10秒超时
    })

    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    console.log(`获取到原始坐标: ${longitude}, ${latitude}`)

    // 3. 送去高德解析
    const city = await getCity(latitude, longitude)
    if (city) {
      gpsCity.value = city
      selectedCity.value = "" // 还原GPS覆盖
      //showToast(`定位成功: ${city}`)
    } else {
      gpsCity.value = "定位失败"
    }
  } catch (e) {
    console.error("Capacitor 原生定位捕获失败:", e)
    showToast("定位失败：搜索超时，请检查手机GPS开关")
    gpsCity.value = "定位失败"
  }
}

// 🗺️ 高德 Web服务 逆地理接口（无密钥无签名纯净版）
const getCity = async (lat, lng) => {
  // 🚨 把这里替换为你刚申请出来的、服务平台为【Web服务】的全新 Key！
  const key = "高德web服务api" 

  try {
    const locationStr = `${lng},${lat}`
    
    // 🚀 没有密钥，直接传 key 和 location 即可，高德会瞬间放行
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?location=${locationStr}&key=${key}&extensions=base`
    )
    
    const data = await res.json()
    console.log("高德服务器返回原始 JSON:", data)

    if (data.status === "1" && data.regeocode) {
      const comp = data.regeocode.addressComponent
      let targetCity = comp.city
      
      // 直辖市容错
      if (!targetCity || targetCity.length === 0 || typeof targetCity === 'object') {
        targetCity = comp.province
      }
      
      if (typeof targetCity === 'string') {
        return targetCity.replace(/市$/, "") // “北京市” -> “北京”
      }
    }
    
    if (data.info) {
      //showToast(`高德提示: ${data.info}`)
    }
    return null
  } catch (err) {
    console.error("请求高德 HTTP 链路崩溃:", err)
    return null
  }
}

// 页面启动自动定位
onMounted(() => {

  getCurrentLocation()

})

const router = useRouter()
const auth = useAuth()
const planFormRef = ref(null)
const showCityPicker = ref(false)
const isLoading = ref(false)

const formData = reactive({
  city: '',
  budget: '',
  days: ''
})

// const onLocationSelect = (action) => {

//   showLocationAction.value = false

//   if (action.type === "gps") {

//     getCurrentLocation()

//   }

//   if (action.type === "picker") {

//     showLocationPicker.value = true

//   }

// }

const popularDestinations = [
  {
    name: '日本·东京',
    city: '东京',
    image: '/images/dongjing.jpg',
    wantCount: '12.5k'
  },
  {
    name: '印尼·巴厘岛',
    city: '巴厘岛',
    image: '/images/bld.jpg',
    wantCount: '8.2k'
  },
  {
    name: '马尔代夫',
    city: '马尔代夫',
    image: '/images/medf.jpg',
    wantCount: '15.3k'
  },
  {
    name: '法国·巴黎',
    city: '巴黎',
    image: '/images/bl.jpg',
    wantCount: '10.1k'
  }
]

const quickActions = [
  { title: 'AI对话', desc: '随时问旅行问题', icon: 'chat-o', bg: '#4A90E2', to: '/chat' },
  { title: '我的行程', desc: '查看我的行程', icon: 'orders-o', bg: '#52c41a', to: '/my-plans' },
  { title: '收藏夹', desc: '收藏喜欢的地点', icon: 'star-o', bg: '#9254de', to: '' },
  { title: '旅行攻略', desc: '热门攻略推荐', icon: 'guide-o', bg: '#fa8c16', to: '' }
]

const allCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '武汉', '苏州', '长沙', '天津', '郑州', '济南', '青岛',
  '大连', '沈阳', '哈尔滨', '长春', '福州', '厦门', '南昌', '合肥',
  '昆明', '贵阳', '南宁', '桂林', '海口', '三亚', '丽江', '大理',
  '兰州', '乌鲁木齐', '拉萨', '呼和浩特', '太原', '石家庄', '东京', '巴黎'
]

const cityColumns = allCities.map(city => ({ text: city, value: city }))

const scrollToForm = () => {
  planFormRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const handleQuickAction = (item) => {
  if (!item.to) {
    showToast('功能开发中')
    return
  }
  if (item.to === '/my-plans' && !auth.state.isAuthenticated) {
    router.push('/login')
    return
  }
  router.push(item.to)
}

const handleDestClick = (dest) => {
  formData.city = dest.city.trim()
  scrollToForm()
}

const handleCityConfirm = ({ selectedOptions }) => {
  formData.city = selectedOptions[0].value
  showCityPicker.value = false
}

const handleSubmit = () => {
  isLoading.value = true

  if (!formData.city) {
    showToast('请选择旅游城市')
    isLoading.value = false
    return
  }
  if (!formData.budget || Number(formData.budget) < 100) {
    showToast('预算不能小于100元')
    isLoading.value = false
    return
  }
  if (!formData.days || Number(formData.days) < 1 || Number(formData.days) > 30) {
    showToast('旅游天数需在1-30天之间')
    isLoading.value = false
    return
  }

  router.push({
    path: '/detail',
    query: {
      fromCity: displayCity.value,
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    }
  })
  isLoading.value = false
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 70px;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 100;
}

.location-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  flex-shrink: 0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 700;
  color: #1a3a5c;
  flex: 1;
  justify-content: center;
}

.header-notify {
  position: relative;
  flex-shrink: 0;
  padding: 4px;
}

.notify-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  background: #ee0a24;
  border-radius: 50%;
  border: 1px solid #fff;
}

.home-content {
  padding: 12px 16px 16px;
}

.hero-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 168px;
  margin-bottom: 16px;
}

.hero-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.1) 60%, transparent 100%);
  padding: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.hero-overlay h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
}

.hero-overlay p {
  margin: 0 0 14px;
  font-size: 13px;
  opacity: 0.92;
}

.hero-btn {
  align-self: flex-start;
  padding: 8px 18px;
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.section-head.row-between {
  justify-content: space-between;
}

.section-head-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
}

.form-row-input {
  flex: 1;
  font-size: 14px;
  color: #323233;
  min-width: 0;
}

.form-row-input.placeholder {
  color: #c8c9cc;
}

.native-input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
}

.native-input::placeholder {
  color: #c8c9cc;
}

.suffix {
  color: #969799;
  font-size: 13px;
  flex-shrink: 0;
}

.plan-submit-btn {
  margin-top: 6px;
  height: 48px;
  background: linear-gradient(90deg, #4a90e2, #5ba3f5) !important;
  border: none !important;
  font-size: 16px;
  font-weight: 500;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  padding: 4px 0;
}

.quick-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.quick-title {
  font-size: 13px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
}

.quick-desc {
  font-size: 10px;
  color: #969799;
  line-height: 1.3;
  padding: 0 2px;
}

.dest-section {
  margin-bottom: 16px;
}

.dest-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.dest-scroll::-webkit-scrollbar {
  display: none;
}

.dest-card {
  flex: 0 0 120px;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.dest-card img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  display: block;
}

.dest-info {
  padding: 8px 10px 10px;
}

.dest-name {
  font-size: 13px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dest-want {
  font-size: 11px;
  color: #969799;
}

.login-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #e8f4fd, #f0f8ff);
  border-radius: 16px;
}

.login-illus {
  font-size: 36px;
  flex-shrink: 0;
}

.login-text {
  flex: 1;
  min-width: 0;
}

.login-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.login-desc {
  font-size: 11px;
  color: #969799;
  line-height: 1.4;
}

.login-btn {
  flex-shrink: 0;
  background: #fff !important;
  color: #4a90e2 !important;
  border: 1px solid #4a90e2 !important;
  padding: 0 14px;
}


</style>

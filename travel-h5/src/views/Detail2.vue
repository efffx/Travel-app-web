<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar 
        fixed
        placeholder
        left-text="返回" 
        left-arrow 
        @click-left="onback"
        :title="formData.city + '行程规划'" 
      />
    </div>

    <div v-if="loading" class="loading-container">
      <van-loading size="48px" type="spinner" vertical>正在生成行程规划....</van-loading>
    </div>
    <div v-else-if="errorMsg" class="error-container">
      <van-empty :description="errorMsg">
        <van-button type="primary" @click="initData">重新生成</van-button>
      </van-empty>
    </div> 

    <div v-else-if="tripData && tripData.success !== false" class="page-content">
      
      <div class="hero-banner">
        <img class="hero-bg" src="https://images.unsplash.com/photo-1548247661-3d7905940716?auto=format&fit=crop&q=80&w=800" alt="city" />
        <div class="hero-mask"></div>
        <div class="hero-content">
          <h1 class="hero-title">{{formData.fromCity}}->{{ formData.city }} · {{ formData.days }}天行程</h1>
          <div class="hero-subtitle">
            <van-icon name="apps-o" /> 精打细算，畅游城市
          </div>
          <div class="hero-budget-pill">
            <van-icon name="gold-coin" color="#ff7a00" size="16"/> 
            <span>预算：<span class="price-highlight">¥{{ tripData.totalBudget }}元/人</span></span>
          </div>
        </div>
      </div>

      <div class="day-tabs">
        <div 
          v-for="day in tripData.dailyItinerary" 
          :key="day.day" 
          class="day-tab-item" 
          :class="{ 'active': activeDay === day.day }"
          @click="activeDay = day.day"
        >
          <van-icon name="calendar-o" size="16" />
          <span>第{{ day.day }}天</span>
        </div>
      </div>

      <div class="card itinerary-card" v-if="currentDayData">
        <div class="schedule-section">
          <div class="section-label morning">上午</div>
          <SpotItem :data="currentDayData.morning" />
        </div>
        <div class="schedule-section">
          <div class="section-label afternoon">下午</div>
          <SpotItem :data="currentDayData.afternoon" />
        </div>      
        <div class="schedule-section">
          <div class="section-label evening">晚上</div> 
          <SpotItem :data="currentDayData.evening" />
        </div>
      </div>

      <div class="card detail-card" v-if="tripData.budgetBreakdown">
        <div class="card-title">
          <van-icon name="notes-o" color="#1989fa"/> 预算明细
        </div>
        <div class="budget-list">
          <div class="budget-item">
            <span class="label"><van-icon name="hotel-o" color="#1989fa"/> 住宿</span>
            <span class="value">¥{{ tripData.budgetBreakdown.accommodation || 0 }}</span>
          </div>
          <div class="budget-item">
            <span class="label"><van-icon name="shop-o" color="#ff976a"/> 餐饮</span>
            <span class="value">¥{{ tripData.budgetBreakdown.food || 0 }}</span>
          </div>
          <div class="budget-item">
            <span class="label"><van-icon name="logistics" color="#07c160"/> 交通</span>
            <span class="value">¥{{ tripData.budgetBreakdown.transport || 0 }}</span>
          </div>
          <div class="budget-item">
            <span class="label"><van-icon name="coupon-o" color="#7232dd"/> 门票</span>
            <span class="value">¥{{ tripData.budgetBreakdown.tickets || 0 }}</span>
          </div>
          <div class="budget-item">
            <span class="label"><van-icon name="chat-o" color="#ee0a24"/> 其他</span>
            <span class="value">¥{{ tripData.budgetBreakdown.other || 0 }}</span>
          </div>
        </div>
        <div class="budget-total">
          <span class="total-label">总计</span>
          <span class="total-value">¥{{ tripData.totalBudget }}</span>
        </div>
      </div>

      <div class="card detail-card" v-if="transportData">
        <div class="card-title flex-between">
          <div><van-icon name="logistics" color="#1989fa"/> 交通费用预览 <span class="sub-text">(近三天)</span></div>
          <van-icon name="question-o" class="help-icon"/>
        </div>
        <div class="transport-boxes">
          <div class="trans-box train-box">
            <div class="trans-head">
              <van-icon name="logistics" size="20" color="#1989fa"/> 
              <span>火车最低价</span>
            </div>
            <div class="trans-price-block">
              <span class="price-symbol">¥</span>
              <span class="price-big">{{ transportData.train.price }}</span>
              <span class="price-unit">起</span>
            </div>
          </div>
          <div class="trans-box flight-box">
            <div class="trans-head">
              <van-icon name="send-gift-o" size="20" color="#1989fa" style="transform: rotate(-45deg);"/> 
              <span>机票最低价</span>
              <span class="sub-text">(近三天)</span>
            </div>
            <div class="flight-days">
              <div class="flight-day" v-for="(flight, idx) in transportData.flight" :key="idx">
                <div class="f-date">{{ flight.date }}</div>
                <div class="f-price" :class="{'orange': idx===1, 'green': idx===2}">¥{{ flight.price }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card tips-card" v-if="tripData.tips && tripData.tips.length > 0">
        <div class="card-title">
          <van-icon name="light-o" color="#ff976a" size="20"/> 温馨提示
        </div>
        <div class="tips-container blue-box">
          <div class="tip-item" v-for="(tip, index) in tripData.tips" :key="index">
            <van-icon name="checked" color="#1989fa" class="tip-icon"/>
            <span>{{ tip }}</span>
          </div>
        </div>
      </div>

      <div class="card warnings-card">
        <div class="card-title">
          <van-icon name="warning-o" color="#ee0a24" size="20"/> 注意事项
        </div>
        <div class="tips-container red-box">
          <div class="tip-item" v-for="(warning, index) in tripData.warnings" :key="index">
            <van-icon 
              :name="index === 0 ? 'info' : (index === 1 ? 'shop' : (index === 2 ? 'bag' : 'umbrella'))" 
              :color="index === 0 ? '#ee0a24' : (index === 1 ? '#ff976a' : (index === 2 ? '#07c160' : '#1989fa'))" 
              class="tip-icon"
            />
            <span>{{ warning }}</span>
          </div>
        </div>
      </div>

    </div>

    <div class="detail-footer" v-if="tripData && tripData.success !== false">
      <div class="footer-btn btn-ai" @click="goTOChat">
        <van-icon name="chat" size="28" />
        <div class="btn-text-group">
          <div class="btn-title">咨询AI助手</div>
          <div class="btn-sub">智能规划行程</div>
        </div>
      </div>
      <div class="footer-btn btn-finish" @click="markAsTaken">
        <van-icon name="checked" size="28" />
        <div class="btn-text-group">
          <div class="btn-title">Mark as Taken</div>
          <div class="btn-sub">标记为已完成</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { post } from '../utils/request'
import SpotItem from '../components/SpotItem.vue'
import { showToast } from 'vant' // 需引入showToast

const router = useRouter()
const route = useRoute()

// 状态定义
const loading = ref(true)
const errorMsg = ref('')
const formData = reactive({
  fromCity: '',
  city: '',
  budget: null,
  days: null
})
const tripData = ref(null)
const activeDay = ref(1) // 当前激活的行程天数，默认第1天

// 新增功能：交通预览数据模型
const transportData = ref(null)

// 计算属性：当前选中天数的行程数据
const currentDayData = computed(() => {
  if (!tripData.value || !tripData.value.dailyItinerary) return null;
  return tripData.value.dailyItinerary.find(d => d.day === activeDay.value);
})

const onback = () => {
  router.back()
}
const fetchTransportData = async () => {
  try {
    // 1. 发起真实请求，传递当前城市名称
    const res = await post('/train/trainsport', { city: formData.city,fromCity: formData.fromCity})
    console.log('交通API响应:', res)
    
    // 2. 校验后端返回状态并赋值
    if (res && res.success !== false) {
      transportData.value = res
    } else {
      console.error('获取交通数据失败:', res?.message || '未知错误')
      // 容错处理：如果失败则给一个保底展示，防止前端页面卡死
      setDefaultTransportData() 
    }
  } catch (error) {
    console.error('交通数据加载失败', error)
    setDefaultTransportData()
  }
}

// 兜底降级数据（可选：避免后端报错时前端完全空白）
const setDefaultTransportData = () => {
  transportData.value = {
    train: { price: '---' },
    flight: [
      { date: '今天', price: '---' },
      { date: '明天', price: '---' },
      { date: '后天', price: '---' }
    ]
  }
}
// // 补全交通预览模拟接口数据
// const fetchTransportData = async () => {
//   try {
//     // 实际应替换为真实的后端接口 post('/travel/transport', { city: formData.city })
//     // 这里做Mock以匹配UI
//     setTimeout(() => {
//       transportData.value = {
//         train: { price: 111 },
//         flight: [
//           { date: '今天', price: 620 },
//           { date: '明天', price: 580 },
//           { date: '后天', price: 520 }
//         ]
//       }
//     }, 500)
//   } catch (error) {
//     console.error('交通数据加载失败', error)
//   }
// }

// 获取行程规划数据
const fetchTripData = async () => {
   const res = await post('/travel/recommend', {
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    })
   console.log('API响应:', res)
   if(res && res.success !== false) {
     tripData.value = res
     // 默认选中第一天
     if(res.dailyItinerary && res.dailyItinerary.length > 0) {
       activeDay.value = res.dailyItinerary[0].day
     }
     console.log('tripData已更新:', tripData.value)
   } else {
     errorMsg.value = res.error || '接口调用失败'
     console.log('请求失败:', errorMsg.value)
   }
}

// 初始化统一调用
const initData = async () => {
  loading.value = true
  errorMsg.value = ''
  await fetchTripData()
  await fetchTransportData()
  loading.value = false
}

// 保存行程 (保留原有逻辑)
const savePlan = async () => {
  try {
    await post('/trip-plans', tripData.value)
    showToast('Plan saved')
  } catch { 
    showToast('Save failed') 
  }
}

const markAsTaken = () => {
  router.push({
    path: '/travel-log/new',
    query: {
      destination: tripData.value?.city || formData.city,
      days: tripData.value?.days || formData.days,
      totalSpent: tripData.value?.totalBudget || formData.budget,
    }
  })
}

const goTOChat = () => {
  router.push({ 
    path: '/chat',
    query: {
      city: formData.city,
    }
   })
}

onMounted(() => {
  formData.fromCity = route.query.fromCity || '泉州'
  formData.city = route.query.city || '上海' // 提供默认兜底，方便预览
  formData.budget = route.query.budget
  formData.days = route.query.days
  
  if (formData.city && formData.budget && formData.days) {
    initData()
  } else {
    loading.value = false
    console.log('缺少参数，不调用接口')
  }
})
</script>

<style scoped>
/* 基础与布局 */
.page-container {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 90px; /* 为底部吸底按钮留出空间 */
}
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

/* 1. Hero Banner */
.hero-banner {
  position: relative;
  height: 180px;
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  margin: 12px 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.hero-bg {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.hero-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0) 100%);
}
.hero-content {
  position: relative;
  z-index: 1;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
}
.hero-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #333;
}
.hero-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}
.hero-budget-pill {
  margin-top: 16px;
  display: inline-flex;
  align-items: center;
  background: #fff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  width: fit-content;
}
.price-highlight {
  color: #ff7a00;
  font-weight: 600;
}

/* 2. 天数切换 Tabs */
.day-tabs {
  display: flex;
  padding: 0 16px;
  margin-bottom: 16px;
  gap: 12px;
}
.day-tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  border: 1px solid #ebedf0;
  transition: all 0.3s;
}
.day-tab-item.active {
  color: #1989fa;
  background: #f0f7ff;
  border-color: #1989fa;
  font-weight: bold;
}

/* 公共卡片样式 */
.card {
  background: #fff;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sub-text {
  font-size: 12px;
  color: #999;
  font-weight: normal;
}
.help-icon {
  background: #f0f0f0;
  border-radius: 50%;
  padding: 2px;
  color: #999;
}

/* 行程明细卡片 */
.itinerary-card {
  padding: 20px 16px;
}
.schedule-section { margin-bottom: 20px; }
.schedule-section:last-child { margin-bottom: 0; }
.section-label {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 12px;
}
.section-label.morning { background: #fff7e6; color: #fa8c16; }
.section-label.afternoon { background: #e6f7ff; color: #1890ff; }
.section-label.evening { background: #f6ffed; color: #52c41a; }

/* 3. 预算明细列表 */
.budget-list {
  border-bottom: 1px solid #ebedf0;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.budget-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #333;
}
.budget-item .label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.budget-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;
}
.total-value {
  color: #ee0a24;
  font-size: 18px;
}

/* 4. 交通费用预览 */
.transport-boxes {
  display: flex;
  gap: 12px;
}
.trans-box {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}
.trans-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  margin-bottom: 12px;
}
.trans-price-block {
  text-align: center;
  background: #fff;
  border-radius: 6px;
  padding: 12px 0;
  color: #ee0a24;
}
.price-symbol { font-size: 14px; }
.price-big { font-size: 24px; font-weight: bold; margin: 0 2px; }
.price-unit { font-size: 12px; color: #666; }
.flight-days {
  display: flex;
  justify-content: space-between;
  background: #fff;
  border-radius: 6px;
  padding: 8px;
}
.flight-day {
  text-align: center;
}
.f-date { font-size: 12px; color: #666; margin-bottom: 4px; }
.f-price { font-size: 14px; font-weight: bold; color: #1989fa; }
.f-price.orange { color: #ff976a; }
.f-price.green { color: #07c160; }

/* 5 & 6. 提示与警告容器 */
.tips-container {
  border-radius: 8px;
  padding: 12px;
}
.blue-box { background: #f0f7ff; border: 1px solid #e0efff; }
.red-box { background: #fff5f5; border: 1px solid #ffeded; }
.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #333;
  margin-bottom: 10px;
}
.tip-item:last-child {
  margin-bottom: 0;
}
.tip-icon {
  margin-top: 2px;
  font-size: 16px;
}

/* 7. 底部双栏按钮区 */
.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
  max-width: 750px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  z-index: 100;
  box-sizing: border-box;
}
.footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  padding: 12px 0;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s;
}
.footer-btn:active {
  opacity: 0.8;
}
.btn-ai {
  background: linear-gradient(135deg, #409eff 0%, #1989fa 100%);
}
.btn-finish {
  background: linear-gradient(135deg, #20c997 0%, #07c160 100%);
}
.btn-text-group {
  display: flex;
  flex-direction: column;
}
.btn-title {
  font-size: 15px;
  font-weight: bold;
}
.btn-sub {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
}
</style>
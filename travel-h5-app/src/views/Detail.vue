<template>
  <div class="page-container">
    <div class="page-header">
      <van-nav-bar 
        fixed
        left-text="返回" 
        left-arrow @click-left="onback"
        :title="formData.city + '行程规划'" />
    </div>
    <div class="page-content">
      <div v-if="loading" class="loading-container">
      <van-loading size="48px" type="spinner" >
        正在生成行程规划....
      </van-loading >
      </div>
      <div v-else-if="errorMsg">
        <van-empty :description="errorMsg" >
          <van-button type="primary" @click="fetchTripData">重新生成</van-button>
        </van-empty>
      </div> 
      <template v-else-if="tripData && tripData.success !== false">
            <div class="card overview-card">
              <div class="trip-header">
                <h2>{{ tripData.city }} · {{ tripData.days }}天行程</h2>
                <div class="trip-budget">预算: {{ tripData.totalBudget }}元</div>
              </div>
            </div>
            <van-collapse v-model="activeDays" class="trip-collapse">
                 <van-collapse-item v-for="(day, index) in tripData.dailyItinerary"
                  :key="day.day" 
                  :title="'第' + day.day + ' 天'"
                  :name="day.day">
                  <div class="day-schedule">
                      <div class="schedule-section">
                        <div class="section-label morning">上午</div>
                        <SpotItem :data="day.morning" />
                      </div>
                      <div class="schedule-section">
                        <div class="section-label afternoon">下午</div>
                        <SpotItem :data="day.afternoon" />
                      </div>      
                      <div class="schedule-section">
                        <div class="section-label evening">晚上</div> 
                        <SpotItem :data="day.evening" />
                      </div>
                    </div>
                 </van-collapse-item>
            </van-collapse>
          <div class="card budget-card" v-if="tripData.budgetBreakdown">
            <div class="section-title">
             预算明细 
            </div>
              <BudgetTable :data="tripData.budgetBreakdown" :total="tripData.totalBudget" />
          </div>
          <div class="card tips-card" v-if="tripData.tips && tripData.tips.length > 0">
            <div class="section-title">
             温馨提示 
            </div>
            <ul class="tips-list">
              <li v-for="(tip, index) in tripData.tips" :key="index">{{ tip }}</li>
            </ul>
          </div>
          <div class="card warnings-card">
            <div class="section-title">
             注意事项 
            </div>
            <ul class="warnings-list">
              <li v-for="(warning, index) in tripData.warnings" :key="index">{{ warning }}</li>
            </ul>
          </div>
        
       </template>

    </div>
      <div class="detail-footer" v-if="tripData && tripData.success !== false">
      <van-button type="primary" size="large" round @click="goTOChat" class="primary-button">
        咨询AI助手
      </van-button>
      <van-button type="success" size="large" round @click="markAsTaken" style="margin-top:8px;">
        Mark as Taken
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { post } from '../utils/request'
import SpotItem from '../components/SpotItem.vue'
import BudgetTable from '../components/BudgetTable.vue'

const router = useRouter()
const route = useRoute()

// 加载状态
const loading = ref(true)


// 咨询AI助手
const savePlan = async () => {
  try {
    await post('/trip-plans', tripData.value)
    showToast('Plan saved')
  } catch { showToast('Save failed') }
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



const formData = reactive({
  city: '',
  budget: null,
  days: null
})

const tripData = ref(null)

const errorMsg = ref('')

const activeDays = ref([])

const onback=()=>{
    router.back()
}

//行程规划数据
const fetchTripData = async () => {
   const res = await post('/travel/recommend', {
      city: formData.city,
      budget: formData.budget,
      days: formData.days
    })
   loading.value = false
   console.log('API响应:', res)
      if(res && res.success !== false) {
        tripData.value = res
        console.log('tripData已更新:', tripData.value)
      }else{
        errorMsg.value = res.error || '接口调用失败'
        console.log('请求失败:', errorMsg.value)
      }
}


onMounted(() => {
  formData.city = route.query.city
  formData.budget = route.query.budget
  formData.days = route.query.days
  
  console.log('route.query:', route.query)
  console.log('formData:', formData)
   
    if (formData.city && formData.budget && formData.days) {
      fetchTripData()
    } else {
      loading.value = false
      console.log('缺少参数，不调用接口')
    }
})
</script>


<style scoped>
.page-header{
  height: 46px;
}


.overview-card {
  margin-bottom: 16px;
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-header h2 {
  font-size: 20px;
  color: #323233;
  margin: 0;
}

.trip-budget {
  font-size: 16px;
  color: #ee0a24;
  font-weight: 600;
}

.trip-collapse {
  margin-bottom: 16px;
}

.day-schedule {
  padding: 8px 0;
}

.schedule-section {
  margin-bottom: 16px;
}

.schedule-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 8px;
}

.section-label.morning {
  background: #fff7e6;
  color: #fa8c16;
}

.section-label.afternoon {
  background: #e6f7ff;
  color: #1890ff;
}

.section-label.evening {
  background: #f6ffed;
  color: #52c41a;
}

.budget-card,
.tips-card,
.warnings-card {
  margin-bottom: 16px;
}

.tips-list,
.warnings-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li,
.warnings-list li {
  padding: 8px 0;
  color: #666;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.tips-list li:last-child,
.warnings-list li:last-child {
  border-bottom: none;
}

.detail-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
}

.error-card {
  text-align: center;
  padding: 40px 16px;
}

</style>

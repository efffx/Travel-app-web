<template>
  <div class="page-container">
    <van-nav-bar title="My Plans" left-arrow left-text="Back" @click-left="$router.back()" fixed />
    <div class="page-content" style="padding-top:56px;">
      <div v-if="loading" class="loading-container"><van-loading size="36px" type="spinner">Loading...</van-loading></div>
      <div v-else-if="plans.length === 0"><van-empty description="No saved plans. Generate a trip plan first!" /></div>

      <div v-else>
        <div v-for="plan in plans" :key="plan._id" class="card plan-card">
          <div class="plan-header">
            <h3>{{ plan.city }}</h3>
            <div>
              <span class="plan-badge">{{ plan.days }} days</span>
              <span class="plan-badge budget">${{ plan.totalBudget }}</span>
            </div>
          </div>
          <div class="plan-date">{{ new Date(plan.createdAt).toLocaleDateString() }}</div>
          <div class="plan-actions">
            <van-button size="small" @click="toggleExpand(plan._id)">{{ expanded === plan._id ? 'Collapse' : 'View Details' }}</van-button>
            <van-icon name="delete" class="delete-icon" @click="handleDelete(plan._id)" />
          </div>

          <van-collapse v-if="expanded === plan._id" v-model="activeDays" class="plan-detail">
            <van-collapse-item v-for="day in plan.dailyItinerary" :key="day.day"
              :title="'Day ' + day.day" :name="day.day">
              <div class="day-schedule">
                <div class="schedule-item" v-if="day.morning?.spot"><span class="tag morning">AM</span> {{ day.morning.spot }}</div>
                <div class="schedule-item" v-if="day.afternoon?.spot"><span class="tag afternoon">PM</span> {{ day.afternoon.spot }}</div>
                <div class="schedule-item" v-if="day.evening?.spot"><span class="tag evening">EV</span> {{ day.evening.spot }}</div>
              </div>
            </van-collapse-item>
          </van-collapse>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post as del } from '../utils/request.js'
import { showToast, showConfirmDialog } from 'vant'

const plans = ref([])
const loading = ref(true)
const expanded = ref(null)
const activeDays = ref([])

const fetchPlans = async () => {
  try {
    const res = await get('/trip-plans', { page: 1, limit: 50 })
    if (res.success) plans.value = res.data.plans
  } catch { showToast('Failed to load') }
  finally { loading.value = false }
}

const toggleExpand = (id) => {
  expanded.value = expanded.value === id ? null : id
  activeDays.value = []
}

const handleDelete = async (id) => {
  try {
    await showConfirmDialog({ message: 'Delete this plan?' })
    await del(`/trip-plans/${id}`)
    plans.value = plans.value.filter(p => p._id !== id)
    showToast('Deleted')
  } catch { /* cancelled */ }
}

onMounted(fetchPlans)
</script>

<style scoped>
.plan-card { margin-bottom: 12px; }
.plan-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.plan-header h3 { margin: 0; font-size: 18px; }
.plan-badge { background: #1989fa; color: #fff; padding: 2px 8px; border-radius: 8px; font-size: 12px; margin-left: 6px; }
.plan-badge.budget { background: #ee0a24; }
.plan-date { color: #969799; font-size: 13px; margin-bottom: 8px; }
.plan-actions { display: flex; justify-content: space-between; align-items: center; }
.delete-icon { font-size: 20px; color: #ee0a24; }
.plan-detail { margin-top: 12px; }
.schedule-item { padding: 4px 0; font-size: 14px; }
.tag { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 11px; margin-right: 6px; color: #fff; }
.tag.morning { background: #fa8c16; }
.tag.afternoon { background: #1890ff; }
.tag.evening { background: #52c41a; }
</style>

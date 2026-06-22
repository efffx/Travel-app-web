<template>
  <div class="page-container">
    <van-nav-bar title="My Travels" left-arrow left-text="Back" @click-left="$router.back()" fixed />
    <div class="page-content" style="padding-top:56px;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:12px;">
        <van-button type="primary" size="small" round to="/travel-log/new">+ New Log</van-button>
      </div>

      <div v-if="loading" class="loading-container"><van-loading size="36px" type="spinner">Loading...</van-loading></div>
      <div v-else-if="logs.length === 0"><van-empty description="No travel logs yet. Start recording!" /></div>

      <div v-else>
        <div v-for="log in logs" :key="log._id" class="card log-card" @click="$router.push(`/travel-log/${log._id}/edit`)">
          <div class="log-header">
            <h3>{{ log.destination }}</h3>
            <span class="rating">{{ '⭐'.repeat(log.rating) }}</span>
          </div>
          <div class="log-meta">
            <span>{{ log.days }} days</span>
            <span>Spent: {{ log.totalSpent }}</span>
          </div>
          <div class="log-date" v-if="log.startDate">
            {{ new Date(log.startDate).toLocaleDateString() }} - {{ log.endDate ? new Date(log.endDate).toLocaleDateString() : '' }}
          </div>
          <div class="log-notes" v-if="log.notes">{{ log.notes.slice(0, 60) }}{{ log.notes.length > 60 ? '...' : '' }}</div>
          <div class="log-actions">
            <van-icon name="delete" @click.stop="handleDelete(log._id)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { get, post as del } from '../utils/request.js'
import { showToast, showConfirmDialog } from 'vant'

const logs = ref([])
const loading = ref(true)

const fetchLogs = async () => {
  try {
    const res = await get('/travel-logs', { page: 1, limit: 50 })
    if (res.success) logs.value = res.data.logs
    else showToast('Failed to load')
  } catch { showToast('Failed to load') }
  finally { loading.value = false }
}

const handleDelete = async (id) => {
  try {
    await showConfirmDialog({ message: 'Delete this travel log?' })
    await del(`/travel-logs/${id}`)
    logs.value = logs.value.filter(l => l._id !== id)
    showToast('Deleted')
  } catch { /* cancelled */ }
}

onMounted(fetchLogs)
</script>

<style scoped>
.log-card { cursor: pointer; margin-bottom: 12px; }
.log-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.log-header h3 { margin: 0; font-size: 18px; }
.rating { font-size: 14px; }
.log-meta { display: flex; gap: 16px; color: #969799; font-size: 13px; margin-bottom: 4px; }
.log-date { color: #969799; font-size: 12px; margin-bottom: 4px; }
.log-notes { color: #666; font-size: 13px; }
.log-actions { text-align: right; margin-top: 8px; color: #ee0a24; }
</style>

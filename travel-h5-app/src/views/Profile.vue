<template>
  <div class="profile-page">
    <van-nav-bar title="Profile" fixed />

    <template v-if="auth.state.isAuthenticated">
      <div class="user-info-section">
        <div class="user-avatar">
          <van-image round width="80" height="80" :src="auth.state.user?.avatar" fit="cover" />
        </div>
        <div class="user-details">
          <div class="user-name">{{ auth.state.user?.username || 'Traveler' }}</div>
          <div class="user-id">{{ auth.state.user?.email }}</div>
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-item">
          <div class="stat-value">{{ stats.trips }}</div>
          <div class="stat-label">Trips</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.cities }}</div>
          <div class="stat-label">Cities</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ stats.totalSpent }}</div>
          <div class="stat-label">Spent</div>
        </div>
      </div>

      <div class="menu-section">
        <van-cell-group inset>
          <van-cell title="My Travels" icon="notes-o" is-link to="/travel-logs" />
          <van-cell title="My Plans" icon="map-o" is-link to="/my-plans" />
          <van-cell title="Points Mall" icon="gift-o" is-link @click="showToast('Coming soon')" />
          <van-cell title="Settings" icon="setting-o" is-link @click="showToast('Coming soon')" />
        </van-cell-group>
      </div>

      <div class="menu-section">
        <van-cell-group inset>
          <van-cell title="About" icon="info-o" is-link @click="showToast('AI Travel v2.0')" />
        </van-cell-group>
      </div>

      <div class="logout-section">
        <van-button type="default" block round @click="handleLogout">Logout</van-button>
      </div>
    </template>

    <template v-else>
      <div class="unlogin-section">
        <van-empty description="Please login first">
          <van-button type="primary" round to="/login">Login</van-button>
          <van-button plain round to="/register" style="margin-top:12px;">Register</van-button>
        </van-empty>
      </div>
    </template>

    <div class="tabbar-placeholder"></div>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useAuth.js'
import { get } from '../utils/request.js'

const router = useRouter()
const auth = useAuth()

const stats = reactive({ trips: 0, cities: 0, totalSpent: 0 })

onMounted(async () => {
  if (auth.state.isAuthenticated) {
    await auth.fetchProfile()
    try {
      const res = await get('/travel-logs/stats')
      if (res.success) Object.assign(stats, res.data)
    } catch { /* stats will show 0 */ }
  }
})

const handleLogout = () => {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.profile-page { min-height: 100vh; background-color: #f7f8fa; padding-top: 46px; }
.user-info-section { display: flex; align-items: center; padding: 20px 16px; background-color: #fff; margin-bottom: 12px; }
.user-avatar { margin-right: 16px; }
.user-details { flex: 1; }
.user-name { font-size: 18px; font-weight: 500; color: #323233; margin-bottom: 4px; }
.user-id { font-size: 14px; color: #969799; }
.stats-section { display: flex; align-items: center; justify-content: space-around; padding: 16px; background-color: #fff; margin-bottom: 12px; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-value { font-size: 20px; font-weight: 500; color: #323233; }
.stat-label { font-size: 12px; color: #969799; margin-top: 4px; }
.stat-divider { width: 1px; height: 30px; background-color: #ebedf0; }
.menu-section { margin-bottom: 12px; }
.logout-section { padding: 32px 16px; }
.unlogin-section { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
.tabbar-placeholder { height: 50px; }
</style>

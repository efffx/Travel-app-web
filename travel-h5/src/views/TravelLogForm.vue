<template>
  <div class="page-container">
    <van-nav-bar :title="isEdit ? 'Edit Log' : 'New Log'" left-arrow left-text="Back" @click-left="$router.back()" fixed />
    <div class="page-content" style="padding-top:56px;">
      <div class="card">
        <van-form @submit="handleSubmit">
          <van-field v-model="form.destination" label="Destination" placeholder="e.g. Chengdu" :rules="[{ required: true, message: 'Required' }]" />
          <van-field v-model="form.days" type="digit" label="Days" placeholder="e.g. 4" :rules="[{ required: true, message: 'Required' }]" />
          <van-field v-model="form.totalSpent" type="digit" label="Total Spent" placeholder="e.g. 3200" :rules="[{ required: true, message: 'Required' }]" />
          <van-field v-model="form.startDate" label="Start Date" placeholder="2026-05-01" />
          <van-field v-model="form.endDate" label="End Date" placeholder="2026-05-04" />
          <van-field v-model="form.companions" label="Companions" placeholder="e.g. Friends, Family" />
          <van-field v-model="form.notes" label="Notes" type="textarea" rows="3" placeholder="Write something about this trip..." maxlength="500" show-word-limit />
          <div style="margin:16px 0;">
            <div style="font-size:14px;color:#666;margin-bottom:8px;">Rating</div>
            <van-rate v-model="form.rating" :count="5" />
          </div>
          <van-button round block type="primary" native-type="submit" :loading="saving">{{ isEdit ? 'Update' : 'Save' }}</van-button>
        </van-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { post, put, get } from '../utils/request.js'
import { showToast } from 'vant'

const router = useRouter()
const route = useRoute()
const isEdit = computed(() => !!route.params.id)
const saving = ref(false)

const form = ref({
  destination: '', days: '', totalSpent: '', startDate: '', endDate: '',
  companions: '', notes: '', rating: 3
})

onMounted(async () => {
const query = route.query
if (query.destination) {
  form.value.destination = query.destination
  form.value.days = query.days || ''
  form.value.totalSpent = query.totalSpent || ''
}
  if (isEdit.value) {
    try {
      const res = await get(`/travel-logs/${route.params.id}`)
      if (res.success) form.value = { ...res.data }
    } catch { showToast('Failed to load') }
  }
})

const handleSubmit = async () => {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      days: Number(form.value.days),
      totalSpent: Number(form.value.totalSpent),
    }
    const res = isEdit.value ? await put(`/travel-logs/${route.params.id}`, payload) : await post('/travel-logs', payload)
    if (res.success) {
      showToast(isEdit.value ? 'Updated' : 'Saved')
      router.push('/travel-logs')
    } else showToast('Failed')
  } catch { showToast('Failed') }
  finally { saving.value = false }
}
</script>

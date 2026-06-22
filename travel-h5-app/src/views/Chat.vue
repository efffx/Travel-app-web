<template>
  <div class="page-container chat-page">
    <div class="page-header">
      <van-nav-bar 
        title="AI旅游助手"
        left-arrow
        left-text="返回"
        @click-left="onBack"
        fixed
      />
    </div>
    
    <div class="chat-container">
      <div v-if="message.length === 0" class="chat-empty">
        <van-empty description="开始和AI助手对话吧！" />
        <div class="quick-questions">
          <span class="quick-title">常见问题</span>
          <van-tag 
            @click="handleClickTag(q)" 
            v-for="q in quickTags" 
            :key="q" 
            size="large" 
            mark 
            class="van-tag--mark van-tag--large van-tag--default quick-tag"
          >
            {{ q }}
          </van-tag>
        </div>
      </div>
      
      <div v-else class="message-list">
        <div v-for="item in message" :key="item.id" class="message-item" :class="item.role">
          <div class="message-content">{{ item.content }}</div>
          <div class="message-time">{{ item.time }}</div>
        </div>
        <div v-if="isStreaming" class="thinking-indicator">
          <div class="thinking-spinner"></div>
          <span>AI正在思考中...</span>
        </div>
      </div>
    </div>
    
    <div class="chat-input-area">
      <van-field
        v-model="inputMessage"
        placeholder="给我推荐一个"
        @keyup.enter="sendMessage"
      >
        <template #button>
          <van-button type="primary" size="small" :disabled="inputMessage.trim() === ''" @click="sendMessage">
            发送
          </van-button>
        </template>
      </van-field>
    </div>
    
    <div class="van-tabbar__placeholder" style="height: 50px;"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { fetchStream } from '../utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const inputMessage = ref('')
const message = ref([])
const isStreaming = ref(false)

const quickTags = ref([
  '北京有哪些必去的景点？',
  '上海美食推荐',
  '成都三日游攻略',
  '如何选择旅行保险？'
])

const handleClickTag = (tag) => {
  inputMessage.value = tag
  sendMessage()
}

const formatTime = (date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const sendMessage = () => {
  if (!inputMessage.value.trim()) return

  const now = new Date()
  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: inputMessage.value,
    time: formatTime(now)
  }
  message.value.push(userMessage)

  const content = inputMessage.value
  inputMessage.value = ''
  isStreaming.value = true

  let aiResponse = ''
  const aiMessage = {
    id: Date.now() + 1,
    role: 'assistant',
    content: '',
    time: formatTime(new Date())
  }
  message.value.push(aiMessage)

  fetchStream('chat', { message: content },
    (chunk) => {
      aiResponse += chunk
      const index = message.value.findIndex(item => item.id === aiMessage.id)
      if (index !== -1) {
        message.value[index] = { ...message.value[index], content: aiResponse }
      }
    },
    (error) => {
      const index = message.value.findIndex(item => item.id === aiMessage.id)
      if (index !== -1) {
        message.value[index] = { ...message.value[index], content: '抱歉，发生了错误' }
      }
    },
    () => {
      isStreaming.value = false
    }
  )
}

const onBack = () => {
  router.back()
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-top: 60px;
  padding-bottom: 120px;
}

.chat-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.quick-questions {
  margin-top: 32px;
  text-align: center;
}

.quick-title {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.quick-tag {
  margin: 8px;
  cursor: pointer;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.message-item.user {
  align-self: flex-end;
  background-color: #1989fa;
  color: white;
  align-items: flex-end;
}

.message-item.assistant {
  align-self: flex-start;
  background-color: #fff;
  color: #323233;
  border: 1px solid #eee;
  align-items: flex-start;
}

.message-time {
  font-size: 10px;
  opacity: 0.7;
  margin-top: 4px;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  max-width: 80%;
  align-self: flex-start;
  color: #999;
  font-size: 14px;
}

.thinking-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1989fa;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.chat-input-area {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  max-width: 750px;
  margin: 0 auto;
  z-index: 100;
}

.chat-input-area :deep(.van-field) {
  background: #f7f8fa;
  border-radius: 20px;
  padding: 8px 16px;
}
</style>
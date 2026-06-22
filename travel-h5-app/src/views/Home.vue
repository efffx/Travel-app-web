<template>
  <!-- 页面最外层容器 -->
  <div class="page-container">
    <!-- 页面顶部导航栏 -->
    <div class="page-header">
      <!-- Vant 导航栏组件：title设置标题，left-arrow显示左侧返回箭头 -->
      <van-nav-bar title="智能旅游助手" left-arrow />
    </div>

    <!-- 页面主体内容区域 -->
    <div class="page-content">
      <!-- Vant 通知栏组件：用于展示重要提示信息 -->
      <!-- left-icon:左侧图标，text:通知内容，style:底部外边距16px -->
      <van-notice-bar
        left-icon="info-o"
        text="基于AI的智能旅游助手，帮助您计划您的旅游行程。"
        style="margin-bottom: 16px;"
      />

      <!-- 搜索表单卡片区域 -->
      <div class="card search-card">
        <!-- 卡片标题 -->
        <div class="section-title">规划您的旅程</div>

        <!-- 城市选择输入框 -->
        <!-- @click:点击事件,最开始是false，点击后变为true，is-link:显示右侧箭头图标，v-model:双向绑定数据 -->
        <van-field
          @click="showCityPicker = true"
          is-link
          v-model="formData.city"
          label="城市"
          placeholder="请选择城市"
          style="background-color: #f7f8fa; border-radius: 12px;"
        />

        <!-- 预算输入框 -->
        <!-- type="number":数字输入框，:border="false":隐藏边框 -->
        <van-field
            v-model="formData.budget"
            type="number"
            label="预算"
            placeholder="请输入预算"
            :border="false"
            style="background-color: #f7f8fa; border-radius: 12px;"
        ></van-field>

        <!-- 天数输入框 -->
        <!-- type="digit":数字输入框（只能输入数字） -->
        <van-field
            v-model="formData.days"
            type="digit"
            label="天数"
            placeholder="请输入天数"
            :border="false"
            style="background-color: #f7f8fa; border-radius: 12px;"
        ></van-field>

        <!-- 提交按钮 -->
        <!-- type="primary":蓝色主题按钮，size="large":大尺寸，round:圆角 -->
        <!-- :loading:加载状态，@click:点击事件 -->
        <van-button
         type="primary"
         size="large"
         round
         :loading="isloading"
         @click="handleSubmit"
         >开始规划</van-button>
      </div>

      <!-- 快捷入口卡片区域 -->
      <div class="card quick-actions">
        <!-- 卡片标题 -->
        <div class="section-title">快捷入口</div>

        <!-- Vant 宫格组件：用于展示快捷入口 -->
        <!-- :columns="2":一行显示2个，:gutter="12":格子之间的间距12px -->
        <van-grid :columns="2"  :gutter="12">
            <!-- 宫格项：to指定路由跳转目标 -->
            <van-grid-item to="/chat" icon="chat-o" text="AI对话" />
            <van-grid-item to="/profile" icon="user-o" text="我的" />
            </van-grid>

        <!-- 热门目的地卡片 -->
        <div class="card popular-destinations">
            <!-- 卡片标题 -->
            <div class="section-title">热门目的地</div>

            <!-- 热门城市宫格 -->
            <!-- :columns="4":一行显示4个，:gutter="8":间距8px -->
            <van-grid :columns="4"  :gutter="8">
                <!-- 遍历热门目的地数组，:key使用城市名作为唯一标识 -->
                <!-- @click:点击城市时触发函数 -->
                <van-grid-item
                  @click="handleCityClick(city)"
                  v-for="city in popularDestinations"
                  :key="city"
                >
                <!-- 城市标签：动态绑定active类名，city相同时显示蓝色背景 -->
                <div class="city-tag" :class="{'active':formData.city==city}">
                  <!-- 显示城市名称 -->
                  {{ city }}
                </div>
            </van-grid-item >
            </van-grid>
        </div>
      </div>
    </div>

    <!-- 城市选择弹出层 -->
    <!-- v-model:show:控制显示/隐藏，round:圆角，position="bottom":从底部弹出 -->
    <van-popup v-model:show="showCityPicker"
        round
        position="bottom"
    >
      <!-- Vant 选择器组件：用于选择城市 -->
      <!-- title:选择器标题，:columns:选项数据，@confirm/@cancel:确认/取消事件 -->
      <van-picker
        title="请选择城市"
        :columns="cityColumns"
        @confirm="handleCityConfirm"
        @cancel="showCityPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
/* ===== 导入 Vue 响应式 API ===== */
// reactive:创建响应式对象（适合对象类型的数据）
// ref:创建响应式变量（适合基本类型和复杂类型）
import { reactive, ref } from 'vue'
import router from '../router'
import { showToast } from 'vant'




/* ===== 控制城市选择弹窗的显示/隐藏 ===== */
// ref 创建响应式变量，初始值为 false（弹窗隐藏）
const showCityPicker = ref(false)

/* ===== 表单数据对象 ===== */
// reactive 创建响应式对象，city/budget/days 会自动成为响应式属性
const formData = reactive({
  city: '',        // 选中的城市
  budget: 'null',  // 预算金额
  days: 'null'     // 旅游天数
})

/* ===== 点击热门城市时触发 ===== */
// 参数 city：被点击的城市名称
// 功能：将点击的城市填入表单
const handleCityClick = (city) => {
  formData.city = city
}

/* ===== 所有城市列表 ===== */
// 包含全国各大城市的数组
const allCities = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
  '南京', '武汉', '苏州', '长沙', '天津', '郑州', '济南', '青岛',
  '大连', '沈阳', '哈尔滨', '长春', '福州', '厦门', '南昌', '合肥',
  '昆明', '贵阳', '南宁', '桂林', '海口', '三亚', '丽江', '大理',
  '西安', '兰州', '乌鲁木齐', '拉萨', '呼和浩特', '太原', '石家庄'
]

/* ===== 热门目的地列表 ===== */
// 从 allCities 中筛选出的热门城市，用于首页展示
const popularDestinations = [
  '北京', '上海', '广州', '深圳', '成都', '杭州', '西安', '重庆',
]

/* ===== 城市选择器的选项数据 ===== */
// 将城市数组转换为 Vant Picker 需要的格式：{ text: 显示文本, value: 值 }
const cityColumns = allCities.map(city => ({
  text: city,
  value: city
}))

/* ===== 城市选择器确认按钮回调 ===== */
// 参数 { selectedOptions }：Vant Picker 组件返回的选中结果对象
// 功能：获取选中的城市并填入表单，然后关闭弹窗
const handleCityConfirm = ({selectedOptions}) => {
  // selectedOptions[0] 是第一个选中的选项，取其 value 属性
  formData.city = selectedOptions[0].value
  // 关闭城市选择弹窗
  showCityPicker.value = false
}

/* ===== 控制提交按钮的加载状态 ===== */
// ref 创建响应式变量，初始值为 false（未加载）
const isloading = ref(false)

/* ===== 提交表单按钮点击事件 ===== */
// 功能：触发表单提交，显示按钮加载状态
const handleSubmit = () => {
  // 设置为加载状态，显示加载动画
  isloading.value = true
  if (!formData.city) {
    // 如果没有选择城市，提示用户选择城市
    showToast('请选择城市')
    return // 结束函数执行
  }
  //判断预算
  if (!formData.budget || Number(formData.budget) < 100) {
    showToast('预算不能小于100元')
    return
  }
  //判断旅游天数
  if (!formData.days || Number(formData.days) < 1 || Number(formData.days) > 30) {
    showToast('旅游天数不能小于1天或大于30天')
    return
  }
  router.push({
    path:'/detail',
    query:{
      city:formData.city,
      budget:formData.budget,
      days:formData.days
    }
  })

}

</script>

<style scoped>
/* 搜索卡片样式：margin-bottom设置与下方内容的间距 */
.search-card {
  margin-bottom: 16px;
}

/* 城市标签样式 */
.city-tag {
  padding: 8px 12px;           /* 上下8px，左右12px的内边距 */
  border-radius: 16px;         /* 圆角16px */
  border-size: 14px;           /* 字体大小14px */
  font-size: 14px;             /* 字号14px */
  color: #666;                 /* 文字颜色深灰色 */
  background: #f7f8fa;          /* 背景色浅灰色 */
  transition: all 0.3s;         /* 所有属性变化时添加0.3秒过渡动画 */
}

/* 选中状态的城市标签样式：当选中时使用蓝色背景和白色文字 */
.active {
  background: #007AFF;          /* 背景色蓝色 */
  color: #fff;                  /* 文字颜色白色 */
}
</style>

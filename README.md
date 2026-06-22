# AI Travel — 智能旅行规划助手

基于 Vue 3 + Vite + Vant UI 的移动端 H5 前端，搭配 Express + LangChain + OpenAI 大模型后端，提供 AI 驱动的智能旅行规划服务。

---

## 项目结构

```
AI-travel/
├── travel-h5/          # 前端 — Vue 3 + Vite 移动端 H5
│   ├── src/
│   │   ├── views/      # 页面（Home / Chat / Detail / Profile / Demo）
│   │   ├── components/ # 通用组件（BudgetTable / ChatBubble / SpotItem）
│   │   ├── router/     # Vue Router 路由配置
│   │   ├── utils/      # Axios 封装 + SSE 流式请求
│   │   ├── styles/     # 全局样式
│   │   └── assets/     # 静态资源
│   ├── public/
│   └── vite.config.js
│
├── travel-server/      # 后端 — Express + LangChain
│   ├── src/
│   │   ├── services/   # LLM 旅行推荐 & 对话服务
│   │   ├── routes/     # RESTful 路由
│   │   ├── utils/      # SSE 流式响应工具
│   │   └── index.js    # 服务入口
│   └── .env            # 环境配置（API Key 等）
│
├── package.json        # 根级依赖
└── README.md
```

---

## 功能特性

- **AI 行程规划** — 输入城市、预算、天数，自动生成每日详细行程（上午/下午/晚间）
- **AI 对话助手** — 基于 LLM 的流式对话，实时回答旅行相关问题
- **预算明细** — 自动拆分住宿、餐饮、交通、门票等各项费用
- **多模型支持** — 支持 SiliconFlow、DeepSeek 等多种大模型提供商
- **热门目的地** — 快速选择热门城市，一键规划
- **SSE 流式响应** — 对话内容实时流式展示，体验更流畅

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 1. 启动后端

```bash
cd travel-server

# 安装依赖
npm install

# 配置环境变量（编辑 .env 文件）
# MODEL_PROVIDER=SILICONFLOW  # 或 DEEPSEEK
# SILICONFLOW_API_KEY=your_key
# DEEPSEEK_API_KEY=your_key
# PORT=3300

# 启动服务（开发模式，带热重载）
npm run dev

# 或生产模式
npm start
```

### 2. 启动前端

```bash
cd travel-h5

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

> 前端开发服务器已配置代理转发 `/travel` 到 `localhost:3300`，无需额外配置跨域。

---

## API 接口

| 方法   | 路径                | 说明             |
| ------ | ------------------- | ---------------- |
| POST   | `/travel/recommend` | 获取旅行推荐行程 |
| POST   | `/travel/chat`      | AI 对话（SSE 流式） |
| POST   | `/heartbeat`        | 服务健康检查     |

### /travel/recommend

请求体：
```json
{
  "city": "北京",
  "budget": 3000,
  "days": 3
}
```

返回完整的每日行程安排及预算明细。当 LLM 未配置时自动降级为模拟数据。

### /travel/chat

请求体：
```json
{
  "message": "北京有哪些必去的景点？"
}
```

采用 Server-Sent Events (SSE) 流式返回 AI 回复内容。

---

## 技术栈

| 前端              | 后端                |
| ----------------- | ------------------- |
| Vue 3 (Composition API) | Node.js + Express |
| Vite 8            | LangChain.js        |
| Vant 4 (移动端 UI) | OpenAI / SiliconFlow / DeepSeek |
| Vue Router 5      | dotenv + nodemon    |
| Axios             | CORS                |

---

## License

ISC

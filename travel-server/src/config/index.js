import 'dotenv/config';

const config = {
  port: parseInt(process.env.PORT, 10) || 3300,
  nodeEnv: process.env.NODE_ENV || 'development',

  // mongodb: {
  //   uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-travel',
  // },

  jwt: {
    secret: process.env.JWT_SECRET || 'ai-travel-jwt-dev-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  llm: {
    provider: process.env.MODEL_PROVIDER || 'SILICONFLOW',
    siliconflow: {
      apiKey: process.env.SILICONFLOW_API_KEY,
      baseUrl: process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1',
      model: process.env.SILICONFLOW_MODEL || 'Qwen/Qwen3.6-35B-A3B',
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
  },
};

export default config;

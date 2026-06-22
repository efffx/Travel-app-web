import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

class TravelServices{
    constructor(){
        this.llm = null;
        this.initLLM();
    }
    initLLM(){
        const provider = process.env.MODEL_PROVIDER;
        let apiKey, baseURL, model;
        if (provider === 'SILICONFLOW') {
            apiKey = process.env.SILICONFLOW_API_KEY;
            baseURL = process.env.SILICONFLOW_BASE_URL;
            model = process.env.SILICONFLOW_MODEL;
        } else if (provider === 'DEEPSEEK') {
            apiKey = process.env.DEEPSEEK_API_KEY;
            baseURL = process.env.DEEPSEEK_BASE_URL;
            model = process.env.DEEPSEEK_MODEL;
        }
        if (apiKey && baseURL && model) {
            this.llm = new ChatOpenAI({
                model: model,
                temperature: 0.7,
                openAIApiKey: apiKey,
                configuration: {
                    baseURL: baseURL
                }
            });
            console.log('LLM 初始化成功，使用 provider:', provider);
        } else {
            console.warn('LLM configuration incomplete, using mock data');
        }
    }
    getMockRecommendation(city, budget, days) {
        const dailyBudget = Math.floor(budget / days);
        return {
            success: true,
            city: city,
            days: days,
            totalBudget: budget,
            dailyItinerary: Array.from({ length: days }, (_, i) => ({
                day: i + 1,
                date: `第${i + 1}天`,
                morning: {
                    spot: `${city}著名景点A`,
                    duration: '2小时',
                    ticket: '100',
                    transportation: '地铁',
                    description: `${city}著名景点A是当地最受欢迎的旅游目的地之一，拥有悠久的历史和独特的文化景观。`
                },
                afternoon: {
                    spot: `${city}美食街`,
                    duration: '3小时',
                    ticket: '免费',
                    transportation: '步行',
                    description: `品尝${city}地道美食，体验当地特色小吃文化。`
                },
                evening: {
                    spot: `${city}夜景`,
                    duration: '2小时',
                    ticket: '免费',
                    transportation: '打车',
                    description: `欣赏${city}美丽的城市夜景。`
                }
            })),
            budgetBreakdown: {
                accommodation: Math.floor(budget * 0.3),
                food: Math.floor(budget * 0.2),
                transportation: Math.floor(budget * 0.15),
                tickets: Math.floor(budget * 0.2),
                other: Math.floor(budget * 0.15)
            },
            tips: [`建议提前预订${city}热门景点门票`, '出行前查看天气预报', '注意保管个人财物'],
            warnings: ['节假日游客较多，请提前规划行程', '部分景点可能需要预约']
        };
    }
      async recommend(city, budget, days) {
        if (budget < 100 || days < 1 || days > 30) {
            throw new Error('预算不能低于100元，天数必须在1-30天之间');
        }
        if (!this.llm) {
            console.log('LLM 未配置，返回模拟数据');
            return this.getMockRecommendation(city, budget, days);
        }
        const message = this.getTravelprompt(city, budget, days);
        try {
            const response = await this.llm.invoke(message);
            console.log('LLM原始响应:', response);
            let content = response.content || '';
            console.log('原始内容:', content);
            
            content = this.extractJsonFromContent(content);
            console.log('提取后的JSON:', content);
            
            try {
                const result = JSON.parse(content);
                return result;
            } catch (parseError) {
                console.error('JSON解析失败:', parseError);
                return {
                    success: false,
                    message: '解析结果失败',
                    rawContent: content
                };
            }
        } catch (error) {
            console.error('LLM调用失败:', error);
            console.log('返回模拟数据作为备选');
            return this.getMockRecommendation(city, budget, days);
        }
    }
    
    extractJsonFromContent(content) {
        if (!content) return '';
        
        let jsonStr = content.trim();
        
        const jsonMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        } else {
            const codeMatch = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
            if (codeMatch) {
                jsonStr = codeMatch[1];
            }
        }
        
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        return jsonStr.trim();
    }
    
      getTravelprompt(city,budget,days){
        return [
            new HumanMessage(`你是一个专业的旅游规划师，擅长根据用户的需求生成详细的旅行行程。

请根据以下信息为用户生成一份详细的旅游规划：
- 目的地城市：${city}
- 预算：${budget}元
- 旅行天数：${days}天

要求：
1. 每天的行程安排（上午、下午、晚上）
2. 每个景点的详细介绍
3. 交通建议
4. 预算分配明细
5. 注意事项

请以JSON格式输出，结构如下：
{
  "success": true,
  "city": "城市名",
  "days": 天数,
  "totalBudget": 总预算,
  "dailyItinerary": [
    {
      "day": 1,
      "date": "第1天",
      "morning": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "afternoon": {
        "spot": "景点名称",
        "duration": "游览时长",
        "ticket": "门票价格",
        "transportation": "交通方式",
        "description": "景点介绍"
      },
      "evening": {
        "spot": "活动名称",
        "duration": "活动时长",
        "ticket": "费用",
        "transportation": "交通方式",
        "description": "活动介绍"
      }
    }
  ],
  "budgetBreakdown": {
    "accommodation": 住宿费用,
    "food": 餐饮费用,
    "transportation": 交通费用,
    "tickets": 门票费用,
    "other": 其他费用
  },
  "tips": ["提示1", "提示2", "提示3"],
  "warnings": ["注意事项1", "注意事项2"]
}

请确保只输出纯JSON，不要包含任何markdown代码块标记或其他额外说明。`
      )
        ]
      }
      async chat(message, streamCallback) {
        if (!this.llm) {
            return {
                success: false,
                error: 'LLM 未配置'
            };
        }
        const messages = [
            new SystemMessage('你是一个友好的旅游助手，请用中文回答用户的问题。'),
            new HumanMessage(message)
        ];
      
        try {
            const stream = await this.llm.stream(messages);
            let fullResponse = '';
            for await (const chunk of stream) {
                const content = chunk.content || '';
                if (content.trim() === '') {
                    continue;
                }
                fullResponse += content;
                if (streamCallback) {
                    streamCallback(content);
                }
            }
            return {
                success: true,
                reply: fullResponse
            };
        } catch (err) {
            console.error('聊天接口LLM调用失败:', err);
            return {
                success: false,
                error: err.message
            };
        }
      }
    }


export default new TravelServices()
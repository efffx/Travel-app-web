import express from 'express';
import travelServices from '../services/travelServices.js';
import { createStreamResponse } from '../utils/streamUtils.js';



const router = express.Router();


// router.post('/recommend', async(req,res)=>{
//     const {city,budget,days} = req.body
//     if(!city || !budget || !days){
//         return res.status(400).json({
//             success:false,
//             message:'参数错误',
//             error:'city,budget,days不能为空'
            
//         })
//     }
//     try {
//         const result = await travelServices.recommend(city,budget,days)
//         return res.json(result)
//     } catch (error) {
//         console.error('推荐接口错误:', error);
//         return res.status(500).json({
//             success: false,
//             message: '推荐生成失败',
//             error: error.message
//         });
//     }
// })

router.post('/recommend', async (req, res) => {
    const { city, budget, days } = req.body
    if (!city || !budget || !days) {
        return res.status(400).json({
            success: false,
            message: '参数错误',
            error: 'city, budget, days 不能为空'
        })
    }
    
    try {
        // 1. 调用大模型服务获取结果
        let result = await travelServices.recommend(city, budget, days)
        
        // 如果返回的是字符串（有时候大模型会直接返回JSON字符串），先尝试解析它
        if (typeof result === 'string') {
            try {
                result = JSON.parse(result)
            } catch (e) {
                console.error('解析AI返回的字符串失败:', e)
            }
        }

        // 2. 核心：字段映射与清洗 (抹平 AI 命名不一致的问题)
        // 检查并兼容住宿指南字段
        const rawAccommodation = result.accommodationGuide || result.accommodation || result.hotelRecommendation || result.hotelGuide || {};
        const accommodationGuide = {
            recommendedArea: rawAccommodation.recommendedArea || '市中心或核心商圈地铁站附近',
            reason: rawAccommodation.reason || `来到${city}游玩，建议选择交通枢纽附近住宿，出行更便捷。`,
            hotelSuggestions: Array.isArray(rawAccommodation.hotelSuggestions) ? rawAccommodation.hotelSuggestions : [
                { level: '舒适型', name: '市中心精选高评分连锁酒店', estimatedPrice: Math.round(budget * 0.15) || '280' },
                { level: '高档型', name: '核心商圈豪华型星级酒店', estimatedPrice: Math.round(budget * 0.3) || '550' }
            ]
        };

        // 检查并兼容必吃美食字段
        let mustEatFood = result.mustEatFood || result.foods || result.foodRecommendation || result.localFood || [];
        if (!Array.isArray(mustEatFood) || mustEatFood.length === 0) {
            // 如果大模型漏掉了美食，后端直接给出符合该城市的高级特色文本兜底
            mustEatFood = [
                { name: `地道${city}特色招牌菜`, description: '当地人强力推荐的老字号招牌风味，绝不踩雷。', recommendedLoc: '传统老字号街区/美食汇聚地' },
                { name: '市井风情特色小吃', description: '隐匿在老街巷弄里的地道味道，性价比极高，烟火气十足。', recommendedLoc: '本地传统夜市步行街' }
            ];
        }
        // 🌟【修复：正确使用 const 声明变量，防止 ReferenceError】
        const localTransportStrategy = result.localTransportStrategy || result.transportStrategy || result.transportationStrategy || `建议在${city}首选地铁出行。推荐在支付宝或微信中开通“${city}乘车码”，一码通行。`;

        // 🌟【升级：深层打捞大模型行程描述中的高价值贴士】
        let finalTips = [];
        if (Array.isArray(result.tips) && result.tips.length > 0) {
            finalTips = result.tips;
        } else if (typeof result.tips === 'string' && result.tips.trim().length > 0) {
            finalTips = result.tips.split(/[\n;\r,，；]+/).map(t => t.trim()).filter(t => t.length > 0);
        } else if (result.dailyItinerary) {
            // 从大模型的具体行程里捞出带“建议”、“带”的干货
            result.dailyItinerary.forEach(day => {
                day.activities?.forEach(act => {
                    if (act.description && (act.description.includes('建议') || act.description.includes('带'))) {
                        const match = act.description.match(/[^。]*?(建议|带)[^。]*?。/);
                        if (match) finalTips.push(match[0]);
                    }
                });
            });
        }
        // 如果捞出来的太少，用精选贴士填补
        if (finalTips.length === 0) {
            finalTips = [
                '所有热门免费景点及博物馆，强烈建议提前在官方渠道进行实名预约。',
                '随身务必携带充电宝，景区周边共享充电宝租金高昂且容易遇到归还断位。',
                '出行期间日均步数较多，准备一双舒适的运动鞋至关重要。'
            ];
        } else {
            finalTips = [...new Set(finalTips)].slice(0, 4); // 去重取前4条
        }

        // 🌟【升级：深层打捞大模型行程描述中的避坑注意事项】
        let finalWarnings = [];
        if (Array.isArray(result.warnings) && result.warnings.length > 0) {
            finalWarnings = result.warnings;
        } else if (typeof result.warnings === 'string' && result.warnings.trim().length > 0) {
            finalWarnings = result.warnings.split(/[\n;\r,，；]+/).map(w => w.trim()).filter(w => w.length > 0);
        } else if (result.dailyItinerary) {
            // 从大模型的具体行程里精准打捞“不要买”、“宰客”、“注意”等血泪教训
            result.dailyItinerary.forEach(day => {
                day.activities?.forEach(act => {
                    if (act.description && (act.description.includes('注意') || act.description.includes('宰客') || act.description.includes('不要'))) {
                        const match = act.description.match(/[^。]*?(注意|不要|宰客|溢价)[^。]*?。/);
                        if (match) finalWarnings.push(match[0]);
                    }
                });
            });
        }
        if (finalWarnings.length === 0) {
            finalWarnings = [
                '火车站、机场附近的低价一日游喊客人员多有隐形消费，请务必拒绝。',
                '景区内部及热门步行街中的现切水果特产商品溢价较高，请理智消费。',
                '乘坐出租车请认准正规排队通道，坚决不搭乘不打表的私人拉客黑车。'
            ];
        } else {
            finalWarnings = [...new Set(finalWarnings)].slice(0, 4);
        }
        // 3. 组装标准响应结构，百分之百契合前端需求
        const formattedResult = {
            success: true,
            city: result.city || city,
            days: Number(result.days) || Number(days),
            totalBudget: Number(result.totalBudget) || Number(budget),
            // 强绑定两个重点字段
            accommodationGuide: accommodationGuide,
            mustEatFood: mustEatFood,
            // 其他原有字段原样保留或兜底
            dailyItinerary: result.dailyItinerary || [{ day: 1, theme: '自由探索', activities: [] }],
            budgetBreakdown: result.budgetBreakdown || {
                accommodation: Math.round(budget * 0.4),
                food: Math.round(budget * 0.3),
                transportation: Math.round(budget * 0.15),
                tickets: Math.round(budget * 0.1),
                other: Math.round(budget * 0.05)
            },
            packingList: result.packingList || ['身份证/优待证', '充电宝 & 充电线', '换洗衣物', '常用药品', '雨伞/防晒'],
            // 🌟 核心：把清洗好的三个新字段加入最终的返回对象中
            localTransportStrategy: localTransportStrategy,
            tips: finalTips,
            warnings: finalWarnings
        }

        return res.json(formattedResult)

    } catch (error) {
        console.error('推荐接口错误:', error);
        return res.status(500).json({
            success: false,
            message: '推荐生成失败',
            error: error.message
        });
    }
})

// 聊天接口
router.post('/chat', async(req,res)=>{
    const {message} = req.body
    if(!message){
        return res.status(400).json({
            success:false,
            message:'参数错误',
            error:'message不能为空'
            
        })
    }
//对SSE流式接口返回进行处理
    const stream = createStreamResponse(res)
    //调用LLM获取流式响应
    const result = await travelServices.chat(message,(chunk) => {
        stream.send({type:'chunk',content:chunk})
    });
        stream.send({type:'complete',data:result})
        stream.end()

   
})

export default router;

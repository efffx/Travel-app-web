import express from 'express';
import travelServices from '../services/travelServices.js';
import { createStreamResponse } from '../utils/streamUtils.js';



const router = express.Router();


router.post('/recommend', async(req,res)=>{
    const {city,budget,days} = req.body
    if(!city || !budget || !days){
        return res.status(400).json({
            success:false,
            message:'参数错误',
            error:'city,budget,days不能为空'
            
        })
    }
    try {
        const result = await travelServices.recommend(city,budget,days)
        return res.json(result)
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

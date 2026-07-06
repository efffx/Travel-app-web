import express from 'express';
import axios from 'axios';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// 1. 本地长期文件缓存配置
const CACHE_FILE_PATH = path.resolve('./train_price_cache.json');

const getLocalCache = () => {
    if (!fs.existsSync(CACHE_FILE_PATH)) return {};
    try {
        const data = fs.readFileSync(CACHE_FILE_PATH, 'utf-8');
        return JSON.parse(data || '{}');
    } catch (e) {
        return {};
    }
};

const setLocalCache = (key, value) => {
    const cache = getLocalCache();
    cache[key] = {
        price: value,
        updateAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
};

// 2. 处理前端交通预览数据的 POST 接口
router.post('/trainsport', async (req, res) => {
    //console.log('📬 收到前端交通请求参数:', req.body);
    try {
        const { fromCity,city } = req.body;
        
        if (!city) {
            return res.json({ success: false, message: '缺少城市参数' });
        }

        const fromStationName = fromCity; 
        const toStationName = city; // 动态接收前端城市（例如：福州）
        const cacheKey = `${fromStationName}-${toStationName}`; 

        const localCache = getLocalCache();
        let minTrainPrice = null;

        if (localCache[cacheKey]) {
            minTrainPrice = localCache[cacheKey].price;
            console.log(`[Cache Hit] 成功命中本地长期缓存 -> ${cacheKey}: ¥${minTrainPrice}`);
        } else {
            console.log(`[Cache Miss] 缓存未命中，开始请求阿里云API -> ${cacheKey}`);
            try {
                const ALIYUN_APPCODE = process.env.ALIYUN_APPCODE; 
                const ALIYUN_API_URL = process.env.ALIYUN_API_URL; 

                // 🚨 根据 Java 文档，一比一还原请求
                const response = await axios.get(ALIYUN_API_URL, {
                    params: {
                        start: fromStationName, // 👈 直接传中文 "泉州"
                        end: toStationName,     // 👈 直接传中文 "福州"
                        date: dayjs().add(1, 'day').format('YYYY-MM-DD') // 查明天
                    },
                    headers: {
                        'Authorization': `APPCODE ${ALIYUN_APPCODE}`,
                        // 🚨 必须死死锁住这个 Content-Type，和 Java 完全一致
                        'Content-Type': 'application/json; charset=UTF-8' 
                    },
                    timeout:30000 
                });

                const resData = response.data;
                
                if (resData && (resData.status === '0' || resData.status === 0 || resData.result)) {
                    
                    const trainList = resData.result?.list || resData.result || []; 
                    const allValidPrices = []; 

                    trainList.forEach(train => {
                        const priceFields = [
                            train.pricesw,  train.pricetd,  train.pricegr1, train.pricegr2,
                            train.pricerw1, train.pricerw2, train.priceyw1, train.priceyw2,
                            train.priceyw3, train.priced,   train.priceed,  train.pricerz,  train.priceyz
                        ];

                        priceFields.forEach(rawPrice => {
                            if (rawPrice) {
                                const cleanedPrice = String(rawPrice).replace(/[¥\s]/g, ''); 
                                const priceNum = parseFloat(cleanedPrice);
                                if (!isNaN(priceNum) && priceNum > 0) {
                                    allValidPrices.push(priceNum);
                                }
                            }
                        });
                    });

                    if (allValidPrices.length > 0) {
                        minTrainPrice = Math.min(...allValidPrices); 
                        console.log(`[数据清洗成功] ${cacheKey} 最低票价为: ¥${minTrainPrice}`);
                        setLocalCache(cacheKey, minTrainPrice);
                    } else {
                        console.warn('未能从车次列表中提取到任何有效价格');
                    }
                } else {
                    console.error('极速数据业务报错，原因:', resData?.msg || '状态码不匹配');
                }

            } catch (apiErr) {
                console.error('❌ 阿里云API底层请求失败:');
                if (apiErr.response) {
                    console.error('状态码:', apiErr.response.status);
                    console.error('原始错误数据:', JSON.stringify(apiErr.response.data));
                } else {
                    console.error('错误短语:', apiErr.message);
                }
            }
        }

        // 3. 降级兜底
        if (!minTrainPrice) {
            minTrainPrice = toStationName === '福州' ? 105 : 320;
        }

        // 4. 机票数据模拟
        const todayStr = dayjs().format('MM-DD');
        const tomorrowStr = dayjs().add(1, 'day').format('MM-DD');
        const afterTomorrowStr = dayjs().add(2, 'day').format('MM-DD');

        const mockFlightPrices = {
            '福州': [350, 410, 390],
            '上海': [620, 580, 520],
            '默认': [500, 500, 500]
        };
        const currentFlight = mockFlightPrices[toStationName] || mockFlightPrices['默认'];

        return res.json({
            success: true,
            train: {
                price: minTrainPrice
            },
            flight: [
                { date: `今天 (${todayStr})`, price: currentFlight[0] },
                { date: `明天 (${tomorrowStr})`, price: currentFlight[1] },
                { date: `后天 (${afterTomorrowStr})`, price: currentFlight[2] }
            ]
        });

    } catch (error) {
        console.error('服务器内部错误:', error);
        return res.status(500).json({ success: false, message: '后端服务内部错误' });
    }
});

export default router;
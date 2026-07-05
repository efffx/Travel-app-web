// 🌟 移除 authenticate 中间件，允许未登录时直接访问
import express from 'express';
import axios from 'axios'; // 🚨 核心修复：必须显式引入 axios，否则下方调用会直接崩溃！

const router = express.Router();

router.get('/get-city', async (req, res) => {
  const { list_lng, list_lat } = req.query;
  console.log('【后端收到请求】经度:', list_lng, '纬度:', list_lat);
  
  // 1. 基础参数校验
  if (!list_lng || !list_lat) {
    return res.status(400).json({ success: false, message: '经纬度参数缺失' });
  }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    console.error('服务器未配置 AMAP_KEY 环境变量');
    return res.status(500).json({ success: false, message: '服务器配置缺失' });
  }

  try {
    // 2. 检查经纬度小数点位数
    // 高德逆地理编码规范：经纬度小数点最好不要超过 6 位。
    // Capacitor 获取的原生经纬度往往有十十几位，有时候会导致高德接口报错。我们在这里顺手做个格式化，最稳妥：
    const formattedLng = Number(list_lng).toFixed(6);
    const formattedLat = Number(list_lat).toFixed(6);

    // 3. 向高德发起请求
    const response = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
      params: {
        location: `${formattedLng},${formattedLat}`, // 传入格式化后的标准高德格式
        key: amapKey
      }
    });

    const data = response.data;
    console.log('【高德 API 原始返回】:', data); // 🌟 加一行这个，方便你在后端控制台看高德有没有认出你的坐标

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      
      // 兼容处理：如果是直辖市（上海/北京），city 可能是空数组 []，此时要取 province
      let city = addressComponent.city;
      if (!city || (Array.isArray(city) && city.length === 0)) {
        city = addressComponent.province;
      }

      // 如果返回的城市名带了“市”（如：成都市），为了匹配你的前端 allCities 数组（如：'成都'），做个清洗：
      if (typeof city === 'string') {
        city = city.replace('市', '');
      }

      return res.json({
        success: true,
        data: { city }
      });
    } else {
      console.error('高德 API 返回错误:', data);
      return res.status(500).json({ success: false, message: '获取定位城市失败', raw: data });
    }

  } catch (error) {
    // 🌟 重点观察这里：如果之前报错 axios is not defined，会在这里被打印出来
    console.error('请求高德 API 发生内部异常:', error.stack || error.message);
    return res.status(500).json({ success: false, message: '定位服务暂时不可用' });
  }
});

export default router;
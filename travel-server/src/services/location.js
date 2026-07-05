import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/get-city', async (req, res) => {
  const { list_lng, list_lat } = req.query;
  
  // 1. 打印收到的参数，在 Railway Logs 里死死盯住它们是不是传反了！
  console.log('【Railway收到请求】经度(lng):', list_lng, ' | 纬度(lat):', list_lat);

  if (!list_lng || !list_lat) {
    return res.status(400).json({ success: false, message: '经纬度参数缺失' });
  }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    console.error('服务器未配置 AMAP_KEY 环境变量');
    return res.status(500).json({ success: false, message: '服务器配置缺失' });
  }

  try {
    // 2. 强行截取 6 位小数，防止 Capacitor 吐出的十几位长浮点数导致高德不识别
    const formattedLng = Number(list_lng).toFixed(6);
    const formattedLat = Number(list_lat).toFixed(6);

    // 3. 向高德发起请求 (严格确保格式为：经度,纬度)
    const response = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
      params: {
        location: `${formattedLng},${formattedLat}`,
        key: amapKey
      }
    });

    const data = response.data;
    // 🌟 这行日志至关重要！去 Railway 后台看高德到底吐了什么原始数据出来
    console.log('【高德 API 原始返回数据】:', JSON.stringify(data));

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      
      // 🌟 核心修复：防御直辖市空数组大坑
      let cityName = '';
      if (addressComponent.city && !Array.isArray(addressComponent.city)) {
        cityName = addressComponent.city;
      } else {
        cityName = addressComponent.province; // 直辖市时，city是[]，直接取省份字段（如 "北京市"）
      }

      // 4. 数据清洗：为了匹配你前端 columns 里的 '成都', '北京'，把末尾的 '市' 或 '省' 去掉
      if (typeof cityName === 'string') {
        cityName = cityName.replace('市', '').replace('省', '');
      }

      console.log('【后端最终清洗出的城市】:', cityName);

      return res.json({
        success: true,
        data: { city: cityName }
      });
    } else {
      console.error('高德 API 返回状态不为 1:', data);
      return res.status(500).json({ success: false, message: '获取定位城市失败' });
    }

  } catch (error) {
    console.error('请求高德 API 发生网络异常:', error.message);
    return res.status(500).json({ success: false, message: '定位服务暂时不可用' });
  }
});

export default router;
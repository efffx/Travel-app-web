// 🌟 移除 authenticate 中间件，允许未登录时直接访问
import express from 'express';
const router = express.Router();
 
router.get('/get-city', async (req, res) => {
  const { list_lng, list_lat } = req.query;
  console.log('【后端收到请求】经度:', list_lng, '纬度:', list_lat);
  // 1. 基础参数校验
  if (!list_lng || !list_lat) {
    return res.status(400).json({ success: false, message: '经纬度参数缺失' });
  }

  // 2. 🛡️ 轻量级防御（可选）：验证请求头是否来自你的 App / 小程序
  // 如果是微信小程序，微信会自动带上 mp-origin 或 referer 等特征请求头
  // 这里做个简单的验证，防止别人直接用浏览器刷你的接口
  const referer = req.headers.referer || '';
  // if (!referer.includes('servicewechat.com')) { 
  //   return res.status(403).json({ success: false, message: '非法请求来源' });
  // }

  const amapKey = process.env.AMAP_KEY;
  if (!amapKey) {
    console.error('服务器未配置 AMAP_KEY 环境变量');
    return res.status(500).json({ success: false, message: '服务器配置缺失' });
  }

  try {
    // 3. 向高德发起请求
    const response = await axios.get('https://restapi.amap.com/v3/geocode/regeo', {
      params: {
        location: `${list_lng},${list_lat}`,
        key: amapKey
      }
    });

    const data = response.data;

    if (data.status === '1' && data.regeocode) {
      const addressComponent = data.regeocode.addressComponent;
      const city = addressComponent.city || addressComponent.province;

      return res.json({
        success: true,
        data: { city }
      });
    } else {
      console.error('高德 API 返回错误:', data);
      return res.status(500).json({ success: false, message: '获取定位城市失败' });
    }

  } catch (error) {
    console.error('请求高德 API 发生网络异常:', error.message);
    return res.status(500).json({ success: false, message: '定位服务暂时不可用' });
  }
});

export default router;
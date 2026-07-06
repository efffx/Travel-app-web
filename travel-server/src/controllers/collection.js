import express from 'express';
import pool from '../config/mysql.js';
import { authenticate } from '../middleware/auth.js'; 

const router = express.Router();

// 规范路由注册（统一路径前缀风格）
router.post('/collect', authenticate, collectTravelPlan);
router.post('/uncollect', authenticate, uncollectTravelPlan);
router.get('/check-status', authenticate, checkFavoriteStatus);

/**
 * 1. POST /travel/plan/collect
 * 收藏 AI 生成的旅行规划
 */
export async function collectTravelPlan(req, res) {
  // 健壮性防空：防止 auth 中间件未正确注入 user
  const userId = req.user?.id;
  const {
    city, days, totalBudget,
    accommodationArea, accommodationReason, localTransportStrategy,
    packingList, tips, warnings,
    hotels, foods, activities
  } = req.body;

  // 基础参数校验
  if (!userId || !city || !days) {
    return res.status(400).json({ success: false, message: '必要参数缺失' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // === 步骤一：插入主表 travel_plan ===
    const insertPlanSql = `
      INSERT INTO travel_plan (
        user_id, city, days, total_budget, 
        accommodation_area, accommodation_reason, local_transport_strategy, 
        packing_list, tips, warnings
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [planResult] = await connection.execute(insertPlanSql, [
      userId, city, days, totalBudget || 0,
      accommodationArea || '', accommodationReason || '', localTransportStrategy || '',
      packingList || '', tips || '', warnings || ''
    ]);

    const planId = planResult.insertId;

    // === 🌟 步骤二：安全优化 - 酒店大批量合并插入 ===
    if (hotels && hotels.length > 0) {
      // 构造一条 SQL 的多个 VALUES 占位符，例: (?, ?, ?, ?), (?, ?, ?, ?)
      const valuesPlaceholders = hotels.map(() => '(?, ?, ?, ?)').join(', ');
      const insertHotelSql = `
        INSERT INTO travel_plan_hotel (plan_id, level, name, estimated_price) 
        VALUES ${valuesPlaceholders}
      `;
      
      // 平铺所有的参数数组
      const hotelParams = [];
      hotels.forEach(hotel => {
        hotelParams.push(
          planId,
          hotel.level || '精选',
          hotel.name || '',
          hotel.estimatedPrice || hotel.estimated_price || '0'
        );
      });

      // 仅调用 1 次 execute，彻底拒绝连接排队死锁隐患
      await connection.execute(insertHotelSql, hotelParams);
    }

    // === 🌟 步骤三：安全优化 - 美食大批量合并插入 ===
    if (foods && foods.length > 0) {
      const valuesPlaceholders = foods.map(() => '(?, ?, ?, ?)').join(', ');
      const insertFoodSql = `
        INSERT INTO travel_plan_food (plan_id, name, description, recommended_loc) 
        VALUES ${valuesPlaceholders}
      `;

      const foodParams = [];
      foods.forEach(food => {
        foodParams.push(
          planId,
          food.name || '',
          food.description || '',
          food.recommendedLoc || food.recommended_loc || ''
        );
      });

      await connection.execute(insertFoodSql, foodParams);
    }

    // === 🌟 步骤四：安全优化 - 每日活动大批量合并插入 ===
    if (activities && activities.length > 0) {
      const valuesPlaceholders = activities.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const insertActivitySql = `
        INSERT INTO travel_plan_activity (
          plan_id, day_num, day_theme, time_slot, 
          type, title, duration, ticket, 
          transportation, description
        ) VALUES ${valuesPlaceholders}
      `;

      const activityParams = [];
      activities.forEach(act => {
        activityParams.push(
          planId,
          act.dayNum || 1,
          act.dayTheme || '',
          act.timeSlot || '',
          act.type || 'spot',
          act.title || '',
          act.duration || '',
          act.ticket || '',
          act.transportation || '',
          act.description || ''
        );
      });

      await connection.execute(insertActivitySql, activityParams);
    }

    await connection.commit();

    return res.json({
      success: true,
      message: '收藏成功！已同步写入关系数据库',
      data: { planId }
    });

  } catch (error) {
    await connection.rollback();
    console.error('关系表事务入库失败，已安全回滚:', error);
    return res.status(500).json({
      success: false,
      message: '服务器开小差了，保存失败',
      error: error.message
    });
  } finally {
    connection.release(); // 释放连接池回到池子，保证系统可持续运转
  }
}

/**
 * 2. POST /travel/plan/uncollect
 * 取消收藏
 */
export async function uncollectTravelPlan(req, res) {
  const { planId } = req.body;
  const userId = req.user?.id;

  if (!planId) {
    return res.status(400).json({ success: false, message: '参数缺失: planId' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. 安全校验：确认该条计划确实属于当前请求的用户
    const checkSql = `SELECT COUNT(1) as count FROM travel_plan WHERE id = ? AND user_id = ?`;
    const [rows] = await connection.execute(checkSql, [planId, userId]);
    
    if (rows[0].count === 0) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: '未找到该方案或无权操作' });
    }

    // 🌟 注意：这里删除不同表可以用 Promise.all 并发，因为它们相互独立，不会在同一个连接里由于依赖而排队阻塞
    const deleteHotelsSql = `DELETE FROM travel_plan_hotel WHERE plan_id = ?`;
    const deleteFoodsSql = `DELETE FROM travel_plan_food WHERE plan_id = ?`;
    const deleteActivitiesSql = `DELETE FROM travel_plan_activity WHERE plan_id = ?`;

    await Promise.all([
      connection.execute(deleteHotelsSql, [planId]),
      connection.execute(deleteFoodsSql, [planId]),
      connection.execute(deleteActivitiesSql, [planId])
    ]);

    // 3. 最后删除主方案记录
    const deleteMainSql = `DELETE FROM travel_plan WHERE id = ?`;
    await connection.execute(deleteMainSql, [planId]);

    await connection.commit();

    return res.json({
      success: true,
      message: '已成功取消收藏，云端解绑成功'
    });

  } catch (error) {
    await connection.rollback();
    console.error('取消收藏失败，事务已回滚:', error);
    return res.status(500).json({
      success: false,
      message: '取消收藏失败，请稍后重试',
      error: error.message
    });
  } finally {
    connection.release();
  }
}

/**
 * 3. GET /travel/plan/check-status
 * 校验指定方案的收藏状态
 */
export async function checkFavoriteStatus(req, res) {
  const userId = req.user?.id;
  const { city, days } = req.query; 

  if (!city || !days) {
    return res.status(400).json({ success: false, message: '缺少校验参数' });
  }

  try {
    const sql = `SELECT id FROM travel_plan WHERE city = ? AND days = ? AND user_id = ? LIMIT 1`;
    const [rows] = await pool.execute(sql, [city, days, userId]);
    
    const hasCollected = rows.length > 0;

    return res.json({
      success: true,
      data: {
        isCollected: hasCollected,
        planId: hasCollected ? rows[0].id : null
      }
    });
  } catch (error) {
    console.error('检查收藏状态失败:', error);
    return res.status(500).json({ success: false, isCollected: false, planId: null });
  }
}

// 后端：GET /api/travel/detail
router.get('/detail', authenticate, async (req, res) => {
  const { planId } = req.query;
  const userId = req.user?.id; // 统一用可选链增加系统抗风险能力

  if (!planId) {
    return res.status(400).json({ success: false, message: '必要参数缺失: planId' });
  }

  try {
    // 1. 查主表
    const [main] = await pool.execute(`SELECT * FROM travel_plan WHERE id = ? AND user_id = ?`, [planId, userId]);
    if (main.length === 0) return res.status(404).json({ success: false, message: '行程未找到' });

    // 2. 查子表（多表互相独立，并发并行查，效率最高且安全）
    const [hotels] = await pool.execute(`SELECT * FROM travel_plan_hotel WHERE plan_id = ?`, [planId]);
    const [foods] = await pool.execute(`SELECT * FROM travel_plan_food WHERE plan_id = ?`, [planId]);
    const [activities] = await pool.execute(`SELECT * FROM travel_plan_activity WHERE plan_id = ? ORDER BY day_num ASC, time_slot ASC`, [planId]);

    return res.json({
      success: true,
      data: {
        ...main[0],
        hotels,
        foods,
        activities
      }
    });
  } catch (error) {
    console.error('数据加载失败:', error);
    return res.status(500).json({ success: false, message: '数据加载失败', error: error.message });
  }
});

export default router;

import express from 'express';
import pool from '../config/mysql.js';
// 引入你封装的函数（备用）
import { execute } from '../utils/db.js'; 
// 引入你的登录验证中间件
import { authenticate } from '../middleware/auth.js'; 

const router = express.Router();

router.get('/list', authenticate, getCollectList);

// 3. 🌟 新增：安全取消收藏（动态路由传入自增 ID）
router.delete('/cancel/:id', authenticate, cancelCollect);

/**
 * GET /api/plan/list
 * 分页获取当前登录用户的收藏旅行计划列表
 */
export async function getCollectList(req, res) {
  // 1. 从中间件获取绝对安全的当前用户 ID，防止平行越权
  const userId = req.user.id; 
  
  // 2. 从 query 获取分页参数，并强制转换为整数，设置兜底默认值
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // 3. 🧠 高并发性能优化：使用两条 SQL 分别查“总数”与“当前页列表”
    // 主表只需要返回卡片渲染所需的轻量级数据（如城市、天数、预算、住宿区），千万别把几万字的活动明细一起查出来
    const countSql = `SELECT COUNT(*) as total FROM travel_plan WHERE user_id = ?`;
    const listSql = `
    SELECT id, city, days, total_budget, accommodation_area, created_at
    FROM travel_plan
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?, ?
    `;
const [listRows] = await pool.execute(listSql, [
    userId,
    offset,
    limit
]);
    // 4. 使用 Promise.all 让两条 SQL 并发执行，成倍缩短数据库 I/O 等待时间
    // const [[countResult], [listResult]] = await Promise.all([
    //   pool.execute(countSql, [userId]),
    //   pool.execute(listSql, [userId, limit, offset])
    // ]);、

    const [
    [countRows],
    [listRows]
] = await Promise.all([
    pool.execute(countSql, [userId]),
    pool.execute(listSql, [userId, offset, limit])
]);

return res.json({
    success: true,
    data: {
        list: listRows,
        total: countRows[0].total,
        page,
        limit
    }
});

    // 5. 按照标准分页结构体返回给前端
    return res.json({
      success: true,
      message: '列表加载成功',
      data: {
        list: listResult,
        total: countResult[0].total,
        page,
        limit
      }
    });

  } catch (error) {
    console.error('获取收藏列表失败，报错详情:', error);
    return res.status(500).json({ 
      success: false, 
      message: '云端数据库获取失败，请稍后重试',
      error: error.message 
    });
  }
}

/**
 * DELETE /api/plan/cancel/:id
 * 安全取消收藏（物理删除）
 */
export async function cancelCollect(req, res) {
  const userId = req.user.id;
  const { id } = req.params; // 拿到前端动态路由传过来的计划自增主键 ID

  try {
    // 🌟 核心防御：删除语句必须带上 AND user_id = ? 
    // 理由：防止黑客登录账户A后，通过 Postman 恶意并发遍历 id（如 1, 2, 3...）把别人的收藏全删光！
    const deleteSql = `DELETE FROM travel_plan WHERE id = ? AND user_id = ?`;
    const [result] = await pool.execute(deleteSql, [id, userId]);

    // 如果受影响行数为 0，说明要么这条记录不存在，要么这条记录属于别人，当前用户无权删除
    if (result.affectedRows === 0) {
      return res.status(403).json({ success: false, message: '操作无权被执行或记录已不存在' });
    }

    return res.json({
      success: true,
      message: '已成功从云端抹除该收藏记录'
    });
  } catch (error) {
    console.error('取消收藏失败，报错详情:', error);
    return res.status(500).json({ 
      success: false, 
      message: '同步云端删除失败',
      error: error.message 
    });
  }
}

export default router;
// import jwt from 'jsonwebtoken';
// import config from '../config/index.js';
// import { isDatabaseConnected } from '../config/database.js';
// import User from '../models/User.js';

// export const authenticate = async (req, res, next) => {
//   if (!isDatabaseConnected()) {
//     return res.status(503).json({
//       success: false,
//       message: 'Database not connected. Start MongoDB with: docker compose up -d',
//     });
//   }

//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ success: false, message: 'Authentication required' });
//   }

//   try {
//     const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ success: false, message: 'User not found' });
//     req.user = user;
//     next();
//   } catch (error) {
//     const message = error.name === 'TokenExpiredError' ? 'Token expired, please login again' : 'Invalid token';
//     return res.status(401).json({ success: false, message });
//   }
// };

// export const optionalAuth = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) return next();
//   try {
//     const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
//     const user = await User.findById(decoded.id);
//     if (user) req.user = user;
//   } catch { /* ignore */ }
//   next();
// };
// import jwt from 'jsonwebtoken';
// import config from '../config/index.js';
// import mysql from 'mysql2/promise'; // 🚨 引入 MySQL 驱动

// // 1. 创建 MySQL 连接池（与你的 authService 保持一致）
// // const pool = mysql.createPool({
// //   host: process.env.DB_HOST || 'localhost',
// //   user: process.env.DB_USER || 'root',
// //   password: process.env.DB_PASSWORD || '1234', // 记得改成你的真实 MySQL 密码
// //   database: process.env.DB_NAME || 'travel',
// //   waitForConnections: true,
// //   connectionLimit: 10
// // });

// // =================【 强鉴权中间件 】=================
// export const authenticate = async (req, res, next) => {
//   // 💡 彻底删除了之前的 !isDatabaseConnected() 503 拦截逻辑！

//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ success: false, message: 'Authentication required' });
//   }

//   try {
//     // 解密 Token 拿到当初塞进去的 MySQL 自增 ID
//     const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
    
//     // 🚨 关键改动：去 MySQL 数据库里查找此用户
//     const [users] = await pool.query(
//       'SELECT id, username, email, phone FROM users WHERE id = ?', 
//       [decoded.id]
//     );
    
//     if (users.length === 0) {
//       return res.status(401).json({ success: false, message: 'User not found' });
//     }

//     // 🚨 核心注入：把从 MySQL 查出来的用户行对象挂载到 req.user 上
//     // 这样 Controller 层就能安全地拿到 req.user.id 了！
//     req.user = users[0]; 
    
//     next();
//   } catch (error) {
//     const message = error.name === 'TokenExpiredError' ? 'Token expired, please login again' : 'Invalid token';
//     return res.status(401).json({ success: false, message });
//   }
// };

// // =================【 弱（可选）鉴权中间件 】=================
// export const optionalAuth = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) return next();
  
//   try {
//     const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
    
//     // 🚨 同理改成 MySQL 查询
//     const [users] = await pool.query(
//       'SELECT id, username, email, phone FROM users WHERE id = ?', 
//       [decoded.id]
//     );
    
//     if (users.length > 0) req.user = users[0];
//   } catch { /* ignore */ }
//   next();
// };


import jwt from 'jsonwebtoken';
import config from '../config/index.js';
// 🚨 完美契合：直接引入你写好的、带连接池封装的 query 工具函数
import { query } from '../utils/db.js'; 

// =================【 强鉴权中间件 】=================
export const authenticate = async (req, res, next) => {
  // 💡 针对跨域（Localhost 前端 ➡️ Railway 后端），必须在最顶部放行浏览器的 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    // 解密 Token 拿到当初塞进去的 MySQL 用户 ID
    const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
    
    // 🚨 完美修复：直接调用你 db.js 里的 query 函数。
    // 因为你的 query 函数内部已经解构拿到了 [rows] 并返回了 rows，所以这里直接拿 users 数组即可
    const users = await query(
      'SELECT id, username, email, phone FROM users WHERE id = ?', 
      [decoded.id]
    );
    
    // 如果查不出用户，说明 Token 对应的用户不存在
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // 将从 MySQL 查出来的用户对象挂载到 req.user 上，供后面的控制器（Controller）使用
    req.user = users[0]; 
    
    next();
  } catch (error) {
    // 如果鉴权失败，捕获具体的 JWT 错误
    const message = error.name === 'TokenExpiredError' ? 'Token expired, please login again' : 'Invalid token';
    return res.status(401).json({ success: false, message });
  }
};

// =================【 弱（可选）鉴权中间件 】=================
export const optionalAuth = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next();
  
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
    
    // 同理，使用统一的 query 工具函数进行弱鉴权查询
    const users = await query(
      'SELECT id, username, email, phone FROM users WHERE id = ?', 
      [decoded.id]
    );
    
    if (users && users.length > 0) req.user = users[0];
  } catch { /* ignore */ }
  next();
};
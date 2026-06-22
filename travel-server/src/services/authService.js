// import jwt from 'jsonwebtoken';
// import config from '../config/index.js';
// import User from '../models/User.js';
// import { AppError } from '../middleware/errorHandler.js';
// import { isDatabaseConnected } from '../config/database.js';

// class AuthService {
//   _requireDB() {
//     if (!isDatabaseConnected()) throw new AppError('Database not available. Start MongoDB with: docker compose up -d', 503);
//   }

//   generateToken(userId) {
//     return jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
//   }

//   async register({ username, email, password }) {
//     this._requireDB();
//     const existing = await User.findOne({ $or: [{ email }, { username }] });
//     if (existing) throw new AppError(`${existing.email === email ? 'Email' : 'Username'} already exists`, 409);
//     const user = await User.create({ username, email, password });
//     return { token: this.generateToken(user._id), user: user.toJSON() };
//   }

//   async login({ email, password }) {
//     this._requireDB();
//     const user = await User.findOne({ email }).select('+password');
//     if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
//     return { token: this.generateToken(user._id), user: user.toJSON() };
//   }

//   async getProfile(userId) {
//     this._requireDB();
//     const user = await User.findById(userId);
//     if (!user) throw new AppError('User not found', 404);
//     return user.toJSON();
//   }

//   async updateProfile(userId, updates) {
//     this._requireDB();
//     const allowed = ['username', 'avatar'];
//     const sanitized = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));
//     if (Object.keys(sanitized).length === 0) throw new AppError('No valid fields to update', 400);
//     const user = await User.findByIdAndUpdate(userId, sanitized, { new: true, runValidators: true });
//     if (!user) throw new AppError('User not found', 404);
//     return user.toJSON();
//   }
// }

// export default new AuthService();
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { query, execute, findOne } from '../utils/db.js';


class AuthService {
  // 密码加密（替代原本 Mongoose 模型自带的加密，如果是注册存明文，这里可用 bcrypt 加密）
  // 提示：如果你在前端已经加密了，或者想保持简单，可以直接存入数据库

  generateToken(userId) {
    // 依然复用项目自带的 JWT 配置和秘钥
    //return jwt.sign({ id: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    return jwt.sign({ id: String(userId) }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  }

  // =================【 注册业务 】=================
  async register({ email, password, phone }) {
    // 1. 检查用户名、邮箱或手机号是否已存在
      const existingUsers = await query(
    'SELECT email, phone FROM users WHERE email = ? OR phone = ?',
    [email || null, phone || null]
    );

    if (existingUsers.length > 0) {
      const match = existingUsers[0];
      if (match.email === email) throw new AppError('Email already exists', 409);
      if (match.phone === phone) throw new AppError('Username already exists', 409);
      throw new AppError('Phone number already exists', 409);
    }

    // 2. 写入 MySQL 数据库 (包含新字段 username, 也可以根据你数据库表结构微调)
    const result = await execute(
    'INSERT INTO users (email,password,phone) VALUES (?,?,?)',
    [email || '', password, phone || '']
    );

    const insertId = result.insertId;

    // 3. 返回跟原架构一模一样的数据格式
    return {
      token: this.generateToken(insertId),
      user: { id: insertId, email, phone }
    };
  }

  // =================【 登录业务 】=================
  async login({ email, password, account }) {
    // 兼容原版的 email 登录，以及你新版支持的 account (手机/邮箱) 登录
    const searchKey = account || email;

    // 1. 从 MySQL 匹配用户
    const users = await query(
    'SELECT * FROM users WHERE email = ? OR phone = ?',
    [searchKey, searchKey]
    );

    if (users.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = users[0];

    // 2. 比对密码（如果你在原始库里用了 bcrypt 哈希，这里请用 await bcrypt.compare(password, user.password)）
    // 如果前期测试是明文比对，则直接：
    if (user.password !== password) {
      throw new AppError('Invalid email or password', 401);
    }

    return {
      token: this.generateToken(user.id),
      user: { id: user.id,  email: user.email, phone: user.phone }
    };
  }

  // =================【 获取个人资料 】=================
  async getProfile(userId) {
    const user = await findOne(
      'SELECT id,username,email,phone,avatar FROM users WHERE id=?',
      [userId]
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // =================【 更新个人资料 】=================
  // async updateProfile(userId, updates) {
  //   const allowed = ['username', 'avatar', 'phone'];
  //   const sanitized = Object.entries(updates).filter(([k]) => allowed.includes(k));
    
  //   if (sanitized.length === 0) throw new AppError('No valid fields to update', 400);

  //   // 动态拼接 SQL 更新语句
  //   const setClause = sanitized.map(([k]) => `${k} = ?`).join(', ');
  //   const values = sanitized.map(([, v]) => v);
  //   values.push(userId); // 用于 WHERE id = ?

  //   await pool.query(`UPDATE users SET ${setClause} WHERE id = ?`, values);

  //   // 返回更新后的完整数据
  //   return this.getProfile(userId);
  // }
  async updateProfile(userId, updates) {
    const newName = updates.username;

    if (!newName) {
      throw new AppError('Username is required', 400);
    }

    // 检查用户名是否已存在
    const existing = await findOne(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [newName, userId]
    );

    if (existing) {
      throw new AppError('Username already exists', 409);
    }

    // 更新用户名
    await execute(
      'UPDATE users SET username = ? WHERE id = ?',
      [newName, userId]
    );

    // 返回最新资料
    return await findOne(
      'SELECT id, username, email, phone, avatar FROM users WHERE id = ?',
      [userId]
    );
  }
}

export default new AuthService();
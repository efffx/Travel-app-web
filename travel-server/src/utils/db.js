import pool from '../config/mysql.js';

/**
 * 查询
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * 执行增删改
 */
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/**
 * 查询单条记录
 */
export async function findOne(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}
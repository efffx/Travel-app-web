/*
Navicat MySQL Data Transfer

Source Server         : mm
Source Server Version : 50629
Source Host           : localhost:3306
Source Database       : travel

Target Server Type    : MYSQL
Target Server Version : 50629
File Encoding         : 65001

Date: 2026-06-21 19:27:10
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '用户唯一ID，自增主键',
  `phone` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '手机号码，用于登录和接收通知',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '电子邮箱，用于登录和找回密码',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '哈希加密后的密码',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户名（后端自动生成或用户后续修改）',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '用户头像URL地址',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '账户创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`) COMMENT '确保手机号唯一',
  UNIQUE KEY `uk_email` (`email`) COMMENT '确保邮箱唯一'
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户信息表';

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', '18859459890', '1114255779@qq.com', 'a12345', '22', null, '2026-06-20 16:50:14', '2026-06-21 17:18:13');
INSERT INTO `users` VALUES ('2', '1234565', '2122234208@qq.com', 'a12345', '1232', null, '2026-06-21 17:23:38', '2026-06-21 17:25:52');

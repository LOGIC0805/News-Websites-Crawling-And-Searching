/*
 Navicat Premium Data Transfer

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 50723
 Source Host           : localhost:3306
 Source Schema         : crawl

 Target Server Type    : MySQL
 Target Server Version : 50723
 File Encoding         : 65001

 Date: 23/06/2021 21:35:04
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for useraction
-- ----------------------------
DROP TABLE IF EXISTS `useraction`;
CREATE TABLE `useraction`  (
  `id_useraction` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `phonenum` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `action` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
  `time` datetime(0) NULL DEFAULT NULL,
  PRIMARY KEY (`id_useraction`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 37 CHARACTER SET = latin1 COLLATE = latin1_swedish_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;

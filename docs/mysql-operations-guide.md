# MySQL 本地开发操作指南

> 适用于 macOS + Homebrew 安装的 MySQL 9.6.0
> 项目数据库：`mathlearning`，用户：`mathapp`

## 一、服务管理

### 启动 / 停止 / 重启

```bash
# 启动
brew services start mysql

# 停止
brew services stop mysql

# 重启
brew services restart mysql
```

### 检查状态

```bash
# 查看 brew 服务状态
brew services list | grep mysql

# 检查端口 3306 是否在监听
lsof -i :3306

# 检查进程
ps aux | grep mysql | grep -v grep
```

## 二、连接数据库

```bash
# 用 app 账号连接
mysql -u mathapp -plocal_dev_2024 -h localhost mathlearning

# 用 root 连接（管理操作）
mysql -u root -p
```

## 三、常用 SQL 查询

```sql
-- 查看所有数据库
SHOW DATABASES;

-- 切换到目标库
USE mathlearning;

-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESCRIBE users;
DESCRIBE children;
DESCRIBE study_records;
DESCRIBE generation_history;

-- 查看各表数据量
SELECT 'users' AS tbl, COUNT(*) AS cnt FROM users
UNION ALL SELECT 'children', COUNT(*) FROM children
UNION ALL SELECT 'study_records', COUNT(*) FROM study_records
UNION ALL SELECT 'generation_history', COUNT(*) FROM generation_history;

-- 查看连接数
SHOW PROCESSLIST;

-- 退出
EXIT;
```

## 四、Prisma 相关操作

```bash
cd MathLearningApp

# 生成 Prisma Client（修改 schema 后执行）
npx prisma generate

# 执行迁移（建表/改表）
npx prisma migrate deploy

# 查看迁移状态
npx prisma migrate status

# 打开可视化数据库浏览器
npx prisma studio
```

> **提示：** `npx prisma studio` 会打开一个网页界面，可以可视化浏览和编辑所有表数据。

## 五、数据库环境信息

| 项目 | 值 |
|------|------|
| MySQL 版本 | 9.6.0 (Homebrew, ARM64) |
| 安装路径 | `/opt/homebrew/opt/mysql/` |
| 数据目录 | `/opt/homebrew/var/mysql` |
| 端口 | 3306 |
| 数据库名 | `mathlearning` |
| 应用用户 | `mathapp` |
| 连接串 | `mysql://mathapp:local_dev_2024@localhost:3306/mathlearning` |

## 六、数据表结构（4 表）

```
users               — 用户账号（email、密码哈希、登录安全）
 ├── children       — 孩子档案（关联家长、年级 一年级~六年级）
 ├── study_records  — 学习记录（上传/练习/复习）
 └── generation_history — 题目生成历史
```

## 七、故障排查

### 连接失败

```bash
# 1. 确认 MySQL 正在运行
brew services list | grep mysql

# 2. 如果未运行，启动它
brew services start mysql

# 3. 测试连接
mysql -u mathapp -plocal_dev_2024 -h localhost -e "SELECT 1;" mathlearning
```

### 端口被占用

```bash
# 查看谁占用了 3306
lsof -i :3306

# 如果是旧的 MySQL 进程，重启服务
brew services restart mysql
```

### 重置数据库

```bash
# ⚠️ 危险操作 - 会删除所有数据
mysql -u root -p -e "DROP DATABASE IF EXISTS mathlearning;"
mysql -u root -p -e "CREATE DATABASE mathlearning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL ON mathlearning.* TO 'mathapp'@'localhost';"
cd MathLearningApp && npx prisma migrate deploy
```

# MySQL服务器安装指南

**目标**: 在云服务器上安装MySQL 8.0+并配置远程访问

**适用场景**: MathLearningApp自建数据库服务器

---

## 📋 前置准备

### 1. 租用云服务器

推荐配置：
- **CPU**: 2核心
- **内存**: 4GB
- **硬盘**: 20GB SSD
- **操作系统**: Ubuntu 22.04 LTS

云服务商选择：

| 服务商 | 推荐配置 | 月成本 | 链接 |
|--------|----------|--------|------|
| 阿里云 | 2核4G, 20GB SSD | ¥100-150 | https://www.aliyun.com |
| 腾讯云 | 2核4G, 20GB SSD | ¥90-120 | https://cloud.tencent.com |
| AWS EC2 | t3.medium, 20GB SSD | ¥200-300 | https://aws.amazon.com |

### 2. 安全组配置

在云服务器控制台配置安全组：
- 开放端口：22（SSH），3306（MySQL）
- 来源：建议限制为你的应用服务器IP（如果已知）

---

## 🚀 安装步骤

### Step 1: 连接到服务器

```bash
# SSH连接到服务器（替换为你的服务器IP）
ssh root@your-server-ip

# 或使用密钥文件
ssh -i /path/to/key.pem root@your-server-ip
```

### Step 2: 更新系统

```bash
# 更新包管理器
sudo apt update

# 升级已安装的包
sudo apt upgrade -y
```

### Step 3: 安装MySQL 8.0

```bash
# 安装MySQL Server
sudo apt install mysql-server -y

# 查看MySQL版本
mysql --version
```

预期输出：`mysql Ver 8.0.xx` 或更高

### Step 4: 安全配置

```bash
# 运行MySQL安全配置脚本
sudo mysql_secure_installation
```

按照提示配置：
1. **VALIDATE PASSWORD COMPONENT**: 选择 `y`
2. **Set root password**: 设置强密码（记住此密码）
3. **Remove anonymous users**: 选择 `y`
4. **Disallow root login remotely**: 选择 `y`（安全考虑）
5. **Remove test database**: 选择 `y`
6. **Reload privilege tables**: 选择 `y`

### Step 5: 启动MySQL服务

```bash
# 启动MySQL服务
sudo systemctl start mysql

# 设置开机自启动
sudo systemctl enable mysql

# 检查服务状态
sudo systemctl status mysql
```

预期输出包含：`Active: active (running)`

---

## 🔧 数据库配置

### Step 6: 登录MySQL

```bash
# 使用root用户登录
sudo mysql
```

### Step 7: 创建数据库

在MySQL命令行中执行：

```sql
-- 创建数据库
CREATE DATABASE IF NOT EXISTS mathlearning
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 验证数据库创建
SHOW DATABASES;

-- 应该看到 mathlearning 数据库
```

### Step 8: 创建专用用户

```sql
-- 创建应用用户（替换 'secure_password_here' 为强密码）
CREATE USER 'mathapp'@'%' IDENTIFIED BY 'secure_password_here';

-- 授予所有权限
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, EXECUTE
  ON mathlearning.*
  TO 'mathapp'@'%';

-- 刷新权限
FLUSH PRIVILEGES;

-- 退出MySQL
EXIT;
```

### Step 9: 配置MySQL远程访问

```bash
# 编辑MySQL配置文件
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

找到并修改以下行：

```ini
# 注释掉bind-address（允许所有IP连接）
# bind-address          = 127.0.0.1

# 或者设置为0.0.0.0（允许所有IPv4连接）
bind-address            = 0.0.0.0
```

保存并退出（Ctrl+X, Y, Enter）。

### Step 10: 重启MySQL

```bash
# 重启MySQL使配置生效
sudo systemctl restart mysql

# 验证配置
sudo systemctl status mysql
```

---

## 🔒 安全加固

### Step 11: 配置防火墙

```bash
# 允许MySQL端口（仅允许特定IP更安全）
sudo ufw allow 3306/tcp

# 如果限制特定IP（推荐）
sudo ufw allow from YOUR_APP_SERVER_IP to any port 3306

# 查看防火墙状态
sudo ufw status
```

### Step 12: 测试远程连接

在你的本地机器上测试：

```bash
# 使用应用用户测试连接（替换为你的服务器IP）
mysql -h your-server-ip -u mathapp -p

# 输入密码后应该能连接
```

如果连接成功，执行：

```sql
-- 查看数据库
SHOW DATABASES;

-- 查看当前用户
SELECT USER();

-- 退出
EXIT;
```

---

## 📝 配置应用连接

### Step 13: 更新项目.env文件

在你的项目根目录创建 `.env` 文件：

```bash
# 在MathLearningApp目录下
cd /Users/evelynshi/math_teach/MathLearningApp

# 创建.env文件
cp .env.example .env
```

编辑 `.env` 文件，更新 `DATABASE_URL`：

```bash
# 替换以下值为你的实际配置
DATABASE_URL="mysql://mathapp:secure_password_here@your-server-ip:3306/mathlearning"
```

替换说明：
- `mathapp`: 数据库用户名
- `secure_password_here`: Step 8中设置的密码
- `your-server-ip`: 你的服务器公网IP地址
- `3306`: MySQL默认端口
- `mathlearning`: 数据库名称

### Step 14: 验证应用连接

```bash
# 在项目目录下
cd /Users/evelynshi/math_teach/MathLearningApp

# 生成Prisma Client
npx prisma generate

# 推送数据库Schema（创建表）
npx prisma db push

# 如果成功，你应该看到4个表被创建：
# - users
# - children
# - study_records
# - generation_history
```

---

## ✅ 验证安装

### 检查表是否创建成功

```bash
# 在MySQL服务器上
sudo mysql

USE mathlearning;

-- 查看所有表
SHOW TABLES;

-- 应该看到4个表
-- +-------------------------+
-- | Tables_in_mathlearning   |
-- +-------------------------+
-- | children                 |
-- | generation_history       |
-- | study_records            |
-- | users                    |
-- +-------------------------+

-- 查看表结构
DESCRIBE users;

-- 退出
EXIT;
```

### 运行测试验证

```bash
# 在项目目录下运行测试
npm test -- --testPathPattern=prismaClient

# 应该看到测试通过
```

---

## 📊 成本参考

### 月度成本估算（阿里云/腾讯云）

| 配置 | 月成本 | 年成本 |
|------|--------|--------|
| 2核4G, 20GB SSD | ¥100-150 | ¥1,200-1,800 |
| 带宽1Mbps | 通常包含 | 通常包含 |
| 总计 | **~¥120/月** | **~¥1,440/年** |

---

## 🛠️ 常用管理命令

### 查看MySQL状态

```bash
sudo systemctl status mysql
```

### 启动/停止/重启MySQL

```bash
sudo systemctl start mysql
sudo systemctl stop mysql
sudo systemctl restart mysql
```

### 查看MySQL日志

```bash
# 查看错误日志
sudo tail -f /var/log/mysql/error.log

# 查看慢查询日志
sudo tail -f /var/log/mysql/slow-query.log
```

### 数据库备份

```bash
# 备份数据库
mysqldump -u mathapp -p mathlearning > backup_$(date +%Y%m%d).sql

# 恢复数据库
mysql -u mathapp -p mathlearning < backup_20260325.sql
```

---

## ⚠️ 故障排除

### 问题1: 无法远程连接

**解决方案**:
1. 检查安全组是否开放3306端口
2. 检查防火墙规则
3. 确认bind-address配置

### 问题2: Access denied for user

**解决方案**:
```sql
-- 在MySQL服务器上
GRANT ALL PRIVILEGES ON mathlearning.* TO 'mathapp'@'%';
FLUSH PRIVILEGES;
```

### 问题3: 字符集问题

**解决方案**:
```sql
-- 确保数据库使用utf8mb4
ALTER DATABASE mathlearning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 📞 获取帮助

- **MySQL文档**: https://dev.mysql.com/doc/refman/8.0/en/
- **Ubuntu服务器指南**: https://ubuntu.com/server
- **Prisma文档**: https://www.prisma.io/docs

---

**创建日期**: 2026-03-25
**适用版本**: MySQL 8.0+, Ubuntu 22.04 LTS

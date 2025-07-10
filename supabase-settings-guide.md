# Supabase 密码重置链接过期时间设置指南

## 问题描述
密码重置链接在几秒钟内就失效，用户无法完成密码重置流程。

## 解决方案：调整Supabase设置

### 步骤1：登录Supabase Dashboard
1. 访问 https://supabase.com/dashboard
2. 选择你的项目 (kuflobojizyttadwcbhe)

### 步骤2：进入Authentication设置
1. 点击左侧菜单的 **"Authentication"**
2. 点击 **"Settings"** 选项卡

### 步骤3：查找过期时间设置
在Settings页面中，查找以下任一设置项：

#### 可能的设置名称：
- **"Email OTP expiry"** (邮件OTP过期时间)
- **"Password reset expiry"** (密码重置过期时间)
- **"Recovery link timeout"** (恢复链接超时)
- **"Email link expiry"** (邮件链接过期时间)
- **"OTP expiry time"** (OTP过期时间)

#### 查找位置：
1. **Authentication > Settings > Advanced Settings** (高级设置)
2. **Authentication > Email Templates** (邮件模板设置)
3. **Authentication > URL Configuration** (URL配置)
4. **Project Settings > General** (项目通用设置)

### 步骤4：调整过期时间
当前设置可能是：
- 60 秒 (1分钟) - 太短
- 300 秒 (5分钟) - 仍然较短

**推荐设置：**
- **3600 秒** (1小时) - 推荐
- **1800 秒** (30分钟) - 最少

### 步骤5：保存设置
修改后点击 **"Save"** 或 **"Update"** 按钮保存设置。

## 如果找不到设置

### 方法1：检查Email Templates
1. 进入 **Authentication > Email Templates**
2. 选择 **"Reset Password"** 模板
3. 查看是否有过期时间相关的设置

### 方法2：联系Supabase支持
如果在Dashboard中找不到相关设置：
1. 访问 https://supabase.com/support
2. 提交支持请求，说明需要调整密码重置链接过期时间
3. 提供项目ID：kuflobojizyttadwcbhe

### 方法3：检查项目计划
某些过期时间设置可能只在特定计划中可调整：
- 免费计划：可能有固定的过期时间
- Pro计划：通常允许自定义过期时间

## 验证设置是否生效

1. 修改设置后，等待5-10分钟让更改生效
2. 测试密码重置流程：
   - 访问 `/forgot-password.html`
   - 输入邮箱地址请求重置
   - 检查邮件中的链接是否有更长的有效期

## 当前的临时解决方案

在等待Supabase设置调整期间，我们已经改进了代码：
- 更清晰的错误信息
- 快速重新请求重置链接的按钮
- 用户友好的过期提醒

## 注意事项

- 过期时间不宜设置太长（超过24小时），会有安全风险
- 建议设置为30分钟到1小时之间
- 修改后的设置通常需要几分钟才能生效 
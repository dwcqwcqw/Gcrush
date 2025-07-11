# 🔧 聊天系统故障排除指南

## 已修复的问题

### 1. ✅ RunPod API连接问题
**问题**: 401认证错误，无法连接到RunPod模型
**原因**: API密钥配置和环境变量加载问题
**解决方案**:
- 修复了`config.js`中的getter函数
- 确保API密钥从环境变量正确加载
- 在Cloudflare Pages中设置环境变量

### 2. ✅ 数据库表结构不匹配
**问题**: `chat_messages`表字段不匹配
**原因**: 代码使用`role`字段，但数据库使用`message_type`字段
**解决方案**:
- 更新代码使用正确的字段名
- 添加字段映射逻辑
- 修复消息保存和加载逻辑

### 3. ✅ 数据库权限问题
**问题**: 匿名用户无法访问数据库表
**原因**: RLS策略不允许匿名用户操作
**解决方案**:
- 创建了`fix-database-rls.sql`脚本
- 添加匿名用户访问策略
- 需要在Supabase中执行此脚本

### 4. ✅ MIME类型错误
**问题**: `env-config.js`和`config.local.js`无法加载
**原因**: 文件不存在或MIME类型不正确
**解决方案**:
- 使用构建脚本生成环境配置
- 在Cloudflare Pages中设置环境变量

## 🚀 部署步骤

### 步骤1: 设置Cloudflare Pages环境变量
1. 登录Cloudflare Dashboard
2. 进入Pages项目设置
3. 添加环境变量:
   - `RUNPOD_API_KEY`: `[你的RunPod API密钥]`
   - `RUNPOD_TEXT_ENDPOINT_ID`: `4cx6jtjdx6hdhr`

### 步骤2: 修复Supabase数据库权限
1. 登录Supabase Dashboard
2. 进入SQL Editor
3. 执行`fix-database-rls.sql`脚本
4. 验证策略创建成功

### 步骤3: 测试功能
1. 访问聊天页面
2. 检查浏览器控制台是否有错误
3. 测试角色选择和消息发送
4. 验证数据库保存功能

## 🐛 常见错误和解决方案

### Error: "Could not find the 'role' column"
**解决**: 已修复，代码现在使用`message_type`字段

### Error: "Failed to load resource: 400/401"
**解决**: 检查RunPod API密钥是否正确设置

### Error: "Multiple GoTrueClient instances"
**解决**: 正常警告，不影响功能

### Error: "MIME type 'text/html' is not executable"
**解决**: 确保环境配置文件正确生成

## 📋 验证清单

- [ ] Cloudflare Pages环境变量已设置
- [ ] Supabase RLS策略已更新
- [ ] RunPod API密钥有效
- [ ] 角色数据已加载到数据库
- [ ] 聊天功能正常工作

## 🔄 如果问题仍然存在

1. **检查浏览器控制台**，查看详细错误信息
2. **访问test-env.html**，验证环境变量配置
3. **检查Supabase日志**，确认数据库操作
4. **验证RunPod端点状态**，确保模型可用

---

*最后更新: 2025年1月11日* 
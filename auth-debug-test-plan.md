# Auth Debug Test Plan - Generate Media Account Confusion Issue

## 问题描述
点击 generate-media 页面后，登录状态变成不存在的账户，且无法登出，URL 变成 `https://gcrush.org/?code=eed3c9f0-7795-46b3-b46f-6e324c342b33`

## 调试工具已部署
- 在 auth-simple.js 中添加了详细的 `[AUTH-DEBUG]` 日志
- 包括时间戳、URL、referrer、调用栈、localStorage token 状态

## 测试步骤

### 阶段 1: 正常登录状态确认
1. 访问 https://gcrush.org
2. 使用 Google/Discord 等社交登录
3. 确认登录成功，记录：
   - 用户邮箱
   - 用户 ID
   - Provider
   - localStorage token 状态

### 阶段 2: Generate Media 页面访问
1. 在已登录状态下，点击 generate-media 页面
2. 观察控制台 `[AUTH-DEBUG]` 日志
3. 记录：
   - 页面加载时的 auth 状态
   - 是否触发了新的 auth state change
   - session 检查结果

### 阶段 3: 账户状态异常分析
1. 从 generate-media 页面返回主页
2. 检查登录状态是否异常
3. 记录：
   - 显示的用户信息是否正确
   - 能否正常登出
   - URL 是否包含 OAuth 回调参数

### 阶段 4: OAuth 回调分析
如果 URL 包含 `?code=` 参数：
1. 记录完整的 URL 参数
2. 观察 Supabase 如何处理这个回调
3. 确认是否触发了新的登录流程

## 关键调试点

### 1. Supabase 初始化
```
[AUTH-DEBUG] Starting Supabase initialization
[AUTH-DEBUG] Creating Supabase client with config
[AUTH-DEBUG] Supabase client initialized successfully
```

### 2. Auth State Changes
```
[AUTH-DEBUG] Auth state change detected
[AUTH-DEBUG] Valid session found for event: SIGNED_IN
[AUTH-DEBUG] OAuth sign in detected
```

### 3. Session 检查
```
[AUTH-DEBUG] Starting session check on initialization
[AUTH-DEBUG] Existing session found on initialization
[AUTH-DEBUG] No existing session found on initialization
```

### 4. OAuth 重定向处理
```
[AUTH-DEBUG] OAuth callback detected, redirecting to main page
```

## 预期问题原因

### 假设 1: OAuth 回调循环
generate-media 页面可能触发了 OAuth 重定向，导致用户被重新认证为不同的账户

### 假设 2: Session 覆盖
页面切换时可能覆盖了现有的 session 数据

### 假设 3: detectSessionInUrl 配置问题
Supabase 的 `detectSessionInUrl: true` 可能在 generate-media 页面误解析了 URL 参数

## 解决方案候选

### 方案 1: 禁用 URL Session 检测
在特定页面禁用 `detectSessionInUrl`

### 方案 2: URL 清理
在页面加载时清理 OAuth 回调参数

### 方案 3: Session 保护
在页面切换前保存当前 session，切换后恢复

## 测试记录模板

```
时间: 
测试阶段: 
当前 URL: 
Referrer: 
用户状态: 
关键日志: 
问题现象: 
```

## 下一步行动
1. 部署调试版本 ✅
2. 执行测试步骤
3. 分析日志数据
4. 确定根本原因
5. 实施修复方案
6. 验证修复效果 
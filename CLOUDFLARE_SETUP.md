# Cloudflare Pages 环境变量设置指南

## 🔧 在Cloudflare Pages中设置环境变量

### 步骤 1: 访问Cloudflare Pages Dashboard
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的账户
3. 进入 **Pages** 部分
4. 选择你的 **Gcrush** 项目

### 步骤 2: 配置环境变量
1. 在项目页面中，点击 **Settings** 标签
2. 找到 **Environment variables** 部分（不是 Variables and Secrets）
3. 点击 **Add variable** 按钮

### 步骤 3: 添加必需的环境变量

#### 变量 1: RUNPOD_API_KEY
- **Variable name**: `RUNPOD_API_KEY`
- **Value**: `[你的RunPod API密钥]`
- **Environment**: 选择 `Production` 和 `Preview`

#### 变量 2: RUNPOD_TEXT_ENDPOINT_ID
- **Variable name**: `RUNPOD_TEXT_ENDPOINT_ID`
- **Value**: `4cx6jtjdx6hdhr`
- **Environment**: 选择 `Production` 和 `Preview`

### 步骤 4: 保存并重新部署
1. 点击 **Save** 保存每个环境变量
2. 返回到项目的 **Deployments** 页面
3. 点击最新部署旁边的三个点，选择 **Retry deployment**
4. 环境变量将在 Cloudflare Worker Functions 中可用

## 🚀 自动构建过程

当你推送代码到GitHub时，Cloudflare Pages会：

1. **拉取最新代码**
2. **运行构建命令**: `npm run build`
3. **生成环境配置**: 创建 `env-config.js` 文件包含环境变量
4. **部署应用**: 包含正确的API密钥配置

## ✅ 验证设置

部署完成后，你可以：

1. **检查浏览器控制台** - 应该看到环境配置加载信息
2. **测试聊天功能** - 确认AI回复正常工作
3. **查看网络请求** - 确认RunPod API调用成功

## 🔒 安全说明

- ✅ API密钥通过Cloudflare环境变量安全管理
- ✅ 不会出现在Git仓库中
- ✅ 只在构建时注入到前端代码

## 📝 环境变量列表

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `RUNPOD_API_KEY` | `[你的RunPod API密钥]` | RunPod API认证 |
| `RUNPOD_TEXT_ENDPOINT_ID` | `4cx6jtjdx6hdhr` | RunPod端点标识符 |

设置完成后，聊天系统将自动使用这些环境变量！ 
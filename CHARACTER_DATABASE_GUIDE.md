# Gcrush 角色数据库设置指南

## 概述
这个指南将帮助你在Supabase中建立虚拟角色聊天系统的数据库结构。

## 数据库表结构

### 1. characters (角色卡表)
存储所有虚拟角色的基本信息：
- `number`: 角色编号 (1-12)
- `name`: 角色名称
- `style`: 角色风格/类型
- `age`: 角色年龄
- `system_prompt`: 系统提示词/人设核心
- `situation`: 角色所处情境/背景
- `greeting`: 角色问候语/开场白
- `description`: 角色详细描述
- `tag1`, `tag2`, `tag3`: 角色标签
- `voice`: 语音设置/声音类型
- `images`: 角色图片URLs数组
- `videos`: 角色视频URLs数组

### 2. chat_sessions (聊天会话表)
存储用户与角色的聊天会话信息

### 3. chat_messages (聊天消息表)
存储具体的聊天消息记录

### 4. user_character_preferences (用户角色偏好表)
存储用户对特定角色的个性化设置

## 在Supabase中执行SQL脚本

### 步骤1：登录Supabase Dashboard
1. 访问 https://supabase.com/dashboard
2. 选择你的项目 (kuflobojizyttadwcbhe)

### 步骤2：打开SQL编辑器
1. 在左侧菜单中点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### 步骤3：执行SQL脚本
1. 复制 `setup-character-database.sql` 文件中的所有内容
2. 粘贴到SQL编辑器中
3. 点击 **"Run"** 按钮执行脚本

### 步骤4：验证表创建
执行完成后，你可以在左侧的 **"Table Editor"** 中看到新创建的表：
- characters
- chat_sessions
- chat_messages
- user_character_preferences

## 手动添加角色数据

### 方法1：通过Table Editor界面
1. 在Supabase Dashboard中进入 **"Table Editor"**
2. 选择 **"characters"** 表
3. 点击 **"Insert"** -> **"Insert row"**
4. 填写角色信息：
   - Number: 1 (角色编号)
   - Name: "角色名称"
   - Style: "角色风格"
   - Age: 年龄
   - System_prompt: "详细的人设描述"
   - Situation: "角色所处情境"
   - Greeting: "角色的问候语"
   - Description: "角色详细描述"
   - Tag1, Tag2, Tag3: "相关标签"
   - Voice: "语音类型"
   - Images: ["图片URL1", "图片URL2"] (数组格式)
   - Videos: ["视频URL1", "视频URL2"] (数组格式)

### 方法2：通过SQL插入
在SQL编辑器中执行类似以下的插入语句：

```sql
INSERT INTO characters (
    number, name, style, age, system_prompt, situation, greeting, 
    description, tag1, tag2, tag3, voice, images, videos
) VALUES (
    1, 
    '艾莉娅', 
    '温柔治愈系', 
    22, 
    '你是艾莉娅，一个温柔善良的虚拟伙伴。你总是以关怀和理解的态度对待每一个人，善于倾听和给予温暖的建议。', 
    '在一个温馨的咖啡厅里，阳光透过窗户洒在桌子上', 
    '你好呀～我是艾莉娅，很高兴遇见你！今天过得怎么样呢？', 
    '艾莉娅是一个充满温暖和正能量的虚拟伙伴，她有着治愈人心的力量，总是能够给人带来安慰和鼓励。', 
    '温柔', 
    '治愈', 
    '善良', 
    'female_sweet', 
    ARRAY['https://example.com/alia1.jpg', 'https://example.com/alia2.jpg'], 
    ARRAY['https://example.com/alia_intro.mp4']
);
```

## 角色数据填充建议

为了创建吸引人的角色，建议包含以下元素：

### System Prompt 编写要点
- 明确角色的核心性格特征
- 定义角色的说话风格和语气
- 设置角色的背景故事和动机
- 指定角色的专长和兴趣领域

### Greeting 编写要点
- 体现角色的个性特色
- 自然友好的开场
- 可以包含角色的标志性表达方式
- 长度适中，不要太长或太短

### Tags 选择建议
- Tag1: 性格特征 (如：温柔、活泼、冷静)
- Tag2: 角色类型 (如：学生、老师、艺术家)
- Tag3: 特殊属性 (如：治愈系、知性、幽默)

## 注意事项

1. **角色编号唯一性**: 确保每个角色的number字段是唯一的(1-12)
2. **必填字段**: number, name, system_prompt, greeting 是必填字段
3. **数组格式**: images和videos字段使用PostgreSQL数组格式
4. **安全性**: 已配置行级安全策略，确保数据安全
5. **性能优化**: 已添加必要的索引提升查询性能

## 下一步

数据库建立完成后，你可以：
1. 手动填充12个角色的详细信息
2. 开始开发前端角色选择界面
3. 实现聊天功能的后端逻辑
4. 集成AI对话API

如有任何问题，请查看Supabase文档或联系技术支持。 
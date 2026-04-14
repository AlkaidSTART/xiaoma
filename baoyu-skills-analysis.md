# baoyu-skills 仓库分析

## 仓库概述

baoyu-skills 是一个为 Claude Code 提供的技能集合，旨在提高日常工作效率。这些技能涵盖了内容生成、AI 图像生成、内容处理等多个领域。

## 目录结构分析

### 主要目录

| 目录 | 功能 | 说明 |
|------|------|------|
| [.claude/](file:///workspace/baoyu-skills/.claude) | Claude 配置 | 包含技能发布相关配置 |
| [.claude-plugin/](file:///workspace/baoyu-skills/.claude-plugin) | 插件市场配置 | 用于在 Claude 插件市场注册 |
| [.githooks/](file:///workspace/baoyu-skills/.githooks) | Git 钩子 | 包含预推送钩子等 |
| [.github/](file:///workspace/baoyu-skills/.github) | GitHub 配置 | 包含工作流配置 |
| [docs/](file:///workspace/baoyu-skills/docs) | 文档 | 包含使用指南和教程 |
| [packages/](file:///workspace/baoyu-skills/packages) | 共享包 | 包含可重用的代码包 |
| [screenshots/](file:///workspace/baoyu-skills/screenshots) | 截图 | 包含技能效果预览图 |
| [scripts/](file:///workspace/baoyu-skills/scripts) | 脚本 | 包含发布和测试脚本 |
| [skills/](file:///workspace/baoyu-skills/skills) | 技能目录 | 包含所有技能实现 |

### packages 目录详解

| 包 | 功能 | 说明 |
|-----|------|------|
| [baoyu-chrome-cdp](file:///workspace/baoyu-skills/packages/baoyu-chrome-cdp) | Chrome CDP 客户端 | 用于与 Chrome 浏览器交互 |
| [baoyu-fetch](file:///workspace/baoyu-skills/packages/baoyu-fetch) | 内容获取工具 | 用于从网页获取内容并转换为 Markdown |
| [baoyu-md](file:///workspace/baoyu-skills/packages/baoyu-md) | Markdown 处理 | 用于 Markdown 渲染和样式处理 |

### skills 目录详解

技能分为三大类：

#### 1. 内容技能（Content Skills）

| 技能 | 功能 | 说明 |
|------|------|------|
| [baoyu-article-illustrator](file:///workspace/baoyu-skills/skills/baoyu-article-illustrator) | 文章插图生成 | 分析文章结构，生成适合的插图 |
| [baoyu-comic](file:///workspace/baoyu-skills/skills/baoyu-comic) | 知识漫画创作 | 创建教育类漫画，支持多种艺术风格 |
| [baoyu-cover-image](file:///workspace/baoyu-skills/skills/baoyu-cover-image) | 封面图生成 | 为文章生成封面图，支持多种风格 |
| [baoyu-infographic](file:///workspace/baoyu-skills/skills/baoyu-infographic) | 信息图表生成 | 生成专业信息图表，支持多种布局和风格 |
| [baoyu-post-to-wechat](file:///workspace/baoyu-skills/skills/baoyu-post-to-wechat) | 微信公众号发布 | 将内容发布到微信公众号 |
| [baoyu-post-to-weibo](file:///workspace/baoyu-skills/skills/baoyu-post-to-weibo) | 微博发布 | 将内容发布到微博 |
| [baoyu-post-to-x](file:///workspace/baoyu-skills/skills/baoyu-post-to-x) | X (Twitter) 发布 | 将内容发布到 X 平台 |
| [baoyu-slide-deck](file:///workspace/baoyu-skills/skills/baoyu-slide-deck) | 幻灯片生成 | 生成演示幻灯片图片 |

#### 2. AI 生成技能（AI Generation Skills）

| 技能 | 功能 | 说明 |
|------|------|------|
| [baoyu-imagine](file:///workspace/baoyu-skills/skills/baoyu-imagine) | AI 图像生成 | 支持多种 AI 图像生成 API |
| [baoyu-danger-gemini-web](file:///workspace/baoyu-skills/skills/baoyu-danger-gemini-web) | Gemini Web 交互 | 与 Gemini Web 交互生成内容 |
| [baoyu-image-gen](file:///workspace/baoyu-skills/skills/baoyu-image-gen) | 图像生成 | 类似 baoyu-imagine 的图像生成工具 |

#### 3. 实用工具技能（Utility Skills）

| 技能 | 功能 | 说明 |
|------|------|------|
| [baoyu-compress-image](file:///workspace/baoyu-skills/skills/baoyu-compress-image) | 图像压缩 | 压缩图像以减小文件大小 |
| [baoyu-danger-x-to-markdown](file:///workspace/baoyu-skills/skills/baoyu-danger-x-to-markdown) | X 内容转 Markdown | 将 X (Twitter) 内容转换为 Markdown |
| [baoyu-format-markdown](file:///workspace/baoyu-skills/skills/baoyu-format-markdown) | Markdown 格式化 | 格式化 Markdown 文件 |
| [baoyu-markdown-to-html](file:///workspace/baoyu-skills/skills/baoyu-markdown-to-html) | Markdown 转 HTML | 将 Markdown 转换为 HTML |
| [baoyu-translate](file:///workspace/baoyu-skills/skills/baoyu-translate) | 翻译工具 | 在不同语言之间翻译文档 |
| [baoyu-url-to-markdown](file:///workspace/baoyu-skills/skills/baoyu-url-to-markdown) | URL 转 Markdown | 从 URL 获取内容并转换为 Markdown |
| [baoyu-youtube-transcript](file:///workspace/baoyu-skills/skills/baoyu-youtube-transcript) | YouTube 字幕下载 | 下载 YouTube 视频字幕 |

## 技术栈

- **运行环境**：Node.js
- **构建工具**：Bun
- **主要语言**：TypeScript
- **AI 服务**：OpenAI, Google, Azure, OpenRouter, DashScope, MiniMax, Jimeng, Seedream, Replicate
- **浏览器交互**：Chrome CDP

## 安装与使用

### 快速安装

```bash
npx skills add jimliu/baoyu-skills
```

### 作为插件市场安装

在 Claude Code 中运行：

```bash
/plugin marketplace add JimLiu/baoyu-skills
```

然后通过浏览 UI 或直接命令安装：

```bash
/plugin install baoyu-skills@baoyu-skills
```

### 发布到 ClawHub

```bash
# 预览发布内容
./scripts/sync-clawhub.sh --dry-run

# 发布所有更改的技能
./scripts/sync-clawhub.sh --all
```

## 环境配置

许多技能需要 API 密钥或自定义配置。环境变量可以在 `.env` 文件中设置，加载优先级为：

1. CLI 环境变量
2. `process.env`（系统环境）
3. `<cwd>/.baoyu-skills/.env`（项目级）
4. `~/.baoyu-skills/.env`（用户级）

### 配置示例

```bash
# 创建用户级配置目录
mkdir -p ~/.baoyu-skills

# 创建 .env 文件
cat > ~/.baoyu-skills/.env << 'EOF'
# OpenAI
OPENAI_API_KEY=sk-xxx
OPENAI_IMAGE_MODEL=gpt-image-1.5

# Google
GOOGLE_API_KEY=xxx
GOOGLE_IMAGE_MODEL=gemini-3-pro-image-preview

# 其他 AI 服务配置...
EOF
```

## 自定义

所有技能都支持通过 `EXTEND.md` 文件进行自定义。创建扩展文件以覆盖默认样式、添加自定义配置或定义自己的预设。

### 扩展路径（按优先级检查）

1. `.baoyu-skills/<skill-name>/EXTEND.md` - 项目级（团队/项目特定设置）
2. `~/.baoyu-skills/<skill-name>/EXTEND.md` - 用户级（个人偏好）

## 典型使用场景

### 1. 内容创作

- 使用 `baoyu-cover-image` 为文章生成封面图
- 使用 `baoyu-article-illustrator` 为文章添加插图
- 使用 `baoyu-slide-deck` 为演示创建幻灯片
- 使用 `baoyu-infographic` 生成信息图表

### 2. 社交媒体发布

- 使用 `baoyu-post-to-wechat` 发布到微信公众号
- 使用 `baoyu-post-to-weibo` 发布到微博
- 使用 `baoyu-post-to-x` 发布到 X (Twitter)

### 3. 内容处理

- 使用 `baoyu-url-to-markdown` 从网页获取内容
- 使用 `baoyu-youtube-transcript` 下载 YouTube 字幕
- 使用 `baoyu-format-markdown` 格式化 Markdown 文件
- 使用 `baoyu-translate` 翻译文档

### 4. AI 生成

- 使用 `baoyu-imagine` 生成图像
- 使用 `baoyu-danger-gemini-web` 与 Gemini Web 交互

## 技能使用示例

### baoyu-imagine（图像生成）

```bash
# 基本生成
/baoyu-imagine --prompt "一只可爱的猫" --image cat.png

# 指定宽高比
/baoyu-imagine --prompt "风景" --image landscape.png --ar 16:9

# 指定 AI 提供商
/baoyu-imagine --prompt "猫" --image cat.png --provider openai
```

### baoyu-infographic（信息图表）

```bash
# 基于内容自动推荐布局和风格
/baoyu-infographic path/to/content.md

# 指定布局
/baoyu-infographic path/to/content.md --layout pyramid

# 指定风格
/baoyu-infographic path/to/content.md --style technical-schematic
```

### baoyu-url-to-markdown（URL 转 Markdown）

```bash
# 自动模式 - 页面加载后立即捕获
/baoyu-url-to-markdown https://example.com/article

# 等待模式 - 用于需要登录的页面
/baoyu-url-to-markdown https://example.com/private --wait
```

## 注意事项

1. **API 密钥安全**：不要将 API 密钥提交到版本控制系统
2. **浏览器交互**：某些技能需要 Chrome 浏览器，首次运行可能需要手动登录
3. **速率限制**：使用 AI 服务时注意速率限制
4. **免责声明**：某些技能使用非官方 API，使用风险自负

## 总结

baoyu-skills 是一个功能丰富的 Claude Code 技能集合，涵盖了内容生成、AI 图像生成、内容处理等多个领域。通过合理配置和使用这些技能，可以显著提高日常工作效率，特别是在内容创作、社交媒体发布和信息处理方面。

仓库采用模块化设计，将技能分为内容技能、AI 生成技能和实用工具技能三大类，便于管理和使用。同时，通过共享包和统一的配置机制，确保了技能之间的一致性和可扩展性。

## 建议

1. 首次使用时，建议先配置好所需的 API 密钥
2. 对于频繁使用的技能，可以创建自定义扩展文件以优化体验
3. 定期更新技能以获取最新功能和改进
4. 查看 docs 目录中的文档以获取详细的使用指南
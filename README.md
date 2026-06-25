# AI 岗位雷达

**小红书招聘帖聚合与简历定制助手**

> 产品作品集 Demo · Vibe Coding 能力展示 · 魏智蔓

---

## 产品背景

小红书上有大量 AI 初创公司、互联网大厂的招聘帖，但信息分散、格式不统一、有效期短。求职者需要反复收藏、筛选、复制 JD、修改简历、记录投递进度，效率极低。

本产品帮助用户：
- **聚合招聘帖**：手动粘贴帖子内容，AI 自动解析结构化 JD
- **匹配分析**：上传个人简历，AI 生成匹配度评分、优劣势、面试追问
- **生成定制简历**：基于 JD 和原简历生成优化版，可下载 Word 文件
- **管理投递进度**：全流程状态看板

---

## 运行方式

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

打开 http://localhost:3000

### 环境变量

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_API_KEY=mock` | Mock 模式，无需真实 Key，AI 功能全部可演示 |
| `ANTHROPIC_API_KEY=sk-ant-xxx` | 真实 Claude API，调用 claude-sonnet-4-6 |

---

## 功能说明

| 页面 | 核心功能 |
|---|---|
| 岗位列表 `/jobs` | 浏览/筛选岗位，修改投递状态 |
| 导入招聘帖 `/import` | 粘贴小红书帖子，AI 解析结构化 JD |
| 岗位详情 `/jobs/[id]` | 完整 JD、匹配分析、一键生成 Word 简历 |
| 简历管理 `/resume` | 上传 .docx，自动解析各模块 |
| 投递看板 `/dashboard` | 漏斗统计、分布图、最近更新 |

内置 10 条 mock 岗位（月之暗面、字节豆包、智谱 AI、阶跃星辰、百度、快手、百川、商汤、腾讯、京东健康）。

---

## 技术栈

Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Anthropic Claude API · mammoth · docx · 本地 JSON 存储

---

## AI Prompt 原则

所有 AI 功能均遵循：不编造经历、不虚构数据、不添加假技能；缺失能力明确标注「原简历缺少该能力证据」。

---

*魏智蔓 · AI产品实习作品集 · 2026.06*

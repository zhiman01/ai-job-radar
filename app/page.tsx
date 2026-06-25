import Link from 'next/link'
import {
  Radar, ArrowRight, Sparkles, LayoutDashboard, Plus,
  CheckCircle, AlertCircle, BookOpen, FileText, GitFork,
  ExternalLink, ChevronRight,
} from 'lucide-react'

/* ─── Data ───────────────────────────────────────────────── */

const PAIN_POINTS = [
  {
    icon: '📱',
    title: '信息分散，效率低',
    desc: '小红书 AI 公司招聘帖数量多、格式杂、更新快，收藏后难以系统管理',
  },
  {
    icon: '📄',
    title: '简历千篇一律',
    desc: '为每个岗位手动调整简历耗时，缺乏 JD 对照，容易遗漏关键词',
  },
  {
    icon: '🎯',
    title: '匹配盲目，缺口不清',
    desc: '不确定自己与岗位的真实差距，不知道该强调哪些优势、补足哪些能力',
  },
  {
    icon: '📊',
    title: '投递进度失控',
    desc: '多个岗位同步推进，投递状态靠记忆或散落在各处的备忘录维护',
  },
]

const SOLUTION_STEPS = [
  { step: '01', label: '导入招聘帖', desc: '粘贴小红书分享文本，AI 自动识别并结构化提取 JD 字段' },
  { step: '02', label: 'AI 结构化解析', desc: '提取岗位职责、任职要求、投递方式，完整度评分可视化' },
  { step: '03', label: 'JD × 简历匹配', desc: 'AI 输出匹配度 0–100 评分、优势、能力缺口与面试追问预测' },
  { step: '04', label: '定制简历生成', desc: '基于已有事实优化表达，支持量化版 / 脱敏版，一键下载 Word' },
  { step: '05', label: '投递看板管理', desc: '全流程状态追踪：收藏 → 投递 → 面试 → Offer，可视化漏斗' },
]

const FEATURES = [
  {
    tag: 'F-01',
    title: '招聘帖结构化',
    desc: '粘贴 XHS / 公众号分享文本，AI 提取公司、职责、要求、投递方式，完整度评分 + 可信度说明，结果可人工编辑',
    href: '/import',
    cta: '去导入',
  },
  {
    tag: 'F-02',
    title: '岗位管理',
    desc: '10+ 演示岗位覆盖月之暗面、字节豆包、智谱 AI 等主流 AI 公司；支持 9 种状态、标签筛选、搜索',
    href: '/jobs',
    cta: '看岗位',
  },
  {
    tag: 'F-03',
    title: '匹配分析',
    desc: 'AI 逐条对比 JD 与简历，输出匹配度评分、优势摘录、能力缺口、改写建议、面试追问预测',
    href: '/jobs',
    cta: '运行匹配',
  },
  {
    tag: 'F-04',
    title: '简历生成',
    desc: '基于 JD × 简历生成完整优化文本；量化版保留数据，脱敏版模糊敏感信息；不编造事实，缺口显式标注',
    href: '/jobs',
    cta: '生成简历',
  },
  {
    tag: 'F-05',
    title: '投递看板',
    desc: '可视化漏斗追踪投递全流程，时间区间筛选，岗位类型 / 公司类型分布统计，快捷状态操作',
    href: '/dashboard',
    cta: '看看板',
  },
]

const DECISIONS = [
  {
    title: '解析结果支持人工编辑',
    why: '「AI 辅助而非 AI 决策」——AI 解析可能有误，关键字段（薪资、地点、职责）必须允许用户校正后再入库',
    trade: '放弃全自动存储，换来用户信任与数据准确性',
  },
  {
    title: '内置演示简历，Tab 无空状态',
    why: '作品集 Demo 的核心目标是让面试官快速看到核心价值。空状态会中断体验；预加载演示数据确保任一 Tab 打开即有内容',
    trade: '用演示数据降低了"真实感"，但保障了完整演示链路',
  },
  {
    title: 'hasGeneratedResume 独立于 status',
    why: '用户可能生成简历后又把状态改回"收藏"，但"已生成过简历"这个事实不应该丢失，否则 Dashboard 统计口径会失真',
    trade: '多维护一个字段，换来更准确的漏斗统计',
  },
  {
    title: 'AI 改写严禁编造事实',
    why: 'Prompt 硬约束：不添加未有经历，不虚构数据；缺失能力显式标注「原简历缺少该能力证据」',
    trade: '生成结果"没那么厉害"，但可信度和面试安全性更高',
  },
  {
    title: 'Mock 模式支持离线全链路演示',
    why: '面试场景无法保证网络 + API 可用性；Mock 模式通过 Prompt 关键词分发预设响应，覆盖所有 AI 功能入口',
    trade: '需维护一套 Mock 数据集，但消除了演示中断风险',
  },
]

const ITERATIONS = [
  {
    version: 'V0',
    title: '信息聚合验证',
    color: 'bg-slate-100 border-slate-200 text-slate-600',
    dotColor: 'bg-slate-400',
    items: ['演示岗位列表', '四 Tab 详情结构', '基础状态筛选'],
    insight: '验证：结构化展示是否有价值？',
  },
  {
    version: 'V1',
    title: '招聘帖导入',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    dotColor: 'bg-blue-500',
    items: ['XHS 分享文本格式适配', 'AI 结构化解析', '解析结果可人工编辑', '重复导入检测'],
    insight: '验证：能否把非结构化文本变成可用 JD？',
  },
  {
    version: 'V2',
    title: '匹配分析',
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    dotColor: 'bg-violet-500',
    items: ['匹配度评分 0–100', '优势 / 缺口 / 改写建议', '面试追问预测', '演示简历开箱即用'],
    insight: '验证：能否量化简历与岗位的匹配程度？',
  },
  {
    version: 'V3',
    title: '简历生成闭环',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dotColor: 'bg-emerald-500',
    items: ['量化版 / 脱敏版生成', 'Word 下载', '改写对比展示', '投递看板嵌入操作', 'Landing Page'],
    insight: '验证：从「知道怎么改」到「改好可以用」？',
  },
  {
    version: 'V4',
    title: '规划中',
    color: 'bg-amber-50 border-amber-200 text-amber-600',
    dotColor: 'bg-amber-400',
    items: ['真实简历上传 & 解析', '浏览器插件剪藏', '云端数据同步', '多用户账号系统'],
    insight: '待验证：真实用户场景下全链路能否跑通？',
  },
]

const ACHIEVEMENTS = [
  '从 0 到 1 独立完成 Next.js 15 全栈产品，含 AI 功能全链路',
  '覆盖 5 个核心页面 + 完整 REST API，TypeScript 严格模式，0 错误',
  '3 层 AI 能力（解析 → 匹配 → 改写）+ 2 个人工确认节点',
  '可配置大模型 API + Mock 模式，确保演示不依赖网络',
  'Word 文件生成与下载（docx 库 + base64 传输）',
  '`hasGeneratedResume` 独立字段，解决状态回退导致的统计失真',
  '完整产品文档：PRD、产品故事、6 张 Mermaid 架构图',
]

const DEMO_STEPS = [
  { n: '1', label: '岗位列表', desc: '查看 10+ 条演示岗位', href: '/jobs' },
  { n: '2', label: '岗位详情', desc: '点击任一岗位，浏览完整 JD', href: '/jobs' },
  { n: '3', label: '匹配分析', desc: '切换「匹配分析」Tab，运行 AI 匹配，查看评分与缺口', href: '/jobs' },
  { n: '4', label: '生成简历', desc: '切换「生成简历」Tab，选量化版或脱敏版，一键生成', href: '/jobs' },
  { n: '5', label: 'Word 下载', desc: '点击下载，获取定制简历文件', href: '/jobs' },
  { n: '6', label: '投递看板', desc: '查看漏斗统计与岗位分布', href: '/dashboard' },
  { n: '7', label: '导入招聘帖', desc: '粘贴小红书分享文本，体验 AI 解析全链路', href: '/import' },
]

const DOC_LINKS = [
  {
    icon: BookOpen,
    title: '产品故事',
    desc: '背景 · 用户画像 · 核心决策 · 面试讲述稿',
    href: 'https://github.com/zhiman01/ai-job-radar/blob/main/docs/product-story.md',
  },
  {
    icon: FileText,
    title: 'PRD 文档',
    desc: '需求列表 · 功能规格 · 性能指标 · V1.1 规划',
    href: 'https://github.com/zhiman01/ai-job-radar/blob/main/docs/prd.md',
  },
  {
    icon: GitFork,
    title: '架构图',
    desc: '用户流程 · 信息架构 · AI 工作流 · 数据流 · 迭代路线',
    href: 'https://github.com/zhiman01/ai-job-radar/blob/main/docs/diagrams.md',
  },
  {
    icon: ExternalLink,
    title: 'GitHub 仓库',
    desc: '完整源码 · README · 运行方式',
    href: 'https://github.com/zhiman01/ai-job-radar',
  },
]

/* ─── Component ──────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F5FC]">

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-[#E1EAF5]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Radar className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1E2A3A] tracking-wide">AI 岗位雷达</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { href: '/jobs', label: '岗位列表' },
              { href: '/dashboard', label: '投递看板' },
              { href: '/import', label: '导入招聘帖' },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="text-xs text-[#7A95B0] hover:text-[#2563EB] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF]">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div className="pt-14">

        {/* ── 1. Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3 h-3" />
            产品实习作品集 · 可配置 AI API 驱动 · Vibe Coding 全栈实现
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[#0F2544] leading-tight mb-4">
            AI 岗位雷达
          </h1>
          <p className="text-xl text-[#3D5270] mb-3 max-w-xl mx-auto leading-relaxed font-medium">
            小红书招聘帖聚合 × 简历定制助手
          </p>
          <p className="text-sm text-[#7A95B0] mb-3 max-w-lg mx-auto leading-relaxed">
            面向 AI 产品求职者 · 从导入帖子到生成定制简历，全链路 AI 辅助，一站式管理求职进度
          </p>
          <p className="text-xs text-[#9DAFC0] mb-10 max-w-md mx-auto">
            魏智蔓 · 2026.06 · Next.js 15 · TypeScript · shadcn/ui · Anthropic Claude API
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/jobs"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-200">
              开始体验 Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/import"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8FD] text-[#1E2A3A] px-5 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#E1EAF5] shadow-sm">
              <Plus className="w-4 h-4 text-[#2563EB]" />
              导入招聘帖
            </Link>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8FD] text-[#1E2A3A] px-5 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#E1EAF5] shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
              投递看板
            </Link>
            <a href="https://github.com/zhiman01/ai-job-radar" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8FD] text-[#1E2A3A] px-5 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#E1EAF5] shadow-sm">
              <ExternalLink className="w-4 h-4 text-[#2563EB]" />
              GitHub
            </a>
          </div>
        </section>

        {/* ── 2. 用户痛点 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>用户痛点</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {PAIN_POINTS.map((p) => (
              <div key={p.title} className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="text-2xl mb-3">{p.icon}</div>
                <h3 className="text-sm font-semibold text-[#1E2A3A] mb-2">{p.title}</h3>
                <p className="text-xs text-[#7A95B0] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. 解决方案流程 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>解决方案流程</SectionLabel>
          <div className="mt-6 relative">
            <div className="hidden sm:block absolute top-7 left-[8%] right-[8%] h-px bg-gradient-to-r from-transparent via-[#BFDBFE] to-transparent" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {SOLUTION_STEPS.map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center px-2 relative z-10">
                  <div className="w-14 h-14 bg-white border-2 border-[#BFDBFE] rounded-full flex items-center justify-center mb-3 shadow-sm">
                    <span className="text-xs font-bold text-[#2563EB]">{s.step}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#1E2A3A] mb-1">{s.label}</p>
                  <p className="text-[10px] text-[#9DAFC0] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. 核心功能模块 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>核心功能模块</SectionLabel>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.tag} className="bg-white border border-[#E1EAF5] rounded-xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full">{f.tag}</span>
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">{f.title}</h3>
                </div>
                <p className="text-xs text-[#7A95B0] leading-relaxed flex-1 mb-4">{f.desc}</p>
                <Link href={f.href}
                  className="inline-flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
                  {f.cta} <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. 关键产品决策 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>关键产品决策</SectionLabel>
          <p className="text-xs text-[#9DAFC0] text-center mt-1 mb-6">产品设计中有意识的取舍，体现产品思维</p>
          <div className="space-y-3">
            {DECISIONS.map((d, i) => (
              <div key={i} className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#EFF6FF] rounded-full flex items-center justify-center text-[10px] font-bold text-[#2563EB] mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#1E2A3A] mb-2">{d.title}</h3>
                    <p className="text-xs text-[#3D5270] leading-relaxed mb-1">
                      <span className="text-[#7A95B0]">为什么这样做：</span>{d.why}
                    </p>
                    <p className="text-xs text-[#7A95B0] leading-relaxed">
                      <span className="font-medium">取舍：</span>{d.trade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. 迭代历程 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>迭代历程</SectionLabel>
          <p className="text-xs text-[#9DAFC0] text-center mt-1 mb-6">V0 → V4，每轮迭代聚焦一个核心验证问题</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ITERATIONS.map((v) => (
              <div key={v.version} className={`border rounded-xl p-4 ${v.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${v.dotColor}`} />
                  <span className="text-[11px] font-bold">{v.version}</span>
                </div>
                <p className="text-[11px] font-semibold mb-2 leading-tight">{v.title}</p>
                <ul className="space-y-1 mb-3">
                  {v.items.map((item) => (
                    <li key={item} className="text-[10px] leading-relaxed">· {item}</li>
                  ))}
                </ul>
                <p className="text-[10px] italic opacity-75 leading-relaxed border-t border-current/20 pt-2">{v.insight}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 7. 当前成果 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>当前阶段成果</SectionLabel>
          <div className="mt-6 bg-white border border-[#E1EAF5] rounded-2xl p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[#3D5270] leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. 演示说明 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>演示说明</SectionLabel>
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-amber-800">产品边界说明</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { ok: true,  text: '支持手动粘贴小红书公开招聘帖，AI 自动解析结构化 JD' },
                { ok: true,  text: '内置演示简历，可跑通「匹配分析 → 简历生成 → Word 下载」完整链路' },
                { ok: true,  text: '可配置 AI API，Mock 模式支持离线体验全部 AI 交互' },
                { ok: true,  text: '投递看板数据本地持久化，状态变更实时同步' },
                { ok: false, text: '不含爬虫，招聘帖须手动粘贴导入（自动抓取为 V2 规划）' },
                { ok: false, text: '当前以内置演示简历跑通链路，真实 Word 上传与解析为 V1.1 规划' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  {item.ok
                    ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  }
                  <p className="text-xs text-[#3D5270] leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. 推荐演示路径 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>推荐演示路径</SectionLabel>
          <p className="text-xs text-[#9DAFC0] text-center mt-1 mb-6">按此顺序体验，约 5–8 分钟，覆盖全部核心链路</p>
          <div className="space-y-2">
            {DEMO_STEPS.map((s) => (
              <Link key={s.n} href={s.href}
                className="flex items-center gap-4 bg-white hover:bg-[#F5F8FD] border border-[#E1EAF5] rounded-xl px-5 py-4 transition-colors group">
                <div className="w-7 h-7 bg-[#EFF6FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-[#2563EB]">{s.n}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E2A3A]">{s.label}</p>
                  <p className="text-xs text-[#7A95B0]">{s.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#C8D8F0] group-hover:text-[#2563EB] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── 10. 文档链接 ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <SectionLabel>产品文档</SectionLabel>
          <p className="text-xs text-[#9DAFC0] text-center mt-1 mb-6">完整的产品思考记录，适合面试深度交流</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DOC_LINKS.map((d) => (
              <a key={d.title} href={d.href} target="_blank" rel="noopener noreferrer"
                className="bg-white border border-[#E1EAF5] rounded-xl p-5 hover:border-[#BFDBFE] hover:shadow-sm transition-all group">
                <d.icon className="w-5 h-5 text-[#2563EB] mb-3" />
                <h3 className="text-sm font-semibold text-[#1E2A3A] mb-1 group-hover:text-[#2563EB] transition-colors">{d.title}</h3>
                <p className="text-[10px] text-[#9DAFC0] leading-relaxed">{d.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* ── 11. Footer CTA ── */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0F2544] rounded-2xl p-10 text-center">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-5">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">感谢您看到这里</h2>
            <p className="text-sm text-[#9DAFC0] mb-7 max-w-sm mx-auto leading-relaxed">
              这个产品是我从 0 到 1 独立构建的实战练习，体现了我对 AI 产品设计、用户体验和技术实现的综合理解。
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/jobs"
                className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors">
                开始体验 Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="https://github.com/zhiman01/ai-job-radar" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-colors">
                <ExternalLink className="w-4 h-4" />
                查看源码
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E1EAF5] bg-white">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#2563EB] rounded flex items-center justify-center">
                <Radar className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-[#9DAFC0]">AI 岗位雷达 · 魏智蔓 · 2026.06</span>
            </div>
            <p className="text-xs text-[#C8D8F0]">数据仅存本地 · 不含爬虫</p>
          </div>
        </footer>

      </div>
    </div>
  )
}

/* ─── Helpers ────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-[#9DAFC0] uppercase tracking-widest text-center">
      {children}
    </h2>
  )
}

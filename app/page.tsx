import Link from 'next/link'
import { Radar, ArrowRight, Sparkles, LayoutDashboard, Plus, CheckCircle, AlertCircle } from 'lucide-react'

const FLOW_STEPS = [
  { step: '01', label: '导入招聘帖', desc: '粘贴小红书分享文本，AI 自动结构化提取 JD' },
  { step: '02', label: 'AI 结构化解析', desc: '识别岗位职责、任职要求、投递方式、标签等字段' },
  { step: '03', label: 'JD × 简历匹配', desc: '上传简历，AI 输出匹配度评分、能力缺口与改写建议' },
  { step: '04', label: '定制简历生成', desc: '一键生成针对该岗位优化的简历，支持 Word 下载' },
  { step: '05', label: '投递看板管理', desc: '全流程状态追踪：收藏 → 投递 → 面试 → Offer' },
]

const FEATURES = [
  {
    icon: '🔍',
    title: '招聘帖结构化',
    desc: '粘贴小红书/公众号分享文本，AI 自动提取岗位名称、职责、要求、投递方式，完整度评分可视化',
  },
  {
    icon: '📊',
    title: '简历匹配分析',
    desc: '逐条对比 JD 与简历，输出匹配优势、能力缺口、面试追问预测，评分 0–100',
  },
  {
    icon: '✍️',
    title: '定制简历生成',
    desc: '基于已有事实优化表达，不编造内容；支持量化版 / 脱敏版，一键下载 Word',
  },
  {
    icon: '📋',
    title: '投递看板',
    desc: '可视化漏斗追踪投递进度，快捷操作变更状态，时间筛选 + 转化率统计',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F5FC]">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-[#E1EAF5]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
              <Radar className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-[#1E2A3A] tracking-wide">AI 岗位雷达</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/jobs"
              className="text-sm text-[#7A95B0] hover:text-[#2563EB] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#EFF6FF]">
              岗位列表
            </Link>
            <Link href="/import"
              className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />导入招聘帖
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-14">

        {/* ── Hero ── */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3 h-3" />
            作品集演示版本 · Claude API 驱动
          </div>

          <h1 className="text-4xl font-bold text-[#0F2544] leading-tight mb-4">
            AI 岗位雷达
          </h1>
          <p className="text-lg text-[#3D5270] mb-3 max-w-xl mx-auto leading-relaxed">
            面向 AI 产品求职者的<br />
            <span className="text-[#2563EB] font-semibold">小红书招聘帖聚合 × 简历定制助手</span>
          </p>
          <p className="text-sm text-[#7A95B0] mb-10 max-w-lg mx-auto">
            从导入帖子到生成定制简历，全链路 AI 辅助，一站式管理求职进度
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/jobs"
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-blue-200">
              开始体验
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/import"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8FD] text-[#1E2A3A] px-6 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#E1EAF5] shadow-sm">
              <Plus className="w-4 h-4 text-[#2563EB]" />
              导入招聘帖
            </Link>
            <Link href="/dashboard"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#F5F8FD] text-[#1E2A3A] px-6 py-3 rounded-xl text-sm font-semibold transition-colors border border-[#E1EAF5] shadow-sm">
              <LayoutDashboard className="w-4 h-4 text-[#2563EB]" />
              投递看板
            </Link>
          </div>
        </section>

        {/* ── Flow ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-xs font-semibold text-[#9DAFC0] uppercase tracking-widest text-center mb-8">核心流程</h2>
          <div className="grid grid-cols-5 gap-0 relative">
            {/* connector line */}
            <div className="absolute top-6 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-[#BFDBFE] to-transparent" />
            {FLOW_STEPS.map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center px-2 relative z-10">
                <div className="w-12 h-12 bg-white border-2 border-[#BFDBFE] rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <span className="text-xs font-bold text-[#2563EB]">{s.step}</span>
                </div>
                <p className="text-xs font-semibold text-[#1E2A3A] mb-1">{s.label}</p>
                <p className="text-[10px] text-[#9DAFC0] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-xs font-semibold text-[#9DAFC0] uppercase tracking-widest text-center mb-8">功能模块</h2>
          <div className="grid grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">{f.title}</h3>
                </div>
                <p className="text-xs text-[#7A95B0] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Demo notice ── */}
        <section className="max-w-5xl mx-auto px-6 pb-20">
          <div className="bg-white border border-[#E1EAF5] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              演示说明
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { ok: true,  text: '支持手动粘贴小红书/公众号公开分享文本，AI 自动解析结构化 JD' },
                { ok: true,  text: '内置演示简历，可跑通「匹配分析 → 简历生成 → Word 下载」完整链路' },
                { ok: true,  text: '投递看板数据本地持久化，状态变更实时同步' },
                { ok: true,  text: 'Claude API 驱动，本地 Mock 模式可离线体验全部交互' },
                { ok: false, text: '不含真实爬虫，招聘帖需手动粘贴导入' },
                { ok: false, text: '简历上传为演示能力，暂未接入真实个人简历解析' },
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

        {/* ── Footer ── */}
        <footer className="border-t border-[#E1EAF5] bg-white">
          <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#2563EB] rounded flex items-center justify-center">
                <Radar className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-[#9DAFC0]">AI 岗位雷达 · MVP</span>
            </div>
            <p className="text-xs text-[#C8D8F0]">数据仅存本地 · 不含真实爬虫</p>
          </div>
        </footer>

      </div>
    </div>
  )
}

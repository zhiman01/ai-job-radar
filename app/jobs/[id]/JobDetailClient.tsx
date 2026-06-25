'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Job, Resume, JobStatus } from '@/types'
import { StatusBadge } from '@/components/jobs/StatusBadge'
import { MatchScore } from '@/components/jobs/MatchScore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ResumeRenderer } from '@/components/resume/ResumeRenderer'
import {
  ArrowLeft, MapPin, CalendarDays, Building2, ExternalLink,
  Sparkles, FileText, Download, CheckCircle, XCircle, Loader2,
  Brain, Users, Target, AlertTriangle, ChevronRight, Zap,
  Copy, RotateCcw, Info,
} from 'lucide-react'
import { desensitize } from '@/lib/desensitize'

// ─── Types ───────────────────────────────────────────────────────────────────

type MatchData = {
  matchScore: number
  keywords: string[]
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  rewriteSuggestions: { section: string; original: string; suggestion: string; reason?: string }[]
  interviewQuestions: string[]
  warnings: string[]
}

type GenPhase = 'select' | 'loading' | 'done'

// ─── Constants ───────────────────────────────────────────────────────────────

const ALL_STATUSES: JobStatus[] = [
  '待查看', '已收藏', '待改简历', '已生成简历', '已投递', '面试中', 'Offer', '已拒绝', '已放弃',
]
const MATCH_STEPS = ['读取岗位 JD…', '分析简历内容…', '计算匹配度…', '生成改写建议…', '整理面试追问…']
const GEN_STEPS = ['理解岗位要求…', '提取简历亮点…', '针对性改写内容…', '生成定制简历…']
const DEMO_RESUME_ID = 'demo-resume-001'

// Pre-loaded demo match result — shown immediately so the tab is never empty
const DEMO_MATCH: MatchData = {
  matchScore: 86,
  keywords: ['AI产品', '大模型评测', 'A/B实验', '数据分析', '竞品分析', '用户洞察', 'Prompt Engineering'],
  strengths: [
    '有百度AI健康助手产品实习经历，直接对应AI产品岗需求',
    '独立完成医疗数据洞察报告，体现数据分析能力',
    '参与过大模型竞品评测，构建了200条评估集',
    '有A/B实验分析经验，好评率从88.47%提升至89.19%',
  ],
  gaps: [
    '原简历缺少对目标公司具体产品的深度使用和分析',
    '未明确提及SQL数据查询独立操作经验（可在数据项目中补充）',
    '缺少Figma/Axure原型设计作品的具体说明',
  ],
  recommendations: [
    '补充使用目标公司产品的真实体验和产品观察（如日常使用 Kimi 的感受）',
    '将 SQL 经验从"数据处理"中分拆出来单独呈现，加数量级或时长',
    '在项目经历中加入一个完整的 Axure 原型截图链接或具体说明',
  ],
  rewriteSuggestions: [
    {
      section: '百度实习·大模型竞品评测',
      original: '设计医疗Query评估集及可用率、优良率等评分口径，完成自家产品与文心一言等11款产品评测',
      suggestion: '主导构建200条医疗Query评估集，设计可用率/优良率双层评分口径；系统评测自家产品及11款主流大模型（含Kimi、夸克、Perplexity），自家产品可用率99%、优良率72%，处于第一梯队，结果直接支持科普模型迭代排期。',
      reason: '强化数据规模（200条）、竞品覆盖范围（含Kimi等主流产品）、量化结果及业务影响，使评测经验更具说服力',
    },
    {
      section: '百度实习·兜底体验优化',
      original: '参与A/B实验口径、归因与推全建议',
      suggestion: '参与退款/订单/客服三类高频失败意图的分层兜底方案设计；主导A/B实验指标口径制定与数据归因，实验组好评率+0.72pct，服务转化率相对提升41.65%，点踩率下降4.91%，为推全决策提供数据支撑。',
      reason: '将模糊的"参与"改为具体的职责范围和贡献环节，添加量化结果（三项指标）和决策影响力',
    },
  ],
  interviewQuestions: [
    '你在百度的竞品评测中，如何设计评分口径来减少主观偏差？',
    '能详细描述你的A/B实验归因流程吗？如何排除流量变化的干扰？',
    '如果让你为目标岗位设计一个用户研究方案，你会怎么做？',
    '你认为AI产品和传统产品在数据指标设计上最大的差异是什么？',
  ],
  warnings: [
    '不建议将团队整体实验结果完全归因为个人成果，注意表达为"参与主导"或"负责某环节"',
    '服务单量绝对值较小，建议同时说明业务背景（如该科室/场景的基线量）',
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCompletenessScore(job: Job) {
  let s = 0
  if (job.title) s += 10
  if (job.company) s += 10
  if (job.responsibilities?.length) s += 20
  if (job.requirements?.length) s += 20
  if (job.applyMethod) s += 10
  if (job.tags?.length) s += 10
  if (job.jdText) s += 10
  if (job.location) s += 5
  if (job.postDate) s += 5
  return s
}

function getTargetAudience(job: Job) {
  const map: Record<string, string> = {
    'AI产品': '有产品思维基础、对大模型有真实了解、数据能力扎实，希望加入AI产品团队的应届生或早期实习候选人',
    'Agent产品': '熟悉LLM/Agent基本原理、有产品设计或AI方向研究经历、对Agent工作流设计有深入思考的候选人',
    '数据分析': '有Python/SQL数据处理经验、统计分析基础扎实、对AI产品数据有洞察力的候选人',
    '运营': '有内容/社区/用户运营经验、对AIGC工具有使用和洞察、能用数据驱动运营决策的候选人',
    'Vibe Coding': '有AI工具实战经验（Cursor/Claude等）、能快速搭建Demo验证想法、对AI Native应用开发有判断的候选人',
    '算法': '有机器学习/深度学习基础、熟悉主流框架、有AI相关项目或论文经历的候选人',
  }
  return map[job.jobType] || '对AI行业有热情、具备跨学科背景，适合AI产品/运营/分析方向实习的候选人'
}

function getCoreCapabilities(job: Job) {
  const caps = new Set<string>()
  job.requirements.forEach(r => {
    if (r.includes('数据')) caps.add('数据分析能力')
    if (r.includes('产品') || r.includes('PRD')) caps.add('产品设计思维')
    if (r.includes('AI') || r.includes('大模型') || r.includes('LLM')) caps.add('大模型理解')
    if (r.includes('Python') || r.includes('SQL')) caps.add('数据工程能力')
    if (r.includes('Agent')) caps.add('Agent技术理解')
    if (r.includes('用户')) caps.add('用户洞察')
    if (r.includes('内容') || r.includes('写作')) caps.add('内容创作能力')
    if (r.includes('运营')) caps.add('运营能力')
  })
  job.tags.slice(0, 4).forEach(t => { if (caps.size < 6) caps.add(t) })
  return [...caps].slice(0, 6)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AILoadingCard({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 bg-[#EFF6FF] rounded-full flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#1E2A3A]">AI 正在分析</p>
          <p className="text-xs text-[#9DAFC0]">通常需要 10–30 秒，请稍候</p>
        </div>
      </div>
      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${i < currentStep ? 'bg-emerald-100' : i === currentStep ? 'bg-[#EFF6FF]' : 'bg-[#E8EFF8]'}`}>
              {i < currentStep
                ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                : i === currentStep
                  ? <Loader2 className="w-3 h-3 text-[#2563EB] animate-spin" />
                  : <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8F0]" />
              }
            </div>
            <span className={`text-xs transition-colors ${i < currentStep ? 'text-emerald-600 line-through' : i === currentStep ? 'text-[#2563EB] font-medium' : 'text-[#9DAFC0]'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Client component ────────────────────────────────────────────────────────

export default function JobDetailClient() {
  const { id } = useParams()
  const router = useRouter()

  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<string>(DEMO_RESUME_ID)
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'jd')

  // Match tab
  const [match, setMatch] = useState<MatchData>(DEMO_MATCH)
  const [isDemoMatch, setIsDemoMatch] = useState(true)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchStep, setMatchStep] = useState(0)

  // Generate tab
  const [genPhase, setGenPhase] = useState<GenPhase>('select')
  const [genAnimStep, setGenAnimStep] = useState(0)
  const [tailoredText, setTailoredText] = useState('')
  const [docxB64, setDocxB64] = useState('')
  const [docxName, setDocxName] = useState('')
  const [exportMode, setExportMode] = useState<'量化版' | '脱敏版'>('量化版')
  const [copying, setCopying] = useState(false)
  const [docxLoading, setDocxLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then(r => r.json()).then(setJob).catch(() => {})
    fetch('/api/resume')
      .then(r => r.json())
      .then((data: Resume[]) => {
        setResumes(data.filter(r => r.id !== DEMO_RESUME_ID))
      })
      .catch(() => {})
  }, [id])

  const updateStatus = async (status: JobStatus) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setJob(prev => prev ? { ...prev, status } : prev)
  }

  const runMatch = async () => {
    if (!selectedResume) return
    setMatchLoading(true)
    setMatchStep(0)
    const timer = setInterval(() => setMatchStep(s => Math.min(s + 1, MATCH_STEPS.length - 1)), 3500)
    try {
      const res = await fetch('/api/match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, resumeId: selectedResume }),
      })
      const data = await res.json()
      setMatch({
        ...DEMO_MATCH,
        matchScore: data.matchScore ?? DEMO_MATCH.matchScore,
        keywords: data.keywords?.length ? data.keywords : DEMO_MATCH.keywords,
        strengths: data.strengths?.length ? data.strengths : DEMO_MATCH.strengths,
        gaps: data.gaps?.length ? data.gaps : DEMO_MATCH.gaps,
        rewriteSuggestions: data.rewriteSuggestions?.length ? data.rewriteSuggestions : DEMO_MATCH.rewriteSuggestions,
        interviewQuestions: data.interviewQuestions?.length ? data.interviewQuestions : DEMO_MATCH.interviewQuestions,
        warnings: data.warnings?.length ? data.warnings : DEMO_MATCH.warnings,
      })
      setIsDemoMatch(false)
      setJob(prev => prev ? { ...prev, matchScore: data.matchScore } : prev)
    } catch {
      // keep demo match on failure
    } finally {
      clearInterval(timer)
      setMatchLoading(false)
    }
  }

  const generateResume = async () => {
    if (!selectedResume) return
    setGenPhase('loading')
    setGenAnimStep(0)
    const timer = setInterval(() => setGenAnimStep(s => Math.min(s + 1, GEN_STEPS.length - 1)), 4000)
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, resumeId: selectedResume }),
      })
      const data = await res.json()
      setTailoredText(data.tailoredResumeText)
      setDocxB64(data.docxBase64 || '')
      setDocxName(data.fileName || '定制简历.docx')
      setGenPhase('done')
      // Persist hasGeneratedResume; only promote status if still at an early stage
      const shouldUpdateStatus = ['待查看', '已收藏', '待改简历'].includes(job?.status ?? '')
      const patch: Partial<Job> = {
        hasGeneratedResume: true,
        ...(shouldUpdateStatus ? { status: '已生成简历' as JobStatus } : {}),
      }
      fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      }).catch(() => {})
      setJob(prev => prev ? { ...prev, ...patch } : prev)
    } catch {
      setGenPhase('select')
    } finally {
      clearInterval(timer)
    }
  }

  const triggerDocxDownload = (b64: string, name: string) => {
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
  }

  const downloadDocx = async () => {
    if (!job) return
    if (exportMode === '量化版' && docxB64) {
      triggerDocxDownload(docxB64, docxName)
      return
    }
    // Desensitized: generate fresh docx from scrubbed text
    setDocxLoading(true)
    try {
      const text = exportMode === '脱敏版' ? desensitize(tailoredText) : tailoredText
      const res = await fetch('/api/download-docx', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, jobTitle: job.title, company: job.company }),
      })
      const data = await res.json()
      const suffix = exportMode === '脱敏版' ? '（脱敏版）' : ''
      triggerDocxDownload(data.docxBase64, docxName.replace('.docx', `${suffix}.docx`))
    } finally {
      setDocxLoading(false)
    }
  }

  const copyText = async () => {
    const text = exportMode === '脱敏版' ? desensitize(tailoredText) : tailoredText
    await navigator.clipboard.writeText(text)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const resetGenerate = () => {
    setGenPhase('select')
    setTailoredText('')
    setDocxB64('')
    setExportMode('量化版')
  }

  if (!job) return <div className="text-center py-20 text-[#9DAFC0] text-sm">加载中…</div>

  const completeness = getCompletenessScore(job)
  const coreCapabilities = getCoreCapabilities(job)
  const targetAudience = getTargetAudience(job)
  const hasResume = !!selectedResume

  return (
    <div>
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[#7A95B0] hover:text-[#2563EB] mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>

      {/* ── Top card (preserved) ── */}
      <div className="bg-white border border-[#E1EAF5] rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-[#1E2A3A]">{job.title}</h1>
              <Badge variant="outline" className="text-xs bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">{job.jobType}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#7A95B0] flex-wrap">
              <Building2 className="w-4 h-4" />
              <span className="font-medium text-[#3D5270]">{job.company}</span>
              <span className="text-[#C8D8F0]">·</span>
              <span className="text-xs px-1.5 py-0.5 bg-[#E8EFF8] text-[#3D5270] rounded border border-[#C8D8F0]">{job.companyType}</span>
              <span className="text-[#C8D8F0]">·</span>
              <MapPin className="w-3 h-3" /><span>{job.location}</span>
              <span className="text-[#C8D8F0]">·</span>
              <CalendarDays className="w-3 h-3" /><span>{job.postDate}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <MatchScore score={job.matchScore} />
            <StatusBadge status={job.status} />
          </div>
        </div>

        {job.jdText && (
          <p className="text-xs text-[#7A95B0] bg-[#F5F8FD] rounded-lg px-3 py-2 mb-4 leading-relaxed">{job.jdText}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.tags.map(t => (
            <span key={t} className="text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-[#BFDBFE]">{t}</span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Select value={job.status} onValueChange={v => updateStatus(v as JobStatus)}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {job.sourceUrl && (
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-[#7A95B0] hover:text-[#2563EB] transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />查看原帖
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      {/* Demo notice */}
      <div className="flex items-center gap-2 bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl px-4 py-2.5 mb-4 text-xs text-[#1D4ED8]">
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        作品集演示版本，支持基于演示简历生成定制简历；真实使用时可上传个人 Word 简历。
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[#E1EAF5] p-1 h-9 mb-4">
          <TabsTrigger value="jd" className="text-xs h-7">岗位详情</TabsTrigger>
          <TabsTrigger value="match" className="text-xs h-7">匹配分析</TabsTrigger>
          <TabsTrigger value="generate" className="text-xs h-7">生成简历</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs h-7">原始帖子</TabsTrigger>
        </TabsList>

        {/* ════════ JD Tab ════════ */}
        <TabsContent value="jd">
          <div className="space-y-4">

            {/* Responsibilities + Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">岗位职责</h3>
                  <span className="text-[10px] text-[#9DAFC0] ml-auto">{job.responsibilities.length} 条</span>
                </div>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#3D5270] leading-relaxed">
                      <span className="text-[#93C5FD] flex-shrink-0 font-bold mt-0.5 text-[10px]">{i + 1}</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">任职要求</h3>
                  <span className="text-[10px] text-[#9DAFC0] ml-auto">{job.requirements.length} 条</span>
                </div>
                <ul className="space-y-2.5">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#3D5270] leading-relaxed">
                      <span className="text-indigo-300 flex-shrink-0 font-bold mt-0.5 text-[10px]">{i + 1}</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Core capabilities + Target audience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
                    <Brain className="w-3.5 h-3.5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">AI 提取核心能力</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coreCapabilities.map((cap, i) => (
                    <span key={i} className="text-xs bg-[#EFF6FF] text-[#1D4ED8] px-3 py-1.5 rounded-lg border border-[#BFDBFE] font-medium">{cap}</span>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">适合人群</h3>
                </div>
                <p className="text-xs text-[#3D5270] leading-relaxed">{targetAudience}</p>
              </div>
            </div>

            {/* Completeness + Apply method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-50 rounded-lg flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">信息完整度</h3>
                  </div>
                  <span className={`text-lg font-bold ${completeness >= 80 ? 'text-emerald-600' : completeness >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                    {completeness} 分
                  </span>
                </div>
                <Progress value={completeness} className="h-2 mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '岗位职责', ok: job.responsibilities.length > 0 },
                    { label: '任职要求', ok: job.requirements.length > 0 },
                    { label: '投递方式', ok: !!job.applyMethod },
                    { label: '岗位标签', ok: job.tags.length > 0 },
                    { label: 'JD摘要', ok: !!job.jdText },
                    { label: '发布时间', ok: !!job.postDate },
                  ].map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1 text-[10px] ${ok ? 'text-emerald-600' : 'text-[#9DAFC0]'}`}>
                      {ok ? <CheckCircle className="w-3 h-3 flex-shrink-0" /> : <XCircle className="w-3 h-3 flex-shrink-0" />}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {job.applyMethod && (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-5 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-[#DBEAFE] rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-3.5 h-3.5 text-[#2563EB]" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1D4ED8]">投递方式</h3>
                  </div>
                  <p className="text-xs text-[#1D4ED8] leading-relaxed">{job.applyMethod}</p>
                </div>
              )}
            </div>

          </div>
        </TabsContent>

        {/* ════════ Match Tab ════════ */}
        <TabsContent value="match">
          {/* Resume selector + run button */}
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedResume} onValueChange={v => setSelectedResume(v ?? '')}>
                <SelectTrigger className="h-8 text-xs w-60">
                  <SelectValue placeholder="选择简历" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEMO_RESUME_ID}>演示简历（AI产品实习生）</SelectItem>
                  {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.fileName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={runMatch} disabled={!selectedResume || matchLoading}
                className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
                <Sparkles className="w-3 h-3" />
                {matchLoading ? '分析中…' : '运行 AI 匹配分析'}
              </Button>
              {isDemoMatch && (
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200 ml-auto">
                  演示数据 · 可选真实简历重新运行
                </Badge>
              )}
            </div>
          </div>

          {matchLoading && <AILoadingCard steps={MATCH_STEPS} currentStep={matchStep} />}

          {!matchLoading && (
            <div className="space-y-4">
              {/* Score */}
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#E0EAFC] border border-[#BFDBFE] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">总体匹配度</h3>
                    <p className="text-[10px] text-[#7A95B0] mt-0.5">基于岗位 JD 与简历综合评分</p>
                  </div>
                  <span className="text-4xl font-bold text-[#1D4ED8]">
                    {match.matchScore}
                    <span className="text-sm text-[#7A95B0] font-normal ml-1">分</span>
                  </span>
                </div>
                <Progress value={match.matchScore} className="h-2.5 mb-4" />
                <div>
                  <p className="text-[10px] text-[#7A95B0] mb-2 uppercase tracking-wide">岗位核心关键词</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.keywords.map(k => (
                      <span key={k} className="text-[10px] bg-white text-[#2563EB] px-2 py-0.5 rounded-full border border-[#BFDBFE] font-medium">{k}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths + Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-emerald-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">简历匹配优势</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {match.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-[#3D5270] flex gap-2 leading-relaxed">
                        <span className="text-emerald-500 flex-shrink-0 font-bold">✓</span>{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-amber-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">能力缺口</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {match.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-[#3D5270] flex gap-2 leading-relaxed">
                        <span className="text-amber-500 flex-shrink-0">△</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">推荐强化的经历方向</h3>
                </div>
                <ul className="space-y-2">
                  {match.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs text-[#3D5270] leading-relaxed items-start">
                      <span className="text-indigo-400 flex-shrink-0 font-bold mt-0.5">{i + 1}.</span>{r}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rewrite suggestions */}
              {match.rewriteSuggestions.length > 0 && (
                <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">简历修改建议</h3>
                    <span className="text-[10px] text-[#9DAFC0]">仅优化表达方式，不编造事实</span>
                  </div>
                  <div className="space-y-4">
                    {match.rewriteSuggestions.map((s, i) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-[#E1EAF5]">
                        <div className="bg-[#F5F8FD] px-4 py-2 border-b border-[#E1EAF5]">
                          <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide">{s.section}</span>
                        </div>
                        <div className="p-4 space-y-3">
                          {s.original && (
                            <div>
                              <p className="text-[10px] text-[#9DAFC0] uppercase tracking-wide mb-1">原始表达</p>
                              <p className="text-xs text-[#9DAFC0] leading-relaxed line-through">{s.original}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-1 font-medium">改写后</p>
                            <p className="text-xs text-[#3D5270] leading-relaxed">{s.suggestion}</p>
                          </div>
                          {s.reason && (
                            <p className="text-[10px] text-[#7A95B0] bg-[#F5F8FD] px-3 py-2 rounded-lg">
                              <span className="font-medium text-[#3D5270]">改写理由：</span>{s.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interview questions */}
              {match.interviewQuestions.length > 0 && (
                <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">面试可能追问</h3>
                  </div>
                  <div className="space-y-2.5">
                    {match.interviewQuestions.map((q, i) => (
                      <div key={i} className="flex gap-3 p-3 bg-[#EFF6FF] rounded-lg border border-[#DBEAFE]">
                        <span className="text-[10px] font-bold text-[#2563EB] bg-[#BFDBFE] px-1.5 py-0.5 rounded flex-shrink-0 h-fit mt-0.5">Q{i + 1}</span>
                        <p className="text-xs text-[#3D5270] leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {match.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-amber-800">不建议夸大或编造的部分</h3>
                  </div>
                  <ul className="space-y-2">
                    {match.warnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-700 leading-relaxed flex gap-2">
                        <span className="flex-shrink-0">⚠️</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ════════ Generate Tab ════════ */}
        <TabsContent value="generate">
          {genPhase === 'select' && (
            <div className="space-y-4">

              {/* Step 1 */}
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="text-sm font-semibold text-[#1E2A3A]">选择简历基础</p>
                    <p className="text-[10px] text-[#9DAFC0] mt-0.5">AI 仅基于原简历已有事实优化表达，不会编造任何内容</p>
                  </div>
                </div>

                {resumes.length === 0 && selectedResume !== DEMO_RESUME_ID ? (
                  <div className="bg-[#F5F8FD] border border-dashed border-[#C8D8F0] rounded-xl p-6 text-center">
                    <FileText className="w-8 h-8 text-[#BFDBFE] mx-auto mb-3" />
                    <p className="text-sm text-[#3D5270] mb-1">暂无上传简历</p>
                    <p className="text-xs text-[#9DAFC0] mb-4">前往简历管理上传，或使用演示简历体验完整流程</p>
                    <div className="flex items-center justify-center gap-3">
                      <Button size="sm" onClick={() => setSelectedResume(DEMO_RESUME_ID)}
                        className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
                        <Sparkles className="w-3 h-3" />使用演示简历
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => router.push('/resume')}
                        className="h-8 text-xs">
                        前往简历管理
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <Select value={selectedResume} onValueChange={v => setSelectedResume(v ?? '')}>
                      <SelectTrigger className="h-8 text-xs w-60">
                        <SelectValue placeholder="选择简历" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DEMO_RESUME_ID}>演示简历（AI产品实习生）</SelectItem>
                        {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.fileName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {selectedResume === DEMO_RESUME_ID && (
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">演示数据</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2 - enhancement preview */}
              {hasResume && (
                <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <div>
                      <p className="text-sm font-semibold text-[#1E2A3A]">本次将重点强化的能力模块</p>
                      <p className="text-[10px] text-[#9DAFC0] mt-0.5">基于岗位 JD 分析，AI 将在以下方向优化简历表达</p>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {[
                      { module: '大模型竞品评测', detail: '突出评测规模、指标设计与直接业务影响，体现量化结果' },
                      { module: 'A/B 实验分析', detail: '强化归因方法、量化指标（好评率 / 转化率 / 点踩量）与推全支撑' },
                      { module: '数据指标体系', detail: '体现数据洞察深度与从0到1搭建的经历' },
                      { module: '用户研究与需求分析', detail: '关联岗位职责中的用户洞察、场景梳理需求' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[#F5F8FD] rounded-lg border border-[#E8EFF8]">
                        <div className="w-5 h-5 bg-[#EFF6FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Zap className="w-3 h-3 text-[#2563EB]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1E2A3A]">{item.module}</p>
                          <p className="text-[10px] text-[#7A95B0] mt-0.5">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-700 mt-4 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                    ⚠️ AI 只基于原简历已有事实优化表达，不会编造经历、虚构数据或添加未提及的技能
                  </p>
                </div>
              )}

              {/* Step 3 - generate button */}
              {hasResume && (
                <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <p className="text-sm font-semibold text-[#1E2A3A]">生成定制简历</p>
                  </div>
                  <Button onClick={generateResume}
                    className="w-full h-10 text-sm gap-2 bg-[#2563EB] hover:bg-[#1D4ED8]">
                    <Sparkles className="w-4 h-4" />
                    一键生成定制简历
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              )}

            </div>
          )}

          {genPhase === 'loading' && (
            <AILoadingCard steps={GEN_STEPS} currentStep={genAnimStep} />
          )}

          {genPhase === 'done' && tailoredText && (
            <div className="space-y-4">

              {/* Action bar */}
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-semibold text-[#1E2A3A]">定制简历已生成</p>
                  <p className="text-xs text-[#9DAFC0]">针对「{job.title} @ {job.company}」优化</p>
                </div>

                {/* Mode toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#7A95B0] flex-shrink-0">导出格式：</span>
                  {(['量化版', '脱敏版'] as const).map(mode => (
                    <button key={mode}
                      onClick={() => setExportMode(mode)}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                        exportMode === mode
                          ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8] font-medium'
                          : 'bg-white border-[#E1EAF5] text-[#7A95B0] hover:border-[#BFDBFE]'
                      }`}>
                      <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${exportMode === mode ? 'border-[#2563EB]' : 'border-[#C8D8F0]'}`}>
                        {exportMode === mode && <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
                      </div>
                      {mode}
                      {mode === '量化版' && <span className="text-[10px] text-[#9DAFC0]">（含具体数据）</span>}
                      {mode === '脱敏版' && <span className="text-[10px] text-[#9DAFC0]">（数据已模糊化）</span>}
                    </button>
                  ))}
                </div>

                {/* 4 action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" onClick={downloadDocx} disabled={docxLoading}
                    className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
                    {docxLoading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Download className="w-3 h-3" />}
                    下载 Word（{exportMode}）
                  </Button>
                  <Button size="sm" variant="outline" onClick={copyText}
                    className="h-8 text-xs gap-1.5">
                    {copying ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copying ? '已复制' : '复制简历文本'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetGenerate}
                    className="h-8 text-xs gap-1.5">
                    <RotateCcw className="w-3 h-3" />重新生成
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('match')}
                    className="h-8 text-xs gap-1.5 text-[#2563EB] border-[#BFDBFE] hover:bg-[#EFF6FF]">
                    <ArrowLeft className="w-3 h-3" />返回匹配分析
                  </Button>
                </div>
              </div>

              {/* Before/After comparison */}
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">改写对比亮点</h3>
                  <span className="text-[10px] text-[#9DAFC0]">AI 仅基于已有事实优化表达</span>
                </div>
                <div className="space-y-4">
                  {match.rewriteSuggestions.map((s, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-[#E1EAF5]">
                      <div className="bg-[#F5F8FD] px-4 py-2 border-b border-[#E1EAF5] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide">{s.section}</span>
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">优化表达</Badge>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-[#E1EAF5]">
                        <div className="p-4">
                          <p className="text-[10px] text-[#9DAFC0] uppercase tracking-wide mb-2">原始表达</p>
                          <p className="text-xs text-[#9DAFC0] leading-relaxed">{s.original}</p>
                        </div>
                        <div className="p-4 bg-emerald-50/30">
                          <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-2 font-medium">改写后</p>
                          <p className="text-xs text-[#3D5270] leading-relaxed font-medium">{s.suggestion}</p>
                        </div>
                      </div>
                      {s.reason && (
                        <div className="px-4 py-2.5 bg-[#F5F8FD] border-t border-[#E1EAF5]">
                          <p className="text-[10px] text-[#7A95B0]">
                            <span className="font-medium text-[#3D5270]">改写理由：</span>{s.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume preview */}
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">定制简历预览</h3>
                </div>
                <ResumeRenderer text={tailoredText} />
              </div>

            </div>
          )}
        </TabsContent>

        {/* ════════ Raw Tab ════════ */}
        <TabsContent value="raw">
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[#1E2A3A] mb-3">原始帖子内容</h3>
            <pre className="text-xs text-[#7A95B0] whitespace-pre-wrap leading-relaxed font-sans bg-[#F5F8FD] p-4 rounded-lg">
              {job.rawText || '暂无原始内容'}
            </pre>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sparkles, Save, AlertTriangle, CheckCircle, Loader2,
  Plus, X, FileText, Eye, RefreshCw, Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import { CompanyType, JobType, Location } from '@/types'

// ─── Types

interface ParseResult {
  isJobPost: boolean
  isAIRelated: boolean
  company: string
  title: string
  companyType: CompanyType
  jobType: JobType
  location: Location
  responsibilities: string[]
  requirements: string[]
  bonusItems: string[]
  applyMethod: string
  tags: string[]
  jdText: string
  completenessScore: number
  credibilityNote: string
  isMock?: boolean
  sourceUrl?: string
}

interface DuplicateInfo {
  existingId: string
  existingTitle: string
}

// ─── Constants

const PARSE_STEPS = [
  '识别招聘帖类型…',
  '提取岗位关键信息…',
  '结构化 JD 内容…',
  '生成标签与完整度评分…',
]

const LOCATION_OPTIONS: Location[] = [
  '北京', '上海', '深圳', '杭州', '广州', '远程', '不限', '未提及', '其他',
]

const EXAMPLE_POST = {
  title: '【MiniMax｜AI产品实习生｜上海】',
  sourceUrl: 'https://www.xiaohongshu.com/explore/minimax-ai-pm-intern-2026',
  postDate: '2026-06-20',
  rawText: `【MiniMax | AI产品实习生 | 上海】

海螺AI团队招AI产品实习生！与百亿参数模型团队一起定义AI对话产品的未来。

公司：MiniMax（海螺AI）— 国内顶尖大模型公司，海螺、Talkie均为旗下产品
地点：上海
时间：2026.07 入职，至少6个月

【岗位职责】
1. 参与AI对话/创作产品的功能需求调研与设计，输出PRD和交互稿
2. 分析用户行为数据，挖掘产品体验问题，提出优化建议
3. 跟进大模型能力评测，对比竞品（GPT-4、Gemini、Kimi等）产出评测报告
4. 协助A/B实验设计与上线，跟踪实验指标，输出推全建议

【任职要求】
1. 在校学生（本科及以上），每周可实习4天以上
2. 有互联网产品实习经验，具备用户思维和数据分析能力
3. 了解大语言模型基础原理，对AI产品有真实深度使用经验
4. 熟练使用Axure/Figma出原型，能独立撰写PRD

【加分项】
• 有Prompt Engineering实战经验
• 熟悉RAG、Agent、多模态等AI技术方向
• 有AI产品竞品分析报告或个人项目

【投递方式】
简历发送至 internship@minimax.io
邮件主题：AI产品实习生-姓名-学校
或小红书私信，附简历PDF`,
}

// ─── XHS share-text helpers

const XHS_URL_REGEX = /https?:\/\/(?:www\.)?(?:xhslink\.com|xiaohongshu\.com)\/\S+/i

// Tail text appended by XHS share — everything from these markers to end of string
const XHS_TAIL_RE = /[\s\S]*?(复制后前往【小红书】|打开小红书查看|查看完整内容请点击)/

/**
 * Given raw pasted text, returns:
 *   extractedUrl – first XHS/xhslink URL found, or null
 *   cleanedText  – rawText with the share tail (URL onward, if tail present) removed
 */
function processShareText(text: string): { extractedUrl: string | null; cleanedText: string } {
  const urlMatch = text.match(XHS_URL_REGEX)
  const extractedUrl = urlMatch ? urlMatch[0] : null

  let cleanedText = text

  if (urlMatch) {
    const urlStart = text.indexOf(urlMatch[0])
    const afterUrl = text.slice(urlStart + urlMatch[0].length)
    // If the text immediately after the URL starts a share tail, cut from URL onwards
    if (/^\s*(复制后前往|打开小红书|查看完整)/.test(afterUrl)) {
      cleanedText = text.slice(0, urlStart).trim()
    }
  }

  // Also strip any remaining tail patterns (handles URL-less share text)
  cleanedText = cleanedText
    .replace(/复制后前往【小红书】[\s\S]*$/, '')
    .replace(/打开小红书查看[\s\S]*$/, '')
    .replace(/查看完整内容请点击[\s\S]*$/, '')
    .trim()

  return { extractedUrl, cleanedText }
}

// ─── Generic helpers

function isValidUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim())
}

function getMissingFields(p: ParseResult): string[] {
  const missing: string[] = []
  if (!p.company || p.company === 'unknown') missing.push('公司名称')
  if (p.location === '未提及' || p.location === '其他') missing.push('工作地点')
  if (!p.applyMethod.trim()) missing.push('投递方式')
  if (p.responsibilities.length === 0) missing.push('岗位职责')
  if (p.requirements.length === 0) missing.push('任职要求')
  return missing
}

// ─── Editable list with optional collapse

function EditableList({
  items,
  onChange,
  expandable = false,
}: {
  items: string[]
  onChange: (items: string[]) => void
  expandable?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const PREVIEW = 3
  const collapsed = expandable && !expanded && items.length > PREVIEW
  const visible = collapsed ? items.slice(0, PREVIEW) : items

  return (
    <div className="space-y-1.5">
      {visible.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={item}
            onChange={e => {
              const next = [...items]
              next[i] = e.target.value
              onChange(next)
            }}
            className="h-7 text-xs flex-1 border-[#E1EAF5]"
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="text-[#C8D8F0] hover:text-red-400 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {collapsed && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1 text-[10px] text-[#2563EB] hover:underline transition-colors"
        >
          <ChevronDown className="w-3 h-3" />
          展开查看全部 {items.length} 条
        </button>
      )}
      {expandable && expanded && items.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="flex items-center gap-1 text-[10px] text-[#9DAFC0] hover:text-[#3D5270] transition-colors"
        >
          <ChevronUp className="w-3 h-3" />
          收起
        </button>
      )}
      {!collapsed && (
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="flex items-center gap-1 text-[10px] text-[#9DAFC0] hover:text-[#2563EB] transition-colors"
        >
          <Plus className="w-3 h-3" />新增一条
        </button>
      )}
    </div>
  )
}

// ─── Tag editor

function TagEditor({
  tags,
  onChange,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const t = input.trim()
    if (t && !tags.includes(t)) {
      onChange([...tags, t])
      setInput('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2 min-h-[22px]">
        {tags.map(t => (
          <span
            key={t}
            className="flex items-center gap-1 text-[10px] bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-[#BFDBFE]"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter(x => x !== t))}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder="输入标签后回车添加"
          className="h-7 text-xs border-[#E1EAF5] max-w-[180px]"
        />
        <button
          type="button"
          onClick={add}
          className="text-[#9DAFC0] hover:text-[#2563EB] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Main page

export default function ImportPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0])

  const [parsing, setParsing] = useState(false)
  const [parseStep, setParseStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedJobId, setSavedJobId] = useState('')
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [error, setError] = useState('')
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null)

  // ── Derived URL state
  // sourceUrl may have been set by auto-extraction (always a clean URL or empty by now)
  const urlIsMissing = !sourceUrl.trim()
  const urlIsValid = sourceUrl.trim() && isValidUrl(sourceUrl)
  // Warning only — never blocks parsing
  const urlWarning =
    sourceUrl.trim() && !isValidUrl(sourceUrl)
      ? '未识别到小红书链接，可继续解析，但保存后无法跳转原帖。'
      : ''

  const safeUrl = urlIsValid ? sourceUrl.trim() : ''

  // ── Handlers

  const handleRawTextChange = (value: string) => {
    const { extractedUrl, cleanedText } = processShareText(value)
    setRawText(cleanedText)
    // Auto-fill sourceUrl if not already set to a valid URL
    if (extractedUrl && !isValidUrl(sourceUrl)) {
      setSourceUrl(extractedUrl)
    }
    // Auto-suggest title from first 40 chars if title is blank
    if (!title.trim() && cleanedText) {
      const candidate = cleanedText.slice(0, 40).split('\n')[0].trim()
      if (candidate) setTitle(candidate)
    }
  }

  const handleSourceUrlChange = (value: string) => {
    // If user pasted a share text blob into the URL field, extract just the URL
    const extracted = value.match(XHS_URL_REGEX)
    if (extracted && extracted[0] !== value.trim()) {
      setSourceUrl(extracted[0])
    } else {
      setSourceUrl(value)
    }
  }

  const fillExample = () => {
    setTitle(EXAMPLE_POST.title)
    setSourceUrl(EXAMPLE_POST.sourceUrl)
    setPostDate(EXAMPLE_POST.postDate)
    setRawText(EXAMPLE_POST.rawText)
    setParsed(null)
    setError('')
    setSavedJobId('')
    setDuplicate(null)
  }

  const handleParse = async () => {
    if (!rawText.trim()) { setError('请填写帖子正文'); return }
    setParsing(true)
    setParseStep(0)
    setError('')
    setParsed(null)
    setSavedJobId('')
    setDuplicate(null)

    const timer = setInterval(
      () => setParseStep(s => Math.min(s + 1, PARSE_STEPS.length - 1)),
      2200,
    )

    try {
      const res = await fetch('/api/parse-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sourceUrl: safeUrl, rawText, postDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed({
        ...data,
        sourceUrl: safeUrl,
        bonusItems: Array.isArray(data.bonusItems) ? data.bonusItems : [],
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 解析失败，请重试')
    } finally {
      clearInterval(timer)
      setParsing(false)
    }
  }

  const checkDuplicate = async (): Promise<DuplicateInfo | null> => {
    try {
      const res = await fetch('/api/jobs')
      if (!res.ok) return null
      const jobs: Array<{ id: string; title: string; company: string; sourceUrl?: string }> =
        await res.json()
      const match = jobs.find(
        j =>
          (safeUrl && j.sourceUrl && j.sourceUrl === safeUrl) ||
          (parsed && j.title === parsed.title && j.company === parsed.company),
      )
      if (match) {
        return { existingId: match.id, existingTitle: `${match.title} @ ${match.company}` }
      }
    } catch {
      // proceed without duplicate check on network error
    }
    return null
  }

  const doSave = async (mode: 'new' | 'overwrite') => {
    if (!parsed) return
    setSaving(true)
    try {
      let savedId: string
      if (mode === 'overwrite' && duplicate) {
        const res = await fetch(`/api/jobs/${duplicate.existingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parsed, rawText, postDate, sourcePlatform: '小红书' }),
        })
        if (!res.ok) throw new Error('更新失败')
        savedId = duplicate.existingId
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parsed, rawText, postDate, sourcePlatform: '小红书' }),
        })
        if (!res.ok) throw new Error('保存失败')
        const saved = await res.json()
        savedId = saved.id
      }
      setSavedJobId(savedId)
      setDuplicate(null)
    } catch {
      setError('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!parsed) return
    const dup = await checkDuplicate()
    if (dup) { setDuplicate(dup); return }
    await doSave('new')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">导入招聘帖</h1>
          <p className="text-xs text-[#9DAFC0] mt-0.5">粘贴小红书招聘帖内容，AI 自动解析结构化信息</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fillExample}
          className="h-8 text-xs gap-1.5 border-[#BFDBFE] text-[#2563EB] hover:bg-[#EFF6FF] flex-shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          使用示例招聘帖
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── Left: input form */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#1E2A3A]">帖子信息</h2>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">帖子标题</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="小红书帖子标题（可选，粘贴正文后自动识别）"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">原帖链接（选填）</Label>
              <Input
                value={sourceUrl}
                onChange={e => handleSourceUrlChange(e.target.value)}
                placeholder="https://xhslink.com/... 或粘贴完整分享文本自动提取"
                className={`h-8 text-sm ${urlWarning ? 'border-amber-300' : urlIsValid ? 'border-emerald-300' : ''}`}
              />
              {urlWarning && (
                <p className="text-[10px] text-amber-600 flex items-start gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />{urlWarning}
                </p>
              )}
              {urlIsValid && !urlWarning && (
                <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />链接有效
                </p>
              )}
              {urlIsMissing && (
                <p className="text-[10px] text-[#B8CBDF]">留空也可以，不影响解析和保存</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">发布时间</Label>
              <Input
                type="date"
                value={postDate}
                onChange={e => setPostDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#7A95B0]">
                  帖子正文 <span className="text-red-400">*</span>
                </Label>
                <span className="text-[10px] text-[#9DAFC0]">
                  支持直接粘贴小红书分享文本，自动提取链接和清理尾部
                </span>
              </div>
              <Textarea
                value={rawText}
                onChange={e => handleRawTextChange(e.target.value)}
                placeholder={`将招聘帖正文粘贴到这里…\n\n也可以直接粘贴小红书「分享」按钮复制出来的整段文本，\n系统会自动提取链接并去掉"复制后前往小红书"等尾部内容。\n\n格式示例：\n【公司名 | 岗位名 | 城市】\n\n岗位职责：…\n任职要求：…\n投递方式：…`}
                className="min-h-[260px] text-sm resize-none"
              />
              <p className="text-[10px] text-[#B8CBDF]">
                请勿粘贴包含他人隐私、非公开联系方式或不宜传播的内容。
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              onClick={handleParse}
              disabled={parsing || !rawText.trim()}
              className="w-full gap-2 bg-[#2563EB] hover:bg-[#1D4ED8]"
            >
              <Sparkles className="w-4 h-4" />
              {parsing ? 'AI 解析中…' : 'AI 解析招聘帖'}
            </Button>
          </div>

          {/* Compliance notice */}
          <div className="flex items-start gap-2.5 bg-[#F5F8FD] border border-[#E1EAF5] rounded-xl px-4 py-3">
            <Info className="w-3.5 h-3.5 text-[#9DAFC0] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[#9DAFC0] leading-relaxed">
              当前版本不包含真实爬虫，仅支持用户手动粘贴公开招聘帖内容进行结构化整理，供个人求职参考。
              请确保来源帖子为公开发布内容，不得导入含未公开个人信息的内容。
            </p>
          </div>
        </div>

        {/* ── Right: result panel */}
        <div>
          {/* Empty state */}
          {!parsed && !parsing && (
            <div className="bg-white border border-dashed border-[#C8D8F0] rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Sparkles className="w-9 h-9 text-[#BFDBFE] mb-3" />
              <p className="text-sm text-[#7A95B0] font-medium">填写帖子内容，点击「AI 解析」</p>
              <p className="text-xs text-[#9DAFC0] mt-1.5">系统将自动提取岗位信息并结构化</p>
              <p className="text-[10px] text-[#C8D8F0] mt-3">
                也可点击右上角「使用示例招聘帖」快速体验
              </p>
            </div>
          )}

          {/* Loading state */}
          {parsing && (
            <div className="bg-white border border-[#E1EAF5] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-[#EFF6FF] rounded-full flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1E2A3A]">AI 解析中</p>
                  <p className="text-xs text-[#9DAFC0]">通常需要 10–20 秒</p>
                </div>
              </div>
              <div className="space-y-4">
                {PARSE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        i < parseStep ? 'bg-emerald-100' : i === parseStep ? 'bg-[#EFF6FF]' : 'bg-[#F0F4FA]'
                      }`}
                    >
                      {i < parseStep ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : i === parseStep ? (
                        <Loader2 className="w-3 h-3 text-[#2563EB] animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8F0]" />
                      )}
                    </div>
                    <span
                      className={`text-xs transition-colors ${
                        i < parseStep
                          ? 'text-emerald-600 line-through decoration-emerald-300'
                          : i === parseStep
                          ? 'text-[#2563EB] font-medium'
                          : 'text-[#9DAFC0]'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result state */}
          {!parsing && parsed && (
            <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 space-y-5">
              {/* Header badges */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-[#1E2A3A]">解析结果</h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {parsed.isMock && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                      Mock 模式
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      parsed.isJobPost
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {parsed.isJobPost ? (
                      <><CheckCircle className="w-3 h-3 mr-1 inline-block" />识别为招聘帖</>
                    ) : (
                      <><AlertTriangle className="w-3 h-3 mr-1 inline-block" />非招聘帖</>
                    )}
                  </Badge>
                  {parsed.isAIRelated && (
                    <Badge variant="outline" className="text-[10px] bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                      AI 相关
                    </Badge>
                  )}
                </div>
              </div>

              {/* Basic fields grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">岗位名称</Label>
                  <Input value={parsed.title} onChange={e => setParsed({ ...parsed, title: e.target.value })} className="h-7 text-xs border-[#E1EAF5]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">公司名称</Label>
                  <Input value={parsed.company} onChange={e => setParsed({ ...parsed, company: e.target.value })} className="h-7 text-xs border-[#E1EAF5]" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">公司类型</Label>
                  <Select value={parsed.companyType} onValueChange={v => setParsed({ ...parsed, companyType: v as CompanyType })}>
                    <SelectTrigger className="h-7 text-xs border-[#E1EAF5]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['AI初创', '互联网大厂', 'AI应用公司', '其他'] as CompanyType[]).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">岗位方向</Label>
                  <Select value={parsed.jobType} onValueChange={v => setParsed({ ...parsed, jobType: v as JobType })}>
                    <SelectTrigger className="h-7 text-xs border-[#E1EAF5]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['AI产品', 'Agent产品', '数据分析', '运营', '算法', 'Vibe Coding', '设计', '其他'] as JobType[]).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Location — sole item in this row */}
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">工作地点</Label>
                  <Select value={parsed.location} onValueChange={v => setParsed({ ...parsed, location: v as Location })}>
                    <SelectTrigger className="h-7 text-xs border-[#E1EAF5]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOCATION_OPTIONS.map(l => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Completeness — full width */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">信息完整度</Label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      parsed.completenessScore >= 80 ? 'text-emerald-600'
                        : parsed.completenessScore >= 60 ? 'text-amber-600'
                        : 'text-red-500'
                    }`}
                  >
                    {parsed.completenessScore}
                  </span>
                  <span className="text-[10px] text-[#9DAFC0]">分</span>
                  <div className="flex-1 h-1.5 bg-[#E8EFF8] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        parsed.completenessScore >= 80 ? 'bg-emerald-500'
                          : parsed.completenessScore >= 60 ? 'bg-amber-400'
                          : 'bg-red-400'
                      }`}
                      style={{ width: `${parsed.completenessScore}%` }}
                    />
                  </div>
                </div>
                {(() => {
                  const missing = getMissingFields(parsed)
                  return missing.length > 0 ? (
                    <p className="text-[10px] text-[#9DAFC0]">
                      信息尚缺：<span className="text-amber-600">{missing.join('、')}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-emerald-600">信息较完整</p>
                  )
                })()}
              </div>

              {/* JD summary */}
              <div className="space-y-1">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">JD 摘要</Label>
                <Textarea value={parsed.jdText} onChange={e => setParsed({ ...parsed, jdText: e.target.value })} className="text-xs h-14 resize-none border-[#E1EAF5]" />
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">
                  岗位职责（{parsed.responsibilities.length} 条）
                </Label>
                <EditableList
                  items={parsed.responsibilities}
                  onChange={items => setParsed({ ...parsed, responsibilities: items })}
                  expandable
                />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">
                  任职要求（{parsed.requirements.length} 条）
                </Label>
                <EditableList
                  items={parsed.requirements}
                  onChange={items => setParsed({ ...parsed, requirements: items })}
                  expandable
                />
              </div>

              {/* Bonus items */}
              {parsed.bonusItems.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">
                    加分项（{parsed.bonusItems.length} 条）
                  </Label>
                  <EditableList
                    items={parsed.bonusItems}
                    onChange={items => setParsed({ ...parsed, bonusItems: items })}
                  />
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">关键词标签</Label>
                <TagEditor tags={parsed.tags} onChange={tags => setParsed({ ...parsed, tags })} />
              </div>

              {/* Apply method */}
              <div className="space-y-1">
                <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">投递方式</Label>
                <Input value={parsed.applyMethod} onChange={e => setParsed({ ...parsed, applyMethod: e.target.value })} className="h-7 text-xs border-[#E1EAF5]" placeholder="邮箱 / 内推链接 / 私信" />
              </div>

              {/* Credibility note */}
              {parsed.credibilityNote && (
                <p className="text-[10px] text-[#7A95B0] bg-[#F5F8FD] border border-[#EAF0F9] px-3 py-2.5 rounded-lg leading-relaxed">
                  {parsed.credibilityNote}
                </p>
              )}

              {/* Duplicate warning */}
              {duplicate && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">该招聘帖可能已导入</p>
                      <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                        已有岗位：「{duplicate.existingTitle}」
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => doSave('new')} disabled={saving}
                      className="h-7 text-[10px] px-3 bg-[#2563EB] hover:bg-[#1D4ED8]">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : '继续保存为新岗位'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => doSave('overwrite')} disabled={saving}
                      className="h-7 text-[10px] px-3 border-amber-300 text-amber-700 hover:bg-amber-100">
                      覆盖原岗位
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDuplicate(null)} disabled={saving}
                      className="h-7 text-[10px] px-3">
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* Save success */}
              {savedJobId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs font-semibold text-emerald-800">已成功保存到岗位列表</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={() => router.push(`/jobs/${savedJobId}`)}
                      className="h-7 text-[10px] px-3 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                      <Eye className="w-3 h-3" />查看岗位详情
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push('/jobs')}
                      className="h-7 text-[10px] px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      返回岗位列表
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              {!savedJobId && !duplicate && (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving || !parsed.isJobPost}
                    className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />保存中…</>
                    ) : (
                      <><Save className="w-4 h-4" />保存到岗位列表</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleParse} disabled={parsing}
                    className="gap-1.5 border-[#E1EAF5] text-[#7A95B0] hover:text-[#1E2A3A]">
                    <RefreshCw className="w-3.5 h-3.5" />重新解析
                  </Button>
                </div>
              )}

              {/* Import another */}
              {savedJobId && (
                <Button variant="outline"
                  onClick={() => {
                    setParsed(null); setSavedJobId(''); setTitle('')
                    setSourceUrl(''); setRawText('')
                    setPostDate(new Date().toISOString().split('T')[0])
                  }}
                  className="w-full text-xs gap-1.5">
                  <Plus className="w-3.5 h-3.5" />导入新帖子
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Job, Resume, JobMatch, JobStatus } from '@/types'
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
  Sparkles, FileText, Download, CheckCircle, XCircle, Loader2
} from 'lucide-react'

const ALL_STATUSES: JobStatus[] = [
  '待查看', '已收藏', '待改简历', '已生成简历', '已投递', '面试中', 'Offer', '已拒绝', '已放弃'
]

const MATCH_STEPS = ['读取岗位 JD…', '分析简历内容…', '计算匹配度…', '生成改写建议…', '整理面试追问…']
const GEN_STEPS = ['理解岗位要求…', '提取简历亮点…', '针对性改写内容…', '生成定制简历…']

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
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              i < currentStep ? 'bg-emerald-100' : i === currentStep ? 'bg-[#EFF6FF]' : 'bg-[#E8EFF8]'
            }`}>
              {i < currentStep ? (
                <CheckCircle className="w-3 h-3 text-emerald-500" />
              ) : i === currentStep ? (
                <Loader2 className="w-3 h-3 text-[#2563EB] animate-spin" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8F0]" />
              )}
            </div>
            <span className={`text-xs transition-colors ${
              i < currentStep ? 'text-emerald-600 line-through' : i === currentStep ? 'text-[#2563EB] font-medium' : 'text-[#9DAFC0]'
            }`}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<string>('')
  const [match, setMatch] = useState<JobMatch | null>(null)
  const [matchLoading, setMatchLoading] = useState(false)
  const [matchStep, setMatchStep] = useState(0)
  const [genLoading, setGenLoading] = useState(false)
  const [genStep, setGenStep] = useState(0)
  const [tailoredText, setTailoredText] = useState('')
  const [docxB64, setDocxB64] = useState('')
  const [docxName, setDocxName] = useState('')

  useEffect(() => {
    fetch(`/api/jobs/${id}`).then(r => r.json()).then(setJob)
    fetch('/api/resume').then(r => r.json()).then((data: Resume[]) => {
      setResumes(data)
      if (data.length > 0) setSelectedResume(data[0].id)
    })
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
    const timer = setInterval(() => {
      setMatchStep(s => Math.min(s + 1, MATCH_STEPS.length - 1))
    }, 3500)
    try {
      const res = await fetch('/api/match', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, resumeId: selectedResume }),
      })
      const data = await res.json()
      setMatch(data)
      setJob(prev => prev ? { ...prev, matchScore: data.matchScore } : prev)
    } finally {
      clearInterval(timer)
      setMatchLoading(false)
    }
  }

  const generateResume = async () => {
    if (!selectedResume) return
    setGenLoading(true)
    setGenStep(0)
    const timer = setInterval(() => {
      setGenStep(s => Math.min(s + 1, GEN_STEPS.length - 1))
    }, 4000)
    try {
      const res = await fetch('/api/generate-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id, resumeId: selectedResume }),
      })
      const data = await res.json()
      setTailoredText(data.tailoredResumeText)
      setDocxB64(data.docxBase64)
      setDocxName(data.fileName)
      setJob(prev => prev ? { ...prev, status: '已生成简历' } : prev)
    } finally {
      clearInterval(timer)
      setGenLoading(false)
    }
  }

  const downloadDocx = () => {
    const binary = atob(docxB64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = docxName; a.click()
  }

  if (!job) return <div className="text-center py-20 text-[#9DAFC0] text-sm">加载中…</div>

  return (
    <div>
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-[#7A95B0] hover:text-[#2563EB] mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" />返回列表
      </button>

      {/* Header */}
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
          <Select value={job.status} onValueChange={(v) => updateStatus(v as JobStatus)}>
            <SelectTrigger className="h-8 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
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

      <Tabs defaultValue="jd">
        <TabsList className="bg-white border border-[#E1EAF5] p-1 h-9 mb-4">
          <TabsTrigger value="jd" className="text-xs h-7">岗位详情</TabsTrigger>
          <TabsTrigger value="match" className="text-xs h-7">匹配分析</TabsTrigger>
          <TabsTrigger value="generate" className="text-xs h-7">生成简历</TabsTrigger>
          <TabsTrigger value="raw" className="text-xs h-7">原始帖子</TabsTrigger>
        </TabsList>

        {/* JD Tab */}
        <TabsContent value="jd">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                <h3 className="text-sm font-semibold text-[#1E2A3A]">岗位职责</h3>
              </div>
              <ul className="space-y-2.5">
                {job.responsibilities.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#3D5270]">
                    <span className="text-[#93C5FD] flex-shrink-0 font-bold mt-0.5">·</span>{r}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                <h3 className="text-sm font-semibold text-[#1E2A3A]">任职要求</h3>
              </div>
              <ul className="space-y-2.5">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex gap-2 text-xs text-[#3D5270]">
                    <span className="text-indigo-300 flex-shrink-0 font-bold mt-0.5">·</span>{r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {job.applyMethod && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 mt-4">
              <p className="text-xs text-[#1D4ED8]"><span className="font-semibold">投递方式：</span>{job.applyMethod}</p>
            </div>
          )}
        </TabsContent>

        {/* Match Tab */}
        <TabsContent value="match">
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={selectedResume} onValueChange={(v) => setSelectedResume(v ?? '')}>
                <SelectTrigger className="h-8 text-xs w-56">
                  <SelectValue placeholder="选择简历" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.fileName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={runMatch} disabled={!selectedResume || matchLoading}
                className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
                <Sparkles className="w-3 h-3" />
                {matchLoading ? '分析中…' : '生成匹配分析'}
              </Button>
              {resumes.length === 0 && (
                <span className="text-xs text-amber-600">请先在「简历管理」页上传简历</span>
              )}
            </div>
          </div>

          {matchLoading && <AILoadingCard steps={MATCH_STEPS} currentStep={matchStep} />}

          {!matchLoading && match && (
            <div className="space-y-4">
              {/* Score */}
              <div className="bg-gradient-to-br from-[#EFF6FF] to-[#E0EAFC] border border-[#BFDBFE] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">总体匹配度</h3>
                  <span className="text-3xl font-bold text-[#1D4ED8]">
                    {match.matchScore}
                    <span className="text-sm text-[#7A95B0] font-normal ml-1">分</span>
                  </span>
                </div>
                <Progress value={match.matchScore} className="h-2.5 mb-4" />
                <div className="flex flex-wrap gap-1.5">
                  {match.keywords.map(k => (
                    <span key={k} className="text-[10px] bg-white text-[#2563EB] px-2 py-0.5 rounded-full border border-[#BFDBFE] font-medium">{k}</span>
                  ))}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-emerald-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">匹配优势</h3>
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
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">可补强方向</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {match.gaps.map((g, i) => (
                      <li key={i} className="text-xs text-[#3D5270] flex gap-2 leading-relaxed">
                        <span className="text-amber-500 flex-shrink-0">💡</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Rewrite suggestions */}
              {match.rewriteSuggestions.length > 0 && (
                <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                    <h3 className="text-sm font-semibold text-[#1E2A3A]">简历改写建议</h3>
                  </div>
                  <div className="space-y-4">
                    {match.rewriteSuggestions.map((s, i) => (
                      <div key={i} className="border-l-2 border-[#93C5FD] pl-4 bg-[#F5F8FD] py-2 pr-3 rounded-r-lg">
                        <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide mb-1.5">{s.section}</p>
                        {s.original && (
                          <p className="text-xs text-[#9DAFC0] mb-2 line-through leading-relaxed">{s.original}</p>
                        )}
                        <p className="text-xs text-[#3D5270] leading-relaxed">{s.suggestion}</p>
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
            </div>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate">
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 mb-4">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <Select value={selectedResume} onValueChange={(v) => setSelectedResume(v ?? '')}>
                <SelectTrigger className="h-8 text-xs w-56">
                  <SelectValue placeholder="选择简历" />
                </SelectTrigger>
                <SelectContent>
                  {resumes.map(r => <SelectItem key={r.id} value={r.id}>{r.fileName}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={generateResume} disabled={!selectedResume || genLoading}
                className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
                <FileText className="w-3 h-3" />
                {genLoading ? '生成中…' : '一键生成定制简历'}
              </Button>
            </div>
            <p className="text-[10px] text-[#9DAFC0]">AI 将基于原简历已有事实优化表达，不会编造任何经历或数据</p>
          </div>

          {genLoading && <AILoadingCard steps={GEN_STEPS} currentStep={genStep} />}

          {!genLoading && tailoredText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-semibold text-[#1E2A3A]">定制简历预览</h3>
                </div>
                {docxB64 && (
                  <Button size="sm" onClick={downloadDocx} className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    <Download className="w-3 h-3" />下载 Word 文件
                  </Button>
                )}
              </div>
              <div className="bg-white border border-[#E1EAF5] rounded-xl p-6 shadow-sm">
                <ResumeRenderer text={tailoredText} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Raw Tab */}
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

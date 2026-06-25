'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Save, AlertTriangle, CheckCircle } from 'lucide-react'
import { CompanyType, JobType, Location } from '@/types'

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
  applyMethod: string
  tags: string[]
  jdText: string
  completenessScore: number
  credibilityNote: string
  isMock?: boolean
  sourceUrl?: string
}

export default function ImportPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [postDate, setPostDate] = useState(new Date().toISOString().split('T')[0])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsed, setParsed] = useState<ParseResult | null>(null)
  const [error, setError] = useState('')

  const handleParse = async () => {
    if (!rawText.trim()) { setError('请填写帖子正文'); return }
    setParsing(true); setError(''); setParsed(null)
    try {
      const res = await fetch('/api/parse-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sourceUrl, rawText, postDate }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setParsed({ ...data, sourceUrl })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI 解析失败，请重试')
    }
    setParsing(false)
  }

  const handleSave = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parsed,
          rawText,
          postDate,
          sourcePlatform: '小红书',
        }),
      })
      if (!res.ok) throw new Error('保存失败')
      router.push('/jobs')
    } catch {
      setError('保存失败，请重试')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">导入招聘帖</h1>
        <p className="text-xs text-[#9DAFC0] mt-0.5">粘贴小红书招聘帖内容，AI 自动解析结构化信息</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#1E2A3A]">帖子信息</h2>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">帖子标题</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="小红书帖子标题" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">小红书链接</Label>
              <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://www.xiaohongshu.com/explore/..." className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">发布时间</Label>
              <Input type="date" value={postDate} onChange={e => setPostDate(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#7A95B0]">帖子正文 <span className="text-red-400">*</span></Label>
              <Textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder="将小红书帖子正文粘贴到这里…&#10;&#10;例如：&#10;【公司名 | 岗位名 | 城市】&#10;&#10;岗位职责：&#10;1. ...&#10;2. ...&#10;&#10;任职要求：&#10;1. ...&#10;&#10;投递方式：发送简历至 xxx@company.com"
                className="min-h-[280px] text-sm resize-none"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />{error}
              </div>
            )}
            <Button onClick={handleParse} disabled={parsing || !rawText.trim()} className="w-full gap-2 bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Sparkles className="w-4 h-4" />
              {parsing ? 'AI 解析中…' : 'AI 解析招聘帖'}
            </Button>
          </div>
        </div>

        {/* Result Panel */}
        <div>
          {!parsed ? (
            <div className="bg-white border border-dashed border-[#C8D8F0] rounded-xl p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Sparkles className="w-8 h-8 text-[#BFDBFE] mb-3" />
              <p className="text-sm text-[#7A95B0]">填写帖子内容后，点击「AI 解析」</p>
              <p className="text-xs text-[#9DAFC0] mt-1">系统将自动提取岗位信息并结构化</p>
            </div>
          ) : (
            <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1E2A3A]">解析结果</h2>
                <div className="flex items-center gap-2">
                  {parsed.isMock && (
                    <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">Mock模式</Badge>
                  )}
                  {parsed.isJobPost ? (
                    <Badge variant="outline" className="text-[10px] bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]">
                      <CheckCircle className="w-3 h-3 mr-1" />识别为招聘帖
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                      <AlertTriangle className="w-3 h-3 mr-1" />非招聘帖
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">岗位名称</Label>
                  <Input value={parsed.title} onChange={e => setParsed({ ...parsed, title: e.target.value })} className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">公司名称</Label>
                  <Input value={parsed.company} onChange={e => setParsed({ ...parsed, company: e.target.value })} className="h-7 text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">公司类型</Label>
                  <Select value={parsed.companyType} onValueChange={v => setParsed({ ...parsed, companyType: v as CompanyType })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['AI初创', '互联网大厂', 'AI应用公司', '其他'] as CompanyType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">岗位方向</Label>
                  <Select value={parsed.jobType} onValueChange={v => setParsed({ ...parsed, jobType: v as JobType })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['AI产品', 'Agent产品', '数据分析', '运营', '算法', 'Vibe Coding', '设计', '其他'] as JobType[]).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">地点</Label>
                  <Select value={parsed.location} onValueChange={v => setParsed({ ...parsed, location: v as Location })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['北京', '上海', '深圳', '杭州', '远程', '其他'] as Location[]).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">完整度</Label>
                  <div className="h-7 flex items-center">
                    <span className={`text-xs font-semibold ${parsed.completenessScore >= 80 ? 'text-emerald-600' : parsed.completenessScore >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                      {parsed.completenessScore}分
                    </span>
                  </div>
                </div>
              </div>

              {parsed.jdText && (
                <div className="space-y-1">
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">JD摘要</Label>
                  <Textarea value={parsed.jdText} onChange={e => setParsed({ ...parsed, jdText: e.target.value })} className="text-xs h-16 resize-none" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">职责（{parsed.responsibilities.length}条）</Label>
                  <ul className="mt-1 space-y-1">
                    {parsed.responsibilities.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-[10px] text-[#3D5270] flex gap-1"><span className="text-[#2563EB]">•</span>{r}</li>
                    ))}
                    {parsed.responsibilities.length > 3 && <li className="text-[10px] text-[#9DAFC0]">+{parsed.responsibilities.length - 3} 更多</li>}
                  </ul>
                </div>
                <div>
                  <Label className="text-[10px] text-[#7A95B0] uppercase tracking-wide">要求（{parsed.requirements.length}条）</Label>
                  <ul className="mt-1 space-y-1">
                    {parsed.requirements.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-[10px] text-[#3D5270] flex gap-1"><span className="text-[#2563EB]">•</span>{r}</li>
                    ))}
                    {parsed.requirements.length > 3 && <li className="text-[10px] text-[#9DAFC0]">+{parsed.requirements.length - 3} 更多</li>}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {parsed.tags.map(t => (
                  <Badge key={t} variant="outline" className="text-[10px] bg-[#EFF6FF] text-[#3D5270] border-[#BFDBFE]">{t}</Badge>
                ))}
              </div>

              {parsed.credibilityNote && (
                <p className="text-[10px] text-[#7A95B0] bg-[#F5F8FD] px-3 py-2 rounded-lg leading-relaxed">{parsed.credibilityNote}</p>
              )}

              <Button onClick={handleSave} disabled={saving || !parsed.isJobPost} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4" />
                {saving ? '保存中…' : '保存到岗位列表'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

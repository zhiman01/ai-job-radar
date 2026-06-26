'use client'

import { useCallback, useEffect, useState } from 'react'
import { Resume } from '@/types'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CalendarDays, ChevronDown, ChevronUp, Info, Trash2 } from 'lucide-react'

// ── LocalStorage helpers ─────────────────────────────────────────────────────

const CACHE_KEY = 'ai-job-radar-resumes'
const CACHE_VERSION_KEY = 'ai-job-radar-resumes-v'
const CACHE_VERSION = '3'          // bump to auto-clear stale/contaminated data
const DEMO_ID = 'demo-resume-001'

const DEMO_FINGERPRINTS = [
  '北京师范大学', '百度在线网络技术', 'AI健康助手', '量药采医',
  '新加坡国立大学校外合作课题',
]

function isContaminated(resume: Resume): boolean {
  if (resume.source !== 'uploaded') return false
  const allParsed = [
    ...(resume.parsedJson.education ?? []),
    ...(resume.parsedJson.experience ?? []),
    ...(resume.parsedJson.projects ?? []),
    ...(resume.parsedJson.skills ?? []),
  ].join('\n')
  return DEMO_FINGERPRINTS.some(fp => allParsed.includes(fp))
}

function sanitize(resume: Resume): Resume {
  if (!isContaminated(resume)) return resume
  console.warn('[resume-cache] contaminated parsedSections stripped from', resume.id)
  return { ...resume, parsedJson: { raw: resume.parsedJson.raw } }
}

function loadCached(): Resume[] {
  try {
    if (localStorage.getItem(CACHE_VERSION_KEY) !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY)
      localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
      return []
    }
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed: Resume[] = JSON.parse(raw)
    return parsed.map(sanitize)
  } catch { return [] }
}

function saveToCache(resume: Resume) {
  try {
    const sanitized = sanitize(resume)
    const existing = loadCached().filter(r => r.id !== sanitized.id)
    localStorage.setItem(CACHE_KEY, JSON.stringify([sanitized, ...existing]))
  } catch { /* ignore storage quota errors */ }
}

function clearCache() {
  localStorage.removeItem(CACHE_KEY)
  localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION)
}

// ── ResumeCard ───────────────────────────────────────────────────────────────

function ResumeCard({ resume }: { resume: Resume }) {
  const [expanded, setExpanded] = useState(false)
  const rawText = resume.originalText || ''
  const textLength = rawText.length
  const rawTextPreview = rawText.slice(0, 80)
  const contaminated = isContaminated(resume)
  const allSectionsEmpty =
    !resume.parsedJson.education?.length &&
    !resume.parsedJson.experience?.length &&
    !resume.parsedJson.projects?.length &&
    !resume.parsedJson.skills?.length

  // Validation log (visible in devtools)
  useEffect(() => {
    const hasDemoKeyword = DEMO_FINGERPRINTS.some(fp => rawText.includes(fp))
    console.log('[resume-validate]', {
      resumeId: resume.id,
      source: resume.source,
      fileName: resume.fileName,
      textLength,
      rawTextPreview: rawText.slice(0, 100),
      rawTextContainsDemoKeyword: hasDemoKeyword,
      parsedSectionsEmpty: allSectionsEmpty,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-[#1E2A3A]">{resume.fileName}</p>
              {resume.source === 'uploaded' && (
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full">已上传</span>
              )}
            </div>
            <p className="text-xs text-[#9DAFC0] flex items-center gap-1 mt-0.5">
              <CalendarDays className="w-3 h-3" />
              上传于 {new Date(resume.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#7A95B0] hover:text-[#2563EB] flex items-center gap-1 transition-colors">
          {expanded ? <><ChevronUp className="w-4 h-4" />收起</> : <><ChevronDown className="w-4 h-4" />查看解析</>}
        </button>
      </div>

      {/* Debug info */}
      <div className="flex flex-wrap gap-x-3 text-[10px] text-[#B0BFCE] mb-2 font-mono">
        <span>id: {resume.id.slice(0, 8)}…</span>
        <span>·</span>
        <span>{textLength} 字符</span>
        {rawTextPreview && <><span>·</span><span className="truncate max-w-[260px]" title={rawTextPreview}>预览: {rawTextPreview.slice(0, 36)}…</span></>}
      </div>

      {expanded && (
        <div className="space-y-3 pt-3 border-t border-[#E8EFF8]">

          {contaminated && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              检测到演示数据污染（旧缓存），章节结构已清空，匹配将使用下方原始文本。请点击「清空简历缓存」后重新上传。
            </div>
          )}

          {!contaminated && allSectionsEmpty && textLength > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg">
              未识别到标准章节标题（常见于两栏式 Word 简历），章节结构为空，但原始文本已完整提取（{textLength} 字符），匹配分析和生成简历将以原始文本为主要依据。
            </div>
          )}

          {!contaminated && resume.parsedJson.education && resume.parsedJson.education.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">教育经历</p>
              {resume.parsedJson.education.map((l, i) => <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>)}
            </div>
          )}
          {!contaminated && resume.parsedJson.experience && resume.parsedJson.experience.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">实习经历</p>
              {resume.parsedJson.experience.map((l, i) => <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>)}
            </div>
          )}
          {!contaminated && resume.parsedJson.projects && resume.parsedJson.projects.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">项目经历</p>
              {resume.parsedJson.projects.map((l, i) => <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>)}
            </div>
          )}
          {!contaminated && resume.parsedJson.skills && resume.parsedJson.skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">技能</p>
              {resume.parsedJson.skills.map((l, i) => <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>)}
            </div>
          )}

          <div>
            <p className="text-[10px] font-bold text-[#9DAFC0] uppercase tracking-widest mb-1.5">原始文本（匹配主要依据）</p>
            <pre className="text-[10px] text-[#7A95B0] whitespace-pre-wrap leading-relaxed bg-[#F5F8FD] p-3 rounded-lg max-h-64 overflow-y-auto font-sans">
              {resume.originalText}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch('/api/resume')
      if (!res.ok) return
      // Filter out demo resume — it's only needed in job-detail page
      const serverResumes: Resume[] = (await res.json()).filter((r: Resume) => r.id !== DEMO_ID)
      const cached = loadCached()
      const serverIds = new Set(serverResumes.map(r => r.id))
      const cachedOnly = cached.filter(r => !serverIds.has(r.id))
      setResumes([...serverResumes, ...cachedOnly])
    } catch {
      setResumes(loadCached())
    }
  }, [])

  useEffect(() => {
    const cached = loadCached()
    if (cached.length > 0) setResumes(cached)
    fetchResumes()
  }, [fetchResumes])

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      setError('仅支持 .docx 或 .pdf 格式'); return
    }
    setUploading(true); setError('')
    const form = new FormData(); form.append('file', file)
    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: form })
      const data: Resume = await res.json()
      if (!res.ok) throw new Error((data as unknown as { error: string }).error)
      const clean = sanitize(data)
      setResumes(prev => [clean, ...prev.filter(r => r.id !== clean.id)])
      saveToCache(clean)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败')
    }
    setUploading(false)
  }

  const handleReset = async () => {
    clearCache()
    await fetch('/api/reset', { method: 'POST' })
    setResumes([])
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">简历管理</h1>
          <p className="text-xs text-[#9DAFC0] mt-0.5">上传简历，系统自动解析并用于岗位匹配与定制生成</p>
        </div>
        {resumes.length > 0 && (
          <button onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-[#9DAFC0] hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />清空简历缓存
          </button>
        )}
      </div>

      <div className="flex items-start gap-2 bg-[#F0F7FF] border border-[#BFDBFE] rounded-xl px-4 py-3 mb-4 text-xs text-[#1D4ED8]">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>原始文本是匹配分析和生成简历的主要依据。章节结构化基于标题关键词识别，两栏式 Word 简历可能章节为空，但不影响基于全文进行匹配。</span>
      </div>

      <label
        className={`block mb-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-50' : 'border-[#C8D8F0] bg-white hover:border-blue-300 hover:bg-[#F5F8FD]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".docx,.pdf" onChange={handleFileInput} className="hidden" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
            <Upload className={`w-5 h-5 ${uploading ? 'text-blue-400 animate-bounce' : 'text-[#2563EB]'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1E2A3A]">{uploading ? '解析中，请稍候…' : '点击或拖拽上传简历'}</p>
            <p className="text-xs text-[#9DAFC0] mt-1">支持 .docx 和 .pdf 格式</p>
          </div>
        </div>
      </label>

      {error && (
        <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 px-4 py-2.5 rounded-lg">{error}</div>
      )}

      {resumes.length === 0 ? (
        <div className="text-center py-12 text-[#9DAFC0]">
          <FileText className="w-8 h-8 mx-auto mb-3 text-[#C8D8F0]" />
          <p className="text-sm">还没有上传过简历</p>
          <p className="text-xs mt-1">上传后可在岗位详情页生成匹配分析和定制简历</p>
        </div>
      ) : (
        <div className="space-y-3">
          {resumes.map(r => <ResumeCard key={r.id} resume={r} />)}
        </div>
      )}
    </div>
  )
}

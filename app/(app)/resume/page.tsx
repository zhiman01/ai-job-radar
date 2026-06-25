'use client'

import { useCallback, useEffect, useState } from 'react'
import { Resume } from '@/types'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'

function ResumeCard({ resume }: { resume: Resume }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#EFF6FF] rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1E2A3A]">{resume.fileName}</p>
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

      {expanded && (
        <div className="space-y-3 pt-3 border-t border-[#E8EFF8]">
          {resume.parsedJson.education && resume.parsedJson.education.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">教育经历</p>
              {resume.parsedJson.education.map((l, i) => (
                <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>
              ))}
            </div>
          )}
          {resume.parsedJson.experience && resume.parsedJson.experience.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">实习经历</p>
              {resume.parsedJson.experience.map((l, i) => (
                <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>
              ))}
            </div>
          )}
          {resume.parsedJson.projects && resume.parsedJson.projects.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">项目经历</p>
              {resume.parsedJson.projects.map((l, i) => (
                <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>
              ))}
            </div>
          )}
          {resume.parsedJson.skills && resume.parsedJson.skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#2563EB] uppercase tracking-widest mb-1.5">技能</p>
              {resume.parsedJson.skills.map((l, i) => (
                <p key={i} className="text-xs text-[#3D5270] leading-relaxed">{l}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold text-[#9DAFC0] uppercase tracking-widest mb-1.5">原始文本</p>
            <pre className="text-[10px] text-[#7A95B0] whitespace-pre-wrap leading-relaxed bg-[#F5F8FD] p-3 rounded-lg max-h-64 overflow-y-auto font-sans">
              {resume.originalText}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')

  const fetchResumes = useCallback(async () => {
    const res = await fetch('/api/resume')
    setResumes(await res.json())
  }, [])

  useEffect(() => { fetchResumes() }, [fetchResumes])

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith('.docx')) { setError('仅支持 .docx 格式'); return }
    setUploading(true); setError('')
    const form = new FormData(); form.append('file', file)
    try {
      const res = await fetch('/api/resume/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResumes(prev => [data, ...prev])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败')
    }
    setUploading(false)
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">简历管理</h1>
        <p className="text-xs text-[#9DAFC0] mt-0.5">上传 Word 简历，系统自动解析结构化内容</p>
      </div>

      <label
        className={`block mb-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-[#C8D8F0] bg-white hover:border-blue-300 hover:bg-[#F5F8FD]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".docx" onChange={handleFileInput} className="hidden" />
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-[#EFF6FF] rounded-full flex items-center justify-center">
            <Upload className={`w-5 h-5 ${uploading ? 'text-blue-400 animate-bounce' : 'text-[#2563EB]'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1E2A3A]">
              {uploading ? '解析中，请稍候…' : '点击或拖拽上传 Word 简历'}
            </p>
            <p className="text-xs text-[#9DAFC0] mt-1">仅支持 .docx 格式</p>
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
          {resumes.map((r) => <ResumeCard key={r.id} resume={r} />)}
        </div>
      )}
    </div>
  )
}

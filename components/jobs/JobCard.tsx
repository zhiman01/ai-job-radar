'use client'

import Link from 'next/link'
import { Job, JobStatus } from '@/types'
import { StatusBadge } from './StatusBadge'
import { MatchScore } from './MatchScore'
import { MapPin, CalendarDays, ExternalLink, Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const companyTypeColor: Record<string, string> = {
  'AI初创':    'bg-blue-50 text-blue-700 border-blue-200',
  '互联网大厂': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'AI应用公司': 'bg-sky-50 text-sky-700 border-sky-200',
  '其他':      'bg-[#E8EFF8] text-[#7A95B0] border-[#C8D8F0]',
}

const jobTypeColor: Record<string, string> = {
  'AI产品':     'bg-blue-50 text-blue-700',
  'Agent产品':  'bg-indigo-50 text-indigo-700',
  '数据分析':   'bg-sky-50 text-sky-700',
  '运营':       'bg-teal-50 text-teal-700',
  '算法':       'bg-violet-50 text-violet-700',
  'Vibe Coding':'bg-emerald-50 text-emerald-700',
  '设计':       'bg-pink-50 text-pink-700',
  '其他':       'bg-[#E8EFF8] text-[#7A95B0]',
}

interface Props {
  job: Job
  onStatusChange?: (id: string, status: JobStatus) => void
}

const ALL_STATUSES: JobStatus[] = [
  '待查看', '已收藏', '待改简历', '已生成简历', '已投递', '面试中', 'Offer', '已拒绝', '已放弃'
]

export function JobCard({ job, onStatusChange }: Props) {
  const isRecent = () => {
    const postDate = new Date(job.postDate)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return postDate >= weekAgo
  }

  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-5 hover:border-[#93C5FD] hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link href={`/jobs/${job.id}`} className="text-sm font-semibold text-[#1E2A3A] hover:text-[#2563EB] transition-colors truncate">
              {job.title}
            </Link>
            {isRecent() && (
              <span className="text-[10px] font-medium bg-[#2563EB] text-white px-1.5 py-0.5 rounded-full flex-shrink-0">NEW</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#7A95B0]">
            <Building2 className="w-3 h-3" />
            <span className="font-medium text-[#3D5270]">{job.company}</span>
            <span className="text-[#C8D8F0]">·</span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${companyTypeColor[job.companyType] || companyTypeColor['其他']}`}>
              {job.companyType}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <MatchScore score={job.matchScore} />
          <StatusBadge status={job.status} />
        </div>
      </div>

      {job.jdText && (
        <p className="text-xs text-[#7A95B0] mb-3 line-clamp-2 leading-relaxed">{job.jdText}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-[#9DAFC0] mb-3">
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${jobTypeColor[job.jobType] || jobTypeColor['其他']}`}>
          {job.jobType}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />{job.location}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />{job.postDate}
        </span>
      </div>

      {job.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {job.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] bg-[#EFF6FF] text-[#3D5270] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
              {tag}
            </span>
          ))}
          {job.tags.length > 4 && (
            <span className="text-[10px] text-[#9DAFC0]">+{job.tags.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-[#EFF6FF]">
        <select
          value={job.status}
          onChange={(e) => onStatusChange?.(job.id, e.target.value as JobStatus)}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-[#7A95B0] bg-transparent border-none outline-none cursor-pointer hover:text-[#3D5270]"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {job.sourceUrl && (
            <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-[#9DAFC0] hover:text-[#2563EB] flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="w-3 h-3" />原帖
            </a>
          )}
          <Link href={`/jobs/${job.id}`} className="text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors">
            详情 →
          </Link>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Job, JobStatus, CompanyType, JobType } from '@/types'
import { StatusBadge } from '@/components/jobs/StatusBadge'
import { MatchScore } from '@/components/jobs/MatchScore'
import Link from 'next/link'
import {
  Briefcase, Star, FileText, Send, Users, Award, XCircle,
  TrendingUp, Building2, Tag, Clock
} from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  iconBg: string
  sub?: string
}

function StatCard({ icon, label, value, iconBg, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#7A95B0] uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1E2A3A]">{value}</p>
      {sub && <p className="text-xs text-[#9DAFC0] mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#3D5270] w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-[#E8EFF8] rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#7A95B0] w-4 text-right">{value}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setJobs)
      .catch(() => {})
  }, [])

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  const recentJobs = jobs.filter(j => new Date(j.postDate) >= weekAgo)

  const countByStatus = (s: JobStatus) => jobs.filter(j => j.status === s).length
  const countByCompanyType = (t: CompanyType) => jobs.filter(j => j.companyType === t).length
  const countByJobType = (t: JobType) => jobs.filter(j => j.jobType === t).length

  const funnel: { label: string; count: number }[] = [
    { label: '总岗位', count: jobs.length },
    { label: '已收藏', count: countByStatus('已收藏') + countByStatus('待改简历') + countByStatus('已生成简历') + countByStatus('已投递') + countByStatus('面试中') + countByStatus('Offer') },
    { label: '已投递', count: countByStatus('已投递') + countByStatus('面试中') + countByStatus('Offer') },
    { label: '面试中', count: countByStatus('面试中') + countByStatus('Offer') },
    { label: 'Offer', count: countByStatus('Offer') },
  ]

  const recentUpdated = [...jobs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const companyTypes: CompanyType[] = ['AI初创', '互联网大厂', 'AI应用公司', '其他']
  const jobTypes: JobType[] = ['AI产品', 'Agent产品', '数据分析', '运营', 'Vibe Coding', '算法', '其他']
  const maxCompany = Math.max(...companyTypes.map(t => countByCompanyType(t)), 1)
  const maxJob = Math.max(...jobTypes.map(t => countByJobType(t)), 1)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">投递看板</h1>
        <p className="text-xs text-[#9DAFC0] mt-0.5">总览求职进度</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard icon={<Briefcase className="w-4 h-4 text-[#3D5270]" />} label="总岗位" value={jobs.length} iconBg="bg-[#E8EFF8]" sub={`本周新增 ${recentJobs.length} 条`} />
        <StatCard icon={<Star className="w-4 h-4 text-amber-600" />} label="已收藏" value={countByStatus('已收藏')} iconBg="bg-amber-50" />
        <StatCard icon={<FileText className="w-4 h-4 text-indigo-600" />} label="已生成简历" value={countByStatus('已生成简历')} iconBg="bg-indigo-50" />
        <StatCard icon={<Send className="w-4 h-4 text-[#2563EB]" />} label="已投递" value={countByStatus('已投递')} iconBg="bg-[#EFF6FF]" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard icon={<Users className="w-4 h-4 text-emerald-600" />} label="面试中" value={countByStatus('面试中')} iconBg="bg-emerald-50" />
        <StatCard icon={<Award className="w-4 h-4 text-emerald-600" />} label="Offer" value={countByStatus('Offer')} iconBg="bg-emerald-50" />
        <StatCard icon={<XCircle className="w-4 h-4 text-[#9DAFC0]" />} label="已拒绝" value={countByStatus('已拒绝')} iconBg="bg-[#E8EFF8]" />
        <StatCard icon={<TrendingUp className="w-4 h-4 text-[#2563EB]" />} label="待查看" value={countByStatus('待查看')} iconBg="bg-[#EFF6FF]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />投递漏斗
          </h3>
          <div className="space-y-3">
            {funnel.map((f, i) => (
              <div key={f.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[#3D5270]">{f.label}</span>
                  <span className="font-semibold text-[#1E2A3A]">{f.count}</span>
                </div>
                <div className="bg-[#E8EFF8] rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-[#2563EB] transition-all"
                    style={{ width: `${jobs.length > 0 ? (f.count / jobs.length) * 100 : 0}%`, opacity: 1 - i * 0.12 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2563EB]" />公司类型分布
          </h3>
          <div className="space-y-2.5">
            {companyTypes.map((t, i) => (
              <MiniBar key={t} label={t} value={countByCompanyType(t)} max={maxCompany}
                color={['bg-[#2563EB]', 'bg-[#1B3A6B]', 'bg-[#7A95B0]', 'bg-[#C8D8F0]'][i]} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2563EB]" />岗位方向分布
          </h3>
          <div className="space-y-2.5">
            {jobTypes.map((t, i) => (
              <MiniBar key={t} label={t} value={countByJobType(t)} max={maxJob}
                color={['bg-[#2563EB]', 'bg-indigo-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-violet-500', 'bg-[#C8D8F0]'][i]} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2563EB]" />最近更新
        </h3>
        {recentUpdated.length === 0 ? (
          <p className="text-xs text-[#9DAFC0] text-center py-4">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {recentUpdated.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F8FD] transition-colors group">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#1E2A3A] group-hover:text-[#2563EB] transition-colors truncate">{job.title}</p>
                  <p className="text-xs text-[#9DAFC0] truncate">{job.company} · {new Date(job.updatedAt).toLocaleDateString('zh-CN')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <MatchScore score={job.matchScore} />
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

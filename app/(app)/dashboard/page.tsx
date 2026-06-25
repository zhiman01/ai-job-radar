'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Job, JobStatus, CompanyType, JobType } from '@/types'
import { StatusBadge } from '@/components/jobs/StatusBadge'
import { MatchScore } from '@/components/jobs/MatchScore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Briefcase, Star, FileText, Send, Users, Award, XCircle,
  TrendingUp, Building2, Tag, Clock, ExternalLink, Sparkles,
} from 'lucide-react'

// ─── Types

type TimeRange = 'all' | 'week' | 'month'

const ALL_STATUSES: JobStatus[] = [
  '待查看', '已收藏', '待改简历', '已生成简历', '已投递', '面试中', 'Offer', '已拒绝', '已放弃',
]

// ─── Sub-components

function StatCard({
  icon, label, value, iconBg, sub,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  iconBg: string
  sub?: string
}) {
  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#7A95B0] uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1E2A3A] tabular-nums">{value}</p>
      {sub && <p className="text-xs text-[#9DAFC0] mt-1">{sub}</p>}
    </div>
  )
}

function MiniBar({
  label, value, max, color,
}: {
  label: string; value: number; max: number; color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#3D5270] w-20 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-[#E8EFF8] rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-[#7A95B0] w-4 text-right tabular-nums">{value}</span>
    </div>
  )
}

function FunnelRow({
  label, count, total, rate, rateLabel,
}: {
  label: string; count: number; total: number; rate?: string; rateLabel?: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-[#3D5270] w-[72px] flex-shrink-0">{label}</span>
        <span className="text-xs font-semibold text-[#1E2A3A] tabular-nums w-5">{count}</span>
        {rate && (
          <span className="text-[10px] text-[#9DAFC0]">
            {rateLabel && <span className="mr-0.5">{rateLabel}</span>}
            <span className={rate === '--' ? '' : 'text-[#2563EB] font-medium'}>{rate}</span>
          </span>
        )}
      </div>
      <div className="bg-[#E8EFF8] rounded-full h-2">
        <div
          className="h-2 rounded-full bg-[#2563EB] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Page

export default function DashboardPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('all')

  useEffect(() => {
    fetch('/api/jobs')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setJobs)
      .catch(() => {})
  }, [])

  const patchJobStatus = async (jobId: string, status: JobStatus) => {
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
    setJobs(prev =>
      prev.map(j => j.id === jobId ? { ...j, status, updatedAt: new Date().toISOString() } : j),
    )
  }

  // ── Time filter
  const filtered = jobs.filter(j => {
    if (timeRange === 'all') return true
    const created = new Date(j.createdAt)
    const now = new Date()
    if (timeRange === 'week') {
      const cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); return created >= cutoff
    }
    const cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 1); return created >= cutoff
  })

  const total = filtered.length
  const count = (s: JobStatus) => filtered.filter(j => j.status === s).length
  const generatedCount = filtered.filter(j => j.hasGeneratedResume || j.status === '已生成简历').length

  // ── Funnel values (status distribution — each job counted once by current status)
  const starred    = count('已收藏')
  const generated  = generatedCount
  const applied    = count('已投递')
  const interviews = count('面试中')
  const offers     = count('Offer')

  const rate = (n: number, d: number) =>
    d === 0 ? '--' : `${Math.round((n / d) * 100)}%`

  // ── Distribution breakdowns
  const companyTypes: CompanyType[] = ['AI初创', '互联网大厂', 'AI应用公司', '其他']
  const jobTypes: JobType[] = ['AI产品', 'Agent产品', '数据分析', '运营', 'Vibe Coding', '算法', '其他']
  const maxCompany = Math.max(...companyTypes.map(t => filtered.filter(j => j.companyType === t).length), 1)
  const maxJob     = Math.max(...jobTypes.map(t => filtered.filter(j => j.jobType === t).length), 1)

  // ── Recent updated
  const recentUpdated = [...filtered]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)

  // ── New this week (for sub-label on total card)
  const weekCutoff = new Date(); weekCutoff.setDate(weekCutoff.getDate() - 7)
  const weekNew = jobs.filter(j => new Date(j.createdAt) >= weekCutoff).length

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">投递看板</h1>
          <p className="text-xs text-[#9DAFC0] mt-0.5">总览求职进度</p>
        </div>
        {/* Time filter */}
        <div className="flex items-center gap-1 bg-[#F0F4FA] rounded-lg p-1 flex-shrink-0">
          {(['all', 'week', 'month'] as TimeRange[]).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`h-7 px-3 text-xs rounded-md transition-all ${
                timeRange === r
                  ? 'bg-white text-[#1E2A3A] font-medium shadow-sm'
                  : 'text-[#7A95B0] hover:text-[#3D5270]'
              }`}
            >
              {r === 'all' ? '全部' : r === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <StatCard
          icon={<Briefcase className="w-4 h-4 text-[#3D5270]" />}
          label="总岗位" value={total} iconBg="bg-[#E8EFF8]"
          sub={timeRange === 'all' ? `本周新增 ${weekNew} 条` : undefined}
        />
        <StatCard
          icon={<Star className="w-4 h-4 text-amber-600" />}
          label="已收藏" value={starred} iconBg="bg-amber-50"
          sub={`收藏率 ${rate(starred, total)}`}
        />
        <StatCard
          icon={<FileText className="w-4 h-4 text-indigo-600" />}
          label="已生成简历" value={generated} iconBg="bg-indigo-50"
          sub={`生成率 ${rate(generated, total)}`}
        />
        <StatCard
          icon={<Send className="w-4 h-4 text-[#2563EB]" />}
          label="已投递" value={applied} iconBg="bg-[#EFF6FF]"
          sub={`投递率 ${rate(applied, total)}`}
        />
      </div>

      {/* Stat cards row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard
          icon={<Users className="w-4 h-4 text-emerald-600" />}
          label="面试中" value={interviews} iconBg="bg-emerald-50"
          sub={`面试转化率 ${rate(interviews, applied)}`}
        />
        <StatCard
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          label="Offer" value={offers} iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<XCircle className="w-4 h-4 text-[#9DAFC0]" />}
          label="已拒绝" value={count('已拒绝')} iconBg="bg-[#E8EFF8]"
        />
        <StatCard
          icon={<TrendingUp className="w-4 h-4 text-[#2563EB]" />}
          label="待查看" value={count('待查看')} iconBg="bg-[#EFF6FF]"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Funnel */}
        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />投递漏斗
          </h3>
          <div className="space-y-3.5">
            <FunnelRow label="总岗位" count={total} total={total} />
            <FunnelRow
              label="已收藏" count={starred} total={total}
              rate={rate(starred, total)} rateLabel="收藏率"
            />
            <FunnelRow
              label="已生成简历" count={generated} total={total}
              rate={rate(generated, total)} rateLabel="生成率"
            />
            <FunnelRow
              label="已投递" count={applied} total={total}
              rate={rate(applied, total)} rateLabel="投递率"
            />
            <FunnelRow
              label="面试中" count={interviews} total={total}
              rate={rate(interviews, applied)} rateLabel="面试率↑"
            />
            <FunnelRow
              label="Offer" count={offers} total={total}
              rate={rate(offers, interviews)} rateLabel="Offer率↑"
            />
          </div>
          <p className="text-[10px] text-[#B8CBDF] mt-4">
            面试率/Offer率 = 下一阶段 ÷ 上一阶段
          </p>
        </div>

        {/* Company type */}
        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#2563EB]" />公司类型分布
          </h3>
          <div className="space-y-2.5">
            {companyTypes.map((t, i) => (
              <MiniBar
                key={t} label={t}
                value={filtered.filter(j => j.companyType === t).length}
                max={maxCompany}
                color={['bg-[#2563EB]', 'bg-[#1B3A6B]', 'bg-[#7A95B0]', 'bg-[#C8D8F0]'][i]}
              />
            ))}
          </div>
        </div>

        {/* Job type */}
        <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#2563EB]" />岗位方向分布
          </h3>
          <div className="space-y-2.5">
            {jobTypes.map((t, i) => (
              <MiniBar
                key={t} label={t}
                value={filtered.filter(j => j.jobType === t).length}
                max={maxJob}
                color={['bg-[#2563EB]', 'bg-indigo-500', 'bg-sky-500', 'bg-teal-500', 'bg-emerald-500', 'bg-violet-500', 'bg-[#C8D8F0]'][i]}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent updated */}
      <div className="bg-white border border-[#E1EAF5] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#1E2A3A] mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#2563EB]" />最近更新
        </h3>
        {recentUpdated.length === 0 ? (
          <p className="text-xs text-[#9DAFC0] text-center py-6">暂无数据</p>
        ) : (
          <div className="space-y-1">
            {recentUpdated.map(job => (
              <div
                key={job.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#F5F8FD] transition-colors group"
              >
                {/* Job info — clickable to navigate */}
                <button
                  onClick={() => router.push(`/jobs/${job.id}`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm font-medium text-[#1E2A3A] group-hover:text-[#2563EB] transition-colors truncate">
                    {job.title}
                  </p>
                  <p className="text-xs text-[#9DAFC0] truncate">
                    {job.company} · {new Date(job.updatedAt).toLocaleDateString('zh-CN')}
                  </p>
                </button>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <MatchScore score={job.matchScore} />
                  <StatusBadge status={job.status} />
                </div>

                {/* Quick actions */}
                <div
                  className="flex items-center gap-0.5 flex-shrink-0 border-l border-[#E8EFF8] pl-2 ml-1"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    title="查看详情"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="p-1.5 rounded hover:bg-[#E8EFF8] text-[#C8D8F0] hover:text-[#2563EB] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="生成简历"
                    onClick={() => router.push(`/jobs/${job.id}?tab=generate`)}
                    className="p-1.5 rounded hover:bg-[#E8EFF8] text-[#C8D8F0] hover:text-indigo-500 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  {!['已投递', '面试中', 'Offer'].includes(job.status) && (
                    <button
                      title="标记已投递"
                      onClick={() => patchJobStatus(job.id, '已投递')}
                      className="p-1.5 rounded hover:bg-[#E8EFF8] text-[#C8D8F0] hover:text-emerald-600 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <Select
                    value={job.status}
                    onValueChange={v => patchJobStatus(job.id, v as JobStatus)}
                  >
                    <SelectTrigger className="h-6 w-[88px] text-[10px] border-[#E1EAF5] bg-white flex-shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

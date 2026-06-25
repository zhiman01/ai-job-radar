'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CompanyType, JobType, JobStatus, Location } from '@/types'

export interface FilterState {
  companyType: string
  jobType: string
  location: string
  status: string
  recentOnly: boolean
  minScore: number
}

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
  total: number
  filtered: number
}

export function JobFilters({ filters, onChange, total, filtered }: Props) {
  const set = (key: keyof FilterState, value: string | boolean | number | null) =>
    onChange({ ...filters, [key]: value ?? '' })

  return (
    <div className="bg-white border border-[#E1EAF5] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-[#1E2A3A]">筛选</span>
        <span className="text-xs text-[#9DAFC0]">
          共 {total} 条，显示 {filtered} 条
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={filters.companyType} onValueChange={(v) => set('companyType', v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="公司类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {(['AI初创', '互联网大厂', 'AI应用公司', '其他'] as CompanyType[]).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.jobType} onValueChange={(v) => set('jobType', v)}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="岗位方向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部方向</SelectItem>
            {(['AI产品', 'Agent产品', '数据分析', '运营', '算法', 'Vibe Coding', '设计', '其他'] as JobType[]).map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.location} onValueChange={(v) => set('location', v)}>
          <SelectTrigger className="h-8 text-xs w-28">
            <SelectValue placeholder="地点" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部地点</SelectItem>
            {(['北京', '上海', '深圳', '杭州', '远程', '其他'] as Location[]).map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => set('status', v)}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="投递状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {(['待查看', '已收藏', '待改简历', '已生成简历', '已投递', '面试中', 'Offer', '已拒绝', '已放弃'] as JobStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.minScore.toString()} onValueChange={(v) => set('minScore', Number(v))}>
          <SelectTrigger className="h-8 text-xs w-32">
            <SelectValue placeholder="匹配度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">全部匹配度</SelectItem>
            <SelectItem value="60">60分以上</SelectItem>
            <SelectItem value="70">70分以上</SelectItem>
            <SelectItem value="80">80分以上</SelectItem>
            <SelectItem value="90">90分以上</SelectItem>
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-xs text-[#3D5270] cursor-pointer bg-[#F5F8FD] px-3 py-1.5 rounded-lg border border-[#E1EAF5] hover:bg-[#EFF6FF] transition-colors">
          <input
            type="checkbox"
            checked={filters.recentOnly}
            onChange={(e) => set('recentOnly', e.target.checked)}
            className="rounded accent-blue-600"
          />
          仅近一周
        </label>

        {(filters.companyType !== 'all' || filters.jobType !== 'all' || filters.location !== 'all' || filters.status !== 'all' || filters.recentOnly || filters.minScore > 0) && (
          <button
            onClick={() => onChange({ companyType: 'all', jobType: 'all', location: 'all', status: 'all', recentOnly: false, minScore: 0 })}
            className="text-xs text-[#2563EB] hover:text-[#1D4ED8] px-2 transition-colors"
          >
            重置
          </button>
        )}
      </div>
    </div>
  )
}

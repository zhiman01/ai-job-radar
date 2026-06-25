'use client'

import { useState, useEffect, useCallback } from 'react'
import { Job, JobStatus } from '@/types'
import { JobCard } from '@/components/jobs/JobCard'
import { JobFilters, FilterState } from '@/components/jobs/JobFilters'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const defaultFilters: FilterState = {
  companyType: 'all',
  jobType: 'all',
  location: 'all',
  status: 'all',
  recentOnly: false,
  minScore: 0,
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setJobs(data)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleReset = async () => {
    setResetting(true)
    try {
      await fetch('/api/reset', { method: 'POST' })
      await fetchJobs()
    } finally {
      setResetting(false)
    }
  }

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const filtered = jobs.filter((j) => {
    if (filters.companyType !== 'all' && j.companyType !== filters.companyType) return false
    if (filters.jobType !== 'all' && j.jobType !== filters.jobType) return false
    if (filters.location !== 'all' && j.location !== filters.location) return false
    if (filters.status !== 'all' && j.status !== filters.status) return false
    if (filters.minScore > 0 && (j.matchScore ?? 0) < filters.minScore) return false
    if (filters.recentOnly) {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      if (new Date(j.postDate) < weekAgo) return false
    }
    return true
  })

  const handleStatusChange = async (id: string, status: JobStatus) => {
    await fetch(`/api/jobs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setJobs((prev) => prev.map((j) => j.id === id ? { ...j, status } : j))
  }

  const highMatch = jobs.filter(j => (j.matchScore ?? 0) >= 80).length
  const interviewing = jobs.filter(j => j.status === '面试中' || j.status === 'Offer').length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-[#1E2A3A] tracking-wide">岗位列表</h1>
          <p className="text-xs text-[#9DAFC0] mt-0.5">小红书 AI / 互联网招聘帖聚合</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchJobs} className="h-8 text-xs gap-1.5">
            <RefreshCw className="w-3 h-3" />刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleReset} disabled={resetting} className="h-8 text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50">
            <RotateCcw className="w-3 h-3" />{resetting ? '重置中…' : '重置演示数据'}
          </Button>
          <Link href="/import">
            <Button size="sm" className="h-8 text-xs gap-1.5 bg-[#2563EB] hover:bg-[#1D4ED8]">
              <Plus className="w-3 h-3" />导入招聘帖
            </Button>
          </Link>
        </div>
      </div>

      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white border border-[#E1EAF5] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[#2563EB] text-sm font-bold">{jobs.length}</div>
            <div>
              <p className="text-xs font-medium text-[#1E2A3A]">岗位总数</p>
              <p className="text-[10px] text-[#9DAFC0]">已收录</p>
            </div>
          </div>
          <div className="bg-white border border-[#E1EAF5] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#EFF6FF] rounded-lg flex items-center justify-center text-[#1D4ED8] text-sm font-bold">{highMatch}</div>
            <div>
              <p className="text-xs font-medium text-[#1E2A3A]">高匹配</p>
              <p className="text-[10px] text-[#9DAFC0]">80分以上</p>
            </div>
          </div>
          <div className="bg-white border border-[#E1EAF5] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 text-sm font-bold">{interviewing}</div>
            <div>
              <p className="text-xs font-medium text-[#1E2A3A]">进行中</p>
              <p className="text-[10px] text-[#9DAFC0]">面试 / Offer</p>
            </div>
          </div>
        </div>
      )}

      <JobFilters filters={filters} onChange={setFilters} total={jobs.length} filtered={filtered.length} />

      {loading ? (
        <div className="text-center py-16 text-[#9DAFC0] text-sm">加载中…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#9DAFC0] text-sm mb-3">没有符合条件的岗位</p>
          <Button variant="outline" size="sm" onClick={() => setFilters(defaultFilters)} className="text-xs">
            清除筛选
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}

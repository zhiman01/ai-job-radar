import { Suspense } from 'react'
import JobDetailClient from './JobDetailClient'

export default function JobDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-[#9DAFC0] text-sm">加载中…</div>}>
      <JobDetailClient />
    </Suspense>
  )
}

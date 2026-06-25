import { Badge } from '@/components/ui/badge'
import { JobStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<JobStatus, { label: string; className: string }> = {
  待查看:    { label: '待查看',    className: 'bg-[#E8EFF8] text-[#7A95B0] border-[#C8D8F0]' },
  已收藏:    { label: '已收藏',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  待改简历:  { label: '待改简历',  className: 'bg-blue-50 text-blue-700 border-blue-200' },
  已生成简历:{ label: '已生成简历',className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  已投递:    { label: '已投递',    className: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]' },
  面试中:    { label: '面试中',    className: 'bg-[#2563EB] text-white border-[#2563EB]' },
  Offer:     { label: 'Offer 🎉', className: 'bg-emerald-500 text-white border-emerald-500' },
  已拒绝:    { label: '已拒绝',    className: 'bg-[#F8F8FA] text-[#9DAFC0] border-[#E1EAF5] line-through' },
  已放弃:    { label: '已放弃',    className: 'bg-[#F8F8FA] text-[#9DAFC0] border-[#E1EAF5]' },
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const cfg = statusConfig[status] || statusConfig['待查看']
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  )
}

import { cn } from '@/lib/utils'

export function MatchScore({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-xs text-[#9DAFC0]">未分析</span>
  }
  const color =
    score >= 85 ? 'text-[#1D4ED8]' :
    score >= 70 ? 'text-[#2563EB]' :
    score >= 55 ? 'text-amber-600' : 'text-[#9DAFC0]'
  const bg =
    score >= 85 ? 'bg-[#EFF6FF] border border-[#93C5FD]' :
    score >= 70 ? 'bg-[#EFF6FF] border border-[#BFDBFE]' :
    score >= 55 ? 'bg-amber-50 border border-amber-200' : 'bg-[#E8EFF8]'

  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', color, bg)}>
      {score}分
    </span>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Plus, FileText, LayoutDashboard, Radar } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/jobs', label: '岗位列表', icon: Briefcase },
  { href: '/import', label: '导入招聘帖', icon: Plus },
  { href: '/resume', label: '简历管理', icon: FileText },
  { href: '/dashboard', label: '投递看板', icon: LayoutDashboard },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-[#0F2544] flex flex-col z-40 border-r border-[#0A1D38]">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-[#0A1D38]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0">
            <Radar className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#DCE9F5] leading-tight tracking-wide">AI 岗位雷达</p>
            <p className="text-[10px] text-[#4D6E8A] leading-tight">招聘帖聚合助手</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
              path.startsWith(href)
                ? 'bg-[#2563EB] text-white font-medium'
                : 'text-[#7AA0C0] hover:bg-[#1A3358] hover:text-[#DCE9F5]'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#0A1D38]">
        <p className="text-[10px] text-[#3A5470] leading-relaxed">
          MVP · 数据仅存本地<br />不含真实爬虫
        </p>
      </div>
    </aside>
  )
}

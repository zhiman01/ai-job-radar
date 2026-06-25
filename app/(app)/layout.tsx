import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </>
  )
}

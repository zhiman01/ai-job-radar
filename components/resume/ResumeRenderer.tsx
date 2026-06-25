'use client'

interface Props {
  text: string
}

function parseLine(line: string, idx: number) {
  if (/^===.+===$/.test(line)) {
    const title = line.replace(/===/g, '').trim()
    return (
      <div key={idx} className="mt-5 mb-2 pb-1 border-b-2 border-blue-100">
        <span className="text-xs font-bold text-blue-700 tracking-widest uppercase">{title}</span>
      </div>
    )
  }
  if (line.startsWith('# ')) {
    return <h1 key={idx} className="text-lg font-bold text-[#1E2A3A] mt-4 mb-1">{line.replace(/^# /, '')}</h1>
  }
  if (line.startsWith('## ')) {
    return (
      <div key={idx} className="mt-4 mb-2 pb-1 border-b-2 border-blue-100">
        <span className="text-xs font-bold text-blue-700 tracking-widest uppercase">{line.replace(/^## /, '')}</span>
      </div>
    )
  }
  if (line.startsWith('💡') || line.startsWith('⚠️')) {
    return (
      <div key={idx} className="my-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
        <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
        <span className="text-xs text-amber-800 leading-relaxed">
          {line.replace(/^[💡⚠️]\s*/, '')}
        </span>
      </div>
    )
  }
  if (line.startsWith('• ') || line.startsWith('- ')) {
    const content = line.replace(/^[•\-]\s*/, '')
    return (
      <div key={idx} className="flex gap-2 my-0.5">
        <span className="text-blue-400 flex-shrink-0 mt-0.5 text-xs">•</span>
        <span className="text-xs text-[#3D5270] leading-relaxed">{renderInline(content)}</span>
      </div>
    )
  }
  if (!line) return <div key={idx} className="h-1" />
  return (
    <p key={idx} className="text-xs text-[#3D5270] leading-relaxed my-0.5">
      {renderInline(line)}
    </p>
  )
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[#1E2A3A]">{part.slice(2, -2)}</strong>
    }
    return part.replace(/\*/g, '')
  })
}

export function ResumeRenderer({ text }: Props) {
  const lines = text.split('\n')
  return (
    <div className="space-y-0.5">
      {lines.map((line, idx) => parseLine(line.trim(), idx))}
    </div>
  )
}

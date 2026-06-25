import mammoth from 'mammoth'

export interface ParsedResume {
  raw: string
  education: string[]
  experience: string[]
  projects: string[]
  skills: string[]
}

export async function parseDocx(buffer: Buffer): Promise<ParsedResume> {
  const result = await mammoth.extractRawText({ buffer })
  const raw = result.value.trim()
  return {
    raw,
    education: extractSection(raw, ['教育经历', '教育背景', 'Education']),
    experience: extractSection(raw, ['实习经历', '工作经历', '实习', 'Experience']),
    projects: extractSection(raw, ['项目经历', '数据项目', '项目', 'Projects']),
    skills: extractSection(raw, ['技能', '技能与方法', 'Skills']),
  }
}

function extractSection(text: string, headers: string[]): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const results: string[] = []
  let inSection = false

  const sectionHeaders = [
    '教育经历', '教育背景', '实习经历', '工作经历', '项目经历',
    '数据项目', '技能', '技能与方法', '获奖', '自我评价',
    'Education', 'Experience', 'Projects', 'Skills', 'Awards',
  ]

  for (const line of lines) {
    const isHeader = sectionHeaders.some((h) => line.includes(h))
    const isTarget = headers.some((h) => line.includes(h))

    if (isTarget) {
      inSection = true
      continue
    }
    if (inSection && isHeader && !isTarget) {
      break
    }
    if (inSection && line.length > 0) {
      results.push(line)
    }
  }

  return results
}

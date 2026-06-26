import mammoth from 'mammoth'
import { callAI, isMockMode } from './ai'
import { parseResumePrompt } from './prompts'

export interface ParsedResume {
  raw: string
  education: string[]
  experience: string[]
  projects: string[]
  skills: string[]
}

export async function parseFromRaw(raw: string): Promise<ParsedResume> {
  if (!isMockMode()) {
    try {
      const aiRaw = await callAI(parseResumePrompt(raw))
      const jsonMatch = aiRaw.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiRaw)
      return {
        raw,
        education: Array.isArray(parsed.education) ? parsed.education : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      }
    } catch {
      // fall through to keyword extraction
    }
  }
  return {
    raw,
    education: extractSection(raw, ['教育经历', '教育背景', 'Education']),
    experience: extractSection(raw, ['实习经历', '工作经历', '实习', 'Experience']),
    projects: extractSection(raw, ['项目经历', '数据项目', '项目', 'Projects']),
    skills: extractSection(raw, ['技能', '技能与方法', 'Skills']),
  }
}

export async function parseDocx(buffer: Buffer): Promise<ParsedResume> {
  const result = await mammoth.extractRawText({ buffer })
  return parseFromRaw(result.value.trim())
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
    if (isTarget) { inSection = true; continue }
    if (inSection && isHeader && !isTarget) break
    if (inSection && line.length > 0) results.push(line)
  }

  return results
}

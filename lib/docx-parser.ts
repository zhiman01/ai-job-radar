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
    education: extractSection(raw, [
      '教育经历', '教育背景', '学历背景', '学习经历', '学历信息',
      'Education', 'Educational Background',
    ]),
    experience: extractSection(raw, [
      '实习经历', '工作经历', '实习', '职业经历', '工作经验', '实习工作',
      'Experience', 'Work Experience', 'Internship', 'Professional Experience',
    ]),
    projects: extractSection(raw, [
      '项目经历', '数据项目', '项目', '项目经验', '个人项目', '科研经历', '科研项目',
      'Projects', 'Project Experience', 'Research',
    ]),
    skills: extractSection(raw, [
      '技能', '技能与方法', '专业技能', '核心技能', '技术能力', '个人技能', '技能证书',
      'Skills', 'Technical Skills', 'Core Skills',
    ]),
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
    '教育经历', '教育背景', '学历背景', '学习经历', '学历信息',
    '实习经历', '工作经历', '实习', '职业经历', '工作经验', '实习工作',
    '项目经历', '数据项目', '项目', '项目经验', '个人项目', '科研经历', '科研项目',
    '技能', '技能与方法', '专业技能', '核心技能', '技术能力', '个人技能', '技能证书',
    '获奖', '自我评价', '荣誉', '证书', '个人信息', '个人简介',
    'Education', 'Educational Background', 'Experience', 'Work Experience',
    'Internship', 'Projects', 'Project Experience', 'Research',
    'Skills', 'Technical Skills', 'Core Skills', 'Awards', 'Summary',
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

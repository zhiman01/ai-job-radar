import { NextRequest, NextResponse } from 'next/server'
import { getJob, getResume, createOrUpdateMatch, updateJob } from '@/lib/store'
import { callAI, isMockMode } from '@/lib/ai'
import { matchResumePrompt } from '@/lib/prompts'
import { JobMatch } from '@/types'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const { jobId, resumeId, resumeText: bodyResumeText } = await req.json()
  const job = getJob(jobId)
  const resume = getResume(resumeId)
  const resumeText = bodyResumeText || resume?.originalText
  if (!job || !resumeText) {
    return NextResponse.json({ error: '岗位或简历不存在' }, { status: 404 })
  }

  const jd = `${job.jdText}\n\n职责：\n${job.responsibilities.join('\n')}\n\n要求：\n${job.requirements.join('\n')}`
  const prompt = matchResumePrompt(jd, resumeText, job.title, job.company)
  const raw = await callAI(prompt)

  let parsed: Record<string, unknown>
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
  } catch {
    return NextResponse.json({ error: 'AI分析失败，请重试', raw }, { status: 500 })
  }

  const now = new Date().toISOString()
  const match: JobMatch = {
    id: nanoid(),
    jobId,
    resumeId,
    matchScore: Number(parsed.matchScore) || 0,
    keywords: (parsed.keywords as string[]) || [],
    strengths: (parsed.strengths as string[]) || [],
    gaps: (parsed.gaps as string[]) || [],
    rewriteSuggestions: (parsed.rewriteSuggestions as JobMatch['rewriteSuggestions']) || [],
    interviewQuestions: (parsed.interviewQuestions as string[]) || [],
    tailoredResumeText: '',
    createdAt: now,
  }
  createOrUpdateMatch(match)
  updateJob(jobId, { matchScore: match.matchScore, status: '待改简历' })

  return NextResponse.json({ ...match, isMock: isMockMode() })
}

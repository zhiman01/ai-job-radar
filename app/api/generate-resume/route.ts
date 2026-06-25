import { NextRequest, NextResponse } from 'next/server'
import { getJob, getResume, getMatchByJobResume, createOrUpdateMatch } from '@/lib/store'
import { callAI, isMockMode } from '@/lib/ai'
import { rewriteResumePrompt } from '@/lib/prompts'
import { generateTailoredDocx } from '@/lib/docx-generator'

export async function POST(req: NextRequest) {
  const { jobId, resumeId } = await req.json()
  const job = getJob(jobId)
  const resume = getResume(resumeId)
  if (!job || !resume) {
    return NextResponse.json({ error: '岗位或简历不存在' }, { status: 404 })
  }

  const existingMatch = getMatchByJobResume(jobId, resumeId)
  const strengths = existingMatch?.strengths || []
  const gaps = existingMatch?.gaps || []

  const jd = `${job.jdText}\n\n职责：\n${job.responsibilities.join('\n')}\n\n要求：\n${job.requirements.join('\n')}`
  const prompt = rewriteResumePrompt(jd, resume.originalText, job.title, job.company, strengths, gaps)
  const tailoredText = await callAI(prompt)

  const docxBuffer = await generateTailoredDocx(tailoredText, job.title, job.company)
  const base64 = docxBuffer.toString('base64')

  if (existingMatch) {
    createOrUpdateMatch({ ...existingMatch, tailoredResumeText: tailoredText })
  }

  return NextResponse.json({
    tailoredResumeText: tailoredText,
    docxBase64: base64,
    fileName: `定制简历_${job.company}_${job.title}.docx`,
    isMock: isMockMode(),
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { parseDocx } from '@/lib/docx-parser'
import { createResume } from '@/lib/store'
import { Resume } from '@/types'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: '请上传文件' }, { status: 400 })
  if (!file.name.endsWith('.docx')) {
    return NextResponse.json({ error: '仅支持 .docx 格式' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  let parsed
  try {
    parsed = await parseDocx(buffer)
  } catch {
    return NextResponse.json({ error: '文件解析失败，请确认文件格式正确' }, { status: 500 })
  }

  const now = new Date().toISOString()
  const resume: Resume = {
    id: nanoid(),
    fileName: file.name,
    originalText: parsed.raw,
    parsedJson: {
      education: parsed.education,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      raw: parsed.raw,
    },
    createdAt: now,
    updatedAt: now,
  }
  createResume(resume)
  return NextResponse.json(resume, { status: 201 })
}

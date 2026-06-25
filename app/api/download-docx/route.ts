import { NextRequest, NextResponse } from 'next/server'
import { generateTailoredDocx } from '@/lib/docx-generator'

export async function POST(req: NextRequest) {
  const { text, jobTitle, company } = await req.json()
  if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })
  const buf = await generateTailoredDocx(text, jobTitle ?? '', company ?? '')
  return NextResponse.json({ docxBase64: buf.toString('base64') })
}

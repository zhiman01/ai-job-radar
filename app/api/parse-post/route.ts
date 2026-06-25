import { NextRequest, NextResponse } from 'next/server'
import { callAI, isMockMode } from '@/lib/ai'
import { parseXhsPostPrompt } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const { title, rawText, postDate, sourceUrl } = await req.json()
  if (!rawText) return NextResponse.json({ error: '帖子正文不能为空' }, { status: 400 })

  const prompt = parseXhsPostPrompt(rawText, title || '', postDate || '')
  const raw = await callAI(prompt)

  let parsed: Record<string, unknown>
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
  } catch {
    return NextResponse.json({ error: 'AI解析失败，请重试', raw }, { status: 500 })
  }

  return NextResponse.json({ ...parsed, sourceUrl, isMock: isMockMode() })
}

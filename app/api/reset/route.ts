import { NextResponse } from 'next/server'
import { resetToMock } from '@/lib/store'

export async function POST() {
  resetToMock()
  return NextResponse.json({ ok: true })
}

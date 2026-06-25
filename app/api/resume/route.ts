import { NextResponse } from 'next/server'
import { getResumes } from '@/lib/store'

export async function GET() {
  const resumes = getResumes()
  return NextResponse.json(resumes)
}

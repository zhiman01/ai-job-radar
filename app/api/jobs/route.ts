import { NextRequest, NextResponse } from 'next/server'
import { getJobs, createJob } from '@/lib/store'
import { Job } from '@/types'
import { nanoid } from 'nanoid'

export async function GET() {
  const jobs = getJobs()
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = new Date().toISOString()
  const job: Job = {
    id: nanoid(),
    title: body.title || '',
    company: body.company || 'unknown',
    companyType: body.companyType || '其他',
    sourcePlatform: body.sourcePlatform || '小红书',
    sourceUrl: body.sourceUrl || '',
    postDate: body.postDate || now.split('T')[0],
    capturedAt: now,
    location: body.location || '其他',
    jobType: body.jobType || '其他',
    rawText: body.rawText || '',
    jdText: body.jdText || '',
    responsibilities: body.responsibilities || [],
    requirements: body.requirements || [],
    applyMethod: body.applyMethod || '',
    tags: body.tags || [],
    status: '待查看',
    matchScore: body.matchScore,
    createdAt: now,
    updatedAt: now,
  }
  createJob(job)
  return NextResponse.json(job, { status: 201 })
}

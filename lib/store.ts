import fs from 'fs'
import path from 'path'
import { DB, Job, Resume, JobMatch } from '@/types'
import { mockJobs } from '@/data/mock-jobs'
import { mockResume } from '@/data/mock-resume'

const DB_PATH = process.env.VERCEL
  ? '/tmp/db.json'
  : path.join(process.cwd(), 'data', 'db.json')

function readDB(): DB {
  const fallback: DB = { jobs: [...mockJobs], resumes: [mockResume], matches: [] }
  try {
    if (!fs.existsSync(DB_PATH)) {
      try {
        if (!process.env.VERCEL) {
          fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
        }
        fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2), 'utf-8')
      } catch { /* write failed — return fallback anyway */ }
      return fallback
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    const db = JSON.parse(raw) as DB
    if (!db.jobs || db.jobs.length === 0) db.jobs = [...mockJobs]
    if (!db.resumes) db.resumes = []
    if (!db.resumes.some(r => r.id === mockResume.id)) db.resumes.unshift(mockResume)
    return db
  } catch {
    return fallback
  }
}

function writeDB(db: DB): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
  } catch { /* ignore write errors on read-only filesystems */ }
}

export function resetToMock(): void {
  writeDB({ jobs: [...mockJobs], resumes: [], matches: [] })
}

// Jobs
export function getJobs(): Job[] {
  return readDB().jobs
}

export function getJob(id: string): Job | undefined {
  return readDB().jobs.find((j) => j.id === id)
}

export function createJob(job: Job): Job {
  const db = readDB()
  db.jobs.unshift(job)
  writeDB(db)
  return job
}

export function updateJob(id: string, patch: Partial<Job>): Job | null {
  const db = readDB()
  const idx = db.jobs.findIndex((j) => j.id === id)
  if (idx === -1) return null
  db.jobs[idx] = { ...db.jobs[idx], ...patch, updatedAt: new Date().toISOString() }
  writeDB(db)
  return db.jobs[idx]
}

// Resumes
export function getResumes(): Resume[] {
  return readDB().resumes
}

export function getResume(id: string): Resume | undefined {
  return readDB().resumes.find((r) => r.id === id)
}

export function createResume(resume: Resume): Resume {
  const db = readDB()
  db.resumes.unshift(resume)
  writeDB(db)
  return resume
}

export function updateResume(id: string, patch: Partial<Resume>): Resume | null {
  const db = readDB()
  const idx = db.resumes.findIndex((r) => r.id === id)
  if (idx === -1) return null
  db.resumes[idx] = { ...db.resumes[idx], ...patch, updatedAt: new Date().toISOString() }
  writeDB(db)
  return db.resumes[idx]
}

// Matches
export function getMatches(): JobMatch[] {
  return readDB().matches
}

export function getMatch(id: string): JobMatch | undefined {
  return readDB().matches.find((m) => m.id === id)
}

export function getMatchByJobResume(jobId: string, resumeId: string): JobMatch | undefined {
  return readDB().matches.find((m) => m.jobId === jobId && m.resumeId === resumeId)
}

export function createOrUpdateMatch(match: JobMatch): JobMatch {
  const db = readDB()
  const idx = db.matches.findIndex((m) => m.jobId === match.jobId && m.resumeId === match.resumeId)
  if (idx === -1) {
    db.matches.unshift(match)
  } else {
    db.matches[idx] = match
  }
  writeDB(db)
  return match
}

export type CompanyType = 'AI初创' | '互联网大厂' | 'AI应用公司' | '其他'
export type JobType = 'AI产品' | 'Agent产品' | '数据分析' | '运营' | '算法' | '设计' | 'Vibe Coding' | '其他'
export type JobStatus =
  | '待查看'
  | '已收藏'
  | '待改简历'
  | '已生成简历'
  | '已投递'
  | '面试中'
  | 'Offer'
  | '已拒绝'
  | '已放弃'

export type Location = '北京' | '上海' | '深圳' | '杭州' | '远程' | '其他'

export interface Job {
  id: string
  title: string
  company: string
  companyType: CompanyType
  sourcePlatform: string
  sourceUrl: string
  postDate: string
  capturedAt: string
  location: Location
  jobType: JobType
  rawText: string
  jdText: string
  responsibilities: string[]
  requirements: string[]
  applyMethod: string
  tags: string[]
  status: JobStatus
  matchScore?: number
  createdAt: string
  updatedAt: string
  isMock?: boolean
}

export interface Resume {
  id: string
  fileName: string
  originalText: string
  parsedJson: {
    education?: string[]
    experience?: string[]
    projects?: string[]
    skills?: string[]
    raw?: string
  }
  createdAt: string
  updatedAt: string
}

export interface JobMatch {
  id: string
  jobId: string
  resumeId: string
  matchScore: number
  keywords: string[]
  strengths: string[]
  gaps: string[]
  rewriteSuggestions: { section: string; original: string; suggestion: string }[]
  interviewQuestions: string[]
  tailoredResumeText: string
  docxUrl?: string
  createdAt: string
}

export interface DB {
  jobs: Job[]
  resumes: Resume[]
  matches: JobMatch[]
}

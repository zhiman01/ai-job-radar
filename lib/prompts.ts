export const parseResumePrompt = (rawText: string) => `
你是一个简历结构化提取助手。请分析以下简历文本，按模块提取内容。

简历文本：
${rawText}

请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "education": ["每所学校一个条目，包含学校名、专业、学历、时间"],
  "experience": ["每段实习/工作经历一个条目，包含公司、职位、时间及所有职责描述"],
  "projects": ["每个项目一个条目，包含项目名、时间及完整描述"],
  "skills": ["技能内容，每行或每个技能点一个条目"]
}

注意：
- 保留原文表达，不改写、不总结、不遗漏
- 每段实习/项目经历的所有 bullet 点都合并到同一个条目里
- 如某模块在简历中不存在，返回空数组 []
- 中英文简历均适用
`

export const parseXhsPostPrompt = (rawText: string, title: string, postDate: string) => `
你是一个招聘信息结构化提取助手。请分析以下小红书帖子，判断是否为招聘帖，并提取结构化信息。

帖子标题：${title}
发布时间：${postDate}
帖子正文：
${rawText}

请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "isJobPost": true/false,
  "isAIRelated": true/false,
  "company": "公司名称，不确定则填unknown",
  "title": "岗位名称",
  "companyType": "AI初创 | 互联网大厂 | AI应用公司 | 其他",
  "jobType": "AI产品 | Agent产品 | 数据分析 | 运营 | 算法 | 设计 | Vibe Coding | 其他",
  "location": "北京 | 上海 | 深圳 | 杭州 | 广州 | 远程 | 不限 | 未提及（帖子未明确说明地点时使用） | 其他",
  "responsibilities": ["职责1", "职责2"],
  "requirements": ["要求1", "要求2"],
  "bonusItems": ["加分项1（如有，否则为空数组）"],
  "applyMethod": "投递方式",
  "tags": ["关键词1", "关键词2", "关键词3"],
  "jdText": "一句话描述该岗位核心工作内容",
  "completenessScore": 0-100,
  "credibilityNote": "对该帖子信息完整度和可信度的简短说明"
}

注意事项：
- 只提取帖子中明确存在的信息，不要推断或编造
- completenessScore：0-100，根据信息完整程度打分
- 如果不是招聘帖，isJobPost 填 false，其他字段填默认值
`

export const matchResumePrompt = (jd: string, resumeText: string, jobTitle: string, company: string) => `
你是一个专业的简历与岗位匹配分析助手。请分析以下岗位要求和简历内容，给出详细的匹配分析。

目标岗位：${jobTitle} @ ${company}
岗位描述：
${jd}

求职者简历：
${resumeText}

请严格按照以下 JSON 格式输出，不要输出任何其他内容：
{
  "matchScore": 0-100,
  "keywords": ["岗位核心关键词1", "关键词2"],
  "strengths": ["简历中与岗位匹配的优势1", "优势2"],
  "gaps": ["简历中缺失或表达不足的能力1", "差距2"],
  "recommendations": ["针对岗位，建议在简历/投递前补充或强化的行动1", "行动2", "行动3"],
  "rewriteSuggestions": [
    {
      "section": "经历/模块名称",
      "original": "原有表达（如有）",
      "suggestion": "改写建议（基于已有事实，优化表达，不得编造）"
    }
  ],
  "interviewQuestions": ["面试官可能追问的问题1", "问题2", "问题3"],
  "warnings": ["不建议夸大或编造的内容提示1（如有）"]
}

重要原则：
- 只能基于简历中已有的真实信息给出建议
- 不得建议编造经历、虚构数据、添加用户没有提供的项目
- 如果简历中缺少某项能力证据，在 gaps 里说明"现有简历中暂缺「XX」的直接经历，建议回顾过往经历看是否有可复用的背景"
- 改写建议只能优化表达方式、调整重点顺序、强化与岗位的关联
`

export const rewriteResumePrompt = (
  jd: string,
  resumeText: string,
  jobTitle: string,
  company: string,
  strengths: string[],
  gaps: string[]
) => `
你是一个专业的简历改写助手。请基于以下信息，生成一份针对目标岗位优化的简历文本。

目标岗位：${jobTitle} @ ${company}
岗位核心要求：
${jd}

候选人原始简历：
${resumeText}

已知优势（匹配岗位的能力）：
${strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

能力缺口（原简历不足的地方）：
${gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

请输出优化后的完整简历文本。格式要求：
- 保持清晰的模块结构：个人信息、教育经历、实习经历、项目经历、技能
- 针对目标岗位重点强化相关能力
- 对每个模块的要点按与岗位相关度从高到低排列
- 使用简洁有力的表达

严格禁止：
- 编造任何经历、公司、项目、数据
- 添加原简历中没有的技能或工具
- 虚构量化数据
- 如果原简历某项内容与目标岗位不相关，可以降低篇幅，但不得删除真实信息

如果某项岗位要求在原简历中完全没有依据，请在对应模块末尾用以下格式说明：
「💡 现有简历中暂缺「XX能力」的直接经历。建议回顾过往经历，看是否有可复用的相关背景；若确实没有，面试时可坦诚说明，并表达对该方向的学习意愿和思考。」

输出格式要求：
- 不要使用 ** 加粗标记，直接用文字表达重点
- 模块标题用「=== 模块名 ===」分隔
- 条目用「• 」开头
- 保持纯文本，便于直接复制使用
`

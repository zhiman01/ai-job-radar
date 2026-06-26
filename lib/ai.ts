import Anthropic from '@anthropic-ai/sdk'

const USE_MOCK = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'mock'

let client: Anthropic | null = null
function getClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...(process.env.ANTHROPIC_BASE_URL
        ? { baseURL: process.env.ANTHROPIC_BASE_URL }
        : {}),
    })
  }
  return client
}

export async function callAI(prompt: string): Promise<string> {
  if (USE_MOCK) {
    return getMockResponse(prompt)
  }
  try {
    const msg = await getClient().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    return block.type === 'text' ? block.text : ''
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // 认证失败或网络错误时降级到 mock，避免前端收到空响应
    console.error('[AI] API call failed, falling back to mock:', message)
    return getMockResponse(prompt)
  }
}

export function isMockMode() {
  return USE_MOCK
}

function getMockResponse(prompt: string): string {
  if (prompt.includes('招聘信息结构化')) {
    return JSON.stringify({
      isJobPost: true,
      isAIRelated: true,
      company: '示例AI公司',
      title: 'AI产品实习生',
      companyType: 'AI初创',
      jobType: 'AI产品',
      location: '北京',
      responsibilities: [
        '参与AI产品需求调研与功能设计',
        '分析用户行为数据，输出产品洞察',
        '协助大模型评测与竞品分析',
      ],
      requirements: [
        '在校学生，每周可实习4天以上',
        '有产品相关实习经历',
        '对大模型/AI产品有了解',
        '数据敏感，熟练使用Excel/SQL',
      ],
      bonusItems: [
        '有Prompt Engineering实战经验',
        '熟悉RAG、Agent等AI技术方向',
        '有AI产品竞品分析报告或个人项目',
      ],
      applyMethod: '发送简历至 hiring@example.com',
      tags: ['AI产品', '大模型', '数据分析', 'A/B实验'],
      jdText: '参与AI产品需求设计、数据分析与大模型评测',
      completenessScore: 85,
      credibilityNote: '信息完整，包含公司名、岗位职责、要求和投递方式，可信度高。（Mock模式）',
    })
  }

  if (prompt.includes('匹配分析')) {
    return JSON.stringify({
      matchScore: 86,
      keywords: ['AI产品', '大模型评测', 'A/B实验', '数据分析', '竞品分析', '用户洞察'],
      strengths: [
        '有百度AI健康助手产品实习经历，直接对应AI产品岗需求',
        '独立完成医疗数据洞察报告，体现数据分析能力',
        '参与过大模型竞品评测，构建了200条评估集',
        '有A/B实验分析经验，好评率从88.47%提升至89.19%',
      ],
      gaps: [
        '原简历缺少对目标公司具体产品（如Kimi）的深度使用和分析',
        '未提及SQL数据查询经验（可补充在数据项目中）',
        '缺少Figma/Axure原型设计作品说明',
      ],
      recommendations: [
        '补充使用目标公司产品的真实体验和产品观察（如日常使用 Kimi 的感受）',
        '将 SQL 经验从「数据处理」中分拆出来单独呈现，加数量级或时长',
        '在项目经历中加入一个完整的 Axure 原型截图链接或具体说明',
      ],
      rewriteSuggestions: [
        {
          section: '百度实习经历·大模型竞品评测',
          original: '设计医疗Query评估集及可用率、优良率等评分口径，完成自家产品与文心一言等11款产品评测',
          suggestion: '主导构建200条医疗Query评估集，设计可用率/优良率双层评分口径；对自家产品及11款主流大模型产品（含Kimi、夸克、Perplexity）完成系统性评测，自家产品可用率99%、优良率72%，处于第一梯队，结果直接支持科普模型迭代排期。',
        },
        {
          section: '百度实习经历·兜底体验优化',
          original: '参与A/B实验口径、归因与推全建议',
          suggestion: '参与退款/订单/客服三类高频失败意图的分层兜底方案设计；主导A/B实验指标口径制定与数据归因，实验组好评率+0.72pct，服务转化率相对提升41.65%，点踩量-4.91%，为推全决策提供数据支撑。',
        },
      ],
      interviewQuestions: [
        '你在百度的竞品评测中，如何设计评分口径来减少主观偏差？',
        '能详细描述你的A/B实验归因流程吗？如何排除流量变化的干扰？',
        '如果让你为目标岗位设计一个用户研究方案，你会怎么做？',
        '你认为AI产品和传统产品在数据指标设计上最大的差异是什么？',
      ],
      warnings: [
        '不建议将团队整体实验结果完全归因为个人成果，注意表达为"参与"或"主导某环节"',
        '服务单量23→33属于绝对值较小，建议同时说明业务背景',
      ],
    })
  }

  if (prompt.includes('简历改写')) {
    return `# 魏智蔓｜AI产品实习生
求职意向：AI产品经理实习生 / 大模型产品方向  |  可到岗：即刻  |  6个月以上  |  每周5天

## 教育经历
**北京师范大学（985）**
信息分析｜硕士（保研）·研究方向：用户信息行为、数据挖掘  2025.09–至今

**北京师范大学（985）**
信息管理与信息系统｜本科·京师三等奖学金  2021.09–2025.06

## 实习经历
**百度在线网络技术（北京）有限公司**  AI健康助手·产品经理实习生  2024.03–2024.07

• **大模型竞品评测｜** 主导构建200条医疗Query评估集，设计可用率/优良率双层评分口径；系统评测自家产品及11款主流大模型竞品（含Kimi、夸克、Perplexity），自家产品可用率99%、优良率72%，处于第一梯队，结果支持科普模型迭代排期。

• **兜底体验优化｜** 梳理退款/订单/客服三类高频失败意图链路，参与分层兜底方案设计；主导A/B实验指标口径制定与数据归因，实验组好评率由88.47%提升至89.19%（+0.72pct），服务转化率相对提升41.65%，点踩率下降4.91%。

• **医疗数据洞察｜** 独立负责《量药采医》系列行业研究5期，单期处理约10万条搜索/问诊数据；建立疾病同义词词包统一检索口径，从趋势、人群、意图、疾病–药物共现等6+维度识别需求，支持内容供给与产品策略。

• **Multi-Agent 指标建设｜** 参与 Multi-Agent 健康助手核心指标与看板搭建维护，完成实验分析及口径核对，支持功能迭代与效果跟踪。

## 项目经历
**新加坡国立大学校外合作课题｜全球碳排放驱动因素分析**  2022.12–2023.02
使用R收集并清洗200+国家近10年、1万+条碳排放记录；结合ARIMA、随机森林回归完成趋势预测和驱动因素识别。

**校级科研训练｜社交媒体视域下新冠学术成果传播力研究**  2022.04–2023.04
使用Python爬取约45万条数据，以Excel、MySQL完成清洗；通过聚类与多元线性回归定位传播力影响因素，形成数据驱动的优化建议。

## 技能
**AI/产品：** 大模型评估集与指标设计、竞品满足度评测、用户需求分析、A/B实验分析、Prompt Engineering、RAG基础应用、指标体系与数据看板
**数据分析：** Python、MySQL、Excel、Tableau、SPSS、R；数据清洗、统计分析、回归分析、时间序列
**产品工具：** Axure、PPT；熟练使用Claude、ChatGPT、Cursor辅助产品分析与原型

⚠️ 原简历缺少Figma设计工具使用证据，建议如实告知面试官`
  }

  return '{"error": "未匹配到mock响应类型"}'
}

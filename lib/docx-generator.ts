import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx'

const BLUE = '1F5A7A'
const INK = '222222'
const MUTED = '5D6770'

function heading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: BLUE, font: 'Arial' })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 200, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D9E7EF' },
    },
  })
}

function subheading(left: string, right: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: left, bold: true, size: 20, color: INK, font: 'Arial' }),
      new TextRun({ text: '    ' + right, size: 18, color: MUTED, font: 'Arial' }),
    ],
    spacing: { before: 120, after: 40 },
  })
}

function bullet(text: string): Paragraph {
  const boldMatch = text.match(/^(.+?[｜|])\s*(.*)$/)
  const children = boldMatch
    ? [
        new TextRun({ text: '• ', color: BLUE, font: 'Arial', size: 18 }),
        new TextRun({ text: boldMatch[1], bold: true, color: BLUE, size: 18, font: 'Arial' }),
        new TextRun({ text: boldMatch[2], color: INK, size: 18, font: 'Arial' }),
      ]
    : [
        new TextRun({ text: '• ' + text, color: INK, size: 18, font: 'Arial' }),
      ]
  return new Paragraph({
    children,
    spacing: { before: 40, after: 40 },
    indent: { left: 300 },
  })
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, color: INK, size: 18, font: 'Arial' })],
    spacing: { before: 40, after: 40 },
  })
}

function warning(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, color: 'C0392B', size: 17, italics: true, font: 'Arial' })],
    spacing: { before: 60, after: 40 },
  })
}

export async function generateTailoredDocx(
  tailoredText: string,
  jobTitle: string,
  company: string
): Promise<Buffer> {
  const lines = tailoredText.split('\n').map((l) => l.trim()).filter(Boolean)
  const paragraphs: Paragraph[] = []

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: '求职定制简历', bold: true, size: 36, color: INK, font: 'Arial' }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: 0, after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `目标岗位：${jobTitle} @ ${company}`, size: 20, color: MUTED, font: 'Arial' }),
      ],
      spacing: { before: 0, after: 200 },
    })
  )

  for (const line of lines) {
    if (line.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^#+ /, ''), bold: true, size: 28, color: INK, font: 'Arial' })],
          spacing: { before: 100, after: 80 },
        })
      )
    } else if (line.startsWith('## ')) {
      paragraphs.push(heading(line.replace(/^#+ /, '')))
    } else if (line.startsWith('**') && line.endsWith('**')) {
      paragraphs.push(subheading(line.replace(/\*\*/g, ''), ''))
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
      paragraphs.push(bullet(line.replace(/^[•\-]\s*/, '')))
    } else if (line.startsWith('⚠️')) {
      paragraphs.push(warning(line))
    } else if (line.match(/^\*\*.+\*\*\s.+\s\d{4}/)) {
      const clean = line.replace(/\*\*/g, '')
      paragraphs.push(subheading(clean, ''))
    } else {
      paragraphs.push(body(line))
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        children: paragraphs,
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

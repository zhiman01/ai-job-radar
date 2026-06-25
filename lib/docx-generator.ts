import {
  Document, Packer, Paragraph, TextRun, BorderStyle,
} from 'docx'

const BLUE = '1D4ED8'
const INK = '1E2A3A'
const MUTED = '7A95B0'

// Lines matching these patterns are omitted from the Word export.
// Page preview keeps them; Word output is clean of any AI tool traces.
const WORD_OMIT = [
  /^[💡⚠]/,
  /现有简历中暂缺/,
  /建议在投递时/,
  /建议如实告知/,
  /面试时可坦诚说明/,
  /可坦诚说明，并表达/,
]

function prepareForWord(raw: string): string {
  return raw
    .split('\n')
    .filter(line => !WORD_OMIT.some(p => p.test(line.trim())))
    .join('\n')
    // Remove surrogate pairs (emoji above BMP: 💡 U+1F4A1, etc.)
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    // Remove misc symbol block (⚠ U+26A0, ✅ U+2705, etc.)
    .replace(/[☀-➿]/g, '')
    // Remove variation selectors (FE0F turns ⚠ into ⚠️)
    .replace(/[︀-️]/g, '')
}

// Parse **bold** markers into mixed TextRun array
function parseInline(text: string, baseSize = 18): TextRun[] {
  return text.split(/(\*\*[^*]+\*\*)/).map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true, color: INK, size: baseSize, font: 'Arial' })
    }
    return new TextRun({ text: p.replace(/\*/g, ''), color: INK, size: baseSize, font: 'Arial' })
  })
}

function nameParagraph(raw: string): Paragraph {
  const [name, role] = raw.split(/[｜|]/).map(s => s.trim())
  return new Paragraph({
    children: [
      new TextRun({ text: name, bold: true, size: 44, color: INK, font: 'Arial' }),
      ...(role ? [new TextRun({ text: '   ' + role, size: 22, color: MUTED, font: 'Arial' })] : []),
    ],
    spacing: { before: 0, after: 100 },
  })
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: BLUE, font: 'Arial', characterSpacing: 60 })],
    spacing: { before: 260, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFDBFE' } },
  })
}

// Company / institution line: bold left, muted right (date, role)
function institutionLine(left: string, right?: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: left, bold: true, size: 20, color: INK, font: 'Arial' }),
      ...(right ? [new TextRun({ text: '    ' + right, size: 18, color: MUTED, font: 'Arial' })] : []),
    ],
    spacing: { before: 120, after: 40 },
  })
}

function bulletParagraph(text: string): Paragraph {
  // Support leading bold label: "大模型竞品评测｜ rest"
  const labelMatch = text.match(/^(.+?[｜|])\s*(.*)$/)
  const children = labelMatch
    ? [
        new TextRun({ text: '• ', color: BLUE, size: 18, font: 'Arial' }),
        new TextRun({ text: labelMatch[1], bold: true, color: INK, size: 18, font: 'Arial' }),
        new TextRun({ text: labelMatch[2], color: INK, size: 18, font: 'Arial' }),
      ]
    : [
        new TextRun({ text: '• ', color: BLUE, size: 18, font: 'Arial' }),
        ...parseInline(text),
      ]
  return new Paragraph({
    children,
    spacing: { before: 36, after: 36 },
    indent: { left: 280 },
  })
}

function bodyParagraph(text: string): Paragraph {
  return new Paragraph({
    children: parseInline(text),
    spacing: { before: 30, after: 30 },
  })
}


export async function generateTailoredDocx(
  tailoredText: string,
  // kept for signature compatibility, no longer used as a fluff header
  _jobTitle: string,
  _company: string,
): Promise<Buffer> {
  const lines = prepareForWord(tailoredText).split('\n').map(l => l.trim()).filter(Boolean)
  const paragraphs: Paragraph[] = []

  for (const line of lines) {
    // Name (# 姓名｜职位)
    if (line.startsWith('# ')) {
      paragraphs.push(nameParagraph(line.slice(2).trim()))
    }
    // Section heading: ## or === ===
    else if (line.startsWith('## ')) {
      paragraphs.push(sectionHeading(line.slice(3).trim()))
    }
    else if (/^===.+===$/.test(line)) {
      paragraphs.push(sectionHeading(line.replace(/===/g, '').trim()))
    }
    // Bold institution/company line (starts with ** but not a bullet)
    else if (line.startsWith('**') && !line.startsWith('• ')) {
      const clean = line.replace(/\*\*/g, '').trim()
      // Split on 2+ spaces to separate name from role/date
      const twoSpace = clean.indexOf('  ')
      if (twoSpace > 0) {
        paragraphs.push(institutionLine(clean.slice(0, twoSpace).trim(), clean.slice(twoSpace).trim()))
      } else {
        paragraphs.push(institutionLine(clean))
      }
    }
    // Bullets
    else if (line.startsWith('• ') || line.startsWith('- ')) {
      paragraphs.push(bulletParagraph(line.replace(/^[•\-]\s*/, '')))
    }
    // Everything else (warning lines already stripped by prepareForWord)
    else {
      paragraphs.push(bodyParagraph(line))
    }
  }

  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: paragraphs,
    }],
  })

  return Packer.toBuffer(doc)
}

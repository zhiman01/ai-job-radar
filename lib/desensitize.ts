const RULES: [RegExp, string][] = [
  [/88\.47%/g, '约 88%'],
  [/89\.19%/g, '近 90%'],
  [/\+0\.72pct/g, '约 +1pct'],
  [/0\.72pct/g, '约 1pct'],
  [/41\.65%/g, '超过 40%'],
  [/4\.91%/g, '接近 5%'],
  [/\b99%/g, '接近 100%'],
  [/\b72%/g, '超过 70%'],
  [/23→33/g, '数量有所增长'],
]

export function desensitize(text: string): string {
  let out = text
  for (const [pattern, replacement] of RULES) {
    out = out.replace(pattern, replacement)
  }
  return out
}

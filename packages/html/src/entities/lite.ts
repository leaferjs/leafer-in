// 常用html实体字符转svg能识别的unicode字符
export const unicodeEntities: Record<string, string> = {
  // 基础符号
  lt: '\u003C', // <
  gt: '\u003E', // >
  amp: '\u0026', // &
  quot: '\u0022', // "
  apos: '\u0027', // '

  // 空格类
  nbsp: '\u00A0', // 不断行空格
  ensp: '\u2002', // 半方宽空格
  emsp: '\u2003', // 全方宽空格
  thinsp: '\u2009', // 窄空格

  // 线条/标点
  ndash: '\u2013', // –
  mdash: '\u2014', // —
  hellip: '\u2026', // …
  middot: '\u00B7', // ·
  bull: '\u2022', // •

  // 引号
  laquo: '\u00AB', // «
  raquo: '\u00BB', // »
  lsquo: '\u2018', // ‘
  rsquo: '\u2019', // ’
  ldquo: '\u201C', // “
  rdquo: '\u201D', // ”

  // 货币符号
  cent: '\u00A2', // ¢
  pound: '\u00A3', // £
  yen: '\u00A5', // ¥
  euro: '\u20AC', // €

  // 数学运算
  times: '\u00D7', // ×
  divide: '\u00F7', // ÷
  plusmn: '\u00B1', // ±
  minus: '\u2212', // −
  frac12: '\u00BD', // ½
  frac14: '\u00BC', // ¼
  frac34: '\u00BE', // ¾
  sup2: '\u00B2', // ²
  sup3: '\u00B3', // ³

  // 常见符号
  deg: '\u00B0', // °
  reg: '\u00AE', // ®
  copy: '\u00A9', // ©
  trade: '\u2122', // ™
  section: '\u00A7', // §
  para: '\u00B6', // ¶
  dagger: '\u2020', // †
  Dagger: '\u2021', // ‡

  // 箭头
  larr: '\u2190', // ←
  uarr: '\u2191', // ↑
  rarr: '\u2192', // →
  darr: '\u2193', // ↓
  harr: '\u2194', // ↔

  // 希腊字母（常见）
  alpha: '\u03B1', // α
  beta: '\u03B2', // β
  gamma: '\u03B3', // γ
  delta: '\u03B4', // δ
  pi: '\u03C0', // π
  sigma: '\u03C3', // σ
  omega: '\u03C9', // ω
  Omega: '\u03A9', // Ω

  // 其他常见
  micro: '\u00B5', // µ
  infinity: '\u221E', // ∞
  not: '\u00AC', // ¬
  equiv: '\u2261', // ≡
  le: '\u2264', // ≤
  ge: '\u2265', // ≥
}

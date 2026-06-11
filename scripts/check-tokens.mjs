/**
 * Token enforcement (architecture §6, design §1.5: "tokens or nothing").
 *
 * Fails if any file under src/ — except styles/theme.css — contains:
 *   - a hex color literal
 *   - a Tailwind arbitrary-value utility, e.g. text-[17px]
 *   - a raw palette class, e.g. text-zinc-500
 *
 * This keeps the design-change runbook (docs/03-design-system.md §8) honest:
 * if it's not in theme.css, it can't drift.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const SRC = new URL('../src', import.meta.url).pathname
const EXEMPT = new Set(['styles/theme.css'])
const EXTENSIONS = /\.(jsx?|mjs|css)$/

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

const RULES = [
  { name: 'hex color literal', re: /#[0-9a-fA-F]{3,8}\b/ },
  { name: 'arbitrary-value utility', re: /[a-z][\w/]*-\[[^\]]+\]/ },
  {
    name: 'raw palette class',
    re: new RegExp(`\\b[a-z][\\w-]*-(?:${PALETTE})-\\d{2,3}\\b`),
  },
]

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const violations = []

for (const path of walk(SRC)) {
  const rel = relative(SRC, path).split(sep).join('/')
  if (!EXTENSIONS.test(rel) || EXEMPT.has(rel)) continue

  const lines = readFileSync(path, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      const match = line.match(rule.re)
      if (match) violations.push({ rel, line: i + 1, rule: rule.name, found: match[0] })
    }
  })
}

if (violations.length > 0) {
  console.error('✖ Token rule violations — visual values belong in src/styles/theme.css:\n')
  for (const v of violations) {
    console.error(`  src/${v.rel}:${v.line}  ${v.rule}: "${v.found}"`)
  }
  console.error(`\n${violations.length} violation(s). See docs/03-design-system.md §1.5 and §8.`)
  process.exit(1)
}

console.log('✓ check:tokens — no raw visual values outside theme.css')

/**
 * End-to-end rendering battery (docs/02 §6).
 *
 * Runs against `vite dev` — deliberately, not `vite preview`. The dev server is
 * the strictest renderer (strict validation throws; content JSON is served over
 * HTTP via the eager glob rather than bundled) and it's where the bug class this
 * battery exists to catch actually lives: a URL-unsafe content filename 404s its
 * module fetch and blanks the page, yet `test` and `build` stay green because
 * they bundle the JSON. See docs/reports/2026-06-17-content-restructure.md.
 *
 * Uses the existing `playwright` dependency (no new test framework) and a tiny
 * inline harness. Exit code is non-zero if any check fails.
 *
 * Run: npm run test:e2e
 */
import { spawn } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { chromium } from 'playwright'

// --- expected data, read straight from the content/ source of truth ----------
const projects = readdirSync('content/projects')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(`content/projects/${f}`, 'utf8')))
const countByCategory = projects.reduce((acc, p) => {
  acc[p.category] = (acc[p.category] || 0) + 1
  return acc
}, {})

// --- dev server lifecycle -----------------------------------------------------
function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'dev'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
    let buf = ''
    const onData = (d) => {
      buf += d.toString()
      const match = buf.match(/localhost:(\d+)/)
      if (match) resolve({ proc, port: Number(match[1]) })
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.on('exit', (code) => reject(new Error(`dev server exited early (code ${code})`)))
    setTimeout(() => reject(new Error('dev server did not start within 30s')), 30000)
  })
}

function stopDevServer(proc) {
  try {
    process.kill(-proc.pid, 'SIGTERM') // kill the process group (vite + children)
  } catch {
    proc.kill('SIGTERM')
  }
}

// --- tiny test harness --------------------------------------------------------
const tests = []
const test = (name, fn) => tests.push({ name, fn })
function assert(cond, message) {
  if (!cond) throw new Error(message)
}

// =============================================================================
let server
try {
  console.log('Starting dev server…')
  server = await startDevServer()
  const baseURL = `http://localhost:${server.port}/`
  console.log(`Dev server on ${baseURL}\n`)

  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Collect failures across the whole session.
  const pageErrors = []
  const badResponses = []
  page.on('pageerror', (e) => pageErrors.push(e.message))
  page.on('requestfailed', (r) => {
    const u = r.url()
    if (u.includes('/content/') || u.includes('/images/')) {
      badResponses.push(`${u} — ${r.failure()?.errorText}`)
    }
  })
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(baseURL)) {
      badResponses.push(`${r.status()} ${r.url()}`)
    }
  })

  // Load + scroll to the bottom so every lazy-loaded image actually requests
  // (so a missing/renamed image surfaces as a 404 in badResponses).
  await page.goto(baseURL, { waitUntil: 'networkidle', timeout: 20000 })
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.waitForLoadState('networkidle')

  // --- the battery -----------------------------------------------------------
  test('renders the hero heading', async () => {
    const h1 = (await page.locator('h1').first().innerText()).trim()
    assert(h1.length > 0, 'hero <h1> is empty (page likely failed to render)')
  })

  test('renders one card per project file', async () => {
    const cards = await page.locator('#work li').count()
    assert(
      cards === projects.length,
      `expected ${projects.length} cards (content/projects/*.json), got ${cards}`,
    )
  })

  test('no failed /content or /images requests (the dev-glob 404 guard)', async () => {
    assert(badResponses.length === 0, `failed requests:\n  ${badResponses.join('\n  ')}`)
  })

  test('no uncaught page errors', async () => {
    assert(pageErrors.length === 0, `page errors:\n  ${pageErrors.join('\n  ')}`)
  })

  test('every project thumbnail decodes (no broken images)', async () => {
    const broken = await page.$$eval('#work li img', (imgs) =>
      imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    )
    assert(broken.length === 0, `broken thumbnails:\n  ${broken.join('\n  ')}`)
  })

  test('category filter narrows the grid and resets', async () => {
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    const buttons = page.locator('#work [role="group"] button') // [all, video, motion, product, graphic]
    // Pick the first category that actually has projects.
    const order = ['video', 'motion', 'product', 'graphic']
    const cat = order.find((c) => countByCategory[c] > 0)
    await buttons.nth(order.indexOf(cat) + 1).click()
    const filtered = await page.locator('#work li').count()
    assert(
      filtered === countByCategory[cat],
      `filter "${cat}": expected ${countByCategory[cat]} cards, got ${filtered}`,
    )
    await buttons.nth(0).click() // "all"
    const all = await page.locator('#work li').count()
    assert(all === projects.length, `reset to all: expected ${projects.length}, got ${all}`)
  })

  test('project detail modal opens and closes', async () => {
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    await page.locator('#work li button').first().click()
    const dialog = page.locator('dialog[open]')
    await dialog.waitFor({ state: 'visible', timeout: 5000 })
    assert((await dialog.locator('h2').first().innerText()).trim().length > 0, 'modal has no title')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden', timeout: 5000 })
  })

  test('language toggle flips the document language', async () => {
    await page.goto(baseURL, { waitUntil: 'networkidle' })
    // The language <html lang> uses a mapped value (e.g. "pt-BR"/"en"), so assert
    // it changes to a new non-empty value rather than a specific code. Two toggles
    // exist (header + footer); scope to the first pt/en group.
    const group = page
      .locator('[role="group"]')
      .filter({ has: page.getByRole('button', { name: /^(pt|en)$/i }) })
      .first()
    const before = await page.evaluate(() => document.documentElement.lang)
    const active = (await group.locator('button[aria-pressed="true"]').innerText()).toLowerCase()
    const other = active === 'pt' ? 'en' : 'pt'
    await group.getByRole('button', { name: new RegExp(`^${other}$`, 'i') }).click()
    await page.waitForFunction(
      (prev) => document.documentElement.lang !== prev && document.documentElement.lang.length > 0,
      before,
      { timeout: 5000 },
    )
  })

  // --- run -------------------------------------------------------------------
  let passed = 0
  const failures = []
  for (const { name, fn } of tests) {
    try {
      await fn()
      console.log(`  ✓ ${name}`)
      passed++
    } catch (err) {
      console.log(`  ✗ ${name}`)
      failures.push({ name, message: err.message })
    }
  }

  await browser.close()

  console.log(`\n${passed}/${tests.length} checks passed`)
  if (failures.length > 0) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`\n  ✗ ${f.name}\n    ${f.message}`)
    process.exitCode = 1
  }
} finally {
  if (server) stopDevServer(server.proc)
}

/**
 * Repoint a freshly-cloned copy of this template for a NEW client.
 *
 * This codebase hardcodes one client's identity in a few spots (the GitHub repo
 * + Vercel URL that Decap/OAuth bind to, the absolute SEO/OG URLs in index.html,
 * and the package name). Run this AFTER cloning into the new client's repo to
 * swap them in one shot. It detects the current values from config.yml, so it
 * keeps working as the template evolves.
 *
 * It does NOT create the external resources (GitHub repo, Vercel project, GitHub
 * OAuth App) — those need account access. It prints that checklist at the end;
 * full version in docs/09-forking.md.
 *
 * Usage:
 *   node scripts/new-client.mjs --repo <owner/repo> --url <https://new.vercel.app> [--name <pkg-name>] [--reset-content]
 */
import { readFileSync, writeFileSync, readdirSync, rmSync, existsSync } from 'node:fs'

const args = process.argv.slice(2)
const getArg = (flag) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : undefined
}

const repo = getArg('--repo')
const url = getArg('--url')
const pkgName = getArg('--name')
const resetContent = args.includes('--reset-content')

if (!repo || !url) {
  console.error(
    'Usage: node scripts/new-client.mjs --repo <owner/repo> --url <https://new.vercel.app> [--name <pkg-name>] [--reset-content]',
  )
  process.exit(1)
}
const newUrl = url.replace(/\/+$/, '')

// Detect the CURRENT identifiers from config.yml so the replacements are exact.
const CONFIG = 'public/admin/config.yml'
const config = readFileSync(CONFIG, 'utf8')
const oldRepo = config.match(/^\s*repo:\s*(\S+)/m)?.[1]
const oldUrl = config.match(/^\s*base_url:\s*(\S+)/m)?.[1]?.replace(/\/+$/, '')
if (!oldRepo || !oldUrl) {
  console.error(`Could not detect current repo/base_url in ${CONFIG}`)
  process.exit(1)
}

function replaceInFile(path, pairs) {
  if (!existsSync(path)) return
  let s = readFileSync(path, 'utf8')
  for (const [from, to] of pairs) s = s.split(from).join(to)
  writeFileSync(path, s)
  console.log(`  ✓ ${path}`)
}

console.log(`Repointing\n  repo: ${oldRepo} → ${repo}\n  url:  ${oldUrl} → ${newUrl}`)
replaceInFile(CONFIG, [
  [oldRepo, repo],
  [oldUrl, newUrl],
])
replaceInFile('index.html', [[oldUrl, newUrl]])

if (pkgName) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
  pkg.name = pkgName
  writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
  console.log('  ✓ package.json name')
}

if (resetContent) {
  for (const f of readdirSync('content/projects')) {
    if (f.endsWith('.json')) rmSync(`content/projects/${f}`)
  }
  // Valid placeholder profile (passes loadProjects validation; fill before launch).
  const blank = { pt: 'TODO', en: 'TODO' }
  const profile = {
    name: 'TODO',
    tagline: blank,
    bio: blank,
    services: ['video', 'motion', 'product', 'graphic'].map((id) => ({
      id,
      name: { pt: id, en: id },
      blurb: blank,
    })),
    email: '',
    socials: [],
    photo: null,
  }
  writeFileSync('content/profile.json', JSON.stringify(profile, null, 2) + '\n')
  if (existsSync('public/images/projects')) {
    for (const f of readdirSync('public/images/projects')) rmSync(`public/images/projects/${f}`)
  }
  console.log('  ✓ cleared content/projects, reset profile to placeholders, cleared images')
}

console.log(`
Done with the local repointing. Manual steps left (this script can't do them):
  1. Create GitHub repo ${repo}; push this clone; invite the client as a collaborator.
  2. Import that repo as a new Vercel project → confirm the production URL is ${newUrl}.
  3. Create a GitHub OAuth App with callback ${newUrl}/api/callback;
     add GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET to the new Vercel project's env.
  4. Content: node scripts/fetch-behance.mjs --profile <their-behance>, copy into content/, then: npm run images
  5. Rebrand: src/styles/theme.css tokens (accent, fonts) + brand strings in
     index.html (title, description, og:title, og:image:alt). See docs/09-forking.md.
`)

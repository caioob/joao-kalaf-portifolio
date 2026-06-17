import { chromium } from 'playwright'
import { parseProfileUrl, scrapeProfile, normalizeProject, normalizeUser } from './lib/behance-scrape.mjs'
import { mapProject, mapProfile } from './lib/behance-map.mjs'
import { processImages, applyImageDimensions } from './lib/behance-images.mjs'
import { writeOutput } from './lib/behance-write.mjs'

function parseArgs(argv) {
  const args = {
    profile: process.env.BEHANCE_PROFILE || 'https://www.behance.net/joaakalaf/',
    output: process.env.BEHANCE_OUTPUT || 'scripts/behance-dump',
    lang: process.env.BEHANCE_LANG || 'pt',
    headless: true,
  }

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--profile=')) args.profile = arg.split('=').slice(1).join('=')
    else if (arg === '--profile' && argv[i + 1]) { args.profile = argv[++i] }
    else if (arg.startsWith('--output=')) args.output = arg.split('=').slice(1).join('=')
    else if (arg === '--output' && argv[i + 1]) { args.output = argv[++i] }
    else if (arg.startsWith('--lang=')) args.lang = arg.split('=').slice(1).join('=')
    else if (arg === '--lang' && argv[i + 1]) { args.lang = argv[++i] }
    else if (arg === '--headless=false' || arg === '--headless=no') args.headless = false
    else if (arg === '--help' || arg === '-h') {
      console.log(`
Usage: node scripts/fetch-behance.mjs [options]

Options:
  --profile=URL    Behance profile URL or username (env: BEHANCE_PROFILE)
  --output=DIR     Output directory (env: BEHANCE_OUTPUT, default: scripts/behance-dump)
  --lang=CODE      Source language for TRANSLATE markers (env: BEHANCE_LANG, default: pt)
  --headless=false Run browser visible for debugging (default: true)
  --help           Show this help

Examples:
  node scripts/fetch-behance.mjs --profile=https://www.behance.net/someuser/
  BEHANCE_PROFILE=someuser node scripts/fetch-behance.mjs
  node scripts/fetch-behance.mjs --headless=false --lang=en
`)
      process.exit(0)
    }
  }

  return args
}

function log(msg) {
  const ts = new Date().toLocaleTimeString()
  console.log(`[${ts}] ${msg}`)
}

async function main() {
  const args = parseArgs(process.argv)
  const { profileUrl } = parseProfileUrl(args.profile)

  log(`Behance Import Script`)
  log(`Profile: ${profileUrl}`)
  log(`Output:  ${args.output}`)
  log(`Lang:    ${args.lang}`)
  log('')

  const browser = await chromium.launch({ headless: args.headless })

  try {
    const { rawUser, rawProjects } = await scrapeProfile(browser, profileUrl, {
      requestDelay: 2000,
      onProgress: log,
    })

    log('Normalizing and mapping data...')
    const normalizedUser = normalizeUser(rawUser)
    const profile = mapProfile(normalizedUser, args.lang)

    const mappedProjects = rawProjects.map((raw, i) => {
      const normalized = normalizeProject(raw)
      return mapProject(normalized, i, args.lang)
    })

    log('Processing images...')
    let missingImageCount = 0
    try {
      const { missing, dimensions } = await processImages(mappedProjects, args.output)
      missingImageCount = missing
      applyImageDimensions(mappedProjects, dimensions)
    } catch (err) {
      log(`Warning: image processing failed: ${err.message}`)
      log('Data files will still be written with remote URLs as fallback.')
    }

    log('Writing output...')
    writeOutput(
      {
        profile,
        mappedProjects,
        rawUser,
        rawProjects,
        profileUrl,
        missingImageCount,
      },
      args.output,
    )

    const projectCount = mappedProjects.length
    const warningCount = mappedProjects.flatMap((m) => m.meta.warnings).length
    const skippedCount = mappedProjects.flatMap((m) => m.meta.skippedModules).length

    log('')
    log('Done!')
    log(`  ${projectCount} projects written`)
    if (warningCount > 0) log(`  ${warningCount} warnings (see _review.json)`)
    if (skippedCount > 0) log(`  ${skippedCount} skipped modules (see _review.json)`)
    if (missingImageCount > 0) log(`  ${missingImageCount} images failed to download`)
    log(`  Output: ${args.output}/`)
    log('')
    log('Next steps:')
    log('  1. Review _review.json for warnings')
    log('  2. Fix any incorrect categories in projects/*.json')
    log('  3. Translate all TRANSLATE: fields')
    log('  4. Copy projects/* to content/projects/, profile.json to content/, images to public/images/projects/')
    log('  5. Run: npm run lint && npm run check:tokens && npm run test && npm run test:scripts && npm run build')
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})

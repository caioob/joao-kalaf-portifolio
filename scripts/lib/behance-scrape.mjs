export function parseProfileUrl(input) {
  if (!input) throw new Error('Profile URL or username is required')

  const str = input.trim().replace(/\/+$/, '')

  if (str.startsWith('http')) {
    const url = new URL(str)
    const parts = url.pathname.split('/').filter(Boolean)
    const username = parts[0] || ''
    if (!username) throw new Error(`Could not extract username from URL: ${input}`)
    return { username, profileUrl: `https://www.behance.net/${username}` }
  }

  return { username: str, profileUrl: `https://www.behance.net/${str}` }
}

export function extractEmbedUrl(embedHtml) {
  if (!embedHtml) return null
  const match = embedHtml.match(/src=["']([^"']+)["']/)
  return match ? match[1] : null
}

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function extractCoverUrl(covers) {
  if (!covers) return ''
  if (typeof covers.original === 'string') return covers.original
  if (covers.size_original_webp?.url) return covers.size_original_webp.url
  if (covers.size_original?.url) return covers.size_original.url
  if (Array.isArray(covers.allAvailable)) {
    const original = covers.allAvailable.find((c) =>
      c.url?.includes('/original_webp/') || c.url?.includes('/original/'),
    )
    if (original?.url) return original.url
    const first = covers.allAvailable[0]
    if (first?.url) return first.url
  }
  return ''
}

function normalizeModuleType(typename) {
  if (!typename) return 'unknown'
  if (typename === 'ImageModule') return 'image'
  if (typename === 'VideoModule') return 'video'
  if (typename === 'TextModule') return 'text'
  if (typename === 'EmbedModule') return 'embed'
  if (typename.toLowerCase().includes('image')) return 'image'
  if (typename.toLowerCase().includes('video')) return 'video'
  if (typename.toLowerCase().includes('text')) return 'text'
  if (typename.toLowerCase().includes('embed')) return 'embed'
  return 'unknown'
}

// Pick the highest-resolution downloadable render so the responsive ladder
// (docs/08) has the most to downscale from. In Behance be-state the reliable,
// width-tagged URLs live in `imageSizes.allAvailable[]` (incl. the full-res
// `source`); the named `size_*` keys are unreliable — `size_1400` is often
// `null` and `size_max_1200` carries dimensions but no `url`. So we gather every
// url-bearing entry and take the widest, falling back to an original/source URL
// (when widths are absent) and finally any url.
function extractBestImageUrl(imageSizes) {
  if (!imageSizes) return ''
  const candidates = []
  const consider = (e) => {
    if (e && typeof e === 'object' && typeof e.url === 'string') candidates.push(e)
  }
  if (Array.isArray(imageSizes.allAvailable)) imageSizes.allAvailable.forEach(consider)
  for (const [key, value] of Object.entries(imageSizes)) {
    if (key !== 'allAvailable') consider(value)
  }

  const withWidth = candidates.filter((e) => typeof e.width === 'number' && e.width > 0)
  if (withWidth.length) return withWidth.sort((a, b) => b.width - a.width)[0].url

  const original = candidates.find((e) => /\/(source|original|original_webp)\//.test(e.url))
  return (original || candidates[0])?.url || ''
}

function extractVideoProvider(embedHtml) {
  if (!embedHtml) return null
  if (embedHtml.includes('youtube.com') || embedHtml.includes('youtu.be')) {
    const match = embedHtml.match(
      /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    )
    return match ? { provider: 'youtube', videoId: match[1] } : null
  }
  if (embedHtml.includes('vimeo.com')) {
    const match = embedHtml.match(/vimeo\.com\/(?:video\/)?(\d+)/)
    return match ? { provider: 'vimeo', videoId: match[1] } : null
  }
  return null
}

export function normalizeProject(raw) {
  let src = raw.project || raw
  if (src && src.project && !src.name) src = src.project

  const name = src.name || ''
  const url = src.url || ''
  const publishedOn = src.publishedOn || src.published_on || 0
  const description = stripHtml(src.description || '')

  const tags = Array.isArray(src.tags)
    ? src.tags.map((t) => (typeof t === 'string' ? t : t.title || ''))
    : []
  const fields = Array.isArray(src.fields) ? src.fields : tags

  const covers = src.covers || {}
  const coverUrl = extractCoverUrl(covers)

  const rawTools = src.tools || []
  const tools = rawTools.map((t) => (typeof t === 'string' ? t : t.title || '')).filter(Boolean)

  const rawModules = Array.isArray(src.modules) ? src.modules : []
  const modules = rawModules
    .map((mod) => {
      const modType = normalizeModuleType(mod.__typename || mod.type)

      if (modType === 'image') {
        // Prefer the highest-res source from imageSizes; mod.src is often the
        // downscaled `disp` (~1400px) render, so it's only the fallback.
        const imgSrc = extractBestImageUrl(mod.imageSizes) || mod.src || ''
        const caption = stripHtml(mod.caption || mod.altText || '')
        return { type: 'image', src: imgSrc, caption }
      }

      if (modType === 'video') {
        const embedHtml = mod.embed || ''
        const videoInfo = extractVideoProvider(embedHtml)
        const embedUrl = extractEmbedUrl(embedHtml)
        return {
          type: 'video',
          embedUrl: embedUrl || '',
          embedHtml,
          isAdobeCcv: embedUrl?.includes('adobe.io') || embedUrl?.includes('ccv') || false,
          videoProvider: videoInfo?.provider || null,
          videoId: videoInfo?.videoId || null,
          caption: stripHtml(mod.caption || mod.captionPlain || ''),
        }
      }

      if (modType === 'embed') {
        const embedHtml = mod.embed || ''
        const embedUrl = extractEmbedUrl(embedHtml)
        const videoInfo = extractVideoProvider(embedHtml)
        return {
          type: 'embed',
          embedUrl: embedUrl || mod.original_embed || '',
          videoProvider: videoInfo?.provider || null,
          videoId: videoInfo?.videoId || null,
          caption: stripHtml(mod.caption || ''),
        }
      }

      if (modType === 'text') {
        return { type: 'text', text: stripHtml(mod.text || mod.text_plain || '') }
      }

      return null
    })
    .filter(Boolean)

  return {
    name,
    url,
    description,
    published_on: publishedOn,
    fields,
    covers: { original: coverUrl },
    modules,
    tools,
  }
}

export function normalizeUser(raw) {
  const user = raw.user || raw

  const displayName = user.displayName || user.display_name || ''
  const username = user.username || ''

  let bio = null
  if (user.occupation) bio = user.occupation
  else if (user.bio) bio = user.bio
  else if (user.sections) {
    const sections = user.sections
    const bioKey = Object.keys(sections).find(
      (k) => k.toLowerCase().includes('bio') || k.toLowerCase().includes('about'),
    )
    bio = bioKey ? sections[bioKey] : Object.values(sections)[0] || null
  }

  if (!bio && Array.isArray(user.customSections) && user.customSections.length > 0) {
    bio = user.customSections.map((s) => s.text || '').filter(Boolean).join('\n\n')
  }

  const socialLinks = Array.isArray(user.socialReferences)
    ? user.socialReferences.map((s) => ({ service: s.service || s.label || '', url: s.url || '' }))
    : Array.isArray(user.social_links)
      ? user.social_links.map((s) => ({ service: s.service || '', url: s.url || '' }))
      : []

  return {
    displayName,
    username,
    bio: typeof bio === 'string' ? stripHtml(bio) : null,
    socialLinks,
    location: user.location || null,
  }
}

export async function extractBeState(page) {
  return page.evaluate(() => {
    const candidates = ['be-state', '__NEXT_DATA__', '__BE_DATA__']
    for (const id of candidates) {
      const el = document.getElementById(id)
      if (el) {
        try {
          return JSON.parse(el.textContent)
        } catch {
          // malformed JSON, try next
        }
      }
    }
    for (const script of document.querySelectorAll('script[type="application/json"]')) {
      try {
        const parsed = JSON.parse(script.textContent)
        if (parsed && (parsed.profile || parsed.user || parsed.projects || parsed.activeSection))
          return parsed
      } catch {
        // not our data
      }
    }
    return null
  })
}

export async function scrollToLoadAll(page) {
  let currentHeight = await page.evaluate(() => document.body.scrollHeight)
  let stalled = 0

  while (stalled < 3) {
    const previousHeight = currentHeight
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(2000)
    currentHeight = await page.evaluate(() => document.body.scrollHeight)

    if (currentHeight === previousHeight) {
      stalled++
    } else {
      stalled = 0
    }
  }
}

export async function extractProfileFromDom(page) {
  return page.evaluate(() => {
    const name =
      document.querySelector('[data-testid="user-name"]')?.textContent?.trim() ||
      document.querySelector('.profile-info-name')?.textContent?.trim() ||
      document.querySelector('h1')?.textContent?.trim() ||
      ''

    const bio =
      document.querySelector('[data-testid="user-bio"]')?.textContent?.trim() ||
      document.querySelector('.profile-info-bio')?.textContent?.trim() ||
      document.querySelector('.UserInfo-bio-3Zs')?.textContent?.trim() ||
      null

    const socialLinks = Array.from(
      document.querySelectorAll(
        'a[href*="instagram.com"], a[href*="linkedin.com"], a[href*="vimeo.com"], a[href*="dribbble.com"], a[href*="twitter.com"], a[href*="x.com"]',
      ),
    ).map((a) => {
      const href = a.href
      let service = 'Link'
      if (href.includes('instagram')) service = 'Instagram'
      else if (href.includes('linkedin')) service = 'LinkedIn'
      else if (href.includes('vimeo')) service = 'Vimeo'
      else if (href.includes('dribbble')) service = 'Dribbble'
      else if (href.includes('twitter') || href.includes('x.com')) service = 'Twitter/X'
      return { service, url: href }
    })

    return { displayName: name, bio, socialLinks }
  })
}

export async function extractProjectUrlsFromDom(page) {
  return page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/gallery/"]')
    const seen = new Set()
    return Array.from(links)
      .map((a) => a.href)
      .filter((url) => {
        if (seen.has(url)) return false
        seen.add(url)
        return true
      })
  })
}

export async function extractProjectFromDom(page) {
  return page.evaluate(() => {
    const name = document.querySelector('h1')?.textContent?.trim() || ''
    const description =
      document.querySelector('.project-description')?.textContent?.trim() ||
      document.querySelector('[data-testid="project-description"]')?.textContent?.trim() ||
      ''
    const url = window.location.href

    const fields = Array.from(
      document.querySelectorAll(
        '.project-fields a, .ProjectInfo-field-3Ks a, [data-testid="project-field"] a',
      ),
    ).map((a) => a.textContent.trim())

    const tools = Array.from(
      document.querySelectorAll(
        '.project-tools a, .ProjectInfo-tool-3qF a, [data-testid="project-tool"] a',
      ),
    ).map((a) => a.textContent.trim())

    const coverImg = document.querySelector(
      '.project-cover img, .ProjectCover-cover-3qF img, [data-testid="project-cover"] img',
    )
    const covers = coverImg?.src ? { original: coverImg.src } : {}

    const modules = []
    const images = document.querySelectorAll(
      '.project-module-image img, .Image-image-1Mzn img, [data-testid="project-module-image"] img',
    )
    images.forEach((img, i) => {
      if (img.src) modules.push({ type: 'image', src: img.src, caption: img.alt || `Image ${i + 1}` })
    })

    const iframes = document.querySelectorAll(
      '.project-module-embed iframe, .Embed-embed-3Jc iframe, [data-testid="project-module-embed"] iframe',
    )
    iframes.forEach((iframe) => {
      if (iframe.src) modules.push({ type: 'embed', embedUrl: iframe.src, title: '' })
    })

    const publishedOnEl = document.querySelector(
      '.project-published-date, .ProjectInfo-date-2JN, [data-testid="project-date"]',
    )
    let publishedOn = 0
    if (publishedOnEl) {
      const dateStr = publishedOnEl.textContent.trim()
      const parsed = Date.parse(dateStr)
      if (!Number.isNaN(parsed)) publishedOn = Math.floor(parsed / 1000)
    }

    return { name, url, description, published_on: publishedOn, fields, covers, modules, tools }
  })
}

async function interceptApiData(page) {
  const apiResponses = []

  const handler = async (response) => {
    const url = response.url()
    if (!url.includes('api.behance.net') && !url.includes('/v2/')) return
    try {
      const contentType = response.headers()['content-type'] || ''
      if (!contentType.includes('json')) return
      const data = await response.json()
      apiResponses.push({ url, data })
    } catch {
      // non-JSON or failed parse — skip
    }
  }

  page.on('response', handler)

  try {
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 })
  } catch {
    // reload might timeout, that's ok
  }

  page.off('response', handler)

  let user = null
  const projects = []

  for (const { url, data } of apiResponses) {
    try {
      if (url.includes('/users/') && !url.includes('/projects')) user = data
      if (url.includes('/projects')) {
        if (Array.isArray(data?.projects)) projects.push(...data.projects)
        else if (data && data.id) projects.push(data)
      }
    } catch {
      // ignore
    }
  }

  return { user, projects }
}

export async function scrapeProfile(browser, profileUrl, options = {}) {
  const { requestDelay = 2000, onProgress } = options
  const page = await browser.newPage()

  try {
    onProgress?.(`Navigating to ${profileUrl}...`)
    await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 })

    const title = await page.title()
    if (title.toLowerCase().includes('blocked') || title.toLowerCase().includes('access denied')) {
      throw new Error(
        'Blocked by anti-bot protection. Try running with --headless=false or wait a few minutes and retry.',
      )
    }

    let rawUser = null
    let rawProjects = []

    onProgress?.('Extracting profile data from be-state / embedded JSON...')
    const beState = await extractBeState(page)

    if (beState) {
      onProgress?.('Found embedded JSON data.')

      rawUser = beState.profile?.user || beState.user || beState.profile || null

      const workSection = beState.activeSection?.work
      if (workSection?.profileProjects) {
        rawProjects = workSection.profileProjects
      } else if (Array.isArray(beState.projects)) {
        rawProjects = beState.projects
      }

      if (workSection?.user && rawUser) {
        const workUser = workSection.user
        const merged = { ...rawUser }
        for (const [k, v] of Object.entries(workUser)) {
          if (!(k in merged) && v != null) merged[k] = v
        }
        rawUser = merged
      } else if (workSection?.user && !rawUser) {
        rawUser = workSection.user
      }

      onProgress?.(`Profile: displayName=${rawUser?.displayName || rawUser?.display_name || '(none)'}`)
    }

    if (!rawUser) {
      onProgress?.('No embedded profile data, trying network interception...')
      try {
        const apiData = await interceptApiData(page)
        rawUser = apiData.user
        if (apiData.projects.length > 0) rawProjects = apiData.projects
      } catch (err) {
        onProgress?.(`Network interception failed: ${err.message}`)
      }
    }

    if (!rawUser) {
      onProgress?.('Falling back to DOM extraction for profile...')
      const domProfile = await extractProfileFromDom(page)
      rawUser = {
        displayName: domProfile.displayName,
        username: '',
        occupation: domProfile.bio,
        socialReferences: domProfile.socialLinks,
      }
    }

    onProgress?.('Scrolling to load all projects...')
    await scrollToLoadAll(page)

    const projectUrls = await extractProjectUrlsFromDom(page)
    onProgress?.(`Found ${projectUrls.length} project links on profile page.`)

    const visitedProjects = []
    for (let i = 0; i < projectUrls.length; i++) {
      const url = projectUrls[i]
      onProgress?.(`Visiting project ${i + 1}/${projectUrls.length}: ${url}`)

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })

        const projectState = await extractBeState(page)
        if (projectState?.project) {
          visitedProjects.push(projectState)
          continue
        }

        onProgress?.('  No embedded data, extracting from DOM...')
        const domProject = await extractProjectFromDom(page)
        if (domProject.name || domProject.url) {
          visitedProjects.push({ project: domProject })
        }
      } catch (err) {
        onProgress?.(`  Warning: failed to load ${url}: ${err.message}`)
      }

      if (i < projectUrls.length - 1) {
        await page.waitForTimeout(requestDelay)
      }
    }

    if (visitedProjects.length > 0) {
      rawProjects = visitedProjects
    }

    onProgress?.(`Scraped ${rawProjects.length} projects.`)

    return { rawUser, rawProjects }
  } finally {
    await page.close()
  }
}

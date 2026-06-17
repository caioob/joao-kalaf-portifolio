const CATEGORIES = ['video', 'motion', 'product', 'graphic']

const CATEGORY_MAP = [
  {
    keywords: ['video editing', 'film', 'video production', 'documentary'],
    category: 'video',
  },
  {
    keywords: [
      'motion design',
      'animation',
      'after effects',
      'motion graphics',
      '3d animation',
    ],
    category: 'motion',
  },
  {
    keywords: [
      'ui/ux',
      'product design',
      'interaction design',
      'ux design',
      'ui design',
      'app design',
    ],
    category: 'product',
  },
  {
    keywords: [
      'graphic design',
      'branding',
      'illustration',
      'typography',
      'print design',
      'visual identity',
      'poster design',
      'packaging',
    ],
    category: 'graphic',
  },
]

const DEFAULT_CATEGORY = 'graphic'

export function mapCategory(fields) {
  if (!Array.isArray(fields) || fields.length === 0)
    return { category: DEFAULT_CATEGORY, matched: false }

  const lower = fields.map((f) => (f || '').toLowerCase())
  for (const { keywords, category } of CATEGORY_MAP) {
    if (lower.some((f) => keywords.some((k) => f.includes(k)))) {
      return { category, matched: true }
    }
  }
  return { category: DEFAULT_CATEGORY, matched: false }
}

export function translateField(text, lang = 'pt') {
  const other = lang === 'pt' ? 'en' : 'pt'
  return { [lang]: text, [other]: `TRANSLATE:${text}` }
}

export function formatDate(timestamp) {
  const d = new Date(timestamp * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

// Behance URL segments can be percent-encoded (e.g. `%28`…%29` for parens) and
// carry accents. Slugs become both filenames and dev-server module URLs, so
// they must be filesystem- and URL-safe: an unsanitized `%28` 404s the eager
// glob import in `vite dev` and blanks the page. Decode, strip accents, and
// reduce to [A-Za-z0-9-].
export function sanitizeSlug(value) {
  let s = value
  try {
    s = decodeURIComponent(value)
  } catch {
    // leave as-is if it isn't valid percent-encoding
  }
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function extractSlug(url) {
  if (!url) return ''
  const trimmed = url.replace(/\/+$/, '')
  const segments = trimmed.split('/')
  const last = segments[segments.length - 1]
  if (last && /^[0-9]+$/.test(last)) return ''
  return sanitizeSlug(last || '')
}

export function generateId(index) {
  return `p-${String(index + 1).padStart(3, '0')}`
}

export function extractVideoInfo(url) {
  if (!url) return null
  const yt = url.match(
    /(?:youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
  )
  if (yt) return { provider: 'youtube', videoId: yt[1] }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) return { provider: 'vimeo', videoId: vimeo[1] }
  return null
}

export function mapMediaModules(modules, slug, lang = 'pt') {
  if (!Array.isArray(modules)) return { media: [], skipped: [], mediaUrls: [] }

  let imgIdx = 0
  const media = []
  const skipped = []
  const mediaUrls = []

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i]

    if (mod.type === 'image' && mod.src) {
      imgIdx++
      media.push({
        type: 'image',
        src: `/images/projects/${slug}-${imgIdx}.webp`,
        alt: translateField(mod.caption || slug, lang),
      })
      mediaUrls.push(mod.src)
    } else if (mod.type === 'video') {
      if (mod.videoProvider && mod.videoId) {
        media.push({
          type: 'video',
          provider: mod.videoProvider,
          videoId: mod.videoId,
          title: translateField(mod.caption || slug, lang),
        })
      } else if (mod.isAdobeCcv) {
        media.push({
          type: 'video',
          provider: 'adobe-ccv',
          videoId: mod.embedUrl,
          title: translateField(mod.caption || slug, lang),
        })
      } else if (mod.embedUrl) {
        const video = extractVideoInfo(mod.embedUrl)
        if (video) {
          media.push({
            type: 'video',
            provider: video.provider,
            videoId: video.videoId,
            title: translateField(mod.caption || slug, lang),
          })
        } else {
          skipped.push({
            moduleIndex: i,
            type: 'video',
            reason: `Unsupported video provider: ${mod.embedUrl}`,
          })
        }
      } else {
        skipped.push({
          moduleIndex: i,
          type: 'video',
          reason: 'Video module with no embed URL',
        })
      }
    } else if (mod.type === 'embed' && mod.embedUrl) {
      const video = extractVideoInfo(mod.embedUrl)
      if (video) {
        media.push({
          type: 'video',
          provider: video.provider,
          videoId: video.videoId,
          title: translateField(mod.caption || slug, lang),
        })
      } else if (mod.videoProvider && mod.videoId) {
        media.push({
          type: 'video',
          provider: mod.videoProvider,
          videoId: mod.videoId,
          title: translateField(mod.caption || slug, lang),
        })
      } else {
        skipped.push({
          moduleIndex: i,
          type: 'embed',
          reason: `Unsupported provider: ${mod.embedUrl}`,
        })
      }
    }
  }

  return { media, skipped, mediaUrls }
}

export function mapProject(raw, index, lang = 'pt') {
  const slug = extractSlug(raw.url) || `project-${index + 1}`
  const { category, matched } = mapCategory(raw.fields)

  const coverUrl =
    raw.covers?.original || raw.covers?.max_808 || raw.covers?.['808'] || raw.covers?.['404'] || ''

  const { media, skipped: mediaSkipped, mediaUrls } = mapMediaModules(raw.modules, slug, lang)

  const tools = Array.isArray(raw.tools)
    ? raw.tools.map((t) => (typeof t === 'string' ? t : t.title)).filter(Boolean)
    : []

  const warnings = []
  if (!matched) {
    warnings.push({
      projectId: generateId(index),
      slug,
      field: 'category',
      message: `No matching creative field; defaulted to '${DEFAULT_CATEGORY}'`,
      behanceFields: raw.fields || [],
    })
  }

  const project = {
    id: generateId(index),
    slug,
    category,
    title: translateField(raw.name || '', lang),
    description: translateField(raw.description || '', lang),
    thumbnail: {
      src: `/images/projects/${slug}-thumb.webp`,
      alt: translateField(raw.name || slug, lang),
    },
    media,
    tools,
    date: formatDate(raw.published_on),
    featured: false,
    links: raw.url
      ? [
          {
            label: { pt: 'Ver no Behance', en: 'View on Behance' },
            url: raw.url,
          },
        ]
      : [],
  }

  return { project, meta: { coverUrl, mediaUrls, warnings, skippedModules: mediaSkipped } }
}

export function mapProfile(raw, lang = 'pt') {
  const bio = raw.bio || ''
  const firstSentence = bio ? bio.split(/[.!?]\s/)[0] + (bio.length > bio.split(/[.!?]\s/)[0].length ? '.' : '') : ''

  return {
    name: raw.displayName || '',
    tagline: bio ? translateField(firstSentence, lang) : { pt: '', en: '' },
    bio: bio ? translateField(bio, lang) : { pt: '', en: '' },
    services: CATEGORIES.map((id) => {
      const names = {
        video: { pt: 'Edição de Vídeo', en: 'Video Editing' },
        motion: { pt: 'Motion Design', en: 'Motion Design' },
        product: { pt: 'Product Design', en: 'Product Design' },
        graphic: { pt: 'Design Gráfico', en: 'Graphic Design' },
      }
      const blurbs = {
        video: { pt: 'TRANSLATE:placeholder', en: 'placeholder' },
        motion: { pt: 'TRANSLATE:placeholder', en: 'placeholder' },
        product: { pt: 'TRANSLATE:placeholder', en: 'placeholder' },
        graphic: { pt: 'TRANSLATE:placeholder', en: 'placeholder' },
      }
      return { id, name: names[id], blurb: blurbs[id] }
    }),
    email: '',
    socials: Array.isArray(raw.socialLinks)
      ? raw.socialLinks.map((s) => ({ label: s.service, url: s.url }))
      : [],
    photo: null,
  }
}

export { CATEGORY_MAP, DEFAULT_CATEGORY }

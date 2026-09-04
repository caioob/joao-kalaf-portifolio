import { useI18n } from '../i18n/I18nContext.jsx'
import ResponsiveImage from './ResponsiveImage.jsx'

const RECT_CLASSES = ['h-(--rect-h-1)', 'h-(--rect-h-2)', 'h-(--rect-h-3)']

export default function ProjectCard({ project, onOpen, priority = false, index = 0, transitioningId = null }) {
  const { t, pick } = useI18n()
  const year = project.date.slice(0, 4)
  const hasVideo = project.media.some((item) => item.type === 'video')
  const rectClass = RECT_CLASSES[index % 3]
  // The shared `detail-hero` name is carried by exactly one card at a time
  // (the one being morphed into the detail). View Transitions require the name
  // to be unique per snapshot; the detail hero carries it in the new state.
  const morphing = transitioningId === project.id

  return (
    <button
      type="button"
      onClick={() => onOpen(project.id)}
      className="group block w-full text-left"
    >
      <span
        className="relative block overflow-hidden border border-line"
        style={{ viewTransitionName: morphing ? 'detail-hero' : undefined }}
      >
        <ResponsiveImage
          src={project.thumbnail.src}
          alt={pick(project.thumbnail.alt)}
          slot="thumbnail"
          width={project.thumbnail.width ?? 1600}
          height={project.thumbnail.height ?? 1000}
          eager={priority}
          className={`${rectClass} w-full object-cover transition-transform duration-(--duration-slow) ease-standard group-hover:scale-102`}
        />
        {hasVideo && (
          <span
            aria-hidden="true"
            className="absolute right-3 bottom-3 flex size-8 items-center justify-center bg-surface-raised/90 text-small text-surface"
          >
            ▶
          </span>
        )}
      </span>
      <span className="mt-3 block text-h3 text-ink transition-colors duration-(--duration-fast) ease-standard group-hover:text-accent-strong">
        {pick(project.title)}
      </span>
      <span className="mt-1.5 flex items-center gap-2 text-small text-ink-muted">
        <span className="border border-line px-2.5 py-0.5">
          {t(`filter.${project.category}`)}
        </span>
        <span>{year}</span>
        {project.featured && (
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-1.5 bg-accent" />
            {t('card.featured')}
          </span>
        )}
      </span>
    </button>
  )
}

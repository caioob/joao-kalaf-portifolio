import { useEffect, useRef } from 'react'
import { useI18n } from '../i18n/I18nContext.jsx'
import ResponsiveImage from './ResponsiveImage.jsx'

function VideoEmbed({ media }) {
  const { pick } = useI18n()
  // Privacy-friendly embeds, mounted only while the modal is open (FR-2/FR-5)
  const src =
    media.provider === 'youtube'
      ? `https://www.youtube-nocookie.com/embed/${media.videoId}`
      : media.provider === 'vimeo'
        ? `https://player.vimeo.com/video/${media.videoId}?dnt=1`
        : media.videoId

  return (
    <iframe
      src={src}
      title={pick(media.title)}
      className="aspect-video w-full rounded-card border border-line"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )
}

export default function ProjectDetail({ project, onClose }) {
  const { t, pick } = useI18n()
  const dialogRef = useRef(null)

  // Native <dialog>: focus trap, Esc (onCancel) and inert background for free.
  useEffect(() => {
    dialogRef.current.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const meta = [t(`filter.${project.category}`), project.date.slice(0, 4), ...(project.tools ?? [])]

  return (
    <dialog
      ref={dialogRef}
      onCancel={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-labelledby="project-detail-title"
      className="m-auto w-full max-w-modal rounded-card bg-surface-raised p-0 text-ink backdrop:bg-ink/40"
    >
      <div className="p-6 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <h2 id="project-detail-title" className="font-display text-h2">
            {pick(project.title)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('detail.close')}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink-muted transition-colors duration-(--duration-fast) ease-standard hover:text-ink"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-small text-ink-muted">{meta.join(' · ')}</p>

        <div className="mt-6 space-y-4">
          {pick(project.description)
            .split('\n\n')
            .map((paragraph, index) => (
              <p key={index} className="max-w-prose text-body text-ink-muted">
                {paragraph}
              </p>
            ))}
        </div>

        <div className="mt-8 space-y-6">
          {project.media.map((item, index) =>
            item.type === 'video' ? (
              <VideoEmbed key={index} media={item} />
            ) : (
              <ResponsiveImage
                key={index}
                src={item.src}
                alt={pick(item.alt)}
                slot="gallery"
                width={item.width}
                height={item.height}
                className="w-full rounded-card border border-line"
              />
            ),
          )}
        </div>

        {project.links?.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-5">
            {project.links.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-small font-medium text-accent-strong underline underline-offset-4 transition-colors duration-(--duration-fast) ease-standard hover:text-ink"
                >
                  {pick(link.label)}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </dialog>
  )
}

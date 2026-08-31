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
  // The element that had focus when the modal opened — usually the clicked
  // card button. The dialog is unmounted (not .close()'d) on exit, so native
  // focus return never fires; restore it explicitly on unmount (issue #8).
  const openerRef = useRef(null)

  // showModal() runs in a callback ref so it fires during React's commit —
  // inside any flushSync() that wrapped the open. That puts the dialog in the
  // top layer before a View Transition captures the "new" state, and captures
  // the opener while focus is still on the card.
  function openDialog(el) {
    dialogRef.current = el
    if (el && !el.open) {
      openerRef.current = document.activeElement
      el.showModal()
    }
  }

  // Native <dialog> still owns the focus trap and the inert background.
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      if (openerRef.current && typeof openerRef.current.focus === 'function') {
        openerRef.current.focus()
      }
    }
  }, [])

  const meta = [t(`filter.${project.category}`), project.date.slice(0, 4), ...(project.tools ?? [])]

  return (
    <dialog
      ref={openDialog}
      onCancel={(event) => {
        // Suppress the native close so the view transition can drive the exit;
        // we unmount via onClose instead. Without this, Escape's default action
        // can race the transition's old-state snapshot.
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-labelledby="project-detail-title"
      className="fixed inset-0 w-screen h-dvh max-w-none max-h-none overflow-y-auto bg-surface-raised/90 backdrop-blur-(--blur-modal) p-0 text-ink backdrop:bg-overlay/20"
    >
      <div className="mx-auto w-full max-w-modal p-6 md:p-10">
        {/* Hero — the shared-element morph target. Its `detail-hero` name
            matches the clicked card's thumbnail for the View Transition
            (issue #8). It is the project cover shown large; the rest of the
            detail content cross-fades in as the transition's root group. */}
        <div
          className="overflow-hidden border border-line"
          style={{ viewTransitionName: 'detail-hero' }}
        >
          <ResponsiveImage
            src={project.thumbnail.src}
            alt={pick(project.thumbnail.alt)}
            slot="thumbnail"
            width={project.thumbnail.width ?? 1600}
            height={project.thumbnail.height ?? 1000}
            className="w-full object-cover"
          />
        </div>
        <div className="mt-6 flex items-start justify-between gap-4">
          <h2 id="project-detail-title" className="font-display text-h2">
            {pick(project.title)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('detail.close')}
            className="flex size-10 shrink-0 items-center justify-center border border-line text-ink-muted transition-colors duration-(--duration-fast) ease-standard hover:text-ink"
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

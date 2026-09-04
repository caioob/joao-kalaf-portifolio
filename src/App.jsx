import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import Section from './components/layout/Section.jsx'
import Container from './components/layout/Container.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import FilterBar from './components/FilterBar.jsx'
import ProjectCard from './components/ProjectCard.jsx'
import ProjectDetail from './components/ProjectDetail.jsx'
import Footer from './components/Footer.jsx'
import { I18nProvider, useI18n } from './i18n/I18nContext.jsx'
import { useCategoryFilter } from './lib/categoryFilter.js'
import { getProjects, getProfile } from './lib/projects.js'

// Card → detail shared-element morph (issue #8). We drive the native View
// Transitions API by hand: it is feature-detected, so unsupported browsers and
// `prefers-reduced-motion` fall back to the current instant open/close.
const supportsVT =
  typeof document !== 'undefined' &&
  typeof document.startViewTransition === 'function'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function WorkSection({ projects, onOpen, transitioningId }) {
  const { t } = useI18n()
  const [category, setCategory] = useCategoryFilter()
  const visible =
    category === 'all' ? projects : projects.filter((project) => project.category === category)

  return (
    <Section id="work">
      <Container>
        <h2 className="font-display text-h2 text-ink">{t('work.title')}</h2>
        <div className="mt-6">
          <FilterBar active={category} onChange={setCategory} />
        </div>
        {visible.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-grid">
            {visible.map((project, index) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  onOpen={onOpen}
                  priority={index < 3}
                  index={index}
                  transitioningId={transitioningId}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8">
            <p className="text-body text-ink-muted">{t('work.empty')}</p>
            <button
              type="button"
              onClick={() => setCategory('all')}
              className="mt-4 text-small font-medium text-accent-strong underline underline-offset-4 transition-colors duration-(--duration-fast) ease-standard hover:text-ink"
            >
              {t('work.showAll')}
            </button>
          </div>
        )}
      </Container>
    </Section>
  )
}

function Page() {
  const { t, lang } = useI18n()
  const profile = getProfile()
  const projects = getProjects()
  const [openId, setOpenId] = useState(null)
  const [transitioningId, setTransitioningId] = useState(null)
  const openProject = projects.find((project) => project.id === openId)

  // Open the detail inside a view transition. The clicked card carries the
  // shared name (`detail-hero`) in the OLD snapshot; the detail hero carries it
  // in the NEW snapshot — exactly one named element per snapshot, so a fixed
  // name stays unique without per-item bookkeeping. flushSync forces React to
  // commit (and the dialog's callback ref to run showModal()) inside the
  // transition callback, so the dialog is already in the top layer when the
  // new-state snapshot is taken.
  function handleOpen(id) {
    if (!supportsVT || prefersReducedMotion()) {
      setOpenId(id)
      return
    }
    flushSync(() => setTransitioningId(id))
    const vt = document.startViewTransition(() => {
      flushSync(() => {
        setOpenId(id)
        setTransitioningId(null)
      })
    })
    vt.finished.catch(() => {}).finally(() => setTransitioningId(null))
  }

  // Close reverses the morph: OLD snapshot has the open detail hero named,
  // NEW snapshot has the originating card named (the hero has unmounted).
  function handleClose() {
    if (!supportsVT || prefersReducedMotion() || openId == null) {
      setOpenId(null)
      setTransitioningId(null)
      return
    }
    const id = openId
    const vt = document.startViewTransition(() => {
      flushSync(() => {
        setOpenId(null)
        setTransitioningId(id)
      })
    })
    vt.finished.catch(() => {}).finally(() => setTransitioningId(null))
  }

  // Upgrade the static (PT) <title>/description to the active language. The
  // index.html defaults still serve first paint and no-JS crawlers.
  useEffect(() => {
    document.title = t('meta.title')
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t('meta.description'))
  }, [t, lang])

  return (
    <>
      <a
        href="#main"
        className="sr-only bg-accent px-4 py-2 text-small font-medium text-accent-ink focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-20"
      >
        {t('a11y.skipToContent')}
      </a>
      <Navbar />
      <main id="main">
        <Hero profile={profile} />
        <WorkSection projects={projects} onOpen={handleOpen} transitioningId={transitioningId} />
      </main>
      <Footer profile={profile} />
      {openProject && <ProjectDetail project={openProject} onClose={handleClose} />}
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Page />
    </I18nProvider>
  )
}

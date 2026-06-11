import { useState } from 'react'
import Section from './components/layout/Section.jsx'
import Container from './components/layout/Container.jsx'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import FilterBar from './components/FilterBar.jsx'
import ProjectCard from './components/ProjectCard.jsx'
import ProjectDetail from './components/ProjectDetail.jsx'
import ServiceList from './components/ServiceList.jsx'
import ContactSection from './components/ContactSection.jsx'
import Footer from './components/Footer.jsx'
import { I18nProvider, useI18n } from './i18n/I18nContext.jsx'
import { useCategoryFilter } from './lib/categoryFilter.js'
import { getProjects, getProfile } from './lib/projects.js'

function WorkSection({ projects, onOpen }) {
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
          <ul className="mt-8 grid gap-x-grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => (
              <li key={project.id}>
                <ProjectCard project={project} onOpen={onOpen} />
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

function AboutSection({ profile }) {
  const { t, pick } = useI18n()

  return (
    <Section id="about">
      <Container>
        <h2 className="font-display text-h2 text-ink">{t('about.title')}</h2>
        <div className="mt-6 space-y-4">
          {pick(profile.bio)
            .split('\n\n')
            .map((paragraph, index) => (
              <p key={index} className="max-w-prose text-body text-ink-muted">
                {paragraph}
              </p>
            ))}
        </div>
        <div className="mt-12">
          <ServiceList services={profile.services} />
        </div>
      </Container>
    </Section>
  )
}

function Page() {
  const profile = getProfile()
  const projects = getProjects()
  const [openId, setOpenId] = useState(null)
  const openProject = projects.find((project) => project.id === openId)

  return (
    <>
      <Navbar />
      <main>
        <Hero profile={profile} />
        <WorkSection projects={projects} onOpen={setOpenId} />
        <AboutSection profile={profile} />
        <ContactSection profile={profile} />
      </main>
      <Footer profile={profile} />
      {openProject && <ProjectDetail project={openProject} onClose={() => setOpenId(null)} />}
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

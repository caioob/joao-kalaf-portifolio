import { useEffect, useState } from 'react'
import Container from './layout/Container.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Navbar() {
  const { t } = useI18n()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    ['#work', t('nav.work')],
    ['#about', t('nav.about')],
    ['#contact', t('nav.contact')],
  ]

  return (
    <header
      className={`sticky top-0 z-10 border-b bg-surface/80 backdrop-blur transition-colors duration-(--duration-fast) ease-standard ${
        scrolled ? 'border-line' : 'border-transparent'
      }`}
    >
      <Container className="flex items-center justify-between gap-4 py-4">
        <nav aria-label={t('nav.label')} className="flex items-center gap-5 sm:gap-7">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-small font-medium text-ink-muted transition-colors duration-(--duration-fast) ease-standard hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
        <LanguageToggle />
      </Container>
    </header>
  )
}

import Container from './layout/Container.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Footer({ profile }) {
  const { t } = useI18n()

  return (
    <footer className="border-t border-line">
      <Container className="flex flex-wrap items-center justify-between gap-4 py-8">
        <p className="text-small text-ink-muted">
          © {new Date().getFullYear()} {profile.name}
        </p>
        <LanguageToggle />
      </Container>
    </footer>
  )
}

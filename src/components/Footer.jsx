import Container from './layout/Container.jsx'
import LanguageToggle from './LanguageToggle.jsx'

export default function Footer({ profile }) {
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

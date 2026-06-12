import Section from './layout/Section.jsx'
import Container from './layout/Container.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function Hero({ profile }) {
  const { t, pick } = useI18n()

  return (
    <Section id="hero" reveal={false}>
      <Container>
        <h1 className="font-display text-display text-ink">{profile.name}</h1>
        <p className="mt-5 text-small font-medium tracking-widest text-ink-muted uppercase">
          {t('hero.roles')}
        </p>
        <p className="mt-6 max-w-prose text-body text-ink-muted">{pick(profile.tagline)}</p>
        <a
          href="#work"
          className="mt-10 inline-block rounded-full bg-accent px-7 py-3 text-small font-medium text-accent-ink transition-colors duration-(--duration-fast) ease-standard hover:bg-accent-strong"
        >
          {t('hero.cta')}
        </a>
      </Container>
    </Section>
  )
}

import Section from './layout/Section.jsx'
import Container from './layout/Container.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function ContactSection({ profile }) {
  const { t } = useI18n()

  return (
    <Section id="contact">
      <Container>
        <h2 className="max-w-prose font-display text-h2 text-ink">{t('contact.line')}</h2>
        <a
          href={`mailto:${profile.email}`}
          className="mt-8 inline-block rounded-full bg-accent px-7 py-3 text-small font-medium text-accent-ink transition-colors duration-(--duration-fast) ease-standard hover:bg-accent-strong"
        >
          {t('contact.cta')}
        </a>
        <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
          {profile.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="text-small font-medium text-ink-muted underline-offset-4 transition-colors duration-(--duration-fast) ease-standard hover:text-ink hover:underline"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}

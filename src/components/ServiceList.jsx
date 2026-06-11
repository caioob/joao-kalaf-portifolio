import { useI18n } from '../i18n/I18nContext.jsx'

export default function ServiceList({ services }) {
  const { pick } = useI18n()

  return (
    <ul className="grid gap-x-grid gap-y-8 sm:grid-cols-2">
      {services.map((service, index) => (
        <li key={service.id}>
          <span aria-hidden="true" className="font-display text-h3 text-ink-muted">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="mt-1 text-h3 text-ink">{pick(service.name)}</h3>
          <p className="mt-1 max-w-prose text-body text-ink-muted">{pick(service.blurb)}</p>
        </li>
      ))}
    </ul>
  )
}

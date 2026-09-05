import { useI18n } from '../i18n/I18nContext.jsx'

export default function FilterBar({ active, disciplines, onChange }) {
  const { t, pick } = useI18n()
  const options = [
    { id: 'all', label: t('filter.all') },
    ...disciplines.map((discipline) => ({
      id: discipline.id,
      label: pick(discipline.label),
    })),
  ]

  return (
    <div
      role="group"
      aria-label={t('work.filterLabel')}
      className="-mx-6 flex gap-1 overflow-x-auto px-6 md:mx-0 md:px-0"
    >
      {options.map((option) => {
        const isActive = active === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.id)}
            className={`shrink-0 border-b-2 px-3 py-2 text-small transition-colors duration-(--duration-fast) ease-standard ${
              isActive
                ? 'border-accent font-semibold text-accent-strong'
                : 'border-transparent font-medium text-ink-muted hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

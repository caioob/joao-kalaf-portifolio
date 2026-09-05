import { useI18n } from '../i18n/I18nContext.jsx'

export default function PreviewChecklist({ checklist, enabled }) {
  const { t } = useI18n()

  if (!enabled) return null

  return (
    <aside
      role="status"
      className="mx-auto max-w-site border-b border-line px-6 py-3 text-small text-ink-muted md:px-12"
    >
      <p className="font-medium text-ink">
        {checklist.length === 0 ? t('preview.ready') : t('preview.blocked')}
      </p>
      {checklist.length > 0 && (
        <ul className="mt-2 list-inside list-disc space-y-1">
          {checklist.map(({ projectId, blockers }) => (
            <li key={projectId}>
              {projectId}: {blockers.join('; ')}
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}

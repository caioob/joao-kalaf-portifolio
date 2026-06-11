import { useI18n } from '../i18n/I18nContext.jsx'
import { LANGS } from '../i18n/i18n.js'

export default function LanguageToggle() {
  const { lang, setLang, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('toggle.label')}
      className="flex items-center gap-1 rounded-full border border-line p-1"
    >
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-3 py-1 text-small uppercase transition-colors duration-(--duration-fast) ease-standard ${
            lang === code
              ? 'bg-line font-semibold text-ink'
              : 'font-medium text-ink-muted hover:text-ink'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

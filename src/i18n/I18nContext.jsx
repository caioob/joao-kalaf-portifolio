import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { detectInitialLang, translate, pick, HTML_LANG } from './i18n.js'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  // window.localStorage explicitly: Node's experimental global localStorage
  // shadows jsdom's in the test environment.
  const [lang, setLang] = useState(() =>
    detectInitialLang(window.localStorage.getItem('lang'), navigator.language),
  )

  useEffect(() => {
    window.localStorage.setItem('lang', lang)
    document.documentElement.lang = HTML_LANG[lang]
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (key) => translate(lang, key),
      pick: (field) => pick(field, lang),
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- spec-mandated home for the hook (architecture §2)
export function useI18n() {
  const context = useContext(I18nContext)
  if (context == null) throw new Error('useI18n must be used inside <I18nProvider>')
  return context
}

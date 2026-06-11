/**
 * Pure i18n logic, React-free (architecture §4). UI strings live in the
 * dictionaries; content fields ({pt,en} pairs from the data layer) are
 * resolved with pick().
 */
import pt from './pt.json'
import en from './en.json'

export const LANGS = ['pt', 'en']

/** Value for <html lang> per language (spec FR-3). */
export const HTML_LANG = { pt: 'pt-BR', en: 'en' }

const DICTIONARIES = { pt, en }

/**
 * Stored choice wins if valid; otherwise browsers reporting pt-* get
 * Portuguese, everyone else English (spec FR-3).
 */
export function detectInitialLang(storedValue, navigatorLanguage) {
  if (LANGS.includes(storedValue)) return storedValue
  return navigatorLanguage?.toLowerCase().startsWith('pt') ? 'pt' : 'en'
}

/**
 * UI-string lookup. Missing in the active language → warn + EN fallback;
 * missing everywhere → warn + return the key (visible, never crashing).
 * `dictionaries` is injectable for tests only.
 */
export function translate(lang, key, dictionaries = DICTIONARIES) {
  const value = dictionaries[lang]?.[key]
  if (value != null) return value
  console.warn(`[i18n] missing key "${key}" in "${lang}" — falling back to en`)
  return dictionaries.en?.[key] ?? key
}

/**
 * Resolves a localized content field. The data layer validates {pt,en}
 * completeness, so the EN fallback here is belt-and-suspenders.
 * @param {{ pt: string, en: string } | null | undefined} field
 */
export function pick(field, lang) {
  return field?.[lang] ?? field?.en
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import pt from './pt.json'
import en from './en.json'
import { LANGS, HTML_LANG, detectInitialLang, translate, pick } from './i18n.js'
import { I18nProvider, useI18n } from './I18nContext.jsx'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dictionaries', () => {
  it('pt and en have identical key sets (drift guard)', () => {
    expect(Object.keys(pt).sort()).toEqual(Object.keys(en).sort())
  })

  it('has no empty values', () => {
    for (const dict of [pt, en]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), `empty value for "${key}"`).not.toBe('')
      }
    }
  })
})

describe('detectInitialLang', () => {
  it('honors a valid stored choice over the browser language', () => {
    expect(detectInitialLang('en', 'pt-BR')).toBe('en')
    expect(detectInitialLang('pt', 'en-US')).toBe('pt')
  })

  it('ignores invalid stored values', () => {
    expect(detectInitialLang('klingon', 'pt-BR')).toBe('pt')
    expect(detectInitialLang(null, 'en-US')).toBe('en')
  })

  it('maps pt-* browsers to pt and everything else to en', () => {
    expect(detectInitialLang(null, 'pt-BR')).toBe('pt')
    expect(detectInitialLang(null, 'pt-PT')).toBe('pt')
    expect(detectInitialLang(null, 'en-GB')).toBe('en')
    expect(detectInitialLang(null, 'fr')).toBe('en')
    expect(detectInitialLang(null, undefined)).toBe('en')
  })
})

describe('translate', () => {
  it('looks up the key in the active language', () => {
    expect(translate('pt', 'nav.work')).toBe('Trabalhos')
    expect(translate('en', 'nav.work')).toBe('Work')
  })

  it('falls back to en with a warning when the key is missing in the active language', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const dicts = { pt: {}, en: { 'only.en': 'Hello' } }
    expect(translate('pt', 'only.en', dicts)).toBe('Hello')
    expect(warn).toHaveBeenCalledOnce()
  })

  it('returns the key itself when missing everywhere', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(translate('pt', 'does.not.exist')).toBe('does.not.exist')
  })
})

describe('pick', () => {
  it('resolves the active language and falls back to en', () => {
    expect(pick({ pt: 'Olá', en: 'Hello' }, 'pt')).toBe('Olá')
    expect(pick({ en: 'Hello' }, 'pt')).toBe('Hello')
    expect(pick(null, 'pt')).toBeUndefined()
  })
})

describe('I18nProvider', () => {
  function Probe() {
    const { lang, setLang, t } = useI18n()
    return (
      <div>
        <span data-testid="lang">{lang}</span>
        <button onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}>{t('hero.cta')}</button>
      </div>
    )
  }

  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.lang = 'pt-BR'
  })

  it('starts from the browser language (en in jsdom) and updates <html lang>', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(document.documentElement.lang).toBe(HTML_LANG.en)
  })

  it('switches language, persists it, and re-renders strings', async () => {
    const user = userEvent.setup()
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByRole('button')).toHaveTextContent('See work')

    await user.click(screen.getByRole('button'))

    expect(screen.getByTestId('lang')).toHaveTextContent('pt')
    expect(screen.getByRole('button')).toHaveTextContent('Ver trabalhos')
    expect(window.localStorage.getItem('lang')).toBe('pt')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('restores a persisted choice on mount', () => {
    window.localStorage.setItem('lang', 'pt')
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('pt')
  })

  it('useI18n throws outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/inside <I18nProvider>/)
  })

  it('exposes exactly the supported languages', () => {
    expect(LANGS).toEqual(['pt', 'en'])
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider } from '../i18n/I18nContext.jsx'
import PreviewChecklist from './PreviewChecklist.jsx'

describe('PreviewChecklist', () => {
  it('shows the incomplete record and blockers only in a preview', () => {
    render(
      <I18nProvider>
        <PreviewChecklist
          enabled
          checklist={[{ projectId: 'p-001', blockers: ['title: requires non-empty pt and en'] }]}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('p-001')
    expect(screen.getByRole('status')).toHaveTextContent('title: requires non-empty pt and en')
  })

  it('does not render on production', () => {
    render(
      <I18nProvider>
        <PreviewChecklist enabled={false} checklist={[]} />
      </I18nProvider>,
    )

    expect(screen.queryByRole('status')).toBeNull()
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'
import { getProjects, getProfile } from './lib/projects.js'

// jsdom reports navigator.language as en-US, so the app renders in English.
beforeEach(() => {
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
})

function workGrid() {
  return within(document.getElementById('work'))
}

describe('App', () => {
  it('renders the hero with the profile name', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(getProfile().name)
  })

  it('shows all seed projects in the work grid by default', () => {
    render(<App />)
    expect(workGrid().getAllByRole('listitem')).toHaveLength(getProjects().length)
  })

  it('filters the grid and updates the URL hash when a category pill is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(workGrid().getByRole('button', { name: 'Motion', pressed: false }))

    expect(workGrid().getAllByRole('listitem')).toHaveLength(
      getProjects().filter((p) => p.category === 'motion').length,
    )
    expect(window.location.hash).toBe('#work/motion')
    expect(workGrid().getByRole('button', { name: 'Motion', pressed: true })).toBeInTheDocument()
  })

  it('initializes the filter from a shared #work/<category> URL', () => {
    window.history.replaceState(null, '', '#work/graphic')
    render(<App />)
    expect(workGrid().getAllByRole('listitem')).toHaveLength(
      getProjects().filter((p) => p.category === 'graphic').length,
    )
  })

  it('opens the project modal with details and closes it again', async () => {
    const user = userEvent.setup()
    render(<App />)

    const project = getProjects().find((p) => p.media.some((m) => m.type === 'video'))
    await user.click(screen.getByRole('button', { name: new RegExp(project.title.en, 'i') }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: project.title.en })).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mounts video embeds only while the modal is open (lazy embeds)', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(document.querySelector('iframe')).toBeNull()

    const project = getProjects().find((p) => p.media.some((m) => m.type === 'video'))
    await user.click(screen.getByRole('button', { name: new RegExp(project.title.en, 'i') }))
    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe.src).toContain('ccv.adobe')

    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }))
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('switches the whole page language via the navbar toggle', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Selected work' })).toBeInTheDocument()

    expect(document.title).toContain('Video, Motion, Product')

    const navbar = within(screen.getByRole('banner'))
    await user.click(navbar.getByRole('button', { name: 'pt' }))

    expect(screen.getByRole('heading', { name: 'Trabalhos selecionados' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver trabalhos' })).toBeInTheDocument()
    expect(document.title).toContain('Vídeo, Motion, Produto')
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'Portfólio de João Kalaf',
    )
  })

  it('renders the four services and the contact CTA', () => {
    render(<App />)
    expect(within(document.getElementById('about')).getAllByRole('listitem')).toHaveLength(4)
    const cta = screen.getByRole('link', { name: "Let's talk" })
    const email = getProfile().email
    expect(cta).toHaveAttribute('href', email ? `mailto:${email}` : 'mailto:')
  })
})

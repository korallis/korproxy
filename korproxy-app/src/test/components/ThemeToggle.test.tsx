import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle, ThemeToggleCompact } from '../../components/shared/ThemeToggle'
import { useThemeStore } from '../../stores/themeStore'

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, ...props }: React.ComponentProps<'button'>) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    div: ({ children, ...props }: React.ComponentProps<'div'>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
    document.documentElement.classList.remove('dark', 'light')
  })

  it('renders light and dark options by default', () => {
    render(<ThemeToggle />)

    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('renders system option when showSystemOption is true', () => {
    render(<ThemeToggle showSystemOption />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('toggles to light theme when light button is clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0]) // Light button

    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggles to dark theme when dark button is clicked', async () => {
    useThemeStore.setState({ theme: 'light' })
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[1]) // Dark button

    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('applies theme class to document when theme changes', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0]) // Light button

    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})

describe('ThemeToggleCompact', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'dark' })
    document.documentElement.classList.remove('dark', 'light')
  })

  it('renders a single toggle button', () => {
    render(<ThemeToggleCompact />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('has correct aria-label for dark theme', () => {
    useThemeStore.setState({ theme: 'dark' })
    render(<ThemeToggleCompact />)

    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
  })

  it('has correct aria-label for light theme', () => {
    useThemeStore.setState({ theme: 'light' })
    render(<ThemeToggleCompact />)

    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
  })

  it('toggles from dark to light when clicked', async () => {
    useThemeStore.setState({ theme: 'dark' })
    const user = userEvent.setup()
    render(<ThemeToggleCompact />)

    await user.click(screen.getByRole('button'))

    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('toggles from light to dark when clicked', async () => {
    useThemeStore.setState({ theme: 'light' })
    const user = userEvent.setup()
    render(<ThemeToggleCompact />)

    await user.click(screen.getByRole('button'))

    expect(useThemeStore.getState().theme).toBe('dark')
  })
})

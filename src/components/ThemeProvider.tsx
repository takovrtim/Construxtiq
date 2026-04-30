'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

const ThemeContext = createContext<{
  theme: Theme
  toggle: () => void
}>({ theme: 'light', toggle: () => {} })

export function useTheme() { return useContext(ThemeContext) }

function getAutoTheme(): Theme {
  const hour = new Date().getHours()
  // Dark mode: 7pm - 6am
  return hour >= 19 || hour < 6 ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [manual, setManual] = useState(false)

  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem('ciq-theme') as Theme | null
    if (saved) { setTheme(saved); setManual(true) }
    else setTheme(getAutoTheme())
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setManual(true)
    localStorage.setItem('ciq-theme', next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      style={{
        width: 36, height: 36, borderRadius: 9,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        cursor: 'pointer', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', color: 'var(--text-primary)',
        flexShrink: 0,
      }}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  )
}

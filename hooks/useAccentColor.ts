'use client'

import { useState, useEffect } from 'react'

export const PRESET_COLORS = [
  { name: 'Émeraude', h: 160, s: 60, l: 40 },
  { name: 'Saphir', h: 210, s: 70, l: 50 },
  { name: 'Améthyste', h: 265, s: 60, l: 55 },
  { name: 'Rubis', h: 350, s: 70, l: 50 },
  { name: 'Topaze', h: 35, s: 80, l: 50 },
  { name: 'Jade', h: 140, s: 55, l: 42 },
  { name: 'Cobalt', h: 230, s: 65, l: 50 },
  { name: 'Rose Gold', h: 340, s: 50, l: 60 },
  { name: 'Turquoise', h: 180, s: 60, l: 45 },
  { name: 'Or', h: 45, s: 75, l: 50 },
  { name: 'Lavande', h: 270, s: 45, l: 60 },
  { name: 'Corail', h: 15, s: 70, l: 55 },
]

const STORAGE_KEY = 'aeternum-staff-color'

function applyColor({ h, s, l }: { h: number; s: number; l: number }) {
  document.documentElement.style.setProperty('--accent-h', h.toString())
  document.documentElement.style.setProperty('--accent-s', s + '%')
  document.documentElement.style.setProperty('--accent-l', l + '%')
}

function loadSavedColor() {
  if (typeof window === 'undefined') return { h: 160, s: 60, l: 40 }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as { h: number; s: number; l: number }
  } catch { /* ignore malformed data */ }
  return { h: 160, s: 60, l: 40 }
}

export function useAccentColor() {
  const [color, setColor] = useState(loadSavedColor)

  useEffect(() => {
    applyColor(color)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectColor = (newColor: { h: number; s: number; l: number }) => {
    setColor(newColor)
    applyColor(newColor)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newColor))
  }

  return { color, selectColor, presets: PRESET_COLORS }
}

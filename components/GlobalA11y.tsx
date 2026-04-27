'use client'
import { useEffect, useState } from 'react'

export default function GlobalA11y() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div id="sr-announcer" role="status" aria-live="polite" aria-atomic="true"
      style={{ position:'absolute', width:'1px', height:'1px', padding:0, margin:'-1px', overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }} />
  )
}

export function srAnnounce(message: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById('sr-announcer')
  if (el) { el.textContent = ''; setTimeout(() => { el.textContent = message }, 100) }
}

'use client'
import { useEffect } from 'react'

export default function GlobalA11y() {
  useEffect(() => {
    function enhanceButtons() {
      document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        const text = btn.textContent?.trim()
        if (text && text.length < 50) btn.setAttribute('aria-label', text)
      })
    }

    function enhanceInputs() {
      document.querySelectorAll('input:not([aria-label]), select:not([aria-label])').forEach(el => {
        const placeholder = el.getAttribute('placeholder')
        const name = el.getAttribute('name')
        if (placeholder) el.setAttribute('aria-label', placeholder)
        else if (name) el.setAttribute('aria-label', name)
      })
    }

    function addKeyboardSupport() {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modal = document.querySelector('[role="dialog"]')
          if (modal) {
            const closeBtn = modal.querySelector('button') as HTMLElement
            closeBtn?.click()
          }
        }
      })
    }

    const styleEl = document.createElement('style')
    styleEl.id = 'a11y-global-styles'
    styleEl.textContent = [
      '*:focus-visible { outline: 3px solid #1B3A6B !important; outline-offset: 2px !important; }',
      '[data-a11y="high-contrast"] *:focus-visible { outline: 3px solid #ffff00 !important; }',
      '@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }',
    ].join('\n')

    if (!document.getElementById('a11y-global-styles')) {
      document.head.appendChild(styleEl)
    }

    const timer = setTimeout(() => {
      enhanceButtons()
      enhanceInputs()
      addKeyboardSupport()
    }, 500)

    const observer = new MutationObserver(() => {
      enhanceButtons()
      enhanceInputs()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div
        id="sr-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position:'absolute', width:'1px', height:'1px', padding:0, margin:'-1px', overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }}
      />
      
        href="#main-content"
        style={{ position:'fixed', top:'-50px', left:'16px', background:'#1B3A6B', color:'#fff', padding:'10px 20px', borderRadius:'0 0 8px 8px', fontSize:'14px', fontWeight:700, textDecoration:'none', zIndex:99999, transition:'top 0.2s' }}
        onFocus={e => { (e.target as HTMLElement).style.top = '0' }}
        onBlur={e => { (e.target as HTMLElement).style.top = '-50px' }}
      >
        Ana İçeriğe Geç
      </a>
    </>
  )
}

export function srAnnounce(message: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById('sr-announcer')
  if (el) {
    el.textContent = ''
    setTimeout(() => { el.textContent = message }, 100)
  }
}
'use client'
import { useEffect } from 'react'

export default function GlobalA11y() {
  useEffect(() => {
    // 1. Tum butonlara aria-label ekle (label yoksa)
    function enhanceButtons() {
      document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        const text = btn.textContent?.trim()
        if (text && text.length < 50) btn.setAttribute('aria-label', text)
      })
    }

    // 2. Tum input'lara placeholder'dan aria-label ekle
    function enhanceInputs() {
      document.querySelectorAll('input:not([aria-label]), select:not([aria-label])').forEach(el => {
        const placeholder = el.getAttribute('placeholder')
        const name = el.getAttribute('name')
        if (placeholder) el.setAttribute('aria-label', placeholder)
        else if (name) el.setAttribute('aria-label', name)
      })
    }

    // 3. Ilerleme cubuklarina role ekle
    function enhanceProgressBars() {
      document.querySelectorAll('[style*="border-radius"]').forEach(el => {
        const style = (el as HTMLElement).style
        if (style.height && parseInt(style.height) <= 10 && style.background && style.width) {
          if (!el.getAttribute('role')) {
            el.setAttribute('role', 'presentation')
          }
        }
      })
    }

    // 4. Linklerle navigate edilemeyen div'lere role ekle
    function enhanceClickableDivs() {
      document.querySelectorAll('div[onClick], div[onclick]').forEach(el => {
        if (!el.getAttribute('role')) el.setAttribute('role', 'button')
        if (!el.getAttribute('tabIndex')) el.setAttribute('tabindex', '0')
      })
    }

    // 5. Tablolara caption ekle
    function enhanceTables() {
      document.querySelectorAll('table:not([aria-label])').forEach(table => {
        const heading = table.closest('div')?.querySelector('div[style*="fontWeight:700"]')
        if (heading?.textContent) {
          table.setAttribute('aria-label', heading.textContent.trim())
        }
      })
    }

    // 6. Skip to content klavye destegi
    function addKeyboardSupport() {
      document.addEventListener('keydown', (e) => {
        // ESC ile modallari kapat
        if (e.key === 'Escape') {
          const modal = document.querySelector('[role="dialog"]')
          if (modal) {
            const closeBtn = modal.querySelector('button[aria-label*="kapat"], button[aria-label*="iptal"]') as HTMLElement
            closeBtn?.click()
          }
        }
      })
    }

    // 7. Focus yonetimi - fokus halkasi her zaman gorunur
    const style = document.createElement('style')
    style.textContent = \`
      *:focus {
        outline: 3px solid #1B3A6B !important;
        outline-offset: 2px !important;
      }
      *:focus:not(:focus-visible) {
        outline: none !important;
      }
      *:focus-visible {
        outline: 3px solid #1B3A6B !important;
        outline-offset: 2px !important;
      }
      [data-a11y="high-contrast"] *:focus-visible {
        outline: 3px solid #ffff00 !important;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    \`
    document.head.appendChild(style)

    // Hepsini calistir
    const timer = setTimeout(() => {
      enhanceButtons()
      enhanceInputs()
      enhanceTables()
      addKeyboardSupport()
    }, 500)

    // MutationObserver ile dinamik icerigi de yakala
    const observer = new MutationObserver(() => {
      enhanceButtons()
      enhanceInputs()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      document.head.removeChild(style)
    }
  }, [])

  return (
    <>
      {/* Screen reader live region */}
      <div
        id="sr-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position:'absolute', width:'1px', height:'1px', padding:0, margin:'-1px', overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }}
      />
      {/* Skip to content */}
      
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

// Screen reader duyuru yardimcisi
export function srAnnounce(message: string) {
  if (typeof window === 'undefined') return
  const el = document.getElementById('sr-announcer')
  if (el) {
    el.textContent = ''
    setTimeout(() => { el.textContent = message }, 100)
  }
}

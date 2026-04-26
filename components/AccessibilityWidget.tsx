'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── Tipler ─────────────────────────────────────────
type Theme  = 'default' | 'high-contrast' | 'yellow-black'
type FontSz = 'normal' | 'large' | 'xlarge'

const STORAGE_KEY = 'a11y_prefs'

function loadPrefs() {
  if (typeof window === 'undefined') return { theme: 'default' as Theme, fontSize: 'normal' as FontSz, tts: false }
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') } catch { return {} }
}
function savePrefs(p: object) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch {}
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.removeAttribute('data-a11y')
  if (theme !== 'default') root.setAttribute('data-a11y', theme)
}
function applyFont(sz: FontSz) {
  const root = document.documentElement
  const map = { normal: '100%', large: '115%', xlarge: '130%' }
  root.style.fontSize = map[sz]
}

// Screen reader duyuru fonksiyonu
export function announceToScreenReader(message: string) {
  const el = document.getElementById('sr-announcer')
  if (el) { el.textContent = ''; setTimeout(() => { el.textContent = message }, 100) }
}

export default function AccessibilityWidget() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme]    = useState<Theme>('default')
  const [fontSize, setFont]  = useState<FontSz>('normal')
  const [ttsOn, setTts]      = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Başlangıç — kayıtlı tercihleri yükle
  useEffect(() => {
    const p = loadPrefs()
    const t = p.theme ?? 'default'
    const f = p.fontSize ?? 'normal'
    const tts = p.tts ?? false
    setTheme(t); setFont(f); setTts(tts)
    applyTheme(t); applyFont(f)
  }, [])

  // Sesleri hazırla
  useEffect(() => {
    const check = () => { if (window.speechSynthesis.getVoices().length) setVoicesReady(true) }
    check()
    window.speechSynthesis.addEventListener?.('voiceschanged', check)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', check)
  }, [])

  // Panel dışı tıklama
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // TTS — sayfada tıklanan metni oku
  const speakText = useCallback((text: string) => {
    if (!ttsOn) return
    window.speechSynthesis.cancel()
    if (!text.trim()) return
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'tr-TR'
    utt.rate = 0.95
    utt.pitch = 1
    const voices = window.speechSynthesis.getVoices()
    const tr = voices.find(v => v.lang.startsWith('tr'))
    if (tr) utt.voice = tr
    utt.onstart = () => setSpeaking(true)
    utt.onend   = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utt)
  }, [ttsOn])

  // Tıklanan element metnini oku
  useEffect(() => {
    if (!ttsOn) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      const text = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || ''
      if (text.trim().length > 1) speakText(text.trim().slice(0, 300))
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [ttsOn, speakText])

  // Klavye: Esc paneli kapat, F1 widget aç/kapat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); window.speechSynthesis.cancel() }
      if (e.key === 'F1')     { e.preventDefault(); setOpen(o => !o) }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  function changeTheme(t: Theme) {
    setTheme(t); applyTheme(t)
    const p = { ...loadPrefs(), theme: t }
    savePrefs(p)
  }
  function changeFont(f: FontSz) {
    setFont(f); applyFont(f)
    const p = { ...loadPrefs(), fontSize: f }
    savePrefs(p)
  }
  function toggleTts() {
    const next = !ttsOn
    setTts(next)
    if (!next) { window.speechSynthesis.cancel(); setSpeaking(false) }
    const p = { ...loadPrefs(), tts: next }
    savePrefs(p)
  }
  function stopSpeech() { window.speechSynthesis.cancel(); setSpeaking(false) }
  function readPage() {
    const text = document.body.innerText.slice(0, 2000)
    speakText(text)
  }

  const isModified = theme !== 'default' || fontSize !== 'normal' || ttsOn

  return (
    <>
      {/* Screen reader live region */}
      <div id="sr-announcer" aria-live="polite" aria-atomic="true" 
        style={{ position:'absolute', width:'1px', height:'1px', padding:0, margin:'-1px', overflow:'hidden', clip:'rect(0,0,0,0)', whiteSpace:'nowrap', border:0 }} />
      {/* Global CSS — yüksek kontrast temalar */}
      <style>{`
        [data-a11y="high-contrast"] {
          filter: contrast(1.5) brightness(1.05);
        }
        [data-a11y="high-contrast"] * {
          border-color: #000 !important;
          outline-color: #000 !important;
        }
        [data-a11y="high-contrast"] body,
        [data-a11y="high-contrast"] main,
        [data-a11y="high-contrast"] .main-content {
          background: #fff !important;
          color: #000 !important;
        }
        [data-a11y="yellow-black"] body,
        [data-a11y="yellow-black"] main,
        [data-a11y="yellow-black"] .main-content,
        [data-a11y="yellow-black"] div[style] {
          background: #1a1a00 !important;
          color: #ffff00 !important;
        }
        [data-a11y="yellow-black"] * {
          border-color: #ffff00 !important;
          color: #ffff00 !important;
        }
        [data-a11y="yellow-black"] a { color: #ffcc00 !important; }
        [data-a11y="yellow-black"] button { 
          background: #333300 !important; 
          color: #ffff00 !important;
          border: 1px solid #ffff00 !important;
        }
        /* Odak (focus) her zaman görünür */
        *:focus-visible {
          outline: 3px solid #1B3A6B !important;
          outline-offset: 2px !important;
        }
        [data-a11y="yellow-black"] *:focus-visible {
          outline: 3px solid #ffff00 !important;
        }
        /* Skip to content */
        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: #1B3A6B;
          color: #fff;
          padding: 8px 16px;
          z-index: 9999;
          font-size: 14px;
          font-weight: 600;
          transition: top 0.15s;
        }
        .skip-link:focus { top: 0; }
      `}</style>

      {/* Skip to main content */}
      <a className="skip-link" href="#main-content">Ana içeriğe geç</a>

      {/* Widget butonu */}
      <div ref={panelRef} style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9000 }}>
        <button
          aria-label={open ? 'Erişilebilirlik panelini kapat' : 'Erişilebilirlik panelini aç (F1)'}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen(o => !o)}
          title="Erişilebilirlik (F1)"
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: isModified ? '#10B981' : '#1B3A6B',
            border: speaking ? '3px solid #F59E0B' : '3px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            transition: 'all 0.2s',
            animation: speaking ? 'a11y-pulse 1s ease-in-out infinite' : 'none',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="4" r="2" fill="white"/>
            <path d="M12 7c-3 0-5 1.5-5 4l1 6h2l1-4h2l1 4h2l1-6c0-2.5-2-4-5-4z" fill="white"/>
            <path d="M9 11l-2 2M15 11l2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Panel */}
        {open && (
          <div
            role="dialog"
            aria-label="Erişilebilirlik Ayarları"
            aria-modal="true"
            style={{
              position: 'absolute', bottom: '60px', right: 0,
              width: '300px', background: '#fff',
              borderRadius: '16px', border: '1px solid #E2E8F0',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
            }}
          >
            {/* Başlık */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <div>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#1B3A6B' }}>Erişilebilirlik</div>
                <div style={{ fontSize:'11px', color:'#94A3B8' }}>WCAG 2.1 · F1 ile aç/kapat</div>
              </div>
              {isModified && (
                <button
                  onClick={() => { changeTheme('default'); changeFont('normal'); if (ttsOn) toggleTts() }}
                  style={{ fontSize:'11px', padding:'3px 8px', borderRadius:'5px', background:'#FEF2F2', color:'#7F1D1D', border:'1px solid #FECACA', cursor:'pointer', fontWeight:600 }}
                  aria-label="Tüm ayarları sıfırla"
                >
                  Sıfırla
                </button>
              )}
            </div>

            {/* Kontrast */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px' }}>Renk Kontrastı</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {([
                  { val:'default',        label:'Standart',        bg:'#F8FAFC', tc:'#1E293B', border:'#CBD5E1' },
                  { val:'high-contrast',  label:'Yüksek Kontrast', bg:'#fff',    tc:'#000',    border:'#000'    },
                  { val:'yellow-black',   label:'Sarı / Siyah',    bg:'#1a1a00', tc:'#ffff00', border:'#ffff00' },
                ] as { val: Theme; label: string; bg: string; tc: string; border: string }[]).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => changeTheme(opt.val)}
                    aria-pressed={theme === opt.val}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '8px 10px', borderRadius: '8px',
                      border: `2px solid ${theme === opt.val ? '#1B3A6B' : '#E2E8F0'}`,
                      background: theme === opt.val ? '#EEF3FB' : '#F8FAFC',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width:'28px', height:'18px', borderRadius:'3px', background:opt.bg, border:`1px solid ${opt.border}`, flexShrink:0 }}>
                      <div style={{ fontSize:'8px', lineHeight:'18px', textAlign:'center', color:opt.tc, fontWeight:700, letterSpacing:'0px' }}>Aa</div>
                    </div>
                    <span style={{ fontSize:'12px', fontWeight:theme===opt.val?700:500, color:'#1E293B' }}>{opt.label}</span>
                    {theme === opt.val && <span style={{ marginLeft:'auto', color:'#10B981', fontSize:'14px' }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Boyutu */}
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'11px', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'8px' }}>Metin Boyutu</div>
              <div style={{ display:'flex', gap:'6px' }}>
                {([
                  { val:'normal', label:'A',  size:'14px' },
                  { val:'large',  label:'A',  size:'17px' },
                  { val:'xlarge', label:'A',  size:'20px' },
                ] as { val: FontSz; label: string; size: string }[]).map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => changeFont(opt.val)}
                    aria-pressed={fontSize === opt.val}
                    aria-label={`${opt.val === 'normal' ? 'Normal' : opt.val === 'large' ? 'Büyük' : 'Çok büyük'} metin boyutu`}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '8px',
                      border: `2px solid ${fontSize === opt.val ? '#1B3A6B' : '#E2E8F0'}`,
                      background: fontSize === opt.val ? '#EEF3FB' : '#F8FAFC',
                      cursor: 'pointer', fontSize: opt.size, fontWeight: 600, color: '#1E293B',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TTS */}
            <div style={{ marginBottom:'14px', background:'#F8FAFC', borderRadius:'10px', padding:'12px', border:'1px solid #E2E8F0' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#1B3A6B' }}>Sesli Okuma (TTS)</div>
                  <div style={{ fontSize:'11px', color:'#94A3B8' }}>
                    {!voicesReady ? 'Türkçe ses yükleniyor...' : ttsOn ? (speaking ? '🔊 Okunuyor...' : '✓ Aktif — metne tıklayın') : 'Türkçe · Web Speech API'}
                  </div>
                </div>
                <button
                  onClick={toggleTts}
                  aria-pressed={ttsOn}
                  aria-label={ttsOn ? 'Sesli okumayı kapat' : 'Sesli okumayı aç'}
                  style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer',
                    background: ttsOn ? '#10B981' : '#CBD5E1', position: 'relative', transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: '3px', transition: 'left 0.2s',
                    left: ttsOn ? '21px' : '3px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
              </div>
              {ttsOn && (
                <div style={{ display:'flex', gap:'6px' }}>
                  <button
                    onClick={readPage}
                    aria-label="Tüm sayfayı sesli oku"
                    style={{ flex:1, padding:'7px', borderRadius:'7px', background:'#1B3A6B', color:'#fff', fontSize:'12px', fontWeight:600, border:'none', cursor:'pointer' }}
                  >
                    Sayfayı Oku
                  </button>
                  {speaking && (
                    <button
                      onClick={stopSpeech}
                      aria-label="Okumayı durdur"
                      style={{ padding:'7px 12px', borderRadius:'7px', background:'#FEF2F2', color:'#7F1D1D', fontSize:'12px', fontWeight:600, border:'1px solid #FECACA', cursor:'pointer' }}
                    >
                      Durdur
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Klavye kısayolları */}
            <div style={{ background:'#F8FAFC', borderRadius:'8px', padding:'10px', border:'1px solid #E2E8F0' }}>
              <div style={{ fontSize:'11px', fontWeight:600, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px', marginBottom:'6px' }}>Klavye Kısayolları</div>
              {[
                ['F1', 'Bu paneli aç/kapat'],
                ['Tab', 'Sonraki öğeye git'],
                ['Shift+Tab', 'Önceki öğeye git'],
                ['Enter / Space', 'Seç / Tıkla'],
                ['Esc', 'Paneli kapat'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
                  <kbd style={{ fontSize:'10px', background:'#E2E8F0', padding:'1px 6px', borderRadius:'3px', fontFamily:'monospace', color:'#1E293B' }}>{key}</kbd>
                  <span style={{ fontSize:'11px', color:'#64748B' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes a11y-pulse {
          0%, 100% { box-shadow: 0 4px 16px rgba(245,158,11,0.3), 0 0 0 0 rgba(245,158,11,0.4); }
          50% { box-shadow: 0 4px 16px rgba(245,158,11,0.5), 0 0 0 8px rgba(245,158,11,0); }
        }
      `}</style>
    </>
  )
}